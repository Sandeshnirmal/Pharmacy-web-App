# Enhanced Prescription Views with Intelligent Workflow
# Multi-step verification process: Verified → Need Clarification → Rejected

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, F
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from datetime import timedelta
import uuid
import os

from .models import (
    Prescription, PrescriptionMedicine, PrescriptionWorkflowLog
)
from .serializers import (
    PrescriptionSerializer, PrescriptionDetailSerializer, SuggestedProductSerializer
)
from .ocr_service import OCRService
from .tasks import process_prescription_ocr_task # Import Celery task
from usermanagement.models import UserRole
from product.models import Product

User = get_user_model()

# ============================================================================
# CUSTOM PERMISSIONS FOR ROLE-BASED ACCESS
# ============================================================================

class IsPharmacistOrAdmin(permissions.BasePermission):
    """Permission for pharmacist and admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pharmacist']

class IsVerifierOrAbove(permissions.BasePermission):
    """Permission for verifier, pharmacist, and admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pharmacist', 'verifier']

# ============================================================================
# INTELLIGENT PRESCRIPTION WORKFLOW VIEWSET
# ============================================================================

class EnhancedPrescriptionViewSet(viewsets.ModelViewSet):
    """Enhanced prescription management with intelligent workflow"""
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [AllowAny] # Ensure AllowAny is explicitly set
    
    def get_queryset(self):
        """Temporarily remove filtering to debug 404 issue."""
        # For debugging, return all prescriptions without filtering
        queryset = Prescription.objects.all().order_by('-upload_date')
        print(f"EnhancedPrescriptionViewSet.get_queryset returning {queryset.count()} prescriptions.")
        return queryset
    
    def perform_create(self, serializer):
        """Create prescription and trigger asynchronous OCR processing"""
        prescription = serializer.save(status='pending_ocr', verification_status='Pending_AI_Processing')
        
        # Log workflow action
        PrescriptionWorkflowLog.objects.create(
            prescription=prescription,
            from_status='',
            to_status='uploaded',
            action_taken='Prescription uploaded',
            performed_by=self.request.user if self.request.user.is_authenticated else None,
            system_generated=False
        )
        
        # Trigger AI processing if image is provided
        if prescription.image_file:
            try:
                # Get the actual file path for OCR processing
                actual_file_path = prescription.image_file.path
                user_id = str(self.request.user.id) if self.request.user.is_authenticated else None
                process_prescription_ocr_task.delay(str(prescription.id), actual_file_path, user_id)
                
                # Log task initiation
                PrescriptionWorkflowLog.objects.create(
                    prescription=prescription,
                    from_status='uploaded',
                    to_status='pending_ocr',
                    action_taken='OCR processing task initiated',
                    performed_by=self.request.user if self.request.user.is_authenticated else None,
                    system_generated=True
                )
                print(f"OCR processing task initiated for prescription {prescription.id}")
            except Exception as e:
                print(f"Failed to initiate OCR task for prescription {prescription.id}: {e}")
                prescription.status = 'ocr_failed'
                prescription.verification_status = 'OCR_Failed'
                prescription.rejection_reason = f"Failed to initiate OCR task: {str(e)}"
                prescription.save()
                PrescriptionWorkflowLog.objects.create(
                    prescription=prescription,
                    from_status='uploaded',
                    to_status='ocr_failed',
                    action_taken='OCR task initiation failed',
                    notes=str(e),
                    performed_by=self.request.user if self.request.user.is_authenticated else None,
                    system_generated=True
                )
    
    # Removed trigger_ai_processing and simulate_ai_processing as their logic is now in the Celery task
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def verify(self, request, pk=None):
        """Verify prescription (Verified/Need Clarification/Rejected)"""
        prescription = self.get_object()
        
        # Check verification status - use verification_status field primarily
        current_status = prescription.verification_status
        print(f"Current Prescription Status: {current_status}") # Debug print
        
        if current_status not in ['pending_verification', 'Pending_Review', 'AI_Processed']:
            return Response(
                {'error': f'Prescription is not in pending verification status. Current status: {current_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_action = request.data.get('action')  # 'verified', 'need_clarification', 'rejected'
        notes = request.data.get('notes', '')
        rejection_reason = request.data.get('rejection_reason', '')
        
        if verification_action not in ['verified', 'need_clarification', 'rejected']:
            return Response(
                {'error': 'Invalid verification action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update prescription - update both status fields for compatibility
        old_status = prescription.status if hasattr(prescription, 'status') else prescription.verification_status
        if hasattr(prescription, 'status'):
            prescription.status = verification_action
        prescription.verification_status = verification_action.title().replace('_', '_') if verification_action == 'need_clarification' else verification_action.title()
        prescription.verified_by_admin = request.user if request.user.is_authenticated else None
        prescription.verification_date = timezone.now()
        
        if verification_action == 'verified':
            prescription.verification_notes = notes
        elif verification_action == 'need_clarification':
            prescription.clarification_notes = notes
        elif verification_action == 'rejected':
            if not rejection_reason:
                return Response(
                    {'error': 'Rejection reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            prescription.rejection_reason = rejection_reason
        
        prescription.save()
        
        # Log workflow action
        PrescriptionWorkflowLog.objects.create(
            prescription=prescription,
            from_status=old_status,
            to_status=verification_action,
            action_taken=f'Prescription {verification_action}',
            notes=notes or rejection_reason,
            performed_by=request.user if request.user.is_authenticated else None,
            system_generated=False
        )
        
        return Response({
            'success': True,
            'message': f'Prescription {verification_action} successfully',
            'status': verification_action,
            'prescription_id': prescription.id,
            'can_create_order': verification_action == 'verified'
        })
    
    @action(detail=True, methods=['get'])
    def workflow_history(self, request, pk=None):
        """Get prescription workflow history"""
        prescription = self.get_object()
        logs = prescription.workflow_logs.all()
        serializer = PrescriptionWorkflowLogSerializer(logs, many=True)
        return Response(serializer.data)
    

    
    @action(detail=False, methods=['get'], permission_classes=[IsVerifierOrAbove])
    def verification_queue(self, request):
        """Get prescriptions pending verification"""
        prescriptions = Prescription.objects.filter(
            status='pending_verification'
        ).order_by('-upload_date')

        queue_data = []
        for prescription in prescriptions:
            # Calculate priority score
            from datetime import datetime
            age_hours = (datetime.now(timezone.utc) - prescription.upload_date).total_seconds() / 3600
            priority_score = min(age_hours * 2, 100)  # Max 100 points for age

            if prescription.ai_confidence_score:
                priority_score += (1 - prescription.ai_confidence_score) * 50

            medicines_count = prescription.prescription_medicines.count()
            priority_score += medicines_count * 5

            queue_data.append({
                'id': prescription.id,
                'prescription_number': prescription.prescription_number,
                'patient_name': prescription.patient_name,
                'doctor_name': prescription.doctor_name,
                'status': prescription.status,
                'ai_confidence_score': prescription.ai_confidence_score,
                'upload_date': prescription.upload_date,
                'medicines_count': medicines_count,
                'priority_score': round(priority_score, 2)
            })

        # Sort by priority score (descending)
        queue_data.sort(key=lambda x: x['priority_score'], reverse=True)

        return Response(queue_data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsPharmacistOrAdmin])
    def analytics(self, request):
        """Get prescription analytics"""
        # Calculate analytics
        total_prescriptions = Prescription.objects.count()
        pending_verification = Prescription.objects.filter(status='pending_verification').count()
        
        today = timezone.now().date()
        verified_today = Prescription.objects.filter(
            verification_date__date=today,
            status='verified'
        ).count()
        
        rejected_today = Prescription.objects.filter(
            verification_date__date=today,
            status='rejected'
        ).count()
        
        need_clarification = Prescription.objects.filter(status='need_clarification').count()
        
        # Calculate average processing time
        completed_prescriptions = Prescription.objects.filter(
            verification_date__isnull=False
        )
        
        total_time = 0
        count = 0
        for prescription in completed_prescriptions:
            if prescription.upload_date and prescription.verification_date:
                delta = prescription.verification_date - prescription.upload_date
                total_time += delta.total_seconds() / 3600
                count += 1
        
        average_processing_time = round(total_time / count, 2) if count > 0 else 0
        

        
        # Get top medicines
        top_medicines = PrescriptionMedicine.objects.filter(
            verification_status='approved'
        ).values('verified_medicine__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        data = {
            'total_prescriptions': total_prescriptions,
            'pending_verification': pending_verification,
            'verified_today': verified_today,
            'rejected_today': rejected_today,
            'need_clarification': need_clarification,
            'average_processing_time': average_processing_time,
            'top_medicines': list(top_medicines)
        }

        return Response(data)

# ============================================================================
# PRESCRIPTION MEDICINE MANAGEMENT VIEWSET
# ============================================================================

class PrescriptionMedicineViewSet(viewsets.ModelViewSet):
    """ViewSet for managing prescription medicines with AI mapping"""
    queryset = PrescriptionMedicine.objects.all()
    serializer_class = PrescriptionDetailSerializer  # Use existing serializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Filter prescription medicines based on user permissions"""
        user = self.request.user
        queryset = PrescriptionMedicine.objects.all()
        print(f"PrescriptionMedicineViewSet.get_queryset called. Initial queryset count: {queryset.count()}")

        # For 'remap_medicine' action, allow access to the medicine object regardless of user role
        # as the action itself has AllowAny permission.
        if self.action == 'remap_medicine':
            pass # No additional filtering by user role for this action
        elif user.is_authenticated and hasattr(user, 'role') and user.role in ['admin', 'pharmacist', 'verifier']:
            # No additional filtering for these roles
            pass
        elif user.is_authenticated and hasattr(user, 'role') and user.role == 'customer':
            queryset = queryset.filter(prescription__user=user)
            print(f"  - After customer filter: {queryset.count()}")
        else:
            # For unauthenticated users or other roles, return an empty queryset or apply stricter filters
            queryset = queryset.none() # Or raise permission denied

        prescription_id = self.request.query_params.get('prescription')
        if prescription_id:
            queryset = queryset.filter(prescription_id=prescription_id)
            print(f"  - After prescription_id filter ({prescription_id}): {queryset.count()}")

        verification_status = self.request.query_params.get('verification_status')
        if verification_status:
            queryset = queryset.filter(verification_status=verification_status)
            print(f"  - After verification_status filter ({verification_status}): {queryset.count()}")
        
        print(f"PrescriptionMedicineViewSet.get_queryset returning {queryset.count()} medicines.")
        return queryset.order_by('prescription__upload_date', 'line_number')

    @action(detail=True, methods=['post'], permission_classes=[IsVerifierOrAbove])
    def verify_medicine(self, request, pk=None):
        """Verify individual prescription medicine"""
        medicine = self.get_object()

        verification_status = request.data.get('verification_status')
        if verification_status not in ['verified', 'need_clarification', 'rejected']:
            return Response(
                {'error': 'Invalid verification status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update medicine verification
        medicine.verification_status = verification_status
        medicine.pharmacist_comment = request.data.get('pharmacist_comment', '')
        medicine.save()

        # Log the verification action
        PrescriptionWorkflowLog.objects.create(
            prescription=medicine.prescription,
            from_status='pending',
            to_status=verification_status,
            action_taken=f'Medicine {medicine.extracted_medicine_name} {verification_status}',
            notes=request.data.get('pharmacist_comment', ''),
            performed_by=request.user if request.user.is_authenticated else None,
            system_generated=False
        )

        return Response({
            'success': True,
            'message': f'Medicine {verification_status} successfully'
        })

    @action(detail=True, methods=['post'])
    def suggest_alternatives(self, request, pk=None):
        """Get alternative medicine suggestions"""
        medicine = self.get_object()

        # Simple algorithm to find alternatives based on generic name
        from product.models import Product

        alternatives = []
        if medicine.mapped_product:
            # Find products with same generic name
            similar_products = Product.objects.filter(
                generic_name=medicine.mapped_product.generic_name,
                is_active=True
            ).exclude(id=medicine.mapped_product.id)[:5]

            alternatives = [
                {
                    'id': product.id,
                    'name': product.name,
                    'manufacturer': product.manufacturer,
                    'price': product.price
                }
                for product in similar_products
            ]

        return Response({
            'alternatives': alternatives,
            'count': len(alternatives)
        })

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def remap_medicine(self, request, pk=None):
        """Remap prescription medicine to a different product"""
        print(f"remap_medicine action called. PK: {pk}")
        try:
            medicine = self.get_object()
            print(f"Medicine object retrieved: {medicine.id} - {medicine.extracted_medicine_name}")
        except Exception as e:
            print(f"Error retrieving medicine object with PK {pk}: {e}")
            return Response({
                'error': f'Medicine not found or invalid ID: {str(e)}'
            }, status=status.HTTP_404_NOT_FOUND)

        new_product_id = request.data.get('product_id')
        print(f"New product ID from request: {new_product_id}")

        if not new_product_id:
            return Response({
                'error': 'Product ID is required for remapping'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            from product.models import Product
            new_product = Product.objects.get(id=new_product_id, is_active=True)
            print(f"New product found: {new_product.name}")

            # Update the medicine mapping
            old_product = medicine.verified_medicine
            medicine.verified_medicine = new_product
            medicine.mapped_product = new_product  # Legacy field
            medicine.verified_medicine_name = new_product.name
            medicine.verification_status = 'verified'
            medicine.pharmacist_comment = request.data.get('comment', f'Remapped from {old_product.name if old_product else "unknown"} to {new_product.name}')
            medicine.verified_by = request.user if request.user.is_authenticated else None
            medicine.save()
            print(f"Medicine {medicine.id} remapped successfully to {new_product.name}")

            # Log the remapping action
            PrescriptionWorkflowLog.objects.create(
                prescription=medicine.prescription,
                from_status='pending',
                to_status='remapped',
                action_taken=f'Medicine remapped: {medicine.extracted_medicine_name}',
                notes=f'Remapped to {new_product.name}',
                performed_by=request.user if request.user.is_authenticated else None,
                system_generated=False
            )
            print("Workflow log created.")

            return Response({
                'success': True,
                'message': f'Medicine successfully remapped to {new_product.name}',
                'medicine_id': medicine.id,
                'new_product': {
                    'id': new_product.id,
                    'name': new_product.name,
                    'manufacturer': new_product.manufacturer,
                    'price': float(new_product.price)
                }
            })
# sdfsdf
        except Product.DoesNotExist:
            print(f"Product with ID {new_product_id} not found or inactive.")
            return Response({
                'error': 'Product not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unhandled exception during remapping: {e}")
            return Response({
                'error': f'Failed to remap medicine: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def mobile_composition_prescription_upload(self, request):
        """
        MOBILE APP API: Composition-based prescription processing for mobile customers
        Triggers asynchronous OCR processing.
        """
        try:
            if 'prescription_image' not in request.FILES:
                return Response({
                    'success': False,
                    'error': 'Prescription image is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            prescription_image = request.FILES['prescription_image']

            allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf']
            file_extension = os.path.splitext(prescription_image.name)[1].lower()
            if file_extension not in allowed_extensions:
                return Response({
                    'success': False,
                    'error': 'Invalid file format. Allowed: JPG, JPEG, PNG, PDF'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save uploaded image temporarily
            file_name = f'temp_prescriptions/{uuid.uuid4()}{file_extension}' # Use UUID for unique filename
            file_path = default_storage.save(file_name, ContentFile(prescription_image.read()))
            full_path = default_storage.path(file_path)

            # Create a Prescription record with initial status
            prescription = Prescription.objects.create(
                user=request.user if request.user.is_authenticated else None,
                image_url=default_storage.url(file_path),
                status='pending_ocr',
                verification_status='Pending_AI_Processing',
                upload_date=timezone.now()
            )

            # Trigger OCR processing asynchronously
            user_id = str(request.user.id) if request.user.is_authenticated else None
            process_prescription_ocr_task.delay(str(prescription.id), full_path, user_id)

            return Response({
                'success': True,
                'message': 'Prescription uploaded successfully. Processing initiated in background.',
                'prescription_id': prescription.id,
                'status': 'pending_ocr'
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            print(f"Error in mobile_composition_prescription_upload: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': f'Prescription processing failed: {str(e)}',
                'extracted_medicines': [],
                'composition_matches': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def add_medicine_to_prescription(self, request):
        """Add a new medicine to an existing prescription"""
        prescription_id = request.data.get('prescription_id')
        product_id = request.data.get('product_id')

        if not prescription_id or not product_id:
            return Response({
                'error': 'Both prescription_id and product_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            from product.models import Product

            prescription = Prescription.objects.get(id=prescription_id)
            product = Product.objects.get(id=product_id, is_active=True)

            # Check if prescription can be modified
            if prescription.status in ['dispensed', 'completed']:
                return Response({
                    'error': 'Cannot add medicines to dispensed or completed prescriptions'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create new prescription medicine
            medicine = PrescriptionMedicine.objects.create(
                prescription=prescription,
                line_number=prescription.prescription_medicines.count() + 1,
                extracted_medicine_name=product.name,
                extracted_dosage=request.data.get('dosage', ''),
                extracted_frequency=request.data.get('frequency', ''),
                extracted_duration=request.data.get('duration', ''),
                extracted_quantity=request.data.get('quantity', '1'),
                extracted_instructions=request.data.get('instructions', ''),
                verified_medicine=product,
                mapped_product=product,  # Legacy field
                verified_medicine_name=product.name,
                verification_status='verified',
                quantity_prescribed=int(request.data.get('quantity', 1)),
                pharmacist_comment=f'Medicine added by {request.user.get_full_name() if request.user.is_authenticated else "System"}',
                verified_by=request.user if request.user.is_authenticated else None,
                ai_confidence_score=1.0,  # Manual addition has 100% confidence
                is_valid_for_order=True
            )

            # Log the addition
            PrescriptionWorkflowLog.objects.create(
                prescription=prescription,
                from_status=prescription.status,
                to_status=prescription.status,
                action_taken=f'Medicine added: {product.name}',
                notes=f'Added by pharmacist/verifier',
                performed_by=request.user if request.user.is_authenticated else None,
                system_generated=False
            )

            return Response({
                'success': True,
                'message': f'Medicine {product.name} added to prescription successfully',
                'medicine_id': medicine.id,
                'prescription_id': prescription.id,
                'medicine': {
                    'id': medicine.id,
                    'name': product.name,
                    'dosage': medicine.extracted_dosage,
                    'frequency': medicine.extracted_frequency,
                    'duration': medicine.extracted_duration,
                    'quantity': medicine.quantity_prescribed,
                    'price': float(product.price)
                }
            })

        except Prescription.DoesNotExist:
            return Response({
                'error': 'Prescription not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({
                'error': 'Product not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Failed to add medicine: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
