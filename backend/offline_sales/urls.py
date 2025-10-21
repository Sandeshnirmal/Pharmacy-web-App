from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfflineSaleViewSet, OfflineSaleItemViewSet, BillReturnViewSet, OfflineCustomerViewSet

router = DefaultRouter()
router.register(r'offline-sales', OfflineSaleViewSet)
router.register(r'offline-sale-items', OfflineSaleItemViewSet)
router.register(r'bill-returns', BillReturnViewSet)
router.register(r'offline-customers', OfflineCustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
