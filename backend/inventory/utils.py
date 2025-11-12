from django.db import transaction
from django.db.models import F # Import F for atomic updates
from django.utils import timezone
from product.models import Product, Batch
from inventory.models import StockMovement
import logging
from decimal import Decimal # Import Decimal for precise calculations

logger = logging.getLogger(__name__)

@transaction.atomic
def deduct_stock_from_batches(product: Product, quantity_to_deduct: int, user, order_id: int):
    """
    Deducts the specified quantity of a product from batches,
    prioritizing those with the earliest expiry dates.
    Records stock movements for each deduction.
    """
    logger.info(f"deduct_stock_from_batches: Starting deduction for Product ID: {product.id}, Quantity to deduct: {quantity_to_deduct}, Order ID: {order_id}")

    if quantity_to_deduct <= 0:
        logger.warning(f"deduct_stock_from_batches: Quantity to deduct is non-positive ({quantity_to_deduct}) for Product ID: {product.id}. No deduction performed.")
        return []

    batches = Batch.objects.filter(
        product=product,
        current_quantity__gt=0,
        expiry_date__gte=timezone.now().date() # Only consider non-expired batches
    ).order_by('expiry_date') # Prioritize earliest expiry

    if not batches.exists():
        logger.error(f"deduct_stock_from_batches: No active batches found for Product ID: {product.id} with current_quantity > 0 and non-expired.")
        raise ValueError(f"No active batches found for product {product.name} to deduct from.")

    logger.info(f"deduct_stock_from_batches: Found {batches.count()} active batches for Product ID: {product.id}")

    remaining_to_deduct = quantity_to_deduct
    deducted_batches_info = []

    for batch in batches:
        if remaining_to_deduct <= 0:
            break

        deduct_from_batch = min(remaining_to_deduct, batch.current_quantity)
        
        logger.info(f"deduct_stock_from_batches: Processing Batch {batch.id} (Batch No: {batch.batch_number}) for Product ID: {product.id}. Current quantity BEFORE deduction: {batch.current_quantity}, Deducting: {deduct_from_batch}")

        batch.current_quantity -= deduct_from_batch
        batch.quantity -= deduct_from_batch # Also deduct from the total quantity
        batch.save(update_fields=['current_quantity', 'quantity'])
        # Re-fetch the batch to confirm the saved quantity from the database
        batch.refresh_from_db()
        logger.info(f"deduct_stock_from_batches: Deducted {deduct_from_batch} units from Batch {batch.id} (Batch No: {batch.batch_number}). New current quantity AFTER save: {batch.current_quantity}, New total quantity AFTER save: {batch.quantity}")

        # Record stock movement
        StockMovement.objects.create(
            product=product,
            batch=batch,
            movement_type='OUT',
            quantity=deduct_from_batch,
            reference_number=f"ORDER_{order_id}_PRODUCT_{product.id}",
            notes=f"Deducted {deduct_from_batch} units for order {order_id} (Product: {product.name}, Batch: {batch.batch_number})",
            created_by=user
        )
        logger.info(f"deduct_stock_from_batches: StockMovement 'OUT' created for Product ID: {product.id}, Batch ID: {batch.id}, Quantity: {deduct_from_batch}")

        deducted_batches_info.append({
            'batch': batch, # Return the batch object itself
            'deducted_quantity': deduct_from_batch
        })
        remaining_to_deduct -= deduct_from_batch
    
    if remaining_to_deduct > 0:
        logger.error(f"deduct_stock_from_batches: Insufficient stock for product {product.name}. Needed {quantity_to_deduct} units, but could only deduct {quantity_to_deduct - remaining_to_deduct} units.")
        raise ValueError(f"Insufficient stock for product {product.name}. Needed {quantity_to_deduct} units, but could only deduct {quantity_to_deduct - remaining_to_deduct} units.")
    
    logger.info(f"deduct_stock_from_batches: Successfully deducted total {quantity_to_deduct} units for Product ID: {product.id}. Deducted batches info: {deducted_batches_info}")
    return deducted_batches_info


