from django.db import models
from usermanagement.models import User
from usermanagement.models import Address
from product.models import Product,Batch




# Create your models here.
class Order(models.Model):
    PAYMENT_METHODS = [('UPI', 'UPI'), ('Card', 'Card'), ('COD', 'COD')]
    PAYMENT_STATUS = [
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Refunded', 'Refunded'),
        ('Aborted', 'Aborted'), # New status
    ]
    ORDER_STATUS = [
        ('Pending', 'Pending'),
        ('payment_completed', 'Payment Completed'),
        ('prescription_uploaded', 'Prescription Uploaded'),
        ('verified', 'Verified'),
        ('prescription_rejected', 'Prescription Rejected'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Aborted', 'Aborted'), # New status
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS)
    order_status = models.CharField(max_length=25, choices=ORDER_STATUS, default='Pending')
    is_prescription_order = models.BooleanField(default=False)
    prescription_image_url = models.URLField(max_length=500, blank=True, null=True) # Store URL to image
    PRESCRIPTION_STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    prescription_status = models.CharField(max_length=20, choices=PRESCRIPTION_STATUS_CHOICES, default='pending_review')
    delivery_method = models.CharField(max_length=50, default='Standard Delivery')
    expected_delivery_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    delivery_address = models.JSONField(default=dict, blank=True)  # Store delivery address as JSON
    tracking_number = models.CharField(max_length=100, blank=True)  # Courier tracking number
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Renamed for consistency
    unit_price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    prescription_detail = models.ForeignKey('prescriptions.PrescriptionMedicine', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True,related_name='orders')

    @property
    def total_price(self):
        return self.quantity * self.unit_price_at_order

    def __str__(self):
        return f"{self.product.name if self.product else 'Unknown'} x {self.quantity}"


class OrderTracking(models.Model):
    """Enhanced order tracking with detailed status updates"""
    TRACKING_STATUS_CHOICES = [
        ('order_placed', 'Order Placed'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('prescription_verified', 'Prescription Verified'),
        ('order_confirmed', 'Order Confirmed'),
        ('preparing', 'Preparing Order'),
        ('quality_check', 'Quality Check'),
        ('packed', 'Packed'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tracking_updates')
    status = models.CharField(max_length=30, choices=TRACKING_STATUS_CHOICES)
    message = models.TextField()
    location = models.CharField(max_length=200, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    delivery_person_name = models.CharField(max_length=100, blank=True)
    delivery_person_phone = models.CharField(max_length=15, blank=True)
    tracking_number = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Tracking'
        verbose_name_plural = 'Order Tracking Updates'

    def __str__(self):
        return f"Order {self.order.id} - {self.get_status_display()}"


class OrderStatusHistory(models.Model):
    """Track all status changes for an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=15, blank=True)
    new_status = models.CharField(max_length=15)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Order Status History'
        verbose_name_plural = 'Order Status History'

    def __str__(self):
        return f"Order {self.order.id}: {self.old_status} → {self.new_status}"
