# Core Models for Intelligent Pharmacy Management System
# Comprehensive database schema with proper relationships and constraints

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

# ============================================================================
# USER MANAGEMENT & ROLES
# ============================================================================

class UserRole(models.Model):
    """User role classification system"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('pharmacist', 'Pharmacist'),
        ('verifier', 'Verifier'),
        ('customer', 'Customer'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict)  # Store role-specific permissions
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_roles'
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
    
    def __str__(self):
        return self.display_name

class CustomUser(AbstractUser):
    """Extended user model with role-based classification"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(UserRole, on_delete=models.PROTECT, related_name='users')
    phone_number = models.CharField(max_length=15, blank=True)
    license_number = models.CharField(max_length=100, blank=True)  # For doctors/pharmacists
    verification_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('verified', 'Verified'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

# ============================================================================
# MEDICINES & COMPOSITIONS DATABASE
# ============================================================================

class Composition(models.Model):
    """Reusable medicine compositions (active ingredients)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    scientific_name = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)  # e.g., 'analgesic', 'antibiotic'
    side_effects = models.TextField(blank=True)
    contraindications = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT, related_name='created_compositions')
    
    class Meta:
        db_table = 'compositions'
        verbose_name = 'Composition'
        verbose_name_plural = 'Compositions'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name

class Medicine(models.Model):
    """Medicine database with multiple compositions support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    brand_name = models.CharField(max_length=200, blank=True)
    manufacturer = models.CharField(max_length=200)
    
    # Medicine classifications
    MEDICINE_TYPES = [
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup'),
        ('injection', 'Injection'),
        ('cream', 'Cream'),
        ('drops', 'Drops'),
        ('inhaler', 'Inhaler'),
        ('other', 'Other'),
    ]
    medicine_type = models.CharField(max_length=20, choices=MEDICINE_TYPES)
    
    # Prescription requirements
    PRESCRIPTION_TYPES = [
        ('otc', 'Over The Counter'),
        ('prescription', 'Prescription Required'),
        ('controlled', 'Controlled Substance'),
    ]
    prescription_type = models.CharField(max_length=20, choices=PRESCRIPTION_TYPES, default='otc')
    
    # Pricing and inventory
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=10)
    
    # Medicine details
    dosage_form = models.CharField(max_length=100, blank=True)  # e.g., "500mg", "10ml"
    pack_size = models.PositiveIntegerField(default=1)  # Number of units per pack
    expiry_date = models.DateField(blank=True, null=True)
    batch_number = models.CharField(max_length=100, blank=True)
    
    # Status and metadata
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    usage_instructions = models.TextField(blank=True)
    storage_instructions = models.TextField(blank=True)
    
    # Relationships
    compositions = models.ManyToManyField(
        Composition, 
        through='MedicineComposition', 
        related_name='medicines'
    )
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT, related_name='created_medicines')
    
    class Meta:
        db_table = 'medicines'
        verbose_name = 'Medicine'
        verbose_name_plural = 'Medicines'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['brand_name']),
            models.Index(fields=['manufacturer']),
            models.Index(fields=['is_active']),
            models.Index(fields=['prescription_type']),
        ]
        unique_together = ['name', 'manufacturer', 'dosage_form']
    
    def __str__(self):
        return f"{self.name} ({self.manufacturer})"

class MedicineComposition(models.Model):
    """Junction table for medicine-composition relationship with dosage info"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    composition = models.ForeignKey(Composition, on_delete=models.CASCADE)
    strength = models.CharField(max_length=100)  # e.g., "500mg", "10%"
    unit = models.CharField(max_length=20, default='mg')  # mg, ml, %, etc.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'medicine_compositions'
        verbose_name = 'Medicine Composition'
        verbose_name_plural = 'Medicine Compositions'
        unique_together = ['medicine', 'composition']
    
    def __str__(self):
        return f"{self.medicine.name} - {self.composition.name} ({self.strength}{self.unit})"

# ============================================================================
# PRESCRIPTION WORKFLOW SYSTEM
# ============================================================================

class Prescription(models.Model):
    """Prescription management with intelligent workflow"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Prescription identification
    prescription_number = models.CharField(max_length=50, unique=True)
    patient_name = models.CharField(max_length=200)
    patient_age = models.PositiveIntegerField(blank=True, null=True)
    patient_gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True
    )
    
    # Doctor information
    doctor_name = models.CharField(max_length=200, blank=True)
    doctor_license = models.CharField(max_length=100, blank=True)
    hospital_clinic = models.CharField(max_length=300, blank=True)
    
    # Prescription workflow status
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('ai_processing', 'AI Processing'),
        ('ai_mapped', 'AI Mapped'),
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('need_clarification', 'Need Clarification'),
        ('rejected', 'Rejected'),
        ('dispensed', 'Dispensed'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='uploaded')
    
    # File management
    prescription_image = models.ImageField(upload_to='prescriptions/')
    ocr_text = models.TextField(blank=True)  # Extracted text from AI/OCR
    ai_confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    
    # Workflow management
    rejection_reason = models.TextField(blank=True)
    clarification_notes = models.TextField(blank=True)
    verification_notes = models.TextField(blank=True)
    
    # User relationships
    uploaded_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.PROTECT, 
        related_name='uploaded_prescriptions'
    )
    verified_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.PROTECT, 
        related_name='verified_prescriptions',
        blank=True, 
        null=True
    )
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prescriptions'
        verbose_name = 'Prescription'
        verbose_name_plural = 'Prescriptions'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['prescription_number']),
        ]
    
    def __str__(self):
        return f"Prescription {self.prescription_number} - {self.patient_name}"

