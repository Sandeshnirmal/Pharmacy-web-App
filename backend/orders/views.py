# order/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-order_date')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('order_status', None)
        payment_status = self.request.query_params.get('payment_status', None)
        is_prescription = self.request.query_params.get('is_prescription_order', None)
        user_id = self.request.query_params.get('user_id', None)

        if status_filter:
            queryset = queryset.filter(order_status=status_filter)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if is_prescription:
            queryset = queryset.filter(is_prescription_order=is_prescription.lower() == 'true')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get order statistics for admin dashboard"""
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(order_status='Pending').count()
        processing_orders = Order.objects.filter(order_status='Processing').count()
        delivered_orders = Order.objects.filter(order_status='Delivered').count()
        prescription_orders = Order.objects.filter(is_prescription_order=True).count()

        total_revenue = Order.objects.filter(
            payment_status='Paid'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        return Response({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'processing_orders': processing_orders,
            'delivered_orders': delivered_orders,
            'prescription_orders': prescription_orders,
            'total_revenue': total_revenue,
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        new_status = request.data.get('order_status')

        if new_status in dict(Order.ORDER_STATUS):
            order.order_status = new_status
            order.save()
            return Response({'message': 'Order status updated successfully'})

        return Response(
            {'error': 'Invalid order status'},
            status=status.HTTP_400_BAD_REQUEST
        )

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        order_id = self.request.query_params.get('order_id', None)

        if order_id:
            queryset = queryset.filter(order_id=order_id)

        return queryset
