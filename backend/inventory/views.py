from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import StockMovement, StockAlert, Supplier, PurchaseOrder, PurchaseOrderItem
from .serializers import (
    StockMovementSerializer, StockAlertSerializer, SupplierSerializer,
    BatchCreateSerializer, InventoryStatsSerializer,
    PurchaseOrderSerializer, PurchaseOrderItemSerializer
)
from product.models import Product, Batch
from product.serializers import BatchSerializer
from .pagination import CustomPageNumberPagination

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-created_at')
    pagination_class = CustomPageNumberPagination
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
    pagination_class = CustomPageNumberPagination
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
    pagination_class = CustomPageNumberPagination
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
    pagination_class = CustomPageNumberPagination
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

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-order_date')
    pagination_class = CustomPageNumberPagination
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        supplier_id = self.request.query_params.get('supplier', None)
        status = self.request.query_params.get('status', None)

        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def receive_items(self, request, pk=None):
        purchase_order = self.get_object()
        if purchase_order.status == 'CANCELLED':
            return Response({'detail': 'Cannot receive items for a cancelled order.'}, status=status.HTTP_400_BAD_REQUEST)

        items_data = request.data.get('items', [])
        if not items_data:
            return Response({'detail': 'No items provided for reception.'}, status=status.HTTP_400_BAD_REQUEST)

        for item_data in items_data:
            item_id = item_data.get('id')
            received_quantity = item_data.get('received_quantity')

            if not item_id or received_quantity is None:
                return Response({'detail': 'Each item must have an id and received_quantity.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                po_item = purchase_order.items.get(id=item_id)
            except PurchaseOrderItem.DoesNotExist:
                return Response({'detail': f'Purchase order item with id {item_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

            if received_quantity > (po_item.quantity - po_item.received_quantity):
                return Response({'detail': f'Received quantity for item {po_item.product.name} exceeds outstanding quantity.'}, status=status.HTTP_400_BAD_REQUEST)
            
            po_item.received_quantity += received_quantity
            po_item.save()

            # Update product stock and create stock movement
            product = po_item.product
            product.stock_quantity += received_quantity
            product.save()

            # Handle batch creation/update and link to StockMovement
            batch_number = po_item.batch_number # Get batch number from purchase order item
            expiry_date = po_item.expiry_date # Get expiry date from purchase order item

            batch, created = Batch.objects.get_or_create(
                product=product,
                batch_number=batch_number,
                expiry_date=expiry_date,
                defaults={'quantity': 0, 'current_quantity': 0} # Default values if creating a new batch
            )
            
            # Update batch quantity
            batch.quantity += received_quantity
            batch.current_quantity += received_quantity
            batch.save()

            StockMovement.objects.create(
                product=product,
                batch=batch,
                movement_type='IN',
                quantity=received_quantity,
                reference_number=f"PO-{purchase_order.id}",
                notes=f"Received {received_quantity} units for Purchase Order #{purchase_order.id} into batch {batch.batch_number}",
                created_by=request.user
            )

        # Check if all items are fully received
        all_received = all(item.quantity == item.received_quantity for item in purchase_order.items.all())
        if all_received:
            purchase_order.status = 'RECEIVED'
            purchase_order.delivery_date = timezone.now().date()
            purchase_order.save()

        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)

class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.all()
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        purchase_order_id = self.request.query_params.get('purchase_order', None)
        if purchase_order_id:
            queryset = queryset.filter(purchase_order_id=purchase_order_id)
        return queryset
