from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourierPartnerViewSet, CourierShipmentViewSet,
    CourierServiceAreaViewSet, CourierRateCardViewSet
)

router = DefaultRouter()
router.register(r'tpc-partner', CourierPartnerViewSet, basename='tpc-partner') # Added basename and changed path
router.register(r'shipments', CourierShipmentViewSet)
router.register(r'service-areas', CourierServiceAreaViewSet)
router.register(r'rate-cards', CourierRateCardViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
