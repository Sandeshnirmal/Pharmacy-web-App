from django.db import models
from product.models import Product, Batch
from usermanagement.models import User
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

# ============================================================================
# INTELLIGENT PRESCRIPTION WORKFLOW SYSTEM
# ============================================================================
class Prescription(models.Model):
    """Enhanced prescription management with intelligent workflow"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Prescription identification
    prescription_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    patient_name = models.CharField(max_length=200, blank=True, null=True)
    patient_age = models.PositiveIntegerField(blank=True, null=True)
    patient_gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True
    )

    # Doctor information
    doctor_name = models.CharField(max_length=200, blank=True, null=True)
    doctor_license = models.CharField(max_length=100, blank=True, null=True)
    hospital_clinic = models.CharField(max_length=300, blank=True, null=True)
    prescription_date = models.DateField(null=True, blank=True)

    # Enhanced prescription workflow status
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

    # Legacy status field for backward compatibility
    VERIFICATION_STATUS = [
        ('Uploaded', 'Uploaded'),
        ('AI_Processing', 'AI_Processing'),
        ('AI_Processed', 'AI_Processed'),
        ('Pending_Review', 'Pending_Review'),
        ('Verified', 'Verified'),
        ('Rejected', 'Rejected'),
    ]
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='Uploaded')

    # File management
    image_url = models.URLField(blank=True)
    image_file = models.ImageField(upload_to='prescriptions/', null=True, blank=True)
    ocr_text = models.TextField(blank=True)  # Extracted text from AI/OCR
    ai_confidence_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True, blank=True
    )
    ai_processing_time = models.FloatField(null=True, blank=True)
    ai_processed = models.BooleanField(default=False)

    # Enhanced workflow management
    rejection_reason = models.TextField(blank=True, null=True)
    clarification_notes = models.TextField(blank=True, null=True)
    pharmacist_notes = models.TextField(blank=True, null=True)
    verification_notes = models.TextField(blank=True, null=True)

    # User relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions')
    verified_by_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_prescriptions_set'
    )

    # Timestamps
    upload_date = models.DateTimeField(auto_now_add=True)
    verification_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'prescriptions'
        verbose_name = 'Prescription'
        verbose_name_plural = 'Prescriptions'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['verification_status']),
            models.Index(fields=['upload_date']),
            models.Index(fields=['prescription_number']),
        ]

    def __str__(self):
        return f"Prescription {self.prescription_number or self.id} - {self.patient_name or 'Unknown Patient'}"

class PrescriptionMedicine(models.Model):
    """Enhanced AI-mapped medicines from prescription with verification status"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='prescription_medicines'
    )

    # AI extracted information
    line_number = models.PositiveIntegerField(default=1)
    recognized_text_raw = models.TextField(blank=True)
    extracted_medicine_name = models.CharField(max_length=300)  # Raw text from AI
    extracted_dosage = models.CharField(max_length=100, blank=True)
    extracted_frequency = models.CharField(max_length=100, blank=True)
    extracted_duration = models.CharField(max_length=100, blank=True)
    extracted_quantity = models.CharField(max_length=50, blank=True)
    extracted_instructions = models.TextField(blank=True)

    # AI mapping
    suggested_medicine = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='ai_suggestions'
    )
    suggested_products = models.ManyToManyField(Product, blank=True, related_name='suggested_for_prescriptions')
    ai_confidence_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True, blank=True
    )

    # Enhanced verification status
    VERIFICATION_STATUS = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('need_clarification', 'Need Clarification'),
        ('rejected', 'Rejected'),
    ]
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS,
        default='pending'
    )

    # Legacy mapping status for backward compatibility
    MAPPING_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Mapped', 'Mapped'),
        ('Unmapped', 'Unmapped'),
        ('Unavailable', 'Unavailable'),
    ]
    mapping_status = models.CharField(max_length=50, choices=MAPPING_STATUS_CHOICES, default='Pending')

    # Final verified medicine (after pharmacist review)
    verified_medicine = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='verified_prescriptions'
    )
    mapped_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)  # Legacy field
    verified_medicine_name = models.CharField(max_length=255, blank=True, null=True)
    verified_dosage = models.CharField(max_length=100, blank=True, null=True)
    verified_frequency = models.CharField(max_length=100, blank=True, null=True)
    verified_duration = models.CharField(max_length=100, blank=True, null=True)
    verified_quantity = models.CharField(max_length=50, blank=True, null=True)
    verified_instructions = models.TextField(blank=True, null=True)

    # Quantity and pricing
    quantity_prescribed = models.PositiveIntegerField(default=1)
    quantity_dispensed = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Status flags
    is_valid_for_order = models.BooleanField(default=False)
    customer_approved = models.BooleanField(default=False)

    # Comments and notes
    pharmacist_comment = models.TextField(blank=True, null=True)
    clarification_notes = models.TextField(blank=True, null=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_by = models.ForeignKey(
        User,
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
            models.Index(fields=['mapping_status']),
            models.Index(fields=['ai_confidence_score']),
        ]

    def __str__(self):
        return f"{self.prescription.prescription_number or self.prescription.id} - {self.extracted_medicine_name}"

# ============================================================================
# LEGACY COMPATIBILITY
# ============================================================================

# Legacy model alias for backward compatibility
PrescriptionDetail = PrescriptionMedicine

# Add legacy field mappings for backward compatibility
def add_legacy_fields():
    """Add legacy field mappings to PrescriptionMedicine"""
    # Map legacy field names to new field names
    PrescriptionMedicine.ai_extracted_medicine_name = property(lambda self: self.extracted_medicine_name)
    PrescriptionMedicine.ai_extracted_dosage = property(lambda self: self.extracted_dosage)
    PrescriptionMedicine.ai_extracted_quantity = property(lambda self: self.extracted_quantity)
    PrescriptionMedicine.ai_extracted_instructions = property(lambda self: self.extracted_instructions)
    PrescriptionMedicine.ai_extracted_frequency = property(lambda self: self.extracted_frequency)
    PrescriptionMedicine.ai_extracted_duration = property(lambda self: self.extracted_duration)

# Apply legacy field mappings
add_legacy_fields()

# ============================================================================
# WORKFLOW TRACKING & AUDIT SYSTEM
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
        User,
        on_delete=models.PROTECT,
        related_name='workflow_actions',
        null=True,
        blank=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescription_workflow_logs'
        verbose_name = 'Prescription Workflow Log'
        verbose_name_plural = 'Prescription Workflow Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.prescription.prescription_number or self.prescription.id}: {self.from_status} → {self.to_status}"


class PrescriptionScanResult(models.Model):
    """Model for storing prescription scan results for medicine suggestions"""
    SCAN_TYPES = [
        ('composition_search', 'Composition Search'),
        ('ocr_scan', 'OCR Scan'),
        ('manual_entry', 'Manual Entry'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    scanned_text = models.TextField()
    extracted_medicines = models.JSONField(default=list)
    total_suggestions = models.IntegerField(default=0)
    scan_type = models.CharField(max_length=20, choices=SCAN_TYPES, default='composition_search')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescription_scan_results'
        verbose_name = 'Prescription Scan Result'
        verbose_name_plural = 'Prescription Scan Results'
        ordering = ['-created_at']

    def __str__(self):
        return f"Scan {self.id} - {self.user.username if self.user else 'Anonymous'} ({self.total_suggestions} suggestions)"


class MedicineSuggestion(models.Model):
    """Model for storing individual medicine suggestions from scans"""
    scan_result = models.ForeignKey(PrescriptionScanResult, on_delete=models.CASCADE, related_name='suggestions')
    product_id = models.IntegerField()  # Reference to Product model
    product_name = models.CharField(max_length=255)
    match_type = models.CharField(max_length=50)  # exact_name, composition, partial_name, etc.
    confidence_score = models.FloatField(default=0.0)
    search_term = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'medicine_suggestions'
        verbose_name = 'Medicine Suggestion'
        verbose_name_plural = 'Medicine Suggestions'
        ordering = ['-confidence_score', '-created_at']

    def __str__(self):
        return f"{self.product_name} (Score: {self.confidence_score})"
