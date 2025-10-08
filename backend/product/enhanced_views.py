# Enhanced Product Views
# Comprehensive medicine database with composition handling and full CRUD operations

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, F, Sum
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
# from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import (
    Composition, Product, ProductComposition, Category, GenericName,
    Batch, Inventory, ProductReview, ProductImage, Wishlist, ProductTag
)
from .enhanced_serializers import (
    CompositionSerializer, EnhancedProductSerializer, ProductCompositionSerializer,
    ProductCompositionCreateSerializer, ProductSearchSerializer, CompositionSearchSerializer,
    CategorySerializer, GenericNameSerializer, BatchSerializer, InventorySerializer
)
from usermanagement.enhanced_views import IsPharmacistOrAdmin, IsAdminUser

User = get_user_model()

# ============================================================================
# COMPOSITION MANAGEMENT VIEWSET
# ============================================================================

class CompositionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing medicine compositions with full CRUD operations"""
    queryset = Composition.objects.all()
    serializer_class = CompositionSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # permission_classes = [IsPharmacistOrAdmin]
            permission_classes = [AllowAny]

        else:
            permission_classes = [AllowAny]

        return [permission() for permission in permission_classes]

    
    def get_queryset(self):
        """Filter compositions based on parameters"""
        queryset = Composition.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(scientific_name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['post'], permission_classes=[IsPharmacistOrAdmin])
    def toggle_status(self, request, pk=None):
        """Toggle composition active status"""
        composition = self.get_object()
        composition.is_active = not composition.is_active
        composition.save()
        
        return Response({
            'message': f'Composition {composition.name} {"activated" if composition.is_active else "deactivated"}',
            'is_active': composition.is_active
        })
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products using this composition"""
        composition = self.get_object()
        products = composition.products.filter(is_active=True)
        serializer = ProductSearchSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all composition categories"""
        categories = Composition.objects.values_list('category', flat=True).distinct()
        categories = [cat for cat in categories if cat]  # Remove empty categories
        return Response(sorted(categories))

# ============================================================================
# ENHANCED PRODUCT MANAGEMENT VIEWSET
# ============================================================================

class ProductViewSet(viewsets.ModelViewSet):
    """Enhanced product management with composition support"""
    queryset = Product.objects.all()
    serializer_class = EnhancedProductSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter products with advanced search capabilities"""
        queryset = Product.objects.all()

        # Annotate queryset with total_stock for filtering
        queryset = queryset.annotate(
            total_stock=Sum('batches__current_quantity')
        )
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by prescription type
        prescription_type = self.request.query_params.get('prescription_type')
        if prescription_type:
            queryset = queryset.filter(prescription_type=prescription_type)
        
        # Filter by medicine type
        medicine_type = self.request.query_params.get('medicine_type')
        if medicine_type:
            queryset = queryset.filter(medicine_type=medicine_type)
        
        # Filter by manufacturer
        manufacturer = self.request.query_params.get('manufacturer')
        if manufacturer:
            queryset = queryset.filter(manufacturer__icontains=manufacturer)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by composition
        composition = self.request.query_params.get('composition')
        if composition:
            queryset = queryset.filter(compositions__id=composition)
        
        # Stock filters
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            queryset = queryset.filter(total_stock__lte=F('min_stock_level'))
        
        out_of_stock = self.request.query_params.get('out_of_stock')
        if out_of_stock == 'true':
            queryset = queryset.filter(total_stock=0)
        
        # Price range filter (Note: Product model does not have a direct price field, this might need adjustment)
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(batches__selling_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(batches__selling_price__lte=max_price)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(brand_name__icontains=search) |
                Q(generic_name__name__icontains=search) |
                Q(manufacturer__icontains=search) |
                Q(compositions__name__icontains=search)
            ).distinct()
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['post'], permission_classes=[IsPharmacistOrAdmin])
    def add_compositions(self, request, pk=None):
        """Add compositions to product"""
        product = self.get_object()
        serializer = ProductCompositionCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            compositions_data = serializer.validated_data['compositions']
            
            with transaction.atomic():
                for comp_data in compositions_data:
                    composition_id = comp_data['composition_id']
                    strength = comp_data['strength']
                    unit = comp_data.get('unit', 'mg')
                    
                    try:
                        composition = Composition.objects.get(id=composition_id)
                        ProductComposition.objects.get_or_create(
                            product=product,
                            composition=composition,
                            defaults={
                                'strength': strength,
                                'unit': unit
                            }
                        )
                    except Composition.DoesNotExist:
                        return Response(
                            {'error': f'Composition with ID {composition_id} not found'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            return Response({
                'message': 'Compositions added successfully',
                'product': EnhancedProductSerializer(product).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], permission_classes=[IsPharmacistOrAdmin])
    def remove_composition(self, request, pk=None):
        """Remove composition from product"""
        product = self.get_object()
        composition_id = request.data.get('composition_id')
        
        if not composition_id:
            return Response(
                {'error': 'Composition ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product_composition = ProductComposition.objects.get(
                product=product,
                composition_id=composition_id
            )
            product_composition.delete()
            
            return Response({
                'message': 'Composition removed successfully'
            })
        except ProductComposition.DoesNotExist:
            return Response(
                {'error': 'Composition not found in this product'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsPharmacistOrAdmin])
    def update_stock(self, request, pk=None):
        """Update product stock quantity and optionally set a batch as primary"""
        product = self.get_object()
        quantity = request.data.get('quantity')
        operation = request.data.get('operation', 'set')  # 'set', 'add', 'subtract'
        set_as_primary = request.data.get('set_as_primary', False) # New parameter

        if quantity is None:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
        except ValueError:
            return Response(
                {'error': 'Quantity must be a number'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_quantity = product.stock_quantity

        with transaction.atomic():
            batch_id = request.data.get('batch_id')
            if batch_id:
                try:
                    batch = product.batches.get(id=batch_id)
                except Batch.DoesNotExist:
                    return Response(
                        {'error': f'Batch with ID {batch_id} not found for this product'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # If no batch_id is provided, default to updating the primary batch
                # or the first available batch if no primary is explicitly set.
                batch = product.batches.filter(is_primary=True).first()
                if not batch:
                    batch = product.batches.first()
                if not batch:
                    # No batches exist, create a new primary batch
                    batch = Batch.objects.create(
                        product=product,
                        batch_number=f'AUTO-{product.id}-{timezone.now().strftime("%Y%m%d%H%M%S")}',
                        manufacturing_date=timezone.now().date(),
                        expiry_date=timezone.now().date() + timedelta(days=365),
                        quantity=0,
                        current_quantity=0,
                        cost_price=0,
                        selling_price=0,
                        is_primary=True
                    )

            # Apply stock operation
            if operation == 'set':
                batch.current_quantity = quantity
            elif operation == 'add':
                batch.current_quantity += quantity
            elif operation == 'subtract':
                batch.current_quantity = max(0, batch.current_quantity - quantity)
            else:
                return Response(
                    {'error': 'Invalid operation. Use "set", "add", or "subtract"'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Handle setting as primary
            if set_as_primary:
                # Set all other batches for this product to non-primary
                product.batches.exclude(pk=batch.pk).update(is_primary=False)
                batch.is_primary = True

            batch.save()

        product.refresh_from_db()

        return Response({
            'message': 'Stock updated successfully',
            'old_quantity': old_quantity,
            'new_quantity': product.stock_quantity,
            'operation': operation,
            'batch_id': batch.id,
            'batch_is_primary': batch.is_primary
        })

    @action(detail=True, methods=['post'], permission_classes=[IsPharmacistOrAdmin])
    def create_batch(self, request, pk=None):
        """Create a new batch for a product."""
        product = self.get_object()
        serializer = BatchSerializer(data=request.data)
        if serializer.is_valid():
            # Ensure the batch is linked to the correct product
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def low_stock_alert(self, request):
        """Get products with low stock"""
        low_stock_products = Product.objects.annotate(
            total_stock=Sum('batches__current_quantity')
        ).filter(
            total_stock__lte=F('min_stock_level'),
            is_active=True
        ).order_by('total_stock')
        
        serializer = ProductSearchSerializer(low_stock_products, many=True)
        return Response({
            'count': low_stock_products.count(),
            'products': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def inventory_summary(self, request):
        """Get inventory summary statistics"""
        total_products = Product.objects.filter(is_active=True).count()
        
        # Annotate products with total_stock for filtering
        products_with_stock = Product.objects.filter(is_active=True).annotate(
            total_stock=Sum('batches__current_quantity')
        )

        out_of_stock = products_with_stock.filter(total_stock=0).count()
        low_stock = products_with_stock.filter(
            total_stock__lte=F('min_stock_level'),
            total_stock__gt=0,
        ).count()
        
        # Calculate total_stock_value by summing (batch.current_quantity * batch.selling_price)
        total_stock_value = Product.objects.filter(is_active=True).aggregate(
            total_value=Sum(F('batches__current_quantity') * F('batches__selling_price'))
        )['total_value'] or 0

        return Response({
            'total_products': total_products,
            'out_of_stock': out_of_stock,
            'low_stock': low_stock,
            'in_stock': total_products - out_of_stock - low_stock,
            'total_stock_value': round(total_stock_value, 2)
        })
