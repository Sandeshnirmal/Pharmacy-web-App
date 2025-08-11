from django.contrib import admin
from .models import CourierPartner, CourierShipment, CourierServiceArea, CourierRateCard

@admin.register(CourierPartner)
class CourierPartnerAdmin(admin.ModelAdmin):
    list_display = ['name', 'courier_type', 'is_active', 'created_at']
    list_filter = ['courier_type', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(CourierShipment)
class CourierShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'tracking_number', 'order', 'courier_partner', 'status',
        'pickup_scheduled', 'estimated_delivery', 'created_at'
    ]
    list_filter = ['status', 'courier_partner', 'created_at']
    search_fields = ['tracking_number', 'order__id', 'courier_order_id']
    readonly_fields = ['id', 'created_at', 'updated_at', 'tracking_history']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('order', 'courier_partner', 'tracking_number', 'courier_order_id', 'status')
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
            'fields': ('current_location', 'tracking_history', 'courier_response')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at')
        })
    )

@admin.register(CourierServiceArea)
class CourierServiceAreaAdmin(admin.ModelAdmin):
    list_display = [
        'courier_partner', 'city', 'pincode', 'state',
        'is_cod_available', 'standard_delivery_days'
    ]
    list_filter = ['courier_partner', 'state', 'is_cod_available', 'is_express_available']
    search_fields = ['city', 'pincode', 'state']

@admin.register(CourierRateCard)
class CourierRateCardAdmin(admin.ModelAdmin):
    list_display = [
        'courier_partner', 'zone', 'weight_slab_start', 'weight_slab_end',
        'rate_per_kg', 'minimum_charge'
    ]
    list_filter = ['courier_partner', 'zone']
    search_fields = ['zone']
