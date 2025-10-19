from rest_framework import serializers
from .models import OfflineSale, OfflineSaleItem
from product.serializers import ProductSerializer, BatchSerializer # Assuming these exist

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

    class Meta:
        model = OfflineSale
        fields = '__all__'
        read_only_fields = ('total_amount', 'change_amount', 'created_by', 'updated_by', 'return_date')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        offline_sale = OfflineSale.objects.create(**validated_data)
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
        
        instance.customer_name = validated_data.get('customer_name', instance.customer_name)
        instance.customer_phone = validated_data.get('customer_phone', instance.customer_phone)
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
