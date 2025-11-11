# order/serializers.py
from rest_framework import serializers
from decimal import Decimal # Import Decimal
from .models import Order, OrderItem
from product.serializers import ProductSerializer
from usermanagement.models import Address # Import Address model
class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    tax_percentage = serializers.DecimalField(source='batch.tax_percentage', max_digits=5, decimal_places=2, read_only=True)
    tax_amount = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'unit_price_at_order',
                 'total_price', 'product_name', 'batch_number',
                 'tax_percentage', 'tax_amount']

    def get_tax_amount(self, obj):
        if obj.batch and obj.batch.tax_percentage is not None:
            return obj.unit_price_at_order * obj.quantity * (obj.batch.tax_percentage / 100)
        return Decimal('0.00')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    address_full = serializers.SerializerMethodField()
    prescription_id = serializers.CharField(source='prescription.id', read_only=True) # Assuming 'prescription' is a ForeignKey
    total_items = serializers.SerializerMethodField()
    total_tax_amount = serializers.SerializerMethodField()

    # Allow setting address by ID
    address = serializers.PrimaryKeyRelatedField(queryset=Address.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'user_email', 'user_phone', 'address', 'address_full',
                  'order_date', 'total_amount', 'discount_amount', 'shipping_fee',
                  'payment_method', 'payment_status', 'order_status', 'is_prescription_order',
                  'prescription_image_url', 'prescription_status', 'delivery_method',
                  'expected_delivery_date', 'notes', 'delivery_address', 'tracking_number',
                  'created_at', 'updated_at', 'items', 'prescription_id', 'total_items', 'total_tax_amount']
        read_only_fields = ['user', 'order_date', 'total_amount', 'discount_amount', 'shipping_fee',
                            'payment_status', 'order_status', 'created_at', 'updated_at',
                            'tracking_number', 'delivery_address', 'prescription_image_url', 'total_tax_amount']

    def get_address_full(self, obj):
        if obj.address:
            return f"{obj.address.address_line1}, {obj.address.city}, {obj.address.state} - {obj.address.pincode}"
        return None

    def get_total_items(self, obj):
        return obj.items.count()

    def get_total_tax_amount(self, obj):
        total_tax = Decimal('0.00')
        for item in obj.items.all():
            if item.batch and item.batch.tax_percentage is not None:
                total_tax += item.unit_price_at_order * item.quantity * (obj.batch.tax_percentage / 100)
        return total_tax

class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=True)
