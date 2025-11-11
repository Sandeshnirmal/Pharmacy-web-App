from django.db import transaction
from django.utils import timezone
from product.models import Product, Batch
from inventory.models import StockMovement
import logging

logger = logging.getLogger(__name__)

@transaction.atomic
def deduct_stock_from_batches(product: Product, quantity_to_deduct: int, user, order_id: int):
    """
    Deducts the specified quantity of a product from batches,
    prioritizing those with the earliest expiry dates.
    Records stock movements for each deduction.
    """
    logger.debug(f"deduct_stock_from_batches called for Product ID: {product.id}, Quantity to deduct: {quantity_to_deduct}, Order ID: {order_id}")

    if quantity_to_deduct <= 0:
        logger.warning(f"Quantity to deduct is non-positive ({quantity_to_deduct}) for Product ID: {product.id}. No deduction performed.")
        return []

    batches = Batch.objects.filter(
        product=product,
        current_quantity__gt=0,
        expiry_date__gte=timezone.now().date() # Only consider non-expired batches
    ).order_by('expiry_date') # Prioritize earliest expiry

    if not batches.exists():
        logger.error(f"No active batches found for Product ID: {product.id} with current_quantity > 0 and non-expired.")
        raise ValueError(f"No active batches found for product {product.name} to deduct from.")

    logger.debug(f"Found {batches.count()} active batches for Product ID: {product.id}")

    remaining_to_deduct = quantity_to_deduct
    deducted_batches_info = []

    for batch in batches:
        if remaining_to_deduct <= 0:
            break

        deduct_from_batch = min(remaining_to_deduct, batch.current_quantity)
        
        logger.debug(f"Processing Batch {batch.id} (Batch No: {batch.batch_number}) for Product ID: {product.id}. Current quantity BEFORE deduction: {batch.current_quantity}, Deducting: {deduct_from_batch}")

        batch.current_quantity -= deduct_from_batch
        batch.save(update_fields=['current_quantity'])
        # Re-fetch the batch to confirm the saved quantity from the database
        batch.refresh_from_db()
        logger.info(f"Deducted {deduct_from_batch} units from Batch {batch.id} (Batch No: {batch.batch_number}). New current quantity AFTER save: {batch.current_quantity}")

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
        logger.info(f"StockMovement 'OUT' created for Product ID: {product.id}, Batch ID: {batch.id}, Quantity: {deduct_from_batch}")

        deducted_batches_info.append({
            'batch': batch, # Return the batch object itself
            'deducted_quantity': deduct_from_batch
        })
        remaining_to_deduct -= deduct_from_batch
    
    if remaining_to_deduct > 0:
        logger.error(f"Insufficient stock for product {product.name}. Needed {quantity_to_deduct} units, but could only deduct {quantity_to_deduct - remaining_to_deduct} units.")
        raise ValueError(f"Insufficient stock for product {product.name}. Needed {quantity_to_deduct} units, but could only deduct {quantity_to_deduct - remaining_to_deduct} units.")
    
    logger.debug(f"Successfully deducted total {quantity_to_deduct} units for Product ID: {product.id}. Deducted batches info: {deducted_batches_info}")
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
        batch.save(update_fields=['current_quantity'])

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
        logger.warning(f"OrderItem {order_item.id} for product {product.name} has no linked batch. Attempting to return to any active batch.")
        
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
            logger.error(f"No suitable active batch found to return {quantity_to_return} units for product {product.name} (OrderItem {order_item.id}). Recording as general IN movement.")
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
