from rest_framework import serializers
from .models import CourierPartner, CourierShipment, CourierServiceArea, CourierRateCard

class CourierPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierPartner
        fields = ['id', 'name', 'courier_type', 'is_active', 'service_areas']

class CourierShipmentSerializer(serializers.ModelSerializer):
    courier_partner_name = serializers.CharField(source='courier_partner.name', read_only=True)
    order_number = serializers.CharField(source='order.id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CourierShipment
        fields = [
            'id', 'order_number', 'courier_partner_name', 'tracking_number',
            'status', 'status_display', 'current_location', 'estimated_delivery',
            'actual_delivery', 'pickup_scheduled', 'pickup_completed',
            'delivery_address', 'delivery_contact', 'weight', 'dimensions',
            'shipping_charges', 'cod_charges', 'total_charges',
            'tracking_history', 'created_at', 'updated_at'
        ]

class CourierTrackingSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=100)
    status = serializers.CharField()
    status_display = serializers.CharField()
    current_location = serializers.CharField()
    estimated_delivery = serializers.DateTimeField()
    tracking_history = serializers.ListField()
    
class CourierServiceAreaSerializer(serializers.ModelSerializer):
    courier_partner_name = serializers.CharField(source='courier_partner.name', read_only=True)
    
    class Meta:
        model = CourierServiceArea
        fields = [
            'id', 'courier_partner_name', 'pincode', 'city', 'state',
            'is_cod_available', 'is_express_available',
            'standard_delivery_days', 'express_delivery_days'
        ]

class CourierRateCardSerializer(serializers.ModelSerializer):
    courier_partner_name = serializers.CharField(source='courier_partner.name', read_only=True)
    
    class Meta:
        model = CourierRateCard
        fields = [
            'id', 'courier_partner_name', 'zone', 'weight_slab_start',
            'weight_slab_end', 'rate_per_kg', 'minimum_charge',
            'cod_percentage', 'fuel_surcharge_percentage'
        ]

class PickupScheduleSerializer(serializers.Serializer):
    shipment_id = serializers.UUIDField()
    pickup_date = serializers.DateTimeField()
    pickup_address = serializers.JSONField()
    special_instructions = serializers.CharField(max_length=500, required=False)

class ShipmentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    courier_type = serializers.CharField(max_length=20, default='professional')
    pickup_address = serializers.JSONField()
    delivery_address = serializers.JSONField()
    delivery_contact = serializers.CharField(max_length=15)
    special_instructions = serializers.CharField(max_length=500, required=False)
    weight = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    dimensions = serializers.JSONField(required=False)
