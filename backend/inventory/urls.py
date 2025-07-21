from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockMovementViewSet, StockAlertViewSet, SupplierViewSet, BatchViewSet

router = DefaultRouter()
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'stock-alerts', StockAlertViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'batches', BatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
