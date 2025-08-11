from django.db import models
from django.contrib.auth.models import User
from orders.models import Order
import uuid

class CourierPartner(models.Model):
    """Model for courier service providers"""
    COURIER_TYPES = [
        ('delhivery', 'Delhivery'),
        ('bluedart', 'Blue Dart'),
        ('dtdc', 'DTDC'),
        ('fedex', 'FedEx'),
        ('aramex', 'Aramex'),
        ('ecom', 'Ecom Express'),
        ('xpressbees', 'XpressBees'),
        ('professional', 'Professional Courier'),
    ]
    
    name = models.CharField(max_length=100)
    courier_type = models.CharField(max_length=20, choices=COURIER_TYPES)
    api_endpoint = models.URLField()
    api_key = models.CharField(max_length=255)
    api_secret = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    service_areas = models.JSONField(default=list)  # List of pincodes/areas served
    pricing_config = models.JSONField(default=dict)  # Pricing configuration
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_courier_type_display()})"

class CourierShipment(models.Model):
    """Model for tracking courier shipments"""
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
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='courier_shipment')
    courier_partner = models.ForeignKey(CourierPartner, on_delete=models.CASCADE)
    
    # Shipment Details
    tracking_number = models.CharField(max_length=100, unique=True)
    courier_order_id = models.CharField(max_length=100, blank=True)
    
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
    courier_response = models.JSONField(default=dict)  # Store API responses
    tracking_history = models.JSONField(default=list)  # Track status changes
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Shipment {self.tracking_number} - Order #{self.order.id}"
    
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

class CourierServiceArea(models.Model):
    """Model for courier service coverage areas"""
    courier_partner = models.ForeignKey(CourierPartner, on_delete=models.CASCADE)
    pincode = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    is_cod_available = models.BooleanField(default=True)
    is_express_available = models.BooleanField(default=False)
    standard_delivery_days = models.IntegerField(default=3)
    express_delivery_days = models.IntegerField(default=1)
    
    class Meta:
        unique_together = ['courier_partner', 'pincode']
    
    def __str__(self):
        return f"{self.courier_partner.name} - {self.city} ({self.pincode})"

class CourierRateCard(models.Model):
    """Model for courier pricing"""
    courier_partner = models.ForeignKey(CourierPartner, on_delete=models.CASCADE)
    zone = models.CharField(max_length=20)  # Local, Metro, Rest of India
    weight_slab_start = models.DecimalField(max_digits=5, decimal_places=2)  # in kg
    weight_slab_end = models.DecimalField(max_digits=5, decimal_places=2)  # in kg
    rate_per_kg = models.DecimalField(max_digits=8, decimal_places=2)
    minimum_charge = models.DecimalField(max_digits=8, decimal_places=2)
    cod_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=2.0)
    fuel_surcharge_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.courier_partner.name} - {self.zone} ({self.weight_slab_start}-{self.weight_slab_end}kg)"
