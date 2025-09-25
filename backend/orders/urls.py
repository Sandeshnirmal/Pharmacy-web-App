# order/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, OrderItemViewSet, get_order_tracking, add_tracking_update,
    get_order_status_history, create_pending_order, confirm_prescription_order,
    create_paid_order_for_prescription, link_prescription_to_order,
    verify_prescription_and_confirm_order, get_orders_for_prescription_review,
    get_paid_orders_awaiting_prescription
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Order tracking endpoints
    path('tracking/<int:order_id>/', get_order_tracking, name='get_order_tracking'),
    path('tracking/<int:order_id>/add/', add_tracking_update, name='add_tracking_update'),
    path('status-history/<int:order_id>/', get_order_status_history, name='get_order_status_history'),
    path('orders/<int:order_id>/status-updates/', get_order_status_history, name='order_status_updates'), # Added to resolve 404

    # Prescription order flow (Legacy)
    path('pending/', create_pending_order, name='create_pending_order'),
    path('confirm-prescription/<int:order_id>/', confirm_prescription_order, name='confirm_prescription_order'),

    # Enhanced Order Flow - Payment First Approach
    path('enhanced/create-paid-order/', create_paid_order_for_prescription, name='create_paid_order_for_prescription'),
    path('enhanced/<int:order_id>/link-prescription/', link_prescription_to_order, name='link_prescription_to_order'),
    path('enhanced/<int:order_id>/verify-prescription/', verify_prescription_and_confirm_order, name='verify_prescription_and_confirm_order'),
    path('enhanced/prescription-review/', get_orders_for_prescription_review, name='get_orders_for_prescription_review'),
    path('enhanced/awaiting-prescription/', get_paid_orders_awaiting_prescription, name='get_paid_orders_awaiting_prescription'),
]
