from django.db import models
from django.contrib.auth import get_user_model
from orders.models import Order

User = get_user_model()


class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('razorpay', 'Razorpay'),
        ('cod', 'Cash on Delivery'),
        ('wallet', 'Wallet'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Razorpay fields
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=200, blank=True)
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='razorpay')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Metadata
    payment_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment {self.id} - Order {self.order.id} - {self.status}"
