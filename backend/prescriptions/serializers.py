from rest_framework import serializers
from datetime import date # Import date for current_selling_price calculation
from .models import Prescription, PrescriptionMedicine , Product,User
from product.serializers import ProductSerializer
from datetime import date # Import date for current_selling_price calculation

class SuggestedProductSerializer(serializers.ModelSerializer):
    """Serializer for suggested products in prescription details"""
    current_selling_price = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField() # Add total_stock

    class Meta:
        model = ProductSerializer.Meta.model
        fields = ['id', 'name', 'strength', 'form', 'current_selling_price', 'manufacturer', 'total_stock']

    def get_current_selling_price(self, obj):
        # Prioritize batches with soonest expiry date
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('expiry_date', 'selling_price')
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

    # Explicitly define ForeignKey fields to handle potential empty strings from database
    suggested_medicine = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), allow_null=True, required=False)
    verified_medicine = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), allow_null=True, required=False)
    verified_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)

    class Meta:
        model = PrescriptionMedicine
        fields = '__all__'
        read_only_fields = ['unit_price', 'total_price'] # These will be calculated

    def to_representation(self, instance):
        # Pre-process instance attributes to handle potential empty strings in ForeignKey IDs
        if instance.suggested_medicine_id == '':
            instance.suggested_medicine_id = None
        if instance.verified_medicine_id == '':
            instance.verified_medicine_id = None
        if instance.verified_by_id == '':
            instance.verified_by_id = None
        if instance.extracted_quantity == '':
            instance.extracted_quantity = None
        if instance.verified_quantity == '':
            instance.verified_quantity = None

        ret = super().to_representation(instance)
        return ret

    def _get_selling_price_from_product(self, product):
        # Prioritize batches with soonest expiry date
        active_batches = product.batches.filter(expiry_date__gt=date.today()).order_by('expiry_date', 'selling_price')
        if active_batches.exists():
            return active_batches.first().selling_price
        return None

    def _calculate_prices(self, instance):
        if instance.verified_medicine and instance.quantity_prescribed is not None:
            selling_price = self._get_selling_price_from_product(instance.verified_medicine)
            
            if selling_price is not None:
                instance.unit_price = selling_price
                instance.total_price = selling_price * instance.quantity_prescribed
            else:
                instance.unit_price = 0.00
                instance.total_price = 0.00
        else:
            instance.unit_price = 0.00
            instance.total_price = 0.00
        return instance

    def create(self, validated_data):
        instance = super().create(validated_data)
        return self._calculate_prices(instance)

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        return self._calculate_prices(instance)

    def get_product_price(self, obj):
        # This method is for read-only display of suggested medicine price, not for setting unit_price
        if obj.suggested_medicine:
            return self._get_selling_price_from_product(obj.suggested_medicine)
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
        # Use the 'status' field from the Prescription model
        if obj.status == 'ai_processing':
            return 'Processing with AI...'
        elif obj.status == 'ai_mapped':
            return f'AI Processing Complete ({obj.ai_confidence_score:.1%} confidence)'
        elif obj.status == 'pending_verification':
            return 'Ready for Verification'
        elif obj.status == 'verified':
            return 'Verified by Pharmacist'
        elif obj.status == 'rejected':
            return 'Rejected'
        elif obj.status == 'dispensed':
            return 'Dispensed'
        elif obj.status == 'completed':
            return 'Completed'
        else:
            return 'Uploaded'
