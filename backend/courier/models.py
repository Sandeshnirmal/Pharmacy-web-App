from django.db import models
from usermanagement.models import User
import uuid

class CourierShipment(models.Model):
    """Model for tracking TPC courier shipments"""
    STATUS_CHOICES = [
        ('pending', 'Pending Pickup'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
        ('exception', 'Exception'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='courier_shipment')
    
    # Shipment Details (TPC specific)
    tracking_number = models.CharField(max_length=100, unique=True)
    tpc_order_id = models.CharField(max_length=100, blank=True) # Renamed from courier_order_id
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_location = models.CharField(max_length=255, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    
    # Pickup Details
    pickup_scheduled = models.DateTimeField(null=True, blank=True)
    pickup_completed = models.DateTimeField(null=True, blank=True)
    pickup_address = models.JSONField(default=dict)
    
    # Delivery Details
    delivery_address = models.JSONField(default=dict)
    delivery_instructions = models.TextField(blank=True)
    delivery_contact = models.CharField(max_length=15)
    
    # Package Details
    weight = models.DecimalField(max_digits=8, decimal_places=2, default=0.5)  # in kg
    dimensions = models.JSONField(default=dict)  # length, width, height in cm
    declared_value = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Charges
    shipping_charges = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    cod_charges = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_charges = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Metadata
    tpc_response = models.JSONField(default=dict)  # Store API responses (TPC specific)
    tracking_history = models.JSONField(default=list)  # Track status changes
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"TPC Shipment {self.tracking_number} - Order #{self.order.id}"
    
    def add_tracking_event(self, status, location, timestamp, description=""):
        """Add a tracking event to history"""
        event = {
            'status': status,
            'location': location,
            'timestamp': timestamp.isoformat() if timestamp else None,
            'description': description
        }
        self.tracking_history.append(event)
        self.save()

# This is the new model to store TPC recipient-specific details
class TPCRecipient(models.Model):
    # Link to the user's address for location details
    address = models.ForeignKey('usermanagement.Address', on_delete=models.CASCADE, related_name='tpc_recipients')
    
    # API-specific fields
    recipient_name = models.CharField(max_length=255, verbose_name="Recipient Name")
    recipient_company = models.CharField(max_length=255, blank=True, null=True, verbose_name="Recipient Company")
    recipient_mobile = models.CharField(max_length=20, verbose_name="Recipient Mobile")
    recipient_email = models.EmailField(verbose_name="Recipient Email")
    recipient_gstin = models.CharField(max_length=20, blank=True, null=True, verbose_name="Recipient GSTIN")
    
    def __str__(self):
        return f"{self.recipient_name} at {self.address.city}"

class TPCServiceableArea(models.Model):
    """Model to store TPC serviceable pincodes and area names."""
    pincode = models.CharField(max_length=10, unique=True)
    area_name = models.CharField(max_length=255, blank=True, null=True) # Corresponds to AREANAME
    city = models.CharField(max_length=100, blank=True, null=True) # Keeping for potential future use or if AREANAME is not always city
    state = models.CharField(max_length=100, blank=True, null=True)
    
    station_code = models.CharField(max_length=50, blank=True, null=True)
    sub_branch_code = models.CharField(max_length=50, blank=True, null=True)
    
    doc_delivery = models.CharField(max_length=10, blank=True, null=True) # YES/NO
    parcel_delivery = models.CharField(max_length=10, blank=True, null=True) # YES/NO
    propremium_delivery = models.CharField(max_length=10, blank=True, null=True) # YES/NO
    
    doc_delivery_schedule = models.CharField(max_length=50, blank=True, null=True)
    parcel_delivery_schedule = models.CharField(max_length=50, blank=True, null=True)
    prodlyschedule = models.CharField(max_length=50, blank=True, null=True) # Assuming this is PRODLYSCHEDULE
    cod_delivery = models.CharField(max_length=10, blank=True, null=True) # YES/NO

    is_serviceable = models.BooleanField(default=True) # Derived field
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'TPC Serviceable Area'
        verbose_name_plural = 'TPC Serviceable Areas'

    def __str__(self):
        return f"{self.pincode} - {self.area_name} ({'Serviceable' if self.is_serviceable else 'Not Serviceable'})"
