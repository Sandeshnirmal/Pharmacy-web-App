from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
import logging # Import logging
from django.db import transaction # Import transaction
from .models import StockMovement, StockAlert, Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseReturn, PurchaseReturnItem
from .serializers import (
    StockMovementSerializer, StockAlertSerializer, SupplierSerializer,
    BatchCreateSerializer, InventoryStatsSerializer,
    PurchaseOrderSerializer, PurchaseOrderItemSerializer,
    PurchaseReturnItemSerializer,
    PurchaseReturnSerializer,
    PurchaseOrderReturnItemsSerializer # Import the new serializer
)
from product.models import Product, Batch
from product.serializers import BatchSerializer
from .pagination import CustomPageNumberPagination

logger = logging.getLogger(__name__) # Initialize logger

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
    permission_classes = [AllowAny]

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
    queryset = PurchaseOrder.objects.all().order_by('-order_date').prefetch_related('items__product')
    pagination_class = CustomPageNumberPagination
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('items__product')
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

            # Handle batch creation/update and link to StockMovement
            batch_number = po_item.batch_number # Get batch number from purchase order item
            expiry_date = po_item.expiry_date # Get expiry date from purchase order item

            from inventory.utils import add_stock_to_batches # Import centralized stock utility
            try:
                batch = add_stock_to_batches(
                    product=po_item.product,
                    batch_number=batch_number,
                    expiry_date=expiry_date,
                    quantity_to_add=received_quantity,
                    user=request.user,
                    purchase_order_id=purchase_order.id
                )
                if not batch:
                    raise ValueError(f"Stock addition failed for product {po_item.product.name}.")
            except ValueError as ve:
                return Response({'detail': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as ex:
                logger.exception(f"Unexpected error during stock addition for product {po_item.product.name} during purchase order reception.")
                return Response({'detail': f"An unexpected error occurred while adding stock for {po_item.product.name}: {str(ex)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Check if all items are fully received
        all_received = all(item.quantity == item.received_quantity for item in purchase_order.items.all())
        if all_received:
            purchase_order.status = 'RECEIVED'
            purchase_order.delivery_date = timezone.now().date()
            purchase_order.save()

        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @transaction.atomic # Add atomic transaction decorator
    def return_items(self, request, pk=None):
        purchase_order = self.get_object()
        if purchase_order.status == 'CANCELLED':
            return Response({'detail': 'Cannot return items for a cancelled order.'}, status=status.HTTP_400_BAD_REQUEST)

        items_data = request.data.get('items', [])
        if not items_data:
            return Response({'detail': 'No items provided for return.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create PurchaseReturn instance
        purchase_return = PurchaseReturn.objects.create(
            purchase_order=purchase_order,
            reason=request.data.get('reason', 'Items returned to supplier.'),
            notes=request.data.get('notes', ''),
            return_date=request.data.get('return_date', timezone.now().date()),
            status=request.data.get('status', 'PENDING'),
            created_by=request.user
        )

        total_amount = 0
        for item_data in items_data:
            purchase_order_item_id = item_data.get('purchase_order_item')
            product_id = item_data.get('product')
            quantity = item_data.get('quantity')
            unit_price = item_data.get('unit_price')
            # batch_number = item_data.get('batch_number') # Removed, will get from purchase_order_item
            # expiry_date = item_data.get('expiry_date') # Removed, will get from purchase_order_item

            if not all([purchase_order_item_id, product_id, quantity, unit_price]):
                purchase_return.delete() # Rollback
                return Response({'detail': 'Each return item must have purchase_order_item, product, quantity, and unit_price.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                purchase_order_item = PurchaseOrderItem.objects.get(id=purchase_order_item_id)
                product = Product.objects.get(id=product_id)
            except (PurchaseOrderItem.DoesNotExist, Product.DoesNotExist) as e:
                purchase_return.delete() # Rollback
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            if quantity > purchase_order_item.quantity - purchase_order_item.returned_quantity:
                purchase_return.delete() # Rollback
                return Response({'detail': f'Return quantity for item {product.name} exceeds available quantity.'}, status=status.HTTP_400_BAD_REQUEST)

            # Get batch_number and expiry_date from the original PurchaseOrderItem
            batch_number = purchase_order_item.batch_number
            expiry_date = purchase_order_item.expiry_date

            PurchaseReturnItem.objects.create(
                purchase_return=purchase_return,
                purchase_order_item=purchase_order_item,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                batch_number=batch_number,
                expiry_date=expiry_date
            )
            total_amount += quantity * unit_price

            # Update returned_quantity in the original PurchaseOrderItem
            purchase_order_item.returned_quantity += quantity
            purchase_order_item.save()

            # Update stock and create StockMovement
            batch = Batch.objects.filter(
                product=product,
                batch_number=batch_number,
                expiry_date=expiry_date
            ).first()

            if batch:
                print(f"Before deduction: Batch {batch.batch_number}, Product {product.name}, Total Quantity: {batch.quantity}, Current Quantity: {batch.current_quantity}")
                if batch.current_quantity >= quantity:
                    batch.current_quantity -= quantity
                    batch.quantity -= quantity # Deduct from total quantity as well
                    batch.save()
                    print(f"After deduction: Batch {batch.batch_number}, Product {product.name}, New Total Quantity: {batch.quantity}, New Current Quantity: {batch.current_quantity}")
                    StockMovement.objects.create(
                        product=product,
                        batch=batch,
                        movement_type='SUPPLIER_RETURN',
                        quantity=quantity,
                        reference_number=f"PR-{purchase_return.id}",
                        notes=f"Returned {quantity} units of {product.name} from batch {batch.batch_number} (PO Item {purchase_order_item.id}) for Purchase Return #{purchase_return.id}.",
                        created_by=request.user
                    )
                else:
                    purchase_return.delete() # Rollback
                    return Response({'detail': f"Insufficient stock in batch {batch_number} for product {product.name} to return {quantity} units."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                purchase_return.delete() # Rollback
                return Response({'detail': f"Specific batch (number: {batch_number}) not found for product {product.name}. Stock deduction failed."}, status=status.HTTP_400_BAD_REQUEST)

        purchase_return.total_amount = total_amount
        purchase_return.status = 'PROCESSED'
        purchase_return.save()

        serializer = PurchaseReturnSerializer(purchase_return)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PurchaseReturnViewSet(viewsets.ModelViewSet):
    queryset = PurchaseReturn.objects.all().order_by('-created_at').prefetch_related('items__product', 'purchase_order__supplier')
    pagination_class = CustomPageNumberPagination
    serializer_class = PurchaseReturnSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('items__product', 'purchase_order__supplier')
        purchase_order_id = self.request.query_params.get('purchase_order', None)
        status = self.request.query_params.get('status', None)

        if purchase_order_id:
            queryset = queryset.filter(purchase_order_id=purchase_order_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


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
