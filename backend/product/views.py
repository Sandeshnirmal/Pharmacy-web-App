from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Category, Product, Batch, Inventory, GenericName
from .serializers import CategorySerializer, ProductSerializer, BatchSerializer, InventorySerializer, GenericNameSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        stock_status = self.request.query_params.get('stock_status', None)
        prescription_required = self.request.query_params.get('prescription_required', None)

        if category:
            queryset = queryset.filter(category_id=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(generic_name__name__icontains=search) |
                Q(manufacturer__icontains=search)
            )
        if stock_status:
            if stock_status == 'low':
                queryset = queryset.filter(stock_quantity__lte=F('min_stock_level'))
            elif stock_status == 'out':
                queryset = queryset.filter(stock_quantity=0)
            elif stock_status == 'in':
                queryset = queryset.filter(stock_quantity__gt=F('min_stock_level'))
        if prescription_required is not None:
            queryset = queryset.filter(is_prescription_required=prescription_required.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        from django.db.models import F
        products = Product.objects.filter(stock_quantity__lte=F('min_stock_level'))
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get products that are out of stock"""
        products = Product.objects.filter(stock_quantity=0)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().order_by('-created_at')
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        product = self.request.query_params.get('product', None)
        expiring_soon = self.request.query_params.get('expiring_soon', None)
        expired = self.request.query_params.get('expired', None)

        if product:
            queryset = queryset.filter(product_id=product)
        if expiring_soon:
            thirty_days_from_now = timezone.now().date() + timedelta(days=30)
            queryset = queryset.filter(expiry_date__lte=thirty_days_from_now, expiry_date__gte=timezone.now().date())
        if expired:
            queryset = queryset.filter(expiry_date__lt=timezone.now().date())

        return queryset

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]

class GenericNameViewSet(viewsets.ModelViewSet):
    queryset = GenericName.objects.all().order_by('name')
    serializer_class = GenericNameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset