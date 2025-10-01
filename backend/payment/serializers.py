# payment/serializers.py

from rest_framework import serializers
from .models import Payment
from orders.serializers import OrderSerializer

class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Payment model.
    Includes a nested representation of the associated order for easy lookup.
    """
    order = OrderSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'user', 'razorpay_order_id', 'razorpay_payment_id', 
            'razorpay_signature', 'amount', 'currency', 'payment_method', 
            'status', 'payment_date', 'updated_at', 'notes'
        ]
        read_only_fields = ['order', 'user', 'status', 'payment_date', 'updated_at']

