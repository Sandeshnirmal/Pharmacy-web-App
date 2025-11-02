from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourierShipmentViewSet # Removed check_pincode_service import

router = DefaultRouter()
router.register(r'shipments', CourierShipmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Removed path for 'tpc-partner/check_pincode_service/'
]
