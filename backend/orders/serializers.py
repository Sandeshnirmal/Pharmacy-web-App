# order/serializers.py
from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem
from product.models import Product, Batch
from usermanagement.models import Address
from inventory.models import StockMovement # Import StockMovement
from prescriptions.models import Prescription # Import Prescription model

class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product')
    batch_id = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all(), source='batch')
    product_name = serializers.CharField(source='product.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    quantity = serializers.IntegerField(allow_null=True, required=False) # Explicitly define quantity

    class Meta:
        model = OrderItem
        fields = ['id', 'product_id', 'batch_id', 'quantity', 'unit_price_at_order',
                 'product_name', 'batch_number']
        read_only_fields = ['unit_price_at_order'] # unit_price_at_order will be set by the OrderSerializer

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    address_full = serializers.SerializerMethodField()
    prescription_id = serializers.PrimaryKeyRelatedField(queryset=Prescription.objects.all(), allow_null=True, required=False, source='prescription')
    total_items = serializers.SerializerMethodField()

    # Allow setting address by ID
    address = serializers.PrimaryKeyRelatedField(queryset=Address.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'user_email', 'user_phone', 'address', 'address_full',
                  'order_date', 'total_amount', 'discount_amount', 'shipping_fee',
                  'payment_method', 'payment_status', 'order_status', 'is_prescription_order',
                  'prescription_id', 'delivery_method',
                  'expected_delivery_date', 'notes', 'delivery_address', 'tracking_number',
                  'created_at', 'updated_at', 'items', 'total_items']
        read_only_fields = ['user', 'order_date', 'total_amount', 'discount_amount', 'shipping_fee',
                            'payment_status', 'order_status', 'created_at', 'updated_at',
                            'tracking_number', 'delivery_address']

    def get_address_full(self, obj):
        if obj.delivery_address:
            return f"{obj.delivery_address.get('address_line1', '')}, {obj.delivery_address.get('city', '')}, {obj.delivery_address.get('state', '')} - {obj.delivery_address.get('pincode', '')}"
        return None

    def get_total_items(self, obj):
        return obj.items.count()

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        address_instance = validated_data.pop('address', None)
        user = self.context['request'].user # Assuming user is available in context

        with transaction.atomic():
            # Populate delivery_address from Address instance if provided
            if address_instance:
                validated_data['delivery_address'] = {
                    'address_line1': address_instance.address_line1,
                    'address_line2': address_instance.address_line2,
                    'city': address_instance.city,
                    'state': address_instance.state,
                    'pincode': address_instance.pincode,
                    'country': address_instance.country,
                }
            
            validated_data['user'] = user
            validated_data['order_status'] = 'Pending' # Initial status
            validated_data['payment_status'] = 'Pending' # Initial payment status

            order = Order.objects.create(**validated_data)

            total_amount = 0
            for item_data in items_data:
                product = item_data['product']
                batch = item_data['batch']
                quantity = item_data['quantity']

                if batch.current_quantity < quantity:
                    raise serializers.ValidationError(f"Insufficient stock for product {product.name} (Batch: {batch.batch_number}). Available: {batch.current_quantity}, Requested: {quantity}")

                # Deduct stock
                batch.current_quantity -= quantity
                batch.save(update_fields=['current_quantity'])

                # Create StockMovement record
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    quantity=quantity,
                    movement_type='OUT',
                    reason='Order placed',
                    moved_by=user # Assuming user is the one placing the order
                )

                # Set unit_price_at_order from batch's selling price
                item_data['unit_price_at_order'] = batch.selling_price
                order_item = OrderItem.objects.create(order=order, **item_data)
                total_amount += order_item.total_price

            order.total_amount = total_amount
            order.save(update_fields=['total_amount', 'order_status', 'payment_status', 'delivery_address'])

        return order
