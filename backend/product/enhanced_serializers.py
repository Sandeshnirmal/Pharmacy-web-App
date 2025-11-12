# Enhanced Serializers for Intelligent Pharmacy Management System
# Comprehensive API serializers with composition handling and role-based permissions

from rest_framework import serializers
from rest_framework.serializers import ImageField # Import ImageField
from django.contrib.auth import get_user_model
from django.db import models # Import models module
import requests # Import requests for downloading images
from django.core.files.base import ContentFile # Import ContentFile for image handling
import json # Import json module
from uuid import UUID # Import UUID for validation
from .models import (
    Composition, Product, ProductComposition, Category, GenericName,
    Batch, Inventory, ProductReview, ProductImage, Wishlist, ProductTag
)

User = get_user_model()

# ============================================================================
# INVENTORY AND BATCH SERIALIZERS
# ============================================================================

# Enhanced Serializers for Intelligent Pharmacy Management System
# Comprehensive API serializers with composition handling and role-based permissions

from rest_framework import serializers
from rest_framework.serializers import ImageField # Import ImageField
from django.contrib.auth import get_user_model
from django.db import models # Import models module
import json # Import json module
from uuid import UUID # Import UUID for validation
from .models import (
    Composition, Product, ProductComposition, Category, GenericName,
    Batch, Inventory, ProductReview, ProductImage, Wishlist, ProductTag
)

User = get_user_model()

# ============================================================================
# INVENTORY AND BATCH SERIALIZERS
# ============================================================================

class BatchSerializer(serializers.ModelSerializer):
    """Batch serializer with enhanced tracking"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    days_to_expiry = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = [
            'id', 'product', 'product_name', 'batch_number',
            'manufacturing_date', 'expiry_date', 'quantity', 'current_quantity',
            'cost_price', 
            'mrp_price', 'discount_percentage', 'selling_price', # Generic
            'online_mrp_price', 'online_discount_percentage', 'online_selling_price', # Online
            'offline_mrp_price', 'offline_discount_percentage', 'offline_selling_price', # Offline
            'mfg_license_number', 'days_to_expiry', 'is_expired', 'created_at', 'updated_at'
        ]
        # Add extra_kwargs to ensure product is fetched with select_related
        extra_kwargs = {
            'product': {'read_only': True},
            'selling_price': {'read_only': True},
            'online_selling_price': {'read_only': True},
            'offline_selling_price': {'read_only': True},
        }
    
    def get_days_to_expiry(self, obj):
        """Calculate days until expiry"""
        from datetime import date
        if obj.expiry_date:
            delta = obj.expiry_date - date.today()
            return delta.days
        return None
    
    def get_is_expired(self, obj):
        """Check if batch is expired"""
        from datetime import date
        if obj.expiry_date:
            return obj.expiry_date < date.today()
        return False

    def create(self, validated_data):
        if 'current_quantity' not in validated_data:
            validated_data['current_quantity'] = validated_data.get('quantity', 0)
        return super().create(validated_data)

class InventorySerializer(serializers.ModelSerializer):
    """Inventory serializer"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'quantity_on_hand',
            'reorder_point', 'last_restock_date'
        ]
        extra_kwargs = {'product': {'read_only': True}}

# ============================================================================
# COMPOSITION MANAGEMENT SERIALIZERS
# ============================================================================

class CompositionSerializer(serializers.ModelSerializer):
    """Serializer for medicine compositions with full CRUD support"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    products_count = serializers.IntegerField(read_only=True) # Use annotated field

    
    class Meta:
        model = Composition
        fields = [
            'id', 'name', 'scientific_name', 'description', 'category',
            'side_effects', 'contraindications', 'is_active',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'products_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
        extra_kwargs = {'created_by': {'read_only': True}} # Ensure created_by is read-only

    def create(self, validated_data):
        """Create composition with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class ProductCompositionSerializer(serializers.ModelSerializer):
    """Serializer for product-composition relationships"""
    composition_name = serializers.CharField(source='composition.name', read_only=True)
    composition_details = CompositionSerializer(source='composition', read_only=True)
    
    class Meta:
        model = ProductComposition
        fields = [
            'id', 'composition', 'composition_name', 'composition_details',
            'strength', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'composition': {'read_only': True}} # Ensure composition is fetched with select_related

# ============================================================================
# ENHANCED PRODUCT SERIALIZERS
# ============================================================================

