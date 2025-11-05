from rest_framework import serializers
from .models import OfflineSale, OfflineSaleItem, BillReturn, BillReturnItem, OfflineCustomer
from product.serializers import ProductSerializer, BatchSerializer # Assuming these exist
from decimal import Decimal # Import Decimal for precise calculations
from django.utils import timezone # Import timezone
from product.models import Discount, Product, Batch, ProductUnit # Import Product, Batch, ProductUnit

class OfflineCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineCustomer
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class OfflineSaleItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    batch_details = BatchSerializer(source='batch', read_only=True)
    
    # Explicitly define batch as a PrimaryKeyRelatedField to accept ID
    batch = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = OfflineSaleItem
        fields = '__all__'
        read_only_fields = ('subtotal', 'sale', 'discount_percentage', 'discount_amount')
        extra_kwargs = {
            'price_per_unit': {'required': True}
        }

class OfflineSaleSerializer(serializers.ModelSerializer):
    items = OfflineSaleItemSerializer(many=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    customer_details = OfflineCustomerSerializer(source='customer', read_only=True) # Add customer details
    
    # Explicitly define customer as a PrimaryKeyRelatedField to accept ID
    customer = serializers.PrimaryKeyRelatedField(
        queryset=OfflineCustomer.objects.all(), 
        allow_null=True, 
        required=False,
        # Removed redundant source='customer'
    )

    class Meta:
        model = OfflineSale
        fields = '__all__'
        read_only_fields = ('total_amount', 'change_amount', 'created_by', 'updated_by', 'last_status_update_date')

    def create(self, validated_data):
        # Ensure the tag is set to 'OFFLINE' for new offline sales
        validated_data['tag'] = 'OFFLINE'
        items_data = validated_data.pop('items')
        customer_instance = validated_data.pop('customer', None)

        # Populate denormalized fields from the customer instance if available
        if customer_instance:
            validated_data['customer_name'] = customer_instance.name
            validated_data['customer_phone'] = customer_instance.phone_number
            validated_data['customer_address'] = customer_instance.address
        
        # Initialize total_amount
        total_amount = Decimal('0.00')

        # Create OfflineSale instance first to get an ID for reference_number
        # Temporarily set total_amount to 0, will update after item calculations
        offline_sale = OfflineSale.objects.create(customer=customer_instance, total_amount=Decimal('0.00'), **validated_data)
        
        for item_data in items_data:
            product = item_data['product']
            batch = item_data['batch']
            quantity = item_data['quantity']

            # --- Discount and Pricing Logic ---
            # 1. Start with batch's offline pricing
            base_mrp = batch.offline_mrp_price
            batch_discount_percent = batch.offline_discount_percentage
            
            # Calculate price after batch discount
            price_after_batch_discount = base_mrp * (Decimal('1.00') - (batch_discount_percent / Decimal('100.00')))
            
            # 2. Check for active global/targeted discounts (Product or Category)
            now = timezone.now().date()

            # Product-specific discount
            product_discount_obj = Discount.objects.filter(
                target_type='product',
                product=product,
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            ).order_by('-percentage').first() # Get highest product discount

            # Category-specific discount
            category_discount_obj = Discount.objects.filter(
                target_type='category',
                category=product.category, # Assuming product has a category
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            ).order_by('-percentage').first() # Get highest category discount

            # Determine the highest applicable additional discount percentage
            additional_discount_percent = Decimal('0.00')
            if product_discount_obj:
                additional_discount_percent = max(additional_discount_percent, product_discount_obj.percentage)
            if category_discount_obj:
                additional_discount_percent = max(additional_discount_percent, category_discount_obj.percentage)

            # Apply additional discount to the price after batch discount
            final_price_per_unit = price_after_batch_discount * (Decimal('1.00') - (additional_discount_percent / Decimal('100.00')))
            
            # Calculate total discount percentage and amount
            # This is a more accurate way to combine discounts
            effective_discount_factor = (Decimal('1.00') - (batch_discount_percent / Decimal('100.00'))) * \
                                        (Decimal('1.00') - (additional_discount_percent / Decimal('100.00')))
            total_discount_percentage = (Decimal('1.00') - effective_discount_factor) * Decimal('100.00')
            
            total_discount_amount = (base_mrp - final_price_per_unit) * quantity

            # Update item_data with calculated values
            item_data['price_per_unit'] = final_price_per_unit
            item_data['discount_percentage'] = total_discount_percentage
            item_data['discount_amount'] = total_discount_amount
            item_data['subtotal'] = final_price_per_unit * quantity
            # --- End Discount and Pricing Logic ---

            OfflineSaleItem.objects.create(sale=offline_sale, **item_data)
            total_amount += item_data['subtotal']
            
            # Stock reduction logic
            # Convert quantity from product_unit to base_unit
            product_unit_id = item_data.get('product_unit') # Assuming product_unit is passed in item_data
            if product_unit_id:
                try:
                    product_unit = ProductUnit.objects.get(id=product_unit_id)
                    quantity_in_base_units = quantity * product_unit.conversion_factor
                except ProductUnit.DoesNotExist:
                    raise serializers.ValidationError(f"ProductUnit with ID {product_unit_id} not found.")
            else:
                quantity_in_base_units = quantity # Assume already in base units

            if batch.current_quantity < quantity_in_base_units:
                raise serializers.ValidationError(f"Insufficient stock for product {product.name} in batch {batch.batch_number}. Available: {batch.current_quantity}, Requested: {quantity_in_base_units} base units.")
            batch.current_quantity -= quantity_in_base_units
            batch.save(update_fields=['current_quantity'])

            # Create StockMovement record for OUT (quantity in base units)
            from inventory.models import StockMovement
            StockMovement.objects.create(
                product=product,
                batch=batch,
                movement_type='OUT',
                quantity=quantity_in_base_units,
                product_unit=product.product_unit, # Use product's default base unit for stock movement
                reference_number=f"OFFLINE-SALE-{offline_sale.id}",
                notes=f"Sold {quantity_in_base_units} base units for Offline Sale #{offline_sale.id} from batch {batch.batch_number}",
                created_by=self.context.get('request').user if self.context.get('request') else None
            )

        # Update total_amount and change_amount for the OfflineSale instance
        offline_sale.total_amount = total_amount
        offline_sale.change_amount = validated_data.get('paid_amount', Decimal('0.00')) - total_amount
        
        # Set status to PAID if paid_amount covers total_amount
        if offline_sale.paid_amount >= offline_sale.total_amount:
            offline_sale.status = 'PAID'
        else:
            offline_sale.status = 'PENDING' # Ensure it's pending if not fully paid

        offline_sale.save() # Save is needed to update total_amount, change_amount, and status

        return offline_sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        customer_instance = validated_data.pop('customer', None) # This will now be an OfflineCustomer instance or None
        
        # Update customer and denormalized fields
        instance.customer = customer_instance
        if customer_instance:
            instance.customer_name = customer_instance.name
            instance.customer_phone = customer_instance.phone_number
            instance.customer_address = customer_instance.address
        else:
            instance.customer_name = validated_data.get('customer_name', instance.customer_name)
            instance.customer_phone = validated_data.get('customer_phone', instance.customer_phone)
            instance.customer_address = validated_data.get('customer_address', instance.customer_address)

        # Handle status change and stock reversal for cancellation
        new_status = validated_data.get('status', instance.status)
        if new_status == 'CANCELLED' and instance.status != 'CANCELLED':
            # If status changes to CANCELLED, reverse stock for all items
            from inventory.models import StockMovement
            for old_item in instance.items.all():
                batch = old_item.batch
                if batch:
                    # Convert old_item quantity to base units for reversal
                    product_unit = old_item.product_unit
                    if product_unit:
                        quantity_in_base_units = old_item.quantity * product_unit.conversion_factor
                    else:
                        quantity_in_base_units = old_item.quantity # Assume already in base units

                    batch.current_quantity += quantity_in_base_units
                    batch.save(update_fields=['current_quantity'])
                    StockMovement.objects.create(
                        product=old_item.product,
                        batch=batch,
                        movement_type='IN',
                        quantity=quantity_in_base_units,
                        product_unit=old_item.product.product_unit, # Use product's default base unit for stock movement
                        reference_number=f"OFFLINE-SALE-CANCEL-{instance.id}",
                        notes=f"Cancelled Sale #{instance.id}: Returned {quantity_in_base_units} base units of {old_item.product.name} to batch {batch.batch_number}",
                        created_by=self.context.get('request').user if self.context.get('request') else None
                    )
            instance.status = 'CANCELLED'
            instance.cancellation_reason = validated_data.get('cancellation_reason', instance.cancellation_reason)
        elif new_status == 'RETURNED' and instance.status != 'RETURNED':
            instance.status = 'RETURNED'
        elif new_status == 'PARTIALLY_RETURNED' and instance.status not in ['RETURNED', 'PARTIALLY_RETURNED']:
            instance.status = 'PARTIALLY_RETURNED'
        else:
            # Only allow status to be set to PAID if not cancelled/returned and paid_amount covers total_amount
            if validated_data.get('paid_amount', instance.paid_amount) >= instance.total_amount:
                instance.status = 'PAID'
            else:
                instance.status = 'PENDING' # Revert to pending if not fully paid or if it was paid and now isn't

        instance.paid_amount = validated_data.get('paid_amount', instance.paid_amount)
        instance.payment_method = validated_data.get('payment_method', instance.payment_method)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.updated_by = self.context['request'].user # Assuming user is available in context
        instance.save() # This will also update last_status_update_date due to auto_now=True

        if items_data is not None:
            # Stock adjustment for existing items before deleting
            from inventory.models import StockMovement
            for old_item in instance.items.all():
                batch = old_item.batch
                if batch:
                    # Convert old_item quantity to base units for reversal
                    product_unit = old_item.product_unit
                    if product_unit:
                        quantity_in_base_units = old_item.quantity * product_unit.conversion_factor
                    else:
                        quantity_in_base_units = old_item.quantity # Assume already in base units

                    batch.current_quantity += quantity_in_base_units # Return old quantity to stock
                    batch.save(update_fields=['current_quantity'])
                    StockMovement.objects.create(
                        product=old_item.product,
                        batch=batch,
                        movement_type='IN',
                        quantity=quantity_in_base_units,
                        product_unit=old_item.product.product_unit, # Use product's default base unit for stock movement
                        reference_number=f"OFFLINE-SALE-UPDATE-REVERT-{instance.id}",
                        notes=f"Reverted {quantity_in_base_units} base units of {old_item.product.name} for Sale Update #{instance.id}",
                        created_by=self.context.get('request').user if self.context.get('request') else None
                    )
            instance.items.all().delete() # Clear existing items

            total_amount = 0
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                price_per_unit = item_data['price_per_unit']
                subtotal = quantity * price_per_unit
                
                batch = item_data['batch']
                # Convert quantity from product_unit to base_unit
                product_unit_id = item_data.get('product_unit') # Assuming product_unit is passed in item_data
                if product_unit_id:
                    try:
                        product_unit = ProductUnit.objects.get(id=product_unit_id)
                        quantity_in_base_units = quantity * product_unit.conversion_factor
                    except ProductUnit.DoesNotExist:
                        raise serializers.ValidationError(f"ProductUnit with ID {product_unit_id} not found.")
                else:
                    quantity_in_base_units = quantity # Assume already in base units

                if batch.current_quantity < quantity_in_base_units:
                    raise serializers.ValidationError(f"Insufficient stock for product {product.name} in batch {batch.batch_number}. Available: {batch.current_quantity}, Requested: {quantity_in_base_units} base units.")
                batch.current_quantity -= quantity_in_base_units
                batch.save(update_fields=['current_quantity'])

                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    movement_type='OUT',
                    quantity=quantity_in_base_units,
                    product_unit=product.product_unit, # Use product's default base unit for stock movement
                    reference_number=f"OFFLINE-SALE-UPDATE-{instance.id}",
                    notes=f"Sold {quantity_in_base_units} base units for Offline Sale Update #{instance.id} from batch {batch.batch_number}",
                    created_by=self.context.get('request').user if self.context.get('request') else None
                )
                OfflineSaleItem.objects.create(sale=instance, subtotal=subtotal, **item_data)
                total_amount += subtotal
            instance.total_amount = total_amount
            instance.change_amount = instance.paid_amount - total_amount
            
            # Re-evaluate status after item updates and total_amount recalculation
            if instance.paid_amount >= instance.total_amount:
                instance.status = 'PAID'
            else:
                instance.status = 'PENDING'

            instance.save()

        return instance

class BillReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='offline_sale_item.product.name', read_only=True)
    batch_number = serializers.CharField(source='offline_sale_item.batch.batch_number', read_only=True)

    class Meta:
        model = BillReturnItem
        fields = '__all__'
        read_only_fields = ('subtotal', 'bill_return')

class BillReturnSerializer(serializers.ModelSerializer):
    returned_items = BillReturnItemSerializer(many=True)
    returned_by_username = serializers.CharField(source='returned_by.username', read_only=True)

    class Meta:
        model = BillReturn
        fields = '__all__'
        read_only_fields = ('total_return_amount', 'returned_by', 'status') # Added status to read_only_fields

    def create(self, validated_data):
        returned_items_data = validated_data.pop('returned_items')
        bill_return = BillReturn.objects.create(status='PROCESSED', **validated_data) # Set status to PROCESSED
        total_return_amount = 0

        for item_data in returned_items_data:
            offline_sale_item = item_data['offline_sale_item']
            returned_quantity = item_data['returned_quantity']
            price_per_unit = item_data['price_per_unit']
            subtotal = returned_quantity * price_per_unit

            if returned_quantity > offline_sale_item.quantity:
                raise serializers.ValidationError(f"Returned quantity {returned_quantity} for product {offline_sale_item.product.name} exceeds original sale quantity {offline_sale_item.quantity}.")

            BillReturnItem.objects.create(bill_return=bill_return, subtotal=subtotal, **item_data)
            total_return_amount += subtotal

            # Stock increment logic for returned items
            batch = offline_sale_item.batch
            # Convert returned_quantity from its original unit to base units
            product_unit = offline_sale_item.product_unit
            if product_unit:
                returned_quantity_in_base_units = returned_quantity * product_unit.conversion_factor
            else:
                returned_quantity_in_base_units = returned_quantity # Assume already in base units

            batch.current_quantity += returned_quantity_in_base_units
            batch.save(update_fields=['current_quantity'])

            # Create StockMovement record for IN (quantity in base units)
            from inventory.models import StockMovement
            StockMovement.objects.create(
                product=offline_sale_item.product,
                batch=batch,
                movement_type='IN',
                quantity=returned_quantity_in_base_units,
                product_unit=offline_sale_item.product.product_unit, # Use product's default base unit for stock movement
                reference_number=f"OFFLINE-RETURN-{bill_return.id}",
                notes=f"Returned {returned_quantity_in_base_units} base units for Offline Sale Return #{bill_return.id} to batch {batch.batch_number}",
                created_by=self.context.get('request').user if self.context.get('request') else None
            )
        
        bill_return.total_return_amount = total_return_amount
        bill_return.save()

        # Determine if it's a full or partial return for the OfflineSale
        sale_total_quantity = sum(item.quantity for item in bill_return.sale.items.all())
        returned_total_quantity = sum(bill_return.sale.returns.all().exclude(id=bill_return.id).values_list('returned_items__returned_quantity', flat=True)) + sum(item['returned_quantity'] for item in returned_items_data)

        if returned_total_quantity >= sale_total_quantity:
            bill_return.sale.status = 'RETURNED'
        else:
            bill_return.sale.status = 'PARTIALLY_RETURNED'
        
        bill_return.sale.save() # This will update last_status_update_date due to auto_now=True

        return bill_return
