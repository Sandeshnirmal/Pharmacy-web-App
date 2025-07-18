from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, PrescriptionDetailViewSet
from . import mobile_api
# test_views removed - using only mobile_api now

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'prescription-details', PrescriptionDetailViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Mobile API endpoints
    path('mobile/upload/', mobile_api.upload_prescription, name='mobile_upload_prescription'),
    path('mobile/status/<int:prescription_id>/', mobile_api.get_prescription_status, name='mobile_prescription_status'),
    path('mobile/suggestions/<int:prescription_id>/', mobile_api.get_medicine_suggestions, name='mobile_medicine_suggestions'),
    path('mobile/products/<int:prescription_id>/', mobile_api.get_prescription_products, name='mobile_prescription_products'),
    path('mobile/create-order/', mobile_api.create_prescription_order, name='mobile_create_order'),

    # Admin OCR API endpoints
    path('admin/reprocess-ocr/<int:prescription_id>/', mobile_api.reprocess_prescription_ocr, name='admin_reprocess_ocr'),

    # Test endpoints removed - use mobile API for all prescription processing
]
