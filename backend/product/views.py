from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import ListCreateAPIView # Import ListCreateAPIView
from rest_framework.views import APIView # Import APIView for file upload
from django.db.models import Q, Sum, Count, F, Avg
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
import openpyxl # Import openpyxl
from .models import (
    Category, Product, Batch, Inventory, GenericName,
    ProductReview, ProductImage, Wishlist, ProductTag,
    ProductViewHistory
)
from .serializers import (
    CategorySerializer, ProductSerializer, BatchSerializer,
    InventorySerializer, GenericNameSerializer, EnhancedProductSerializer,
    ProductReviewSerializer, WishlistSerializer, ProductSearchSerializer,
    BulkCategorySerializer, BulkGenericNameSerializer, BulkProductSerializer, # Import new serializers
    FileSerializer # Import FileSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class BulkCategoryCreateAPIView(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = BulkCategorySerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can bulk create

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class BulkGenericNameCreateAPIView(ListCreateAPIView):
    queryset = GenericName.objects.all()
    serializer_class = BulkGenericNameSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can bulk create

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class BulkProductCreateAPIView(ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = BulkProductSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can bulk create

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super().get_serializer(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class ExcelUploadView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data['file']

        try:
            workbook = openpyxl.load_workbook(file)
            sheet = workbook.active
            
            headers = [cell.value for cell in sheet[1]]
            data_rows = []
            for row in sheet.iter_rows(min_row=2, values_only=True):
                row_data = dict(zip(headers, row))
                data_rows.append(row_data)

            # Process products
            product_serializer = BulkProductSerializer(data=data_rows, many=True, context={'request': request})
            product_serializer.is_valid(raise_exception=True)
            product_serializer.save()

            return Response({"message": "Excel file processed successfully", "data": product_serializer.data}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # Allow public access for mobile app browsing

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
            queryset = queryset.annotate(total_stock=Sum('batches__current_quantity'))
            if stock_status == 'low':
                queryset = queryset.filter(total_stock__lte=F('min_stock_level'))
            elif stock_status == 'out':
                queryset = queryset.filter(total_stock=0)
            elif stock_status == 'in':
                queryset = queryset.filter(total_stock__gt=F('min_stock_level'))
        if prescription_required is not None:
            queryset = queryset.filter(is_prescription_required=prescription_required.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        products = self.get_queryset().annotate(total_stock=Sum('batches__current_quantity')).filter(total_stock__lte=F('min_stock_level'))
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get products that are out of stock"""
        products = self.get_queryset().annotate(total_stock=Sum('batches__current_quantity')).filter(total_stock=0)
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


class EnhancedProductViewSet(viewsets.ModelViewSet):
    """Enhanced product viewset with additional features for mobile app"""
    queryset = Product.objects.select_related('category', 'generic_name').prefetch_related(
        'images', 'reviews', 'tags__tag', 'batches' # Add 'batches' here
    ).all()
    serializer_class = EnhancedProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'generic_name__name', 'manufacturer', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter parameters
        category = self.request.query_params.get('category')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        prescription_required = self.request.query_params.get('prescription_required')
        in_stock = self.request.query_params.get('in_stock')
        rating = self.request.query_params.get('min_rating')

        if category:
            queryset = queryset.filter(category_id=category)
        if min_price:
            # This filter needs to be adjusted to use current_selling_price from batches
            # For now, it's commented out as 'price' is not a direct field on Product
            # queryset = queryset.filter(price__gte=min_price)
            pass
        if max_price:
            # This filter needs to be adjusted to use current_selling_price from batches
            # For now, it's commented out as 'price' is not a direct field on Product
            # queryset = queryset.filter(price__lte=max_price)
            pass
        if prescription_required is not None:
            queryset = queryset.filter(is_prescription_required=prescription_required.lower() == 'true')
        if in_stock == 'true':
            queryset = queryset.annotate(total_stock=Sum('batches__current_quantity')).filter(total_stock__gt=0)
        if rating:
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).filter(avg_rating__gte=rating)

        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Track product views when retrieving product details"""
        instance = self.get_object()

        # Track view history for authenticated users
        if request.user.is_authenticated:
            ProductViewHistory.objects.create(
                user=request.user,
                product=instance
            )

        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products"""
        featured_products = self.get_queryset().annotate(total_stock=Sum('batches__current_quantity')).filter(
            total_stock__gt=0
        ).order_by('-created_at')[:10]

        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending products based on views and orders"""
        trending_products = self.get_queryset().annotate(
            view_count=Count('productviewhistory'),
            review_count=Count('reviews'),
            total_stock=Sum('batches__current_quantity')
        ).filter(
            total_stock__gt=0
        ).order_by('-view_count', '-review_count')[:10]

        serializer = self.get_serializer(trending_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get personalized recommendations for authenticated users"""
        if not request.user.is_authenticated:
            # Return popular products for anonymous users
            popular_products = self.get_queryset().annotate(
                avg_rating=Avg('reviews__rating'),
                total_stock=Sum('batches__current_quantity')
            ).filter(
                total_stock__gt=0,
                avg_rating__gte=4.0
            ).order_by('-avg_rating')[:10]

            serializer = self.get_serializer(popular_products, many=True)
            return Response(serializer.data)

        # Get user's view history and preferences
        viewed_products = ProductViewHistory.objects.filter(
            user=request.user
        ).values_list('product__category', flat=True).distinct()

        # Recommend products from viewed categories
        recommended_products = self.get_queryset().annotate(total_stock=Sum('batches__current_quantity')).filter(
            category__in=viewed_products,
            total_stock__gt=0
        ).exclude(
            id__in=ProductViewHistory.objects.filter(
                user=request.user
            ).values_list('product_id', flat=True)
        ).order_by('?')[:10]  # Random order

        serializer = self.get_serializer(recommended_products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        Adds a new batch or updates an existing batch for a product.
        Handles setting a batch as primary, ensuring only one primary batch per product.
        """
        try:
            product = self.get_object()
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        batch_data = request.data
        batch_number = batch_data.get('batch_number')
        is_primary = batch_data.get('is_primary', False)

        if not batch_number:
            return Response({'detail': 'Batch number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if batch already exists for this product
        batch, created = Batch.objects.get_or_create(
            product=product,
            batch_number=batch_number,
    
            defaults={
                'quantity': batch_data.get('quantity', 0),
                'current_quantity': batch_data.get('quantity', 0),
                'expiry_date': batch_data.get('expiry_date'),
                'cost_price': batch_data.get('cost_price', 0),
                'mrp_price': batch_data.get('mrp_price', 0),
                'discount_percentage': batch_data.get('discount_percentage', 0),
                'is_primary': is_primary,
            }
        )

        if not created:
            # Update existing batch
            batch.quantity = batch_data.get('quantity', batch.quantity)
            batch.current_quantity = batch_data.get('quantity', batch.current_quantity) # Assuming full replacement or adjustment
            batch.expiry_date = batch_data.get('expiry_date', batch.expiry_date)
            batch.cost_price = batch_data.get('cost_price', batch.cost_price)
            batch.mrp_price = batch_data.get('mrp_price', batch.mrp_price)
            batch.discount_percentage = batch_data.get('discount_percentage', batch.discount_percentage)
            batch.is_primary = is_primary # Update is_primary
            batch.save()

        # Ensure only one primary batch for the product
        if is_primary:
            Batch.objects.filter(product=product).exclude(id=batch.id).update(is_primary=False)

        serializer = BatchSerializer(batch)
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def search_suggestions(self, request):
        """Get search suggestions based on query"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        suggestions = Product.objects.filter(
            Q(name__icontains=query) |
            Q(generic_name__name__icontains=query) |
            Q(manufacturer__icontains=query)
        ).values_list('name', flat=True)[:10]

        return Response(list(suggestions))


class ProductReviewViewSet(viewsets.ModelViewSet):
    """Product reviews management"""
    queryset = ProductReview.objects.select_related('user', 'product').all()
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        review.helpful_count = F('helpful_count') + 1
        review.save()
        review.refresh_from_db()

        serializer = self.get_serializer(review)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ModelViewSet):
    """User wishlist management"""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(
            user=self.request.user
        ).select_related('product').order_by('-created_at')

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle product in wishlist"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )

        if not created:
            wishlist_item.delete()
            return Response({'message': 'Removed from wishlist', 'in_wishlist': False})
        else:
            serializer = self.get_serializer(wishlist_item)
            return Response({
                'message': 'Added to wishlist',
                'in_wishlist': True,
                'data': serializer.data
            })
