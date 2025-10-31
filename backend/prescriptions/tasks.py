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
        
        # Correctly retrieve the list of processed medicines from OCRService result
        extracted_medicines = ocr_results.get('medicines', []) 
        confidence_score = ocr_results.get('ocr_confidence', 0.0) # Use 'ocr_confidence' from OCRService result
        
        prescription.ai_processed = True
        prescription.ai_confidence_score = confidence_score
        prescription.status = 'pending_verification' # Keep this for internal status
        prescription.verification_status = 'Pending_Review' # Set this for frontend display and approval logic
        logger.debug(f"Before save: Prescription {prescription_id} status='{prescription.status}', verification_status='{prescription.verification_status}'")
        prescription.save()
        prescription.refresh_from_db() # Ensure we read the latest from DB
        logger.debug(f"After save: Prescription {prescription_id} status='{prescription.status}', verification_status='{prescription.verification_status}'")

        # Create PrescriptionMedicine entries
        for medicine_data in extracted_medicines:
            # The OCRService returns 'medicines' which are already analyzed and potentially matched.
            # Each item in 'extracted_medicines' (which is 'analyzed_medicines' from OCRService)
            # has keys like 'input_medicine_name', 'generic_name', 'composition', 'form',
            # 'local_equivalent', 'match_confidence'.

            # Extract relevant data from the analyzed medicine_data
            input_medicine_name = medicine_data.get('input_medicine_name', '')
            extracted_dosage = medicine_data.get('strength', '') # 'strength' from OCRService output maps to 'extracted_dosage'
            extracted_form = medicine_data.get('form', '').lower() # 'form' from OCRService output maps to 'extracted_form'
            extracted_frequency = medicine_data.get('frequency', '') # 'frequency' from OCRService output maps to 'extracted_frequency'
            extracted_quantity_duration = medicine_data.get('quantity_duration', '') # New field from prompt

            # Map quantity_duration to extracted_quantity for now, or parse if needed
            extracted_quantity = extracted_quantity_duration # Simple mapping for now

            # Get the suggested Product object if a local equivalent was found
            suggested_product_obj = None
            if medicine_data.get('local_equivalent'):
                product_name_from_ocr = medicine_data['local_equivalent'].get('product_name')
                if product_name_from_ocr:
                    try:
                        # Retrieve the Product object using its name
                        suggested_product_obj = Product.objects.get(name=product_name_from_ocr, is_active=True)
                    except Product.DoesNotExist:
                        logger.warning(f"Suggested product '{product_name_from_ocr}' not found in database for prescription medicine.")

            prescription_medicine_instance = PrescriptionMedicine.objects.create(
                prescription=prescription,
                extracted_medicine_name=input_medicine_name,
                extracted_dosage=extracted_dosage,
                extracted_form=extracted_form,
                extracted_frequency=extracted_frequency,
                extracted_quantity=extracted_quantity,
                verification_status='pending', # Default status
                suggested_medicine=suggested_product_obj, # Link to Product object
                ai_confidence_score=medicine_data.get('match_confidence', 0.0),
                # Other fields can be set as needed or left to their defaults
            )
            # Add the suggested product to the ManyToMany field if it exists
            if suggested_product_obj:
                prescription_medicine_instance.suggested_products.add(suggested_product_obj)
        
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
