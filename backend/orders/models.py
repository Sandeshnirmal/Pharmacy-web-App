from django.db import models
from usermanagement.models import User,Address
from product.models import Product,Batch




# Create your models here.
class Order(models.Model):
    PAYMENT_METHODS = [('UPI', 'UPI'), ('Card', 'Card'), ('COD', 'COD')]
    PAYMENT_STATUS = [('Pending', 'Pending'), ('Paid', 'Paid'), ('Refunded', 'Refunded')]
    ORDER_STATUS = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS)
    order_status = models.CharField(max_length=15, choices=ORDER_STATUS)
    is_prescription_order = models.BooleanField(default=False)
    prescription = models.ForeignKey('prescriptions.Prescription', on_delete=models.SET_NULL, null=True, blank=True ,related_name='orders')

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    unit_price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    prescription_detail = models.ForeignKey('prescriptions.PrescriptionDetail', on_delete=models.SET_NULL, null=True, blank=True,related_name='orders')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True,related_name='orders')