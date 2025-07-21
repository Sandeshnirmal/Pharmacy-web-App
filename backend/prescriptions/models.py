from django.db import models
from product.models import Product,Batch
from orders.models import Order
from usermanagement.models import User
from django.conf import settings 
# Create your models here.
class Prescription(models.Model):
    VERIFICATION_STATUS = [
        ('Uploaded', 'Uploaded'),
        ('AI_Processing', 'AI_Processing'),
        ('AI_Processed', 'AI_Processed'),
        ('Pending_Review', 'Pending_Review'),
        ('Verified', 'Verified'),
        ('Rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescription_upload')
    upload_date = models.DateTimeField(auto_now_add=True)
    image_url = models.URLField()
    image_file = models.ImageField(upload_to='prescriptions/', null=True, blank=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='Uploaded')
    rejection_reason = models.TextField(blank=True, null=True)
    pharmacist_notes = models.TextField(blank=True, null=True)
    verified_by_admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,related_name='verified_prescriptions_set')
    verification_date = models.DateTimeField(null=True, blank=True)
    ai_processed = models.BooleanField(default=False)
    ai_confidence_score = models.FloatField(null=True, blank=True)
    ai_processing_time = models.FloatField(null=True, blank=True)  # Time taken for AI processing
    doctor_name = models.CharField(max_length=255, blank=True, null=True)  # Extracted from prescription
    patient_name = models.CharField(max_length=255, blank=True, null=True)  # Extracted from prescription
    prescription_date = models.DateField(null=True, blank=True)  # Date on prescription
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class PrescriptionDetail(models.Model):
    MAPPING_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Mapped', 'Mapped'),
        ('Unmapped', 'Unmapped'),
        ('Unavailable', 'Unavailable'),
    ]

    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='details')
    line_number = models.PositiveIntegerField()
    recognized_text_raw = models.TextField()
    ai_extracted_medicine_name = models.CharField(max_length=255, blank=True, null=True)
    ai_extracted_dosage = models.CharField(max_length=100, blank=True, null=True)
    ai_extracted_quantity = models.CharField(max_length=50, blank=True, null=True)
    ai_extracted_instructions = models.TextField(blank=True, null=True)
    ai_extracted_frequency = models.CharField(max_length=100, blank=True, null=True)  # e.g., "twice daily"
    ai_extracted_duration = models.CharField(max_length=100, blank=True, null=True)  # e.g., "7 days"
    ai_confidence_score = models.FloatField(null=True, blank=True)
    verified_medicine_name = models.CharField(max_length=255, blank=True, null=True)
    verified_dosage = models.CharField(max_length=100, blank=True, null=True)
    verified_quantity = models.CharField(max_length=50, blank=True, null=True)
    verified_instructions = models.TextField(blank=True, null=True)
    mapped_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    suggested_products = models.ManyToManyField(Product, blank=True, related_name='suggested_for_prescriptions')
    mapping_status = models.CharField(max_length=50, choices=MAPPING_STATUS_CHOICES, default='Pending')
    is_valid_for_order = models.BooleanField(default=False)
    pharmacist_comment = models.TextField(blank=True, null=True)
    customer_approved = models.BooleanField(default=False)  # Customer approval for suggested medicine