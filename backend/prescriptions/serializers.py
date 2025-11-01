from rest_framework import serializers
from datetime import date # Import date for current_selling_price calculation
from .models import Prescription, PrescriptionMedicine, PrescriptionWorkflowLog # Import PrescriptionWorkflowLog
from product.serializers import ProductSerializer
from datetime import date # Import date for current_selling_price calculation

class SuggestedProductSerializer(serializers.ModelSerializer):
    """Serializer for suggested products in prescription details"""
    current_selling_price = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField() # Add total_stock

    class Meta:
        model = ProductSerializer.Meta.model
        fields = ['id', 'name', 'strength', 'form', 'current_selling_price', 'manufacturer', 'is_prescription_required', 'total_stock']

    def get_current_selling_price(self, obj):
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.selling_price
        
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('selling_price')
        if active_batches.exists():
            return active_batches.first().selling_price
        return None

    def get_total_stock(self, obj):
        return obj.stock_quantity # Assuming stock_quantity is a property on Product model

class PrescriptionMedicineSerializer(serializers.ModelSerializer): # Renamed from PrescriptionDetailSerializer
    product_name = serializers.CharField(source='suggested_medicine.name', read_only=True)
    product_strength = serializers.CharField(source='suggested_medicine.strength', read_only=True)
    product_form = serializers.CharField(source='suggested_medicine.form', read_only=True)
    product_price = serializers.SerializerMethodField() # Changed to SerializerMethodField
    suggested_products = SuggestedProductSerializer(many=True, read_only=True)
    mapped_product = ProductSerializer(read_only=True) # Include full Product object for mapped_product

    class Meta:
        model = PrescriptionMedicine # Changed model to PrescriptionMedicine
        fields = '__all__'

    def get_product_price(self, obj):
        if obj.suggested_medicine:
            primary_batch = obj.suggested_medicine.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
            if primary_batch:
                return primary_batch.selling_price
            
            active_batches = obj.suggested_medicine.batches.filter(expiry_date__gt=date.today()).order_by('selling_price')
            if active_batches.exists():
                return active_batches.first().selling_price
        return None

class PrescriptionUploadSerializer(serializers.ModelSerializer):
    """Serializer for prescription upload"""
    image_file = serializers.ImageField(required=True)

    class Meta:
        model = Prescription
        fields = ['image_file', 'notes']
        extra_kwargs = {
            'notes': {'required': False}
        }

    def create(self, validated_data):
        # Set image_url from uploaded file
        if 'image_file' in validated_data:
            validated_data['image_url'] = validated_data['image_file'].url
        return super().create(validated_data)

class PrescriptionSerializer(serializers.ModelSerializer):
    prescription_medicines = PrescriptionMedicineSerializer(many=True, read_only=True) # Updated serializer name
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by_admin.get_full_name', read_only=True)
    total_medicines = serializers.SerializerMethodField()
    verified_medicines = serializers.SerializerMethodField()
    suggested_medicines = serializers.SerializerMethodField()
    processing_status = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = '__all__'

    def get_total_medicines(self, obj):
        return obj.prescription_medicines.count()

    def get_verified_medicines(self, obj):
        return obj.prescription_medicines.filter(is_valid_for_order=True).count()

    def get_suggested_medicines(self, obj):
        # Aggregate all unique suggested products from all prescription medicines
        all_suggested_products = set()
        for detail in obj.prescription_medicines.all():
            for product in detail.suggested_products.all():
                all_suggested_products.add(product)
        return SuggestedProductSerializer(list(all_suggested_products), many=True).data

    def get_processing_status(self, obj):
        if obj.verification_status == 'AI_Processing':
            return 'Processing with AI...'
        elif obj.verification_status == 'AI_Processed':
            return f'AI Processing Complete ({obj.ai_confidence_score:.1%} confidence)'
        elif obj.verification_status == 'Pending_Review':
            return 'Ready for Review'
        elif obj.verification_status == 'Verified':
            return 'Verified by Pharmacist'
        elif obj.verification_status == 'Rejected':
            return 'Rejected'
        else:
            return 'Uploaded'

class PrescriptionWorkflowLogSerializer(serializers.ModelSerializer):
    """Serializer for PrescriptionWorkflowLog model"""
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    
    class Meta:
        model = PrescriptionWorkflowLog
        fields = '__all__'
