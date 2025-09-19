from django.contrib import admin
from django.contrib import admin
from .models import CourierShipment, TPCRecipient, TPCServiceableArea

@admin.register(CourierShipment)
class CourierShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'tracking_number', 'order', 'status',
        'pickup_scheduled', 'estimated_delivery', 'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['tracking_number', 'order__id', 'tpc_order_id']
    readonly_fields = ['id', 'created_at', 'updated_at', 'tracking_history']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('order', 'tracking_number', 'tpc_order_id', 'status')
        }),
        ('Addresses', {
            'fields': ('pickup_address', 'delivery_address', 'delivery_contact', 'delivery_instructions')
        }),
        ('Package Details', {
            'fields': ('weight', 'dimensions', 'declared_value')
        }),
        ('Scheduling', {
            'fields': ('pickup_scheduled', 'pickup_completed', 'estimated_delivery', 'actual_delivery')
        }),
        ('Charges', {
            'fields': ('shipping_charges', 'cod_charges', 'total_charges')
        }),
        ('Tracking', {
            'fields': ('current_location', 'tracking_history', 'tpc_response')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at')
        })
    )

@admin.register(TPCRecipient)
class TPCRecipientAdmin(admin.ModelAdmin):
    list_display = ['recipient_name', 'recipient_mobile', 'recipient_email', 'address']
    search_fields = ['recipient_name', 'recipient_mobile', 'recipient_email', 'address__city']
    raw_id_fields = ['address']

@admin.register(TPCServiceableArea)
class TPCServiceableAreaAdmin(admin.ModelAdmin):
    list_display = ['pincode', 'city', 'state', 'is_serviceable', 'last_updated']
    list_filter = ['is_serviceable', 'state']
    search_fields = ['pincode', 'city', 'state']
    readonly_fields = ['last_updated']
