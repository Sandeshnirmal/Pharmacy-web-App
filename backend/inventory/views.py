from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import StockMovement, StockAlert, Supplier
from .serializers import (
    StockMovementSerializer, StockAlertSerializer, SupplierSerializer,
    BatchCreateSerializer, InventoryStatsSerializer
)
from product.models import Product, Batch
from product.serializers import BatchSerializer

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product', None)
        movement_type = self.request.query_params.get('type', None)

        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)

        return queryset

class StockAlertViewSet(viewsets.ModelViewSet):
    queryset = StockAlert.objects.all().order_by('-created_at')
    serializer_class = StockAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_resolved = self.request.query_params.get('resolved', None)
        alert_type = self.request.query_params.get('type', None)

        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)

        return queryset

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.resolved_by = request.user
        alert.resolved_at = timezone.now()
        alert.save()

        return Response({'status': 'Alert resolved'})

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('active', None)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().order_by('-created_at')
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BatchCreateSerializer
        return BatchSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product', None)
        expiring_soon = self.request.query_params.get('expiring_soon', None)

        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if expiring_soon:
            # Batches expiring in next 30 days
            thirty_days_from_now = timezone.now().date() + timedelta(days=30)
            queryset = queryset.filter(expiry_date__lte=thirty_days_from_now)

        return queryset

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get batches expiring in the next 30 days"""
        thirty_days_from_now = timezone.now().date() + timedelta(days=30)
        batches = Batch.objects.filter(
            expiry_date__lte=thirty_days_from_now,
            current_quantity__gt=0
        ).order_by('expiry_date')

        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired batches"""
        today = timezone.now().date()
        batches = Batch.objects.filter(
            expiry_date__lt=today,
            current_quantity__gt=0
        ).order_by('expiry_date')

        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get inventory statistics"""
        today = timezone.now().date()
        thirty_days_from_now = today + timedelta(days=30)

        # Total products
        total_products = Product.objects.count()

        # Low stock products (stock < min_stock_level)
        low_stock_products = Product.objects.filter(
            stock_quantity__lt=F('min_stock_level')
        ).count()

        # Out of stock products
        out_of_stock_products = Product.objects.filter(stock_quantity=0).count()

        # Expiring batches (next 30 days)
        expiring_batches = Batch.objects.filter(
            expiry_date__lte=thirty_days_from_now,
            expiry_date__gte=today,
            current_quantity__gt=0
        ).count()

        # Expired batches
        expired_batches = Batch.objects.filter(
            expiry_date__lt=today,
            current_quantity__gt=0
        ).count()

        # Total inventory value
        total_inventory_value = Product.objects.aggregate(
            total_value=Sum(F('stock_quantity') * F('price'))
        )['total_value'] or 0

        stats_data = {
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'out_of_stock_products': out_of_stock_products,
            'expiring_batches': expiring_batches,
            'expired_batches': expired_batches,
            'total_inventory_value': total_inventory_value
        }

        serializer = InventoryStatsSerializer(stats_data)
        return Response(serializer.data)
