from rest_framework import serializers
from .models import OfflineSale, OfflineSaleItem, BillReturn, BillReturnItem, OfflineCustomer
from product.serializers import ProductSerializer, BatchSerializer # Assuming these exist

class OfflineCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineCustomer
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class OfflineSaleItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    batch_details = BatchSerializer(source='batch', read_only=True)

    class Meta:
        model = OfflineSaleItem
        fields = '__all__'
        read_only_fields = ('subtotal',)

class OfflineSaleSerializer(serializers.ModelSerializer):
    items = OfflineSaleItemSerializer(many=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    customer_details = OfflineCustomerSerializer(source='customer', read_only=True) # Add customer details
    
    # Explicitly define customer as a PrimaryKeyRelatedField to accept ID
    customer = serializers.PrimaryKeyRelatedField(
        queryset=OfflineCustomer.objects.all(), 
        allow_null=True, 
        required=False,
        source='customer' # Link to the 'customer' field in the model
    )

    class Meta:
        model = OfflineSale
        fields = '__all__'
        read_only_fields = ('total_amount', 'change_amount', 'created_by', 'updated_by', 'return_date')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        customer_instance = validated_data.pop('customer', None) # This will now be an OfflineCustomer instance or None

        # Populate denormalized fields from the customer instance if available
        if customer_instance:
            validated_data['customer_name'] = customer_instance.name
            validated_data['customer_phone'] = customer_instance.phone_number
            validated_data['customer_address'] = customer_instance.address
        
        offline_sale = OfflineSale.objects.create(customer=customer_instance, **validated_data)
        total_amount = 0
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            price_per_unit = item_data['price_per_unit']
            subtotal = quantity * price_per_unit
            OfflineSaleItem.objects.create(sale=offline_sale, subtotal=subtotal, **item_data)
            total_amount += subtotal

            # Stock reduction logic
            batch = item_data['batch']
            if batch.current_quantity < quantity:
                raise serializers.ValidationError(f"Insufficient stock for product {product.name} in batch {batch.batch_number}. Available: {batch.current_quantity}, Requested: {quantity}")
            batch.current_quantity -= quantity
            batch.save()

            # Create StockMovement record for OUT
            from inventory.models import StockMovement
            StockMovement.objects.create(
                product=product,
                batch=batch,
                movement_type='OUT',
                quantity=quantity,
                reference_number=f"OFFLINE-SALE-{offline_sale.id}",
                notes=f"Sold {quantity} units for Offline Sale #{offline_sale.id} from batch {batch.batch_number}",
                created_by=self.context.get('request').user if self.context.get('request') else None
            )

        offline_sale.total_amount = total_amount
        offline_sale.change_amount = offline_sale.paid_amount - total_amount
        offline_sale.save()
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

        instance.paid_amount = validated_data.get('paid_amount', instance.paid_amount)
        instance.payment_method = validated_data.get('payment_method', instance.payment_method)
        instance.is_returned = validated_data.get('is_returned', instance.is_returned)
        instance.return_date = validated_data.get('return_date', instance.return_date)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.updated_by = self.context['request'].user # Assuming user is available in context
        instance.save()

        if items_data is not None:
            # Clear existing items and recreate (or implement more sophisticated update logic)
            instance.items.all().delete()
            total_amount = 0
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                price_per_unit = item_data['price_per_unit']
                subtotal = quantity * price_per_unit
                # For updates, we need to handle stock adjustments carefully.
                # This simple implementation assumes a full replacement of items.
                # A more robust solution would compare old vs. new items and adjust stock accordingly.
                # For now, we'll just decrement stock for new items.
                batch = item_data['batch']
                if batch.current_quantity < quantity:
                    raise serializers.ValidationError(f"Insufficient stock for product {product.name} in batch {batch.batch_number}. Available: {batch.current_quantity}, Requested: {quantity}")
                batch.current_quantity -= quantity
                batch.save()

                # Create StockMovement record for OUT
                from inventory.models import StockMovement
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    movement_type='OUT',
                    quantity=quantity,
                    reference_number=f"OFFLINE-SALE-UPDATE-{instance.id}",
                    notes=f"Sold {quantity} units for Offline Sale Update #{instance.id} from batch {batch.batch_number}",
                    created_by=self.context.get('request').user if self.context.get('request') else None
                )
                OfflineSaleItem.objects.create(sale=instance, subtotal=subtotal, **item_data)
                total_amount += subtotal
            instance.total_amount = total_amount
            instance.change_amount = instance.paid_amount - total_amount
            instance.save()

        return instance

class BillReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='offline_sale_item.product.name', read_only=True)
    batch_number = serializers.CharField(source='offline_sale_item.batch.batch_number', read_only=True)

    class Meta:
        model = BillReturnItem
        fields = '__all__'
        read_only_fields = ('subtotal',)

class BillReturnSerializer(serializers.ModelSerializer):
    returned_items = BillReturnItemSerializer(many=True)
    returned_by_username = serializers.CharField(source='returned_by.username', read_only=True)

    class Meta:
        model = BillReturn
        fields = '__all__'
        read_only_fields = ('total_return_amount', 'returned_by',)

    def create(self, validated_data):
        returned_items_data = validated_data.pop('returned_items')
        bill_return = BillReturn.objects.create(**validated_data)
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
            batch.current_quantity += returned_quantity
            batch.save()

            # Create StockMovement record for IN
            from inventory.models import StockMovement
            StockMovement.objects.create(
                product=offline_sale_item.product,
                batch=batch,
                movement_type='IN',
                quantity=returned_quantity,
                reference_number=f"OFFLINE-RETURN-{bill_return.id}",
                notes=f"Returned {returned_quantity} units for Offline Sale Return #{bill_return.id} to batch {batch.batch_number}",
                created_by=self.context.get('request').user if self.context.get('request') else None
            )
        
        bill_return.total_return_amount = total_return_amount
        bill_return.save()

        # Update the original OfflineSale's is_returned status
        bill_return.sale.is_returned = True
        bill_return.sale.return_date = bill_return.return_date
        bill_return.sale.save()

        return bill_return
