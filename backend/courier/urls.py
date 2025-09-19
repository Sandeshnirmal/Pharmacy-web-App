from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourierShipmentViewSet

router = DefaultRouter()
router.register(r'shipments', CourierShipmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