class PrescriptionMedicine(models.Model):
    """AI-mapped medicines from prescription with verification status"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(
        Prescription, 
        on_delete=models.CASCADE, 
        related_name='prescription_medicines'
    )
    
    # AI extracted information
    extracted_medicine_name = models.CharField(max_length=300)  # Raw text from AI
    extracted_dosage = models.CharField(max_length=100, blank=True)
    extracted_frequency = models.CharField(max_length=100, blank=True)
    extracted_duration = models.CharField(max_length=100, blank=True)
    
    # AI mapping
    suggested_medicine = models.ForeignKey(
        Medicine, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='ai_suggestions'
    )
    ai_confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    
    # Verification status
    VERIFICATION_STATUS = [
        ('pending', 'Pending Verification'),
        ('approved', 'Approved'),
        ('modified', 'Modified'),
        ('rejected', 'Rejected'),
    ]
    verification_status = models.CharField(
        max_length=20, 
        choices=VERIFICATION_STATUS, 
        default='pending'
    )
    
    # Final verified medicine (after pharmacist review)
    verified_medicine = models.ForeignKey(
        Medicine, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='verified_prescriptions'
    )
    verified_dosage = models.CharField(max_length=100, blank=True)
    verified_frequency = models.CharField(max_length=100, blank=True)
    verified_duration = models.CharField(max_length=100, blank=True)
    
    # Quantity and pricing
    quantity_prescribed = models.PositiveIntegerField(default=1)
    quantity_dispensed = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.PROTECT, 
        blank=True, 
        null=True,
        related_name='verified_medicines'
    )
    
    class Meta:
        db_table = 'prescription_medicines'
        verbose_name = 'Prescription Medicine'
        verbose_name_plural = 'Prescription Medicines'
        indexes = [
            models.Index(fields=['verification_status']),
            models.Index(fields=['ai_confidence']),
        ]
    
    def __str__(self):
        return f"{self.prescription.prescription_number} - {self.extracted_medicine_name}"

# ============================================================================
# ORDER MANAGEMENT INTEGRATION
# ============================================================================

class Order(models.Model):
    """Order management integrated with prescription workflow"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True)

    # Order types
    ORDER_TYPES = [
        ('regular', 'Regular Order'),
        ('prescription', 'Prescription Order'),
        ('emergency', 'Emergency Order'),
    ]
    order_type = models.CharField(max_length=20, choices=ORDER_TYPES, default='regular')

    # Customer information
    customer = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='orders'
    )

    # Prescription relationship (for prescription orders)
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='orders'
    )

    # Order status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Pickup'),
        ('dispatched', 'Dispatched'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Delivery information
    delivery_address = models.TextField()
    delivery_phone = models.CharField(max_length=15)
    delivery_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'orders'
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Order {self.order_number} - {self.customer.username}"

class OrderItem(models.Model):
    """Individual items in an order"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)

    # Prescription medicine reference (if from prescription)
    prescription_medicine = models.ForeignKey(
        PrescriptionMedicine,
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )

    # Quantity and pricing
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Status
    is_dispensed = models.BooleanField(default=False)
    dispensed_at = models.DateTimeField(blank=True, null=True)
    dispensed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='dispensed_items'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_items'
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.order.order_number} - {self.medicine.name}"

# ============================================================================
# WORKFLOW TRACKING & AUDIT
# ============================================================================

class PrescriptionWorkflowLog(models.Model):
    """Audit trail for prescription workflow changes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(
        Prescription, 
        on_delete=models.CASCADE, 
        related_name='workflow_logs'
    )
    
    # Status change tracking
    from_status = models.CharField(max_length=30, blank=True)
    to_status = models.CharField(max_length=30)
    
    # Change details
    action_taken = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    system_generated = models.BooleanField(default=False)  # True for AI actions
    
    # User and timestamp
    performed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.PROTECT, 
        related_name='workflow_actions'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'prescription_workflow_logs'
        verbose_name = 'Prescription Workflow Log'
        verbose_name_plural = 'Prescription Workflow Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.prescription.prescription_number}: {self.from_status} → {self.to_status}"
