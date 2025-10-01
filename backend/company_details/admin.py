from django.contrib import admin
from .models import CompanyDetails

@admin.register(CompanyDetails)
class CompanyDetailsAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'phone_number', 'email', 'gstin')
    search_fields = ('name', 'city', 'state', 'gstin')
    list_filter = ('state', 'country')
