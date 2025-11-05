from django.db import models
from product.models import Product, Batch
from usermanagement.models import User

class OfflineCustomer(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True) # Make name optional
    phone_number = models.CharField(max_length=15, unique=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.phone_number})"

class OfflineSale(models.Model):
    customer = models.ForeignKey(OfflineCustomer, on_delete=models.SET_NULL, null=True, blank=True, related_name='offline_sales')
    customer_name = models.CharField(max_length=255, blank=True, null=True) # Kept for flexibility/denormalization
    customer_phone = models.CharField(max_length=15, blank=True, null=True) # Kept for flexibility/denormalization
    customer_address = models.TextField(blank=True, null=True) # Kept for flexibility/denormalization
    sale_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    change_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=50, blank=True, null=True) # e.g., Cash, Card, UPI
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='offline_sales_created')
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned'), # For full returns
        ('PARTIALLY_RETURNED', 'Partially Returned'), # For partial item returns
    ]
    TAG_CHOICES = [
        ('OFFLINE', 'Offline Sale'),
        ('ONLINE', 'Online Sale'),
        # Add other tags as needed
    ]

    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='offline_sales_updated')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    tag = models.CharField(max_length=20, choices=TAG_CHOICES, default='OFFLINE') # New tag field
    last_status_update_date = models.DateTimeField(auto_now=True) # Tracks last update to status
    cancellation_reason = models.TextField(blank=True, null=True) # Reason for cancellation
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Sale #{self.id} - {self.customer_name or 'Guest'} - {self.sale_date.strftime('%Y-%m-%d %H:%M')} ({self.status})"

class OfflineSaleItem(models.Model):
    sale = models.ForeignKey(OfflineSale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True) # Optional, if tracking by batch
    quantity = models.IntegerField()
    # Add a ForeignKey to ProductUnit to specify the unit for this offline sale item
    product_unit = models.ForeignKey(
        'product.ProductUnit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="The unit in which this product was sold (e.g., 'strip', 'bottle')."
    )
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # New field for item-level discount
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # New field for item-level discount amount
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        unit_display = self.product_unit.unit_abbreviation if self.product_unit and self.product_unit.unit_abbreviation else (self.product_unit.unit_name if self.product_unit else 'units')
        return f"{self.quantity} {unit_display} of {self.product.name} in Sale #{self.sale.id}"

class BillReturn(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSED', 'Processed'),
        ('CANCELLED', 'Cancelled'),
    ]

    sale = models.ForeignKey(OfflineSale, on_delete=models.CASCADE, related_name='returns')
    return_date = models.DateTimeField(auto_now_add=True)
    total_return_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING') # Added status field
    returned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bill_returns_created')

    def __str__(self):
        return f"Return for Sale #{self.sale.id} on {self.return_date.strftime('%Y-%m-%d %H:%M')} ({self.status})"

class BillReturnItem(models.Model):
    bill_return = models.ForeignKey(BillReturn, on_delete=models.CASCADE, related_name='returned_items')
    offline_sale_item = models.ForeignKey(OfflineSaleItem, on_delete=models.CASCADE, related_name='returned_details')
    returned_quantity = models.IntegerField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.returned_quantity} of {self.offline_sale_item.product.name} returned for Return #{self.bill_return.id}"