@transaction.atomic
def return_stock_to_batches(order_item, user, reason="Order cancellation"):
    """
    Returns the specified quantity of a product to the original batch it was deducted from.
    Records stock movements for each return.
    """
    product = order_item.product
    quantity_to_return = order_item.quantity
    batch = order_item.batch

    if quantity_to_return <= 0:
        return []

    if batch:
        # Return to the original batch
        batch.current_quantity += quantity_to_return
        batch.quantity += quantity_to_return # Also add to the total quantity
        batch.save(update_fields=['current_quantity', 'quantity'])

        # Record stock movement
        StockMovement.objects.create(
            product=product,
            batch=batch,
            movement_type='IN',
            quantity=quantity_to_return,
            reference_number=f"ORDER_CANCEL_{order_item.order.id}_ITEM_{order_item.id}",
            notes=f"Returned {quantity_to_return} units due to order cancellation {order_item.order.id} (Product: {product.name}, Batch: {batch.batch_number}). Reason: {reason}",
            created_by=user
        )
        return [{
            'batch_id': batch.id,
            'batch_number': batch.batch_number,
            'returned_quantity': quantity_to_return
        }]
    else:
        # If no specific batch was linked (e.g., old orders or an error),
        # try to return to any active batch or log a warning.
        logger.warning(f"return_stock_to_batches: OrderItem {order_item.id} for product {product.name} has no linked batch. Attempting to return to any active batch.")
        
        batches = Batch.objects.filter(
            product=product,
            expiry_date__gte=timezone.now().date() # Only consider non-expired batches
        ).order_by('-expiry_date') # Prioritize latest expiry for returns

        if batches.exists():
            target_batch = batches.first()
            target_batch.current_quantity += quantity_to_return
            target_batch.save(update_fields=['current_quantity'])

            StockMovement.objects.create(
                product=product,
                batch=target_batch,
                movement_type='IN',
                quantity=quantity_to_return,
                reference_number=f"ORDER_CANCEL_{order_item.order.id}_ITEM_{order_item.id}_NO_ORIGINAL_BATCH",
                notes=f"Returned {quantity_to_return} units due to order cancellation {order_item.order.id} (Product: {product.name}). No original batch linked, returned to {target_batch.batch_number}. Reason: {reason}",
                created_by=user
            )
            return [{
                'batch_id': target_batch.id,
                'batch_number': target_batch.batch_number,
                'returned_quantity': quantity_to_return
            }]
        else:
            logger.error(f"return_stock_to_batches: No suitable active batch found to return {quantity_to_return} units for product {product.name} (OrderItem {order_item.id}). Recording as general IN movement.")
            StockMovement.objects.create(
                product=product,
                movement_type='IN',
                quantity=quantity_to_return,
                reference_number=f"ORDER_CANCEL_{order_item.order.id}_ITEM_{order_item.id}_NO_BATCH",
                notes=f"Returned {quantity_to_return} units due to order cancellation {order_item.order.id} (Product: {product.name}). No specific active batch found. Reason: {reason}",
                created_by=user
            )
            return [{
                'batch_id': None,
                'batch_number': 'N/A',
                'returned_quantity': quantity_to_return
            }]


@transaction.atomic
def add_stock_to_batches(product: Product, batch_number: str, expiry_date: str, quantity_to_add: int, user, purchase_order_id: int):
    """
    Adds the specified quantity of a product to a batch.
    Creates the batch if it doesn't exist.
    Records stock movements for each addition.
    """
    import uuid
    call_id = str(uuid.uuid4())[:8] # Unique ID for this call
    logger.info(f"add_stock_to_batches [{call_id}]: Starting addition for Product ID: {product.id}, Batch No: {batch_number}, Expiry: {expiry_date}, Quantity to add: {quantity_to_add}, PO ID: {purchase_order_id}")

    if quantity_to_add <= 0:
        logger.warning(f"add_stock_to_batches: Quantity to add is non-positive ({quantity_to_add}) for Product ID: {product.id}. No addition performed.")
        return None

    batch, created = Batch.objects.get_or_create(
        product=product,
        batch_number=batch_number,
        expiry_date=expiry_date,
        defaults={'quantity': 0, 'current_quantity': 0} # Default values if creating a new batch
    )

    # Ensure we are working with Decimal for consistency
    quantity_to_add_decimal = Decimal(str(quantity_to_add))

    logger.info(f"add_stock_to_batches [{call_id}]: Before update - Batch ID: {batch.id}, Created: {created}, Existing Quantity: {batch.quantity}, Existing Current Quantity: {batch.current_quantity}, Quantity to Add: {quantity_to_add_decimal}")

    if created:
        # For a newly created batch, set both initial quantity and current available quantity
        batch.quantity = quantity_to_add_decimal
        batch.current_quantity = quantity_to_add_decimal
        batch.save(update_fields=['quantity', 'current_quantity'])
    else:
        # For an existing batch, increment both quantity and current_quantity
        batch.quantity = F('quantity') + quantity_to_add_decimal
        batch.current_quantity = F('current_quantity') + quantity_to_add_decimal
        batch.save(update_fields=['quantity', 'current_quantity'])
    
    batch.refresh_from_db() # Re-fetch to confirm saved quantity
    logger.info(f"add_stock_to_batches [{call_id}]: After update - Batch ID: {batch.id}, New Quantity: {batch.quantity}, New Current Quantity: {batch.current_quantity}")

    logger.info(f"add_stock_to_batches: Added {quantity_to_add} units to Batch {batch.id} (Batch No: {batch.batch_number}). New total quantity: {batch.quantity}, New current quantity: {batch.current_quantity}")

    StockMovement.objects.create(
        product=product,
        batch=batch,
        movement_type='IN',
        quantity=quantity_to_add,
        reference_number=f"PO-{purchase_order_id}",
        notes=f"Received {quantity_to_add} units for Purchase Order #{purchase_order_id} into batch {batch.batch_number}",
        created_by=user
    )
    logger.info(f"add_stock_to_batches: StockMovement 'IN' created for Product ID: {product.id}, Batch ID: {batch.id}, Quantity: {quantity_to_add}")

    return batch
