# Enhanced Prescription Workflow Service
# Intelligent prescription processing with AI integration and multi-step verification

import uuid
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import (
    Prescription, PrescriptionMedicine, PrescriptionWorkflowLog,
    AIProcessingLog
)
from .ocr_service import OCRService
from product.models import Product, Composition

User = get_user_model()

class PrescriptionWorkflowService:
    """
    Comprehensive prescription workflow management service
    Handles the complete flow from upload to dispensing
    """
    
    def __init__(self):
        self.ocr_service = OCRService()
    
    def process_uploaded_prescription(self, prescription: Prescription, user: User) -> Dict[str, Any]:
        """
        Process newly uploaded prescription through AI workflow
        """
        try:
            with transaction.atomic():
                # Step 1: Update prescription status
                prescription.status = 'ai_processing'
                prescription.save()
                
                # Step 2: Log workflow action
                self._log_workflow_action(
                    prescription=prescription,
                    from_status='uploaded',
                    to_status='ai_processing',
                    action='AI processing started',
                    user=user,
                    system_generated=True
                )
                
                # Step 3: Create AI processing log
                ai_log = AIProcessingLog.objects.create(
                    prescription=prescription,
                    ai_service_used='Google Gemini Vision API',
                    processing_started_at=timezone.now()
                )
                
                # Step 4: Process with OCR service
                if prescription.image_file:
                    ocr_result = self.ocr_service.analyze_prescription_medicines_by_composition(
                        prescription.image_file.path
                    )
                    
                    # Step 5: Update AI processing log
                    ai_log.processing_completed_at = timezone.now()
                    ai_log.processing_duration = (
                        ai_log.processing_completed_at - ai_log.processing_started_at
                    ).total_seconds()
                    ai_log.success = ocr_result.get('success', False)
                    ai_log.confidence_score = ocr_result.get('ocr_confidence', 0.0)
                    ai_log.extracted_text = ocr_result.get('raw_ocr_text', '')
                    ai_log.medicines_detected = ocr_result.get('total_medicines_analyzed', 0)
                    ai_log.save()
                    
                    # Step 6: Create prescription medicines from OCR results
                    if ocr_result.get('success'):
                        self._create_prescription_medicines(prescription, ocr_result.get('medicines', []))
                        
                        # Step 7: Update prescription with AI results
                        prescription.status = 'ai_mapped'
                        prescription.ai_processed = True
                        prescription.ai_confidence_score = ocr_result.get('ocr_confidence', 0.0)
                        prescription.ai_processing_time = ai_log.processing_duration
                        prescription.ocr_text = ai_log.extracted_text
                        prescription.save()
                        
                        # Step 8: Move to verification queue
                        self._move_to_verification_queue(prescription, user)
                        
                        return {
                            'success': True,
                            'message': 'Prescription processed successfully',
                            'prescription_id': prescription.id,
                            'medicines_detected': ai_log.medicines_detected,
                            'confidence_score': ai_log.confidence_score
                        }
                    else:
                        # AI processing failed
                        ai_log.error_message = ocr_result.get('error', 'Unknown error')
                        ai_log.save()
                        
                        prescription.status = 'rejected'
                        prescription.rejection_reason = 'AI processing failed: ' + ocr_result.get('error', 'Unknown error')
                        prescription.save()
                        
                        self._log_workflow_action(
                            prescription=prescription,
                            from_status='ai_processing',
                            to_status='rejected',
                            action='AI processing failed',
                            user=user,
                            system_generated=True,
                            notes=prescription.rejection_reason
                        )
                        
                        return {
                            'success': False,
                            'message': 'AI processing failed',
                            'error': ocr_result.get('error', 'Unknown error')
                        }
                else:
                    return {
                        'success': False,
                        'message': 'No image file found for processing'
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'message': f'Prescription processing failed: {str(e)}'
            }
    
    def _create_prescription_medicines(self, prescription: Prescription, medicines: List[Dict]) -> None:
        """
        Create PrescriptionMedicine objects from OCR results
        """
        for idx, medicine_data in enumerate(medicines, 1):
            # Find suggested product if available
            suggested_product = None
            if medicine_data.get('local_equivalent'):
                try:
                    suggested_product = Product.objects.get(
                        name=medicine_data['local_equivalent']['product_name']
                    )
                except Product.DoesNotExist:
                    pass
            
            # Create prescription medicine
            prescription_medicine = PrescriptionMedicine.objects.create(
                prescription=prescription,
                line_number=idx,
                extracted_medicine_name=medicine_data.get('input_brand', ''),
                extracted_dosage=self._extract_dosage_info(medicine_data),
                extracted_frequency=medicine_data.get('frequency', ''),
                extracted_duration=medicine_data.get('duration', ''),
                extracted_instructions=medicine_data.get('instructions', ''),
                suggested_medicine=suggested_product,
                ai_confidence_score=medicine_data.get('match_confidence', 0.0),
                verification_status='pending'
            )
            
            # Add alternative suggestions if available
            if suggested_product:
                # Find similar products based on composition
                similar_products = self._find_similar_products(suggested_product)
                prescription_medicine.suggested_products.set(similar_products[:5])
    
    def _extract_dosage_info(self, medicine_data: Dict) -> str:
        """
        Extract dosage information from medicine data
        """
        if medicine_data.get('local_equivalent'):
            composition = medicine_data['local_equivalent'].get('composition', '')
            if composition:
                return composition
        
        return medicine_data.get('composition', '')
    
    def _find_similar_products(self, product: Product) -> List[Product]:
        """
        Find similar products based on composition
        """
        similar_products = Product.objects.filter(
            generic_name=product.generic_name,
            is_active=True,
            stock_quantity__gt=0
        ).exclude(id=product.id)[:5]
        
        return list(similar_products)
    
    def _move_to_verification_queue(self, prescription: Prescription, user: User) -> None:
        """
        Move prescription to verification queue
        """
        prescription.status = 'pending_verification'
        prescription.save()
        
        self._log_workflow_action(
            prescription=prescription,
            from_status='ai_mapped',
            to_status='pending_verification',
            action='Moved to verification queue',
            user=user,
            system_generated=True
        )
    
    def verify_prescription(self, prescription: Prescription, verification_data: Dict, verifier: User) -> Dict[str, Any]:
        """
        Verify prescription with multi-step verification process
        """
        try:
            with transaction.atomic():
                action = verification_data.get('action')  # 'verified', 'need_clarification', 'rejected'
                
                if action not in ['verified', 'need_clarification', 'rejected']:
                    return {
                        'success': False,
                        'message': 'Invalid verification action'
                    }
                
                # Validate required fields
                if action == 'rejected' and not verification_data.get('rejection_reason'):
                    return {
                        'success': False,
                        'message': 'Rejection reason is required'
                    }
                
                if action == 'need_clarification' and not verification_data.get('clarification_notes'):
                    return {
                        'success': False,
                        'message': 'Clarification notes are required'
                    }
                
                # Update prescription
                old_status = prescription.status
                prescription.status = action
                prescription.verified_by_admin = verifier
                prescription.verification_date = timezone.now()
                
                if action == 'verified':
                    prescription.verification_notes = verification_data.get('notes', '')
                elif action == 'need_clarification':
                    prescription.clarification_notes = verification_data.get('clarification_notes', '')
                elif action == 'rejected':
                    prescription.rejection_reason = verification_data.get('rejection_reason', '')
                
                prescription.save()
                
                # Log workflow action
                self._log_workflow_action(
                    prescription=prescription,
                    from_status=old_status,
                    to_status=action,
                    action=f'Prescription {action}',
                    user=verifier,
                    system_generated=False,
                    notes=verification_data.get('notes', '') or verification_data.get('clarification_notes', '') or verification_data.get('rejection_reason', '')
                )
                
                return {
                    'success': True,
                    'message': f'Prescription {action} successfully',
                    'status': action
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Verification failed: {str(e)}'
            }
    
    def verify_prescription_medicine(self, medicine: PrescriptionMedicine, verification_data: Dict, verifier: User) -> Dict[str, Any]:
        """
        Verify individual prescription medicine
        """
        try:
            with transaction.atomic():
                verification_status = verification_data.get('verification_status')
                
                if verification_status not in ['approved', 'modified', 'rejected', 'need_clarification']:
                    return {
                        'success': False,
                        'message': 'Invalid verification status'
                    }
                
                # Update medicine verification
                medicine.verification_status = verification_status
                medicine.verified_by = verifier
                
                if verification_status == 'approved':
                    medicine.verified_medicine_id = verification_data.get('verified_medicine_id')
                    medicine.verified_medicine_name = verification_data.get('verified_medicine_name', '')
                    medicine.verified_dosage = verification_data.get('verified_dosage', '')
                    medicine.verified_frequency = verification_data.get('verified_frequency', '')
                    medicine.verified_duration = verification_data.get('verified_duration', '')
                    medicine.verified_instructions = verification_data.get('verified_instructions', '')
                    medicine.quantity_prescribed = verification_data.get('quantity_prescribed', 1)
                    medicine.unit_price = verification_data.get('unit_price', 0.0)
                    medicine.total_price = medicine.quantity_prescribed * medicine.unit_price
                    medicine.is_valid_for_order = True
                
                elif verification_status in ['rejected', 'need_clarification']:
                    medicine.pharmacist_comment = verification_data.get('pharmacist_comment', '')
                    medicine.clarification_notes = verification_data.get('clarification_notes', '')
                    medicine.is_valid_for_order = False
                
                medicine.save()
                
                # Log workflow action
                self._log_workflow_action(
                    prescription=medicine.prescription,
                    from_status='pending',
                    to_status=verification_status,
                    action=f'Medicine {medicine.extracted_medicine_name} {verification_status}',
                    user=verifier,
                    system_generated=False,
                    notes=verification_data.get('pharmacist_comment', '')
                )
                
                return {
                    'success': True,
                    'message': f'Medicine {verification_status} successfully'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Medicine verification failed: {str(e)}'
            }
    
    def _log_workflow_action(self, prescription: Prescription, from_status: str, to_status: str, 
                           action: str, user: User, system_generated: bool = False, notes: str = '') -> None:
        """
        Log workflow action for audit trail
        """
        PrescriptionWorkflowLog.objects.create(
            prescription=prescription,
            from_status=from_status,
            to_status=to_status,
            action_taken=action,
            notes=notes,
            performed_by=user,
            system_generated=system_generated
        )
    
    def get_prescription_analytics(self) -> Dict[str, Any]:
        """
        Get comprehensive prescription analytics
        """
        from django.db.models import Count, Avg, Q
        from datetime import date, timedelta
        
        today = date.today()
        week_ago = today - timedelta(days=7)
        
        # Basic counts
        total_prescriptions = Prescription.objects.count()
        pending_verification = Prescription.objects.filter(status='pending_verification').count()
        verified_today = Prescription.objects.filter(
            verification_date__date=today,
            status='verified'
        ).count()
        rejected_today = Prescription.objects.filter(
            verification_date__date=today,
            status='rejected'
        ).count()
        need_clarification = Prescription.objects.filter(status='need_clarification').count()
        
        # Processing time analytics
        completed_prescriptions = Prescription.objects.filter(
            verification_date__isnull=False
        )
        
        avg_processing_time = 0
        if completed_prescriptions.exists():
            total_time = 0
            count = 0
            for prescription in completed_prescriptions:
                if prescription.upload_date and prescription.verification_date:
                    delta = prescription.verification_date - prescription.upload_date
                    total_time += delta.total_seconds() / 3600  # Convert to hours
                    count += 1
            
            avg_processing_time = round(total_time / count, 2) if count > 0 else 0
        

        
        # Top medicines
        top_medicines = PrescriptionMedicine.objects.filter(
            verification_status='approved'
        ).values('verified_medicine__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return {
            'total_prescriptions': total_prescriptions,
            'pending_verification': pending_verification,
            'verified_today': verified_today,
            'rejected_today': rejected_today,
            'need_clarification': need_clarification,
            'average_processing_time': avg_processing_time,
            'ai_accuracy_rate': ai_accuracy_rate,
            'top_medicines': list(top_medicines),
            'weekly_trend': self._get_weekly_trend(week_ago, today)
        }
    
    def _get_weekly_trend(self, start_date: date, end_date: date) -> List[Dict]:
        """
        Get weekly prescription trend data
        """
        from django.db.models import Count
        from datetime import timedelta
        
        trend_data = []
        current_date = start_date
        
        while current_date <= end_date:
            daily_count = Prescription.objects.filter(
                upload_date__date=current_date
            ).count()
            
            trend_data.append({
                'date': current_date.isoformat(),
                'count': daily_count
            })
            
            current_date += timedelta(days=1)
        
        return trend_data
