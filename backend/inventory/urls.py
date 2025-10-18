from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockMovementViewSet, StockAlertViewSet, SupplierViewSet, BatchViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet

router = DefaultRouter()
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'stock-alerts', StockAlertViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'purchase-order-items', PurchaseOrderItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
