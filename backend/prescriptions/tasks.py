from celery import shared_task
from .ocr_service import OCRService
from .models import Prescription, PrescriptionMedicine, PrescriptionWorkflowLog
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_prescription_ocr_task(self, prescription_id, image_path, user_id=None):
    """
    Celery task to asynchronously process a prescription image using OCR.
    """
    try:
        prescription = Prescription.objects.get(id=prescription_id)
        user = User.objects.get(id=user_id) if user_id else None
        
        logger.info(f"Starting OCR processing for prescription {prescription_id} from image: {image_path}")
        
        ocr_service = OCRService()
        ocr_results = ocr_service.process_prescription_image(image_path)
        
        extracted_medicines = ocr_results.get('extracted_medicines', [])
        confidence_score = ocr_results.get('confidence_score', 0.0)
        
        prescription.ocr_processed = True
        prescription.ocr_confidence_score = confidence_score
        prescription.status = 'pending_verification' # Move to next stage
        prescription.save()

        # Create PrescriptionMedicine entries
        for medicine_data in extracted_medicines:
            PrescriptionMedicine.objects.create(
                prescription=prescription,
                medicine_name=medicine_data.get('name'),
                dosage=medicine_data.get('dosage'),
                quantity=medicine_data.get('quantity'),
                is_verified=False,
                suggested_product_id=medicine_data.get('suggested_product_id') # Store suggested product
            )
        
        # Log workflow action
        # Determine from_status based on the prescription's status before this update
        from_status = prescription.status # This will be the status before it's set to 'pending_verification'
        
        PrescriptionWorkflowLog.objects.create(
            prescription=prescription,
            from_status=from_status,
            to_status='pending_verification', # The status it's being changed to
            action='OCR_PROCESSED',
            notes=f'OCR processing completed with confidence: {confidence_score:.2f}',
            actor=user,
            system_generated=True # Mark as system-generated action
        )
        
        logger.info(f"OCR processing completed for prescription {prescription_id}. Extracted {len(extracted_medicines)} medicines.")
        return {'status': 'success', 'prescription_id': str(prescription_id), 'medicines_count': len(extracted_medicines)}

    except Prescription.DoesNotExist:
        logger.error(f"Prescription with ID {prescription_id} not found.")
        raise
    except Exception as e:
        logger.error(f"OCR processing failed for prescription {prescription_id}: {e}", exc_info=True)
        self.retry(exc=e) # Retry the task on failure
