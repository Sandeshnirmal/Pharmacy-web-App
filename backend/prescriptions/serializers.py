from rest_framework import serializers
from .models import Prescription, PrescriptionDetail
from product.serializers import ProductSerializer

class SuggestedProductSerializer(serializers.ModelSerializer):
    """Serializer for suggested products in prescription details"""
    class Meta:
        model = ProductSerializer.Meta.model
        fields = ['id', 'name', 'strength', 'form', 'price', 'mrp', 'manufacturer', 'is_prescription_required']

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='mapped_product.name', read_only=True)
    product_price = serializers.DecimalField(source='mapped_product.price', max_digits=10, decimal_places=2, read_only=True)
    product_strength = serializers.CharField(source='mapped_product.strength', read_only=True)
    product_form = serializers.CharField(source='mapped_product.form', read_only=True)
    suggested_products = SuggestedProductSerializer(many=True, read_only=True)
    mapping_status_display = serializers.CharField(source='get_mapping_status_display', read_only=True)

    class Meta:
        model = PrescriptionDetail
        fields = '__all__'

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
    prescription_medicines = PrescriptionDetailSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by_admin.get_full_name', read_only=True)
    total_medicines = serializers.SerializerMethodField()
    verified_medicines = serializers.SerializerMethodField()
    suggested_medicines = serializers.SerializerMethodField() # This will now return a list of products
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
