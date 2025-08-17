# Enhanced Serializers for Intelligent Pharmacy Management System
# Comprehensive API serializers with composition handling and role-based permissions

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Composition, Product, ProductComposition, Category, GenericName,
    Batch, Inventory, ProductReview, ProductImage, Wishlist, ProductTag
)

User = get_user_model()

# ============================================================================
# COMPOSITION MANAGEMENT SERIALIZERS
# ============================================================================

class CompositionSerializer(serializers.ModelSerializer):
    """Serializer for medicine compositions with full CRUD support"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    products_count = serializers.SerializerMethodField()

    
    class Meta:
        model = Composition
        fields = [
            'id', 'name', 'scientific_name', 'description', 'category',
            'side_effects', 'contraindications', 'is_active',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'products_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_products_count(self, obj):
        """Get count of products using this composition"""
        return obj.products.filter(is_active=True).count()
    
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
            'strength', 'unit', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

# ============================================================================
# ENHANCED PRODUCT SERIALIZERS
# ============================================================================

class EnhancedProductSerializer(serializers.ModelSerializer):
    """Enhanced product serializer with composition support"""
    generic_name_display = serializers.CharField(source='generic_name.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Composition relationships
    compositions_detail = ProductCompositionSerializer(
        source='productcomposition_set', 
        many=True, 
        read_only=True
    )
    composition_summary = serializers.SerializerMethodField()
    
    # Stock status
    stock_status = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()
    
    # Pricing
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_display',
            'manufacturer', 'medicine_type', 'prescription_type',
            'strength', 'form', 'is_prescription_required',  # Legacy fields
            'price', 'mrp', 'discount_percentage',
            'stock_quantity', 'min_stock_level', 'stock_status', 'is_low_stock',
            'dosage_form', 'pack_size', 'packaging_unit',
            'description', 'composition', 'uses', 'side_effects',
            'how_to_use', 'precautions', 'storage',
            'compositions_detail', 'composition_summary',
            'image_url', 'hsn_code', 'category', 'category_name',
            'is_active', 'is_featured',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_composition_summary(self, obj):
        """Get a summary of all compositions"""
        compositions = obj.product_compositions.filter(is_active=True)
        return [
            f"{comp.composition.name} {comp.strength}{comp.unit}"
            for comp in compositions
        ]
    
    def get_stock_status(self, obj):
        """Get stock status"""
        if obj.stock_quantity == 0:
            return 'out_of_stock'
        elif obj.stock_quantity <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'
    
    def get_is_low_stock(self, obj):
        """Check if product is low on stock"""
        return obj.stock_quantity <= obj.min_stock_level
    
    def get_discount_percentage(self, obj):
        """Calculate discount percentage"""
        if obj.mrp > obj.price:
            return round(((obj.mrp - obj.price) / obj.mrp) * 100, 2)
        return 0
    
    def create(self, validated_data):
        """Create product with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class ProductCompositionCreateSerializer(serializers.Serializer):
    """Serializer for adding compositions to products"""
    product_id = serializers.UUIDField()
    compositions = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_compositions(self, value):
        """Validate composition data"""
        for comp_data in value:
            required_fields = ['composition_id', 'strength', 'unit']
            for field in required_fields:
                if field not in comp_data:
                    raise serializers.ValidationError(f"Missing required field: {field}")
        return value

# ============================================================================
# SEARCH AND FILTER SERIALIZERS
# ============================================================================

class ProductSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search results"""
    generic_name_display = serializers.CharField(source='generic_name.name', read_only=True)
    composition_summary = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name_display',
            'manufacturer', 'medicine_type', 'prescription_type',
            'price', 'mrp', 'stock_quantity', 'stock_status',
            'dosage_form', 'composition_summary', 'image_url', 'is_active'
        ]
    
    def get_composition_summary(self, obj):
        """Get simplified composition summary"""
        compositions = obj.product_compositions.filter(is_active=True)[:3]
        return [comp.composition.name for comp in compositions]
    
    def get_stock_status(self, obj):
        """Get stock status"""
        if obj.stock_quantity == 0:
            return 'out_of_stock'
        elif obj.stock_quantity <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'

class CompositionSearchSerializer(serializers.ModelSerializer):
    """Serializer for composition search"""
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Composition
        fields = ['id', 'name', 'scientific_name', 'category', 'products_count', 'is_active']
    
    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()

# ============================================================================
# LEGACY COMPATIBILITY SERIALIZERS
# ============================================================================

class ProductSerializer(EnhancedProductSerializer):
    """Legacy product serializer for backward compatibility"""
    pass

class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'parent_category', 'products_count', 'created_at', 'updated_at']
    
    def get_products_count(self, obj):
        return obj.product_set.filter(is_active=True).count()

class GenericNameSerializer(serializers.ModelSerializer):
    """Generic name serializer"""
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GenericName
        fields = ['id', 'name', 'description', 'products_count']
    
    def get_products_count(self, obj):
        return obj.product_set.filter(is_active=True).count()

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
            'cost_price', 'selling_price', 'mfg_license_number',
            'days_to_expiry', 'is_expired', 'created_at', 'updated_at'
        ]
    
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

class InventorySerializer(serializers.ModelSerializer):
    """Inventory serializer"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'quantity_on_hand',
            'reorder_point', 'last_restock_date'
        ]