class EnhancedProductSerializer(serializers.ModelSerializer):
    """Enhanced product serializer with composition support"""
    generic_name = serializers.SlugRelatedField(
        queryset=GenericName.objects.all(), slug_field='name', write_only=False, required=False, allow_null=True
    )
    generic_name_id = serializers.PrimaryKeyRelatedField(
        queryset=GenericName.objects.all(), source='generic_name', write_only=True, required=False, allow_null=True
    )
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_prescription_required = serializers.SerializerMethodField()
    
    # Composition relationships - use the prefetched attribute
    compositions_detail = ProductCompositionSerializer(
        source='active_product_compositions',
        many=True,
        read_only=True
    )
    composition_summary = serializers.SerializerMethodField()
    composition_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, allow_empty=True
    )
    
    # Stock status
    total_stock_quantity = serializers.DecimalField(max_digits=20, decimal_places=10, source='total_stock', read_only=True) # Use annotated field
    stock_status = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()
    
    # Pricing
    current_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, source='current_selling_price_annotated', read_only=True) # Use annotated field

    # Batches
    batches = BatchSerializer(many=True, read_only=True)
    current_batch = serializers.SerializerMethodField()
    image = ImageField(required=False, allow_null=True) # Removed write_only=True
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_id',
            'manufacturer', 'medicine_type', 'prescription_type', 'is_prescription_required',
            'total_stock_quantity', 'min_stock_level', 'stock_status', 'is_low_stock',
            'current_selling_price',
            'description', 'uses', 'side_effects',
            'how_to_use', 'precautions', 'storage',
            'compositions_detail', 'composition_summary', 'composition_ids',
            'hsn_code', 'category', 'category_id', 'category_name',
            'is_active', 'is_featured',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'batches', # Add batches to the fields
            'current_batch', # Add current_batch to the fields
            'image' # Add image to the fields
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
        extra_kwargs = {
            'category': {'read_only': True},
            'created_by': {'read_only': True}
        }
    
    def get_composition_summary(self, obj):
        """Get a summary of all compositions using prefetched data"""
        return [
            f"{comp.composition.name} {comp.strength}"
            for comp in obj.active_product_compositions
        ]
    
    def get_stock_status(self, obj):
        """Get stock status based on total quantity from batches"""
        total_quantity = obj.total_stock # Use annotated field
        if total_quantity == 0:
            return 'out_of_stock'
        elif total_quantity <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'
    
    def get_is_low_stock(self, obj):
        """Check if product is low on stock based on total quantity from batches"""
        total_quantity = obj.total_stock # Use annotated field
        return total_quantity <= obj.min_stock_level
    
    def get_current_batch(self, obj):
        """
        Get the current batch details (MRP, selling price, discount) for the product,
        prioritizing in-stock batches with the soonest expiry date.
        """
        from django.utils import timezone
        
        current_batch = obj.batches.filter(
            quantity__gt=0, # In stock
            expiry_date__gte=timezone.now().date() # Not expired
        ).order_by('expiry_date').first()

        if current_batch:
            request = self.context.get('request')
            channel = request.query_params.get('channel', 'online') # Default to online if not specified

            # Serialize the current_batch using BatchSerializer
            return BatchSerializer(current_batch, context=self.context).data
        return None
    
    def get_is_prescription_required(self, obj):
        """Determine if a prescription is required based on prescription_type"""
        return obj.prescription_type in ['prescription', 'controlled']

    def validate_image(self, value):
        """
        Ensure that if an empty string or None is passed for the image,
        it's treated as None. This prevents "not a file" errors when no file is uploaded.
        """
        if value == '' or value is None:
            return None
        return value

    def create(self, validated_data):
        """Create product with current user as creator"""
        image_file = validated_data.pop('image', None)
        composition_ids_data = validated_data.pop('composition_ids', [])
        validated_data['created_by'] = self.context['request'].user
        product = super().create(validated_data)
        for comp_id in composition_ids_data:
            composition_instance = Composition.objects.get(id=comp_id)
            ProductComposition.objects.create(product=product, composition=composition_instance)
        if image_file:
            product.image.save(image_file.name, image_file, save=True)
        return product

    def update(self, instance, validated_data):
        image_file = validated_data.pop('image', None)
        composition_ids_data = validated_data.pop('composition_ids', [])

        # Update basic product fields
        instance = super().update(instance, validated_data)

        # Handle product compositions
        instance.product_compositions.all().delete()
        for comp_id in composition_ids_data:
            composition_instance = Composition.objects.get(id=comp_id)
            ProductComposition.objects.create(product=instance, composition=composition_instance)
        
        if image_file:
            instance.image.save(image_file.name, image_file, save=True)
        elif 'image' in validated_data and validated_data['image'] is None:
            instance.image.delete(save=True)
        
        return instance

