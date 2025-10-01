from rest_framework import serializers
from .models import CourierShipment, TPCRecipient

class CourierShipmentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CourierShipment
        fields = [
            'id', 'order_number', 'tracking_number', 'tpc_order_id',
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

class PickupScheduleSerializer(serializers.Serializer):
    shipment_id = serializers.UUIDField()
    pickup_date = serializers.DateTimeField()
    pickup_address = serializers.JSONField()
    special_instructions = serializers.CharField(max_length=500, required=False)

class ShipmentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    # courier_type is implicitly TPC
    pickup_address = serializers.JSONField()
    delivery_address = serializers.JSONField()
    delivery_contact = serializers.CharField(max_length=15)
    special_instructions = serializers.CharField(max_length=500, required=False)
    weight = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    dimensions = serializers.JSONField(required=False)

class TPCPickupRequestSerializer(serializers.Serializer):
    REF_NO = serializers.CharField(max_length=50)
    BDATE = serializers.DateField(format="%Y-%m-%d")
    SENDER = serializers.CharField(max_length=100)
    SENDER_CODE = serializers.CharField(max_length=50, required=False, allow_blank=True)
    SENDER_ADDRESS = serializers.CharField(max_length=255)
    SENDER_CITY = serializers.CharField(max_length=100)
    SENDER_PINCODE = serializers.CharField(max_length=10)
    SENDER_MOB = serializers.CharField(max_length=15)
    SENDER_EMAIL = serializers.EmailField(required=False, allow_blank=True)
    GSTIN = serializers.CharField(max_length=15, required=False, allow_blank=True)
    RECIPIENT = serializers.CharField(max_length=100)
    RECIPIENT_COMPANY = serializers.CharField(max_length=100, required=False, allow_blank=True)
    RECIPIENT_ADDRESS = serializers.CharField(max_length=255)
    RECIPIENT_CITY = serializers.CharField(max_length=100)
    RECIPIENT_PINCODE = serializers.CharField(max_length=10)
    RECIPIENT_MOB = serializers.CharField(max_length=15)
    RECIPIENT_EMAIL = serializers.EmailField(required=False, allow_blank=True)
    WEIGHT = serializers.DecimalField(max_digits=8, decimal_places=2)
    PIECES = serializers.IntegerField()
    RECIPIENT_GSTIN = serializers.CharField(max_length=15, required=False, allow_blank=True)
    FLYER_NO = serializers.CharField(max_length=50, required=False, allow_blank=True)
    CUST_INVOICE = serializers.CharField(max_length=50, required=False, allow_blank=True)
    CUST_INVOICEAMT = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    VOL_LENGTH = serializers.IntegerField(required=False)
    VOL_WIDTH = serializers.IntegerField(required=False)
    VOL_HEIGHT = serializers.IntegerField(required=False)
    DESCRIPTION = serializers.CharField(max_length=255, required=False, allow_blank=True)
    REMARKS = serializers.CharField(max_length=255, required=False, allow_blank=True)
    COD_AMOUNT = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    PAYMENT_MODE = serializers.CharField(max_length=20) # CASH/CREDIT
    TYPE = serializers.CharField(max_length=20) # PICKUP
    ORDER_STATUS = serializers.CharField(max_length=20) # HOLD
    MODE = serializers.CharField(max_length=2) # AT/ST
    SERVICE = serializers.CharField(max_length=20, required=False, allow_blank=True) # PRO for Premium
    POD_NO = serializers.CharField(max_length=50, required=False, allow_blank=True)

class TPCCODBookingSerializer(serializers.Serializer):
    REF_NO = serializers.CharField(max_length=50)
    BDATE = serializers.DateField(format="%Y-%m-%d")
    SENDER = serializers.CharField(max_length=100)
    SENDER_CODE = serializers.CharField(max_length=50, required=False, allow_blank=True)
    SENDER_ADDRESS = serializers.CharField(max_length=255)
    SENDER_CITY = serializers.CharField(max_length=100)
    SENDER_PINCODE = serializers.CharField(max_length=10)
    SENDER_MOB = serializers.CharField(max_length=15)
    SENDER_EMAIL = serializers.EmailField(required=False, allow_blank=True)
    GSTIN = serializers.CharField(max_length=15, required=False, allow_blank=True)
    RECIPIENT = serializers.CharField(max_length=100)
    RECIPIENT_COMPANY = serializers.CharField(max_length=100, required=False, allow_blank=True)
    RECIPIENT_ADDRESS = serializers.CharField(max_length=255)
    RECIPIENT_CITY = serializers.CharField(max_length=100)
    RECIPIENT_PINCODE = serializers.CharField(max_length=10)
    RECIPIENT_MOB = serializers.CharField(max_length=15)
    RECIPIENT_EMAIL = serializers.EmailField(required=False, allow_blank=True)
    WEIGHT = serializers.DecimalField(max_digits=8, decimal_places=2)
    PIECES = serializers.IntegerField()
    RECIPIENT_GSTIN = serializers.CharField(max_length=15, required=False, allow_blank=True)
    FLYER_NO = serializers.CharField(max_length=50, required=False, allow_blank=True)
    CUST_INVOICE = serializers.CharField(max_length=50, required=False, allow_blank=True)
    CUST_INVOICEAMT = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    VOL_LENGTH = serializers.IntegerField(required=False)
    VOL_WIDTH = serializers.IntegerField(required=False)
    VOL_HEIGHT = serializers.IntegerField(required=False)
    DESCRIPTION = serializers.CharField(max_length=255, required=False, allow_blank=True)
    REMARKS = serializers.CharField(max_length=255, required=False, allow_blank=True)
    COD_AMOUNT = serializers.DecimalField(max_digits=10, decimal_places=2)
    PAYMENT_MODE = serializers.CharField(max_length=20) # CASH
    TYPE = serializers.CharField(max_length=20, required=False, allow_blank=True)
    ORDER_STATUS = serializers.CharField(max_length=20) # HOLD

class TPCPickupAddonSerializer(serializers.Serializer):
    POD_NO = serializers.CharField(max_length=50)
    WEIGHT = serializers.DecimalField(max_digits=8, decimal_places=2)
    PIECES = serializers.IntegerField()
    CONTENT = serializers.CharField(max_length=255, required=False, allow_blank=True)
    DECLARED_VALUE = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    CUST_INVOICE = serializers.CharField(max_length=50, required=False, allow_blank=True)
    CUST_INVOICEAMT = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
