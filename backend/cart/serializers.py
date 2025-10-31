from rest_framework import serializers
from .models import Cart, CartItem
from product.serializers import ProductSerializer # Assuming ProductSerializer exists

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True) # Nested serializer for product details
    product_id = serializers.IntegerField(write_only=True) # For adding/updating by product ID

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'added_at', 'total_price']
        read_only_fields = ['id', 'product', 'added_at', 'total_price']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_items', 'subtotal', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return obj.items.count()

    def get_subtotal(self, obj):
        return sum(item.total_price for item in obj.items.all())
