from rest_framework import serializers
from .models import Prescription, PrescriptionDetail

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='mapped_product.name', read_only=True)
    product_price = serializers.DecimalField(source='mapped_product.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PrescriptionDetail
        fields = '__all__'

class PrescriptionSerializer(serializers.ModelSerializer):
    details = PrescriptionDetailSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by_admin.get_full_name', read_only=True)
    total_medicines = serializers.SerializerMethodField()
    verified_medicines = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = '__all__'

    def get_total_medicines(self, obj):
        return obj.details.count()

    def get_verified_medicines(self, obj):
        return obj.details.filter(is_valid_for_order=True).count()
