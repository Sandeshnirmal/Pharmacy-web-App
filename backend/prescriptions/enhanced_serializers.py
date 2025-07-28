# Enhanced Prescription Serializers
# Intelligent prescription workflow with AI integration and verification

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Prescription, PrescriptionMedicine, PrescriptionWorkflowLog,
    AIProcessingLog, PrescriptionDetail  # Legacy alias
)
from product.models import Product
from orders.models import Order

User = get_user_model()

# ============================================================================
# INTELLIGENT PRESCRIPTION WORKFLOW SERIALIZERS
# ============================================================================

class PrescriptionSerializer(serializers.ModelSerializer):
    """Enhanced prescription serializer with intelligent workflow"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by_admin.get_full_name', read_only=True)
    order_number = serializers.CharField(source='order.id', read_only=True)
    
    # Status information
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    
    # Workflow metrics
    processing_time = serializers.SerializerMethodField()
    medicines_count = serializers.SerializerMethodField()
    verified_medicines_count = serializers.SerializerMethodField()
    
    # AI processing info
    ai_processing_status = serializers.SerializerMethodField()
    latest_ai_log = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'prescription_number', 'patient_name', 'patient_age', 'patient_gender',
            'doctor_name', 'doctor_license', 'hospital_clinic', 'prescription_date',
            'status', 'status_display', 'verification_status', 'verification_status_display',
            'image_url', 'image_file', 'ocr_text', 'ai_confidence_score',
            'ai_processing_time', 'ai_processed', 'ai_processing_status', 'latest_ai_log',
            'rejection_reason', 'clarification_notes', 'pharmacist_notes', 'verification_notes',
            'user', 'user_name', 'order', 'order_number',
            'verified_by_admin', 'verified_by_name',
            'upload_date', 'verification_date', 'created_at', 'updated_at',
            'processing_time', 'medicines_count', 'verified_medicines_count'
        ]
        read_only_fields = [
            'id', 'prescription_number', 'upload_date', 'created_at', 'updated_at',
            'ai_processed', 'ai_processing_time', 'ocr_text'
        ]
    
    def get_processing_time(self, obj):
        """Calculate processing time in hours"""
        if obj.verification_date and obj.upload_date:
            delta = obj.verification_date - obj.upload_date
            return round(delta.total_seconds() / 3600, 2)
        return None
    
    def get_medicines_count(self, obj):
        """Get total medicines in prescription"""
        return obj.prescription_medicines.count()
    
    def get_verified_medicines_count(self, obj):
        """Get count of verified medicines"""
        return obj.prescription_medicines.filter(verification_status='approved').count()
    
    def get_ai_processing_status(self, obj):
        """Get AI processing status"""
        latest_log = obj.ai_processing_logs.first()
        if latest_log:
            return {
                'success': latest_log.success,
                'confidence': latest_log.confidence_score,
                'medicines_detected': latest_log.medicines_detected,
                'processing_duration': latest_log.processing_duration
            }
        return None
    
    def get_latest_ai_log(self, obj):
        """Get latest AI processing log"""
        latest_log = obj.ai_processing_logs.first()
        if latest_log:
            return AIProcessingLogSerializer(latest_log).data
        return None

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating prescriptions"""
    
    class Meta:
        model = Prescription
        fields = [
            'patient_name', 'patient_age', 'patient_gender',
            'doctor_name', 'doctor_license', 'hospital_clinic', 'prescription_date',
            'image_file', 'order'
        ]
    
    def create(self, validated_data):
        """Create prescription with auto-generated number"""
        import uuid
        validated_data['prescription_number'] = f"RX-{uuid.uuid4().hex[:8].upper()}"
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class PrescriptionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating prescription status"""
    
    class Meta:
        model = Prescription
        fields = [
            'status', 'verification_status', 'rejection_reason',
            'clarification_notes', 'pharmacist_notes', 'verification_notes'
        ]
    
    def validate_status_change(self, attrs):
        """Validate status transitions"""
        current_status = self.instance.status
        new_status = attrs.get('status', current_status)
        
        # Define valid status transitions
        valid_transitions = {
            'uploaded': ['ai_processing', 'rejected'],
            'ai_processing': ['ai_mapped', 'rejected'],
            'ai_mapped': ['pending_verification', 'rejected'],
            'pending_verification': ['verified', 'need_clarification', 'rejected'],
            'need_clarification': ['pending_verification', 'rejected'],
            'verified': ['dispensed'],
            'dispensed': ['completed'],
            'rejected': [],  # Terminal state
            'completed': []  # Terminal state
        }
        
        if new_status != current_status:
            if new_status not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Invalid status transition from {current_status} to {new_status}"
                )
        
        return attrs
    
    def validate(self, attrs):
        """Custom validation"""
        attrs = self.validate_status_change(attrs)
        
        # Require rejection reason for rejected status
        if attrs.get('status') == 'rejected' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError("Rejection reason is required when rejecting prescription")
        
        # Require clarification notes for need_clarification status
        if attrs.get('status') == 'need_clarification' and not attrs.get('clarification_notes'):
            raise serializers.ValidationError("Clarification notes are required")
        
        return attrs

# ============================================================================
# PRESCRIPTION MEDICINE SERIALIZERS
# ============================================================================

class PrescriptionMedicineSerializer(serializers.ModelSerializer):
    """Enhanced prescription medicine serializer with AI mapping"""
    prescription_number = serializers.CharField(source='prescription.prescription_number', read_only=True)
    suggested_medicine_details = serializers.SerializerMethodField()
    verified_medicine_details = serializers.SerializerMethodField()
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    # Alternative suggestions
    alternative_medicines = serializers.SerializerMethodField()
    
    class Meta:
        model = PrescriptionMedicine
        fields = [
            'id', 'prescription', 'prescription_number', 'line_number',
            'recognized_text_raw', 'extracted_medicine_name', 'extracted_dosage',
            'extracted_frequency', 'extracted_duration', 'extracted_quantity', 'extracted_instructions',
            'suggested_medicine', 'suggested_medicine_details', 'ai_confidence_score',
            'verification_status', 'verification_status_display', 'mapping_status',
            'verified_medicine', 'verified_medicine_details', 'verified_medicine_name',
            'verified_dosage', 'verified_frequency', 'verified_duration',
            'verified_quantity', 'verified_instructions',
            'quantity_prescribed', 'quantity_dispensed', 'unit_price', 'total_price',
            'is_valid_for_order', 'customer_approved',
            'pharmacist_comment', 'clarification_notes',
            'alternative_medicines', 'verified_by', 'verified_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_suggested_medicine_details(self, obj):
        """Get suggested medicine details"""
        if obj.suggested_medicine:
            from product.enhanced_serializers import ProductSearchSerializer
            return ProductSearchSerializer(obj.suggested_medicine).data
        return None
    
    def get_verified_medicine_details(self, obj):
        """Get verified medicine details"""
        if obj.verified_medicine:
            from product.enhanced_serializers import ProductSearchSerializer
            return ProductSearchSerializer(obj.verified_medicine).data
        return None
    
    def get_alternative_medicines(self, obj):
        """Get alternative medicine suggestions"""
        alternatives = obj.suggested_products.all()[:5]
        if alternatives:
            from product.enhanced_serializers import ProductSearchSerializer
            return ProductSearchSerializer(alternatives, many=True).data
        return []

class PrescriptionMedicineVerificationSerializer(serializers.ModelSerializer):
    """Serializer for verifying prescription medicines"""
    
    class Meta:
        model = PrescriptionMedicine
        fields = [
            'verification_status', 'verified_medicine', 'verified_medicine_name',
            'verified_dosage', 'verified_frequency', 'verified_duration',
            'verified_quantity', 'verified_instructions', 'quantity_prescribed',
            'unit_price', 'total_price', 'is_valid_for_order',
            'pharmacist_comment', 'clarification_notes'
        ]
    
    def validate_verification(self, attrs):
        """Validate verification data"""
        verification_status = attrs.get('verification_status')
        
        if verification_status == 'approved':
            required_fields = ['verified_medicine', 'quantity_prescribed', 'unit_price']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError(f"{field} is required for approved medicines")
        
        elif verification_status == 'rejected':
            if not attrs.get('pharmacist_comment'):
                raise serializers.ValidationError("Pharmacist comment is required for rejected medicines")
        
        elif verification_status == 'need_clarification':
            if not attrs.get('clarification_notes'):
                raise serializers.ValidationError("Clarification notes are required")
        
        return attrs
    
    def validate(self, attrs):
        """Custom validation"""
        return self.validate_verification(attrs)
    
    def update(self, instance, validated_data):
        """Update with verification user"""
        validated_data['verified_by'] = self.context['request'].user
        return super().update(instance, validated_data)

# ============================================================================
# WORKFLOW AND AUDIT SERIALIZERS
# ============================================================================

class PrescriptionWorkflowLogSerializer(serializers.ModelSerializer):
    """Serializer for prescription workflow logs"""
    prescription_number = serializers.CharField(source='prescription.prescription_number', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = PrescriptionWorkflowLog
        fields = [
            'id', 'prescription', 'prescription_number',
            'from_status', 'to_status', 'action_taken', 'notes',
            'system_generated', 'performed_by', 'performed_by_name', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

class AIProcessingLogSerializer(serializers.ModelSerializer):
    """Serializer for AI processing logs"""
    prescription_number = serializers.CharField(source='prescription.prescription_number', read_only=True)
    
    class Meta:
        model = AIProcessingLog
        fields = [
            'id', 'prescription', 'prescription_number',
            'processing_started_at', 'processing_completed_at', 'processing_duration',
            'ai_service_used', 'api_version', 'success', 'confidence_score',
            'extracted_text', 'medicines_detected', 'error_message', 'retry_count'
        ]
        read_only_fields = ['id']

# ============================================================================
# DASHBOARD AND ANALYTICS SERIALIZERS
# ============================================================================

class PrescriptionAnalyticsSerializer(serializers.Serializer):
    """Serializer for prescription analytics"""
    total_prescriptions = serializers.IntegerField()
    pending_verification = serializers.IntegerField()
    verified_today = serializers.IntegerField()
    rejected_today = serializers.IntegerField()
    need_clarification = serializers.IntegerField()
    average_processing_time = serializers.FloatField()
    ai_accuracy_rate = serializers.FloatField()
    top_medicines = serializers.ListField()

class VerificationQueueSerializer(serializers.ModelSerializer):
    """Serializer for verification queue"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    medicines_count = serializers.SerializerMethodField()
    priority_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'prescription_number', 'patient_name', 'doctor_name',
            'status', 'upload_date', 'ai_confidence_score',
            'user', 'user_name', 'medicines_count', 'priority_score'
        ]
    
    def get_medicines_count(self, obj):
        return obj.prescription_medicines.count()
    
    def get_priority_score(self, obj):
        """Calculate priority score based on various factors"""
        from datetime import datetime, timezone
        
        # Base score
        score = 0
        
        # Age factor (older prescriptions get higher priority)
        age_hours = (datetime.now(timezone.utc) - obj.upload_date).total_seconds() / 3600
        score += min(age_hours * 2, 100)  # Max 100 points for age
        
        # AI confidence factor (lower confidence gets higher priority)
        if obj.ai_confidence_score:
            score += (1 - obj.ai_confidence_score) * 50
        
        # Medicine count factor
        medicines_count = obj.prescription_medicines.count()
        score += medicines_count * 5
        
        return round(score, 2)

# ============================================================================
# LEGACY COMPATIBILITY
# ============================================================================

# Legacy alias for backward compatibility
PrescriptionDetailSerializer = PrescriptionMedicineSerializer
