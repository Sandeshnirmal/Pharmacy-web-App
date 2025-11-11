from django.db import models
from django.utils import timezone # Import timezone
from product.models import Product, Batch
from usermanagement.models import User

class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJUSTMENT', 'Adjustment'),
        ('EXPIRED', 'Expired'),
        ('DAMAGED', 'Damaged'),
        ('SUPPLIER_RETURN', 'Supplier Return'), # New movement type for returns
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text="Quantity for stock movement. Positive for IN, negative for OUT."
    )
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} - {self.quantity}"

class StockAlert(models.Model):
    ALERT_TYPES = [
        ('LOW_STOCK', 'Low Stock'),
        ('OUT_OF_STOCK', 'Out of Stock'),
        ('EXPIRING_SOON', 'Expiring Soon'),
        ('EXPIRED', 'Expired'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_alerts')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='stock_alerts', null=True, blank=True)
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.alert_type}"

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    address = models.TextField()
    gst_number = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ORDERED', 'Ordered'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    invoice_number = models.CharField(max_length=100, unique=True, blank=True, null=True) # Temporarily allow null for migration
    invoice_date = models.DateField(blank=True, null=True) # Temporarily allow null for migration
    order_date = models.DateTimeField(auto_now_add=True) # Keep for internal tracking, but not exposed in form
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='purchase_orders_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders_updated')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"PO #{self.id} - {self.invoice_number} - {self.supplier.name} - {self.invoice_date.strftime('%Y-%m-%d')}"

class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        help_text="Quantity for purchase order."
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # Added discount_percentage
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # Added tax_percentage
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    received_quantity = models.IntegerField(default=0)
    returned_quantity = models.IntegerField(default=0) # New field to track returned quantity
    batch_number = models.CharField(max_length=100, blank=True, null=True) # To store batch number from supplier
    expiry_date = models.DateField(blank=True, null=True) # To store expiry date from supplier

    def __str__(self):
        return f"{self.product.name} ({self.quantity}) in PO #{self.purchase_order.id}"

class PurchaseReturn(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSED', 'Processed'),
        ('CANCELLED', 'Cancelled'),
    ]

    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='returns')
    return_date = models.DateField(default=timezone.now) # Allow frontend to set return date
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True) # Added notes field
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='purchase_returns_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_returns_updated')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Return #{self.id} from PO #{self.purchase_order.id}"

class PurchaseReturnItem(models.Model):
    purchase_return = models.ForeignKey(PurchaseReturn, on_delete=models.CASCADE, related_name='items')
    purchase_order_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.CASCADE, related_name='return_records')
    product = models.ForeignKey(Product, on_delete=models.CASCADE) # Redundant but useful for direct access
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2) # Price at which it was purchased
    batch_number = models.CharField(max_length=100, blank=True, null=True) # Store batch number of returned item
    expiry_date = models.DateField(blank=True, null=True) # Store expiry date of returned item

    def __str__(self):
        return f"{self.product.name} ({self.quantity}) returned in PR #{self.purchase_return.id}"
