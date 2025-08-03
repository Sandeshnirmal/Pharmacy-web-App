# order/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderItemViewSet, get_order_tracking, add_tracking_update, get_order_status_history, create_pending_order, confirm_prescription_order

router = DefaultRouter()
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Order tracking endpoints
    path('tracking/<int:order_id>/', get_order_tracking, name='get_order_tracking'),
    path('tracking/<int:order_id>/add/', add_tracking_update, name='add_tracking_update'),
    path('status-history/<int:order_id>/', get_order_status_history, name='get_order_status_history'),

    # Prescription order flow
    path('pending/', create_pending_order, name='create_pending_order'),
    path('confirm-prescription/<int:order_id>/', confirm_prescription_order, name='confirm_prescription_order'),
]