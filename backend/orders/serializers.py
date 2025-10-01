# order/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem
from product.serializers import ProductSerializer
from usermanagement.models import Address # Import Address model

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_strength = serializers.CharField(source='product.strength', read_only=True)
    product_form = serializers.CharField(source='product.form', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'unit_price_at_order',
                 'total_price', 'product_name', 'product_strength', 'product_form', 'batch_number']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    address_full = serializers.SerializerMethodField()
    prescription_id = serializers.CharField(source='prescription.id', read_only=True) # Assuming 'prescription' is a ForeignKey
    total_items = serializers.SerializerMethodField()

    # Allow setting address by ID
    address = serializers.PrimaryKeyRelatedField(queryset=Address.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'user_email', 'user_phone', 'address', 'address_full',
                  'order_date', 'total_amount', 'discount_amount', 'shipping_fee',
                  'payment_method', 'payment_status', 'order_status', 'is_prescription_order',
                  'prescription_image_base64', 'prescription_status', 'delivery_method',
                  'expected_delivery_date', 'notes', 'delivery_address', 'tracking_number',
                  'created_at', 'updated_at', 'items', 'prescription_id', 'total_items']
        read_only_fields = ['user', 'order_date', 'total_amount', 'discount_amount', 'shipping_fee',
                            'payment_status', 'order_status', 'created_at', 'updated_at',
                            'tracking_number', 'delivery_address'] # delivery_address might be set by system

    def get_address_full(self, obj):
        if obj.address:
            return f"{obj.address.address_line1}, {obj.address.city}, {obj.address.state} - {obj.address.pincode}"
        return None

    def get_total_items(self, obj):
        return obj.items.count()
