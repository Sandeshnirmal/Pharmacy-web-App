from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfflineSaleViewSet, OfflineSaleItemViewSet

router = DefaultRouter()
router.register(r'offline-sales', OfflineSaleViewSet)
router.register(r'offline-sale-items', OfflineSaleItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