class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products without annotated fields"""
    generic_name = serializers.SlugRelatedField(
        queryset=GenericName.objects.all(), slug_field='name', required=False, allow_null=True, write_only=False
    )
    generic_name_id = serializers.PrimaryKeyRelatedField(
        queryset=GenericName.objects.all(), source='generic_name', write_only=True, required=False, allow_null=True
    )
    category = serializers.SlugRelatedField(
        queryset=Category.objects.all(), slug_field='name', required=False, allow_null=True, write_only=False
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    image = ImageField(required=False, allow_null=True) # Removed write_only=True
    composition_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, allow_empty=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_id',
            'manufacturer', 'medicine_type', 'prescription_type',
            'min_stock_level',
            'description', 'uses', 'side_effects',
            'how_to_use', 'precautions', 'storage',
            'hsn_code', 'category', 'category_id',
            'is_active', 'is_featured',
            'created_by', 'image', 'composition_ids' # Changed from image_url to image
        ]
        read_only_fields = ['id', 'created_by']

    def validate_image(self, value):
        """
        Ensure that if an empty string or None is passed for the image,
        it's treated as None. This prevents "not a file" errors when no file is uploaded.
        """
        if value == '' or value is None:
            return None
        return value

    def create(self, validated_data):
        image_file = validated_data.pop('image', None) # Changed from image_url to image
        composition_ids_data = validated_data.pop('composition_ids', [])
        # Ensure 'compositions' (the ManyToMany field) is not in validated_data for super().create
        # as we handle ProductComposition creation manually.
        validated_data.pop('compositions', None) 
        
        validated_data['created_by'] = self.context['request'].user
        product = super().create(validated_data)

        for comp_id in composition_ids_data:
            composition_instance = Composition.objects.get(id=comp_id)
            ProductComposition.objects.create(product=product, composition=composition_instance)

        if image_file: # Handle image file directly
            product.image.save(image_file.name, image_file, save=True)

        return product

    def update(self, instance, validated_data):
        image_file = validated_data.pop('image', None) # Changed from image_url to image
        composition_ids_data = validated_data.pop('composition_ids', [])
        # Ensure 'compositions' (the ManyToMany field) is not in validated_data for super().update
        # as we handle ProductComposition creation manually.
        validated_data.pop('compositions', None)

        product = super().update(instance, validated_data)

        # Handle product compositions
        instance.product_compositions.all().delete()
        for comp_id in composition_ids_data:
            composition_instance = Composition.objects.get(id=comp_id)
            ProductComposition.objects.create(product=instance, composition=composition_instance)

        if image_file: # Handle image file directly
            product.image.save(image_file.name, image_file, save=True)
        elif 'image' in validated_data and validated_data['image'] is None: # Check if image was explicitly set to None
            # If image is explicitly set to None, clear it
            product.image.delete(save=True)
        # If 'image' is not in validated_data, it means the frontend did not send a new image
        # and intends to keep the existing one, so do nothing.

        return product

class ProductCompositionItemSerializer(serializers.Serializer):
    """Serializer for individual composition items within ProductCompositionCreateSerializer"""
    composition_id = serializers.UUIDField()
    strength = serializers.CharField(max_length=100)
    unit = serializers.CharField(max_length=50, required=False, default='mg')

class ProductCompositionCreateSerializer(serializers.Serializer):
    """Serializer for adding compositions to products"""
    product_id = serializers.UUIDField()
    compositions = serializers.ListField(
        child=ProductCompositionItemSerializer()
    )

# ============================================================================
# SEARCH AND FILTER SERIALIZERS
# ============================================================================

class ProductSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search results"""
    generic_name_display = serializers.CharField(source='generic_name.name', read_only=True)
    composition_summary = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    is_prescription_required = serializers.SerializerMethodField()
    total_stock_quantity = serializers.DecimalField(max_digits=20, decimal_places=10, source='total_stock', read_only=True) # Use annotated field
    current_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, source='current_selling_price_annotated', read_only=True) # Use annotated field
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name_display',
            'manufacturer', 'medicine_type', 'prescription_type', 'is_prescription_required',
            'total_stock_quantity', 'stock_status',
            'current_selling_price',
            'composition_summary', 'is_active'
        ]
        extra_kwargs = {
            'generic_name': {'read_only': True},
        }
    
    def get_composition_summary(self, obj):
        """Get simplified composition summary using prefetched data"""
        return [comp.composition.name for comp in obj.active_product_compositions[:3]]
    
    def get_stock_status(self, obj):
        """Get stock status based on total quantity from batches"""
        total_quantity = obj.total_stock # Use annotated field
        if total_quantity == 0:
            return 'out_of_stock'
        elif total_quantity <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'

    def get_is_prescription_required(self, obj):
        """Determine if a prescription is required based on prescription_type"""
        return obj.prescription_type in ['prescription', 'controlled']

class CompositionSearchSerializer(serializers.ModelSerializer):
    """Serializer for composition search"""
    products_count = serializers.IntegerField(read_only=True) # Use annotated field
    
    class Meta:
        model = Composition
        fields = ['id', 'name', 'scientific_name', 'category', 'products_count', 'is_active']

# ============================================================================
# LEGACY COMPATIBILITY SERIALIZERS
# ============================================================================

class ProductSerializer(EnhancedProductSerializer):
    """Legacy product serializer for backward compatibility"""
    pass

class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    products_count = serializers.IntegerField(read_only=True) # Use annotated field
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'parent_category', 'products_count', 'created_at', 'updated_at']
    
    # Removed get_products_count as it should be annotated in the queryset

class GenericNameSerializer(serializers.ModelSerializer):
    """Generic name serializer"""
    products_count = serializers.IntegerField(read_only=True) # Use annotated field
    
    class Meta:
        model = GenericName
        fields = ['id', 'name', 'description', 'products_count']
    
    # Removed get_products_count as it should be annotated in the queryset
