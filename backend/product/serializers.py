from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Q
from django.utils import timezone
from datetime import date, timedelta

from .models import (
    Category, Product, Batch, Inventory, GenericName,
    ProductReview, ProductImage, Wishlist, ProductTag,
    ProductTagAssignment, ProductViewHistory, Composition, Discount,
    ProductUnit, ProductComposition # Import ProductUnit and ProductComposition
)
from .utils import calculate_current_selling_price, calculate_current_cost_price, calculate_effective_discount_percentage

User = get_user_model()


# ----------------------------
# ProductUnit Serializer
# ----------------------------
class ProductUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductUnit
        fields = '__all__'


# ----------------------------
# ProductComposition Serializer
# ----------------------------
class ProductCompositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductComposition
        fields = ['id', 'composition', 'strength', 'strength_unit', 'percentage', 'is_primary', 'is_active', 'notes']
        extra_kwargs = {
            'composition': {'required': False}, # Allow composition to be set by ID
        }


# ----------------------------
# Discount Serializer
# ----------------------------
class DiscountSerializer(serializers.ModelSerializer):
    # Fields for reading (displaying target name)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    # Fields for writing (from frontend)
    target_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    target_type = serializers.CharField(write_only=True, required=False) # Will be 'product' or 'category'

    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'percentage', 'description', 'target_type', 'target_id',
            'product', 'category', # Keep these for internal model mapping
            'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at', 'created_by', 'created_by_username',
            'product_name', 'category_name' # For read-only display
        ]
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'product_name', 'category_name')
        extra_kwargs = {
            'product': {'required': False, 'allow_null': True},
            'category': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        # Custom validation to ensure target_type and target_id are consistent
        target_type = data.get('target_type')
        target_id = data.get('target_id')
        product = data.get('product')
        category = data.get('category')

        if target_type == 'product':
            if not target_id and not product:
                raise serializers.ValidationError({'target_id': 'Product ID is required for product-wise discounts.'})
            if target_id and product and target_id != product.id:
                raise serializers.ValidationError({'target_id': 'Product ID in target_id does not match product field.'})
            if category:
                raise serializers.ValidationError({'category': 'Cannot specify category for product-wise discounts.'})
        elif target_type == 'category':
            if not target_id and not category:
                raise serializers.ValidationError({'target_id': 'Category ID is required for category-wise discounts.'})
            if target_id and category and target_id != category.id:
                raise serializers.ValidationError({'target_id': 'Category ID in target_id does not match category field.'})
            if product:
                raise serializers.ValidationError({'product': 'Cannot specify product for category-wise discounts.'})
        else:
            # If target_type is not provided or invalid, ensure neither product nor category is set
            if product or category:
                raise serializers.ValidationError({'target_type': 'Target type must be specified if product or category is set.'})

        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        target_id = validated_data.pop('target_id', None)
        target_type = validated_data.pop('target_type', None)

        if target_type == 'product' and target_id:
            validated_data['product'] = Product.objects.get(id=target_id)
            validated_data['category'] = None # Ensure category is null
        elif target_type == 'category' and target_id:
            validated_data['category'] = Category.objects.get(id=target_id)
            validated_data['product'] = None # Ensure product is null
        else:
            validated_data['product'] = None
            validated_data['category'] = None

        return super().create(validated_data)

    def update(self, instance, validated_data):
        target_id = validated_data.pop('target_id', None)
        target_type = validated_data.pop('target_type', None)

        if target_type == 'product':
            if target_id:
                instance.product = Product.objects.get(id=target_id)
            else:
                instance.product = None
            instance.category = None
        elif target_type == 'category':
            if target_id:
                instance.category = Category.objects.get(id=target_id)
            else:
                instance.category = None
            instance.product = None
        else:
            instance.product = None
            instance.category = None

        return super().update(instance, validated_data)


# ----------------------------
# Category Serializer
# ----------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


# ----------------------------
# Generic Name Serializer
# ----------------------------
class GenericNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenericName
        fields = '__all__'

# ----------------------------
# Bulk Category Serializer
# ----------------------------
class BulkCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name', 'description', 'parent_category']
        extra_kwargs = {'parent_category': {'required': False, 'allow_null': True}}

# ----------------------------
# Bulk Generic Name Serializer
# ----------------------------
class BulkGenericNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenericName
        fields = ['name', 'description']


# ----------------------------
# Simple Batch Serializer for Debugging
# ----------------------------
class SimpleBatchSerializer(serializers.ModelSerializer):
    mrp_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = ['id', 'mrp_price', 'discount_percentage', 'selling_price']

    def get_mrp_price(self, obj):
        return obj.mrp_price if obj.mrp_price is not None else 0

    def get_discount_percentage(self, obj):
        return obj.discount_percentage if obj.discount_percentage is not None else 0


# ----------------------------
# Batch Serializer (Full details)
# ----------------------------
class BatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    expiry_status = serializers.SerializerMethodField()
    days_to_expiry = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    online_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    online_discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    offline_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    offline_discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    # Add fields for product unit information
    product_unit = ProductUnitSerializer(read_only=True)
    product_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(), source='product_unit', write_only=True, allow_null=True, required=False
    )
    selected_unit_name = serializers.CharField(read_only=True)
    selected_unit_abbreviation = serializers.CharField(read_only=True)

    class Meta:
        model = Batch
        fields = [
            'id', 'product', 'product_name', 'batch_number',
            'manufacturing_date', 'expiry_date', 'quantity',
            'current_quantity', 'cost_price', 
            'mrp_price', 'discount_percentage', 'selling_price', # Generic
            'online_mrp_price', 'online_discount_percentage', 'online_selling_price', # Online
            'offline_mrp_price', 'offline_discount_percentage', 'offline_selling_price', # Offline
            'mfg_license_number', 'created_at',
            'updated_at', 'days_to_expiry', 'is_expired', 'expiry_status',
            'product_unit', 'product_unit_id', 'selected_unit_name', 'selected_unit_abbreviation' # Add new fields
        ]
        extra_kwargs = {
            'current_quantity': {'required': False},
            'selling_price': {'read_only': True},
            'online_selling_price': {'read_only': True},
            'offline_selling_price': {'read_only': True},
        }

    def get_days_to_expiry(self, obj):
        today = date.today()
        return (obj.expiry_date - today).days

    def get_is_expired(self, obj):
        today = date.today()
        return obj.expiry_date < today

    def get_expiry_status(self, obj):
        today = date.today()
        if obj.expiry_date < today:
            return 'Expired'
        elif obj.expiry_date <= today + timedelta(days=30):
            return 'Expiring Soon'
        elif obj.expiry_date <= today + timedelta(days=90):
            return 'Expires in 3 months'
        else:
            return 'Good'

    def create(self, validated_data):
        product_unit = validated_data.pop('product_unit', None)
        # Assuming 'quantity' in validated_data from frontend is the display quantity
        display_quantity = validated_data.get('quantity', 0)

        if product_unit:
            validated_data['quantity'] = display_quantity * product_unit.conversion_factor
            validated_data['current_quantity'] = validated_data['quantity'] # Set current_quantity to base unit quantity
            validated_data['selected_unit_name'] = product_unit.unit_name
            validated_data['selected_unit_abbreviation'] = product_unit.unit_abbreviation
        else:
            # If no product_unit is provided, assume quantity is already in base units
            validated_data['quantity'] = display_quantity
            validated_data['current_quantity'] = display_quantity
            validated_data['selected_unit_name'] = 'Base Unit' # Default
            validated_data['selected_unit_abbreviation'] = 'BU' # Default

        return super().create(validated_data)

    def update(self, instance, validated_data):
        product_unit = validated_data.pop('product_unit', None)
        display_quantity = validated_data.get('quantity', None) # Get display quantity if provided

        if display_quantity is not None:
            if product_unit:
                instance.quantity = display_quantity * product_unit.conversion_factor
                instance.current_quantity = instance.quantity # Update current_quantity to base unit quantity
                instance.selected_unit_name = product_unit.unit_name
                instance.selected_unit_abbreviation = product_unit.unit_abbreviation
            else:
                instance.quantity = display_quantity
                instance.current_quantity = display_quantity
                instance.selected_unit_name = 'Base Unit'
                instance.selected_unit_abbreviation = 'BU'
            validated_data['quantity'] = instance.quantity # Ensure validated_data reflects base unit quantity

        return super().update(instance, validated_data)


# ----------------------------
# Current Batch Detail Serializer (for explicit pricing fields)
# ----------------------------
class CurrentBatchDetailSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    batch_number = serializers.CharField(read_only=True)
    expiry_date = serializers.DateField(read_only=True)
    quantity = serializers.IntegerField(read_only=True)
    current_quantity = serializers.IntegerField(read_only=True)

    online_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    online_discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    online_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    offline_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    offline_discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    offline_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Batch
        fields = [
            'id', 'batch_number', 'expiry_date', 'quantity', 'current_quantity',
            'online_mrp_price', 'online_discount_percentage', 'online_selling_price',
            'offline_mrp_price', 'offline_discount_percentage', 'offline_selling_price',
            'mrp_price', 'discount_percentage', 'selling_price',
        ]


# ----------------------------
# Product Serializer
# ----------------------------
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    generic_name = GenericNameSerializer(read_only=True)
    generic_name_id = serializers.PrimaryKeyRelatedField(
        queryset=GenericName.objects.all(), source='generic_name', write_only=True
    )
    stock_status = serializers.SerializerMethodField()
    stock_quantity = serializers.SerializerMethodField()
    total_batches = serializers.SerializerMethodField()
    batches = BatchSerializer(many=True, read_only=True)
    current_selling_price = serializers.SerializerMethodField()
    current_cost_price = serializers.SerializerMethodField()
    current_batch = serializers.SerializerMethodField()
    offline_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    offline_discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    offline_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    online_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    online_discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    online_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    product_unit = ProductUnitSerializer(read_only=True)
    product_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(), source='product_unit', write_only=True, allow_null=True, required=False
    )
    compositions = ProductCompositionSerializer(many=True, read_only=True) # Use nested serializer for compositions
    composition_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Composition.objects.all(), write_only=True, source='compositions', required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_id', 'manufacturer',
            'medicine_type', 'prescription_type',
            'min_stock_level',
            'description', 'uses',
            'side_effects', 'how_to_use', 'precautions', 'storage', 'compositions', 'composition_ids',
            'image', 'hsn_code', 'category', 'category_id', 'is_active',
            'is_featured', 'created_at', 'updated_at', 'created_by',
            'batches', 'current_selling_price', 'current_cost_price',
            'stock_quantity', 'stock_status', 'total_batches',
            'current_batch', # Include current_batch in fields
            'offline_mrp_price', 'offline_discount_percentage', 'offline_selling_price',
            'online_mrp_price', 'online_discount_percentage', 'online_selling_price',
            'product_unit', 'product_unit_id'
        ]
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }

    def get_current_selling_price(self, obj):
        request = self.context.get('request')
        channel = 'online'
        if request:
            channel = request.query_params.get('channel', 'online')
        return calculate_current_selling_price(obj, channel)

    def get_current_cost_price(self, obj):
        return calculate_current_cost_price(obj)

    def get_stock_quantity(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]
        return sum(batch.current_quantity for batch in active_batches)

    def get_stock_status(self, obj):
        total_stock = self.get_stock_quantity(obj)
        if total_stock == 0:
            return 'Out of Stock'
        elif total_stock <= obj.min_stock_level:
            return 'Low Stock'
        else:
            return 'In Stock'

    def get_total_batches(self, obj):
        return obj.batches.count()

    def create(self, validated_data):
        composition_ids = validated_data.pop('compositions', []) # 'compositions' is the source for composition_ids
        product = super().create(validated_data)
        for comp_id in composition_ids:
            ProductComposition.objects.create(product=product, composition=comp_id)
        return product

    def update(self, instance, validated_data):
        composition_ids = validated_data.pop('compositions', []) # 'compositions' is the source for composition_ids

        # Update basic product fields
        instance = super().update(instance, validated_data)

        # Handle product compositions
        # Clear existing compositions
        instance.product_compositions.all().delete()
        # Add new compositions
        for comp_id in composition_ids:
            ProductComposition.objects.create(product=instance, composition=comp_id)
        
        return instance

    def get_current_batch(self, obj):
        """
        Selects the current batch based on expiry date and quantity,
        prioritizing primary batch, and serializes it.
        """
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        selected_batch = obj.get_default_batch()
        if selected_batch:
            # Debug print to inspect the batch object before serialization
            print(f"DEBUG: ProductSerializer.get_current_batch - Selected Batch ID: {selected_batch.id}")
            print(f"DEBUG: ProductSerializer.get_current_batch - Offline MRP: {selected_batch.offline_mrp_price}")
            print(f"DEBUG: ProductSerializer.get_current_batch - Offline Selling: {selected_batch.offline_selling_price}")
            print(f"DEBUG: ProductSerializer.get_current_batch - Online MRP: {selected_batch.online_mrp_price}")
            print(f"DEBUG: ProductSerializer.get_current_batch - Online Selling: {selected_batch.online_selling_price}")
            return CurrentBatchDetailSerializer(selected_batch, context=self.context).data
        return None


# ----------------------------
# Enhanced Product Serializer
# ----------------------------
class EnhancedProductSerializer(serializers.ModelSerializer):
    batches = SimpleBatchSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    is_in_wishlist = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()
    current_selling_price = serializers.SerializerMethodField()
    current_cost_price = serializers.SerializerMethodField()
    stock_quantity = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    current_batch = serializers.SerializerMethodField()
    offline_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    offline_discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    offline_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    online_mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    online_discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    online_selling_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    product_unit = ProductUnitSerializer(read_only=True)
    product_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(), source='product_unit', write_only=True, allow_null=True, required=False
    )
    compositions = ProductCompositionSerializer(many=True, read_only=True) # Use nested serializer for compositions
    composition_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Composition.objects.all(), write_only=True, source='compositions', required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_id', 'manufacturer',
            'medicine_type', 'prescription_type',
            'min_stock_level',
            'description', 'uses',
            'side_effects', 'how_to_use', 'precautions', 'storage', 'compositions', 'composition_ids',
            'image', 'hsn_code', 'category', 'category_id', 'is_active',
            'is_featured', 'created_at', 'updated_at', 'created_by',
            'batches', 'images', 'reviews', 'tags', 'average_rating',
            'total_reviews', 'discount_percentage', 'is_in_wishlist',
            'related_products', 'current_selling_price', 'current_cost_price',
            'stock_quantity', 'stock_status',
            'current_batch', # Include current_batch in fields
            'offline_mrp_price', 'offline_discount_percentage', 'offline_selling_price',
            'online_mrp_price', 'online_discount_percentage', 'online_selling_price',
            'product_unit', 'product_unit_id'
        ]
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }

    def get_discount_percentage(self, obj):
        return calculate_effective_discount_percentage(obj)

    def create(self, validated_data):
        composition_ids = validated_data.pop('compositions', [])
        product = super().create(validated_data)
        for comp_id in composition_ids:
            ProductComposition.objects.create(product=product, composition=comp_id)
        return product

    def update(self, instance, validated_data):
        composition_ids = validated_data.pop('compositions', [])

        # Update basic product fields
        instance = super().update(instance, validated_data)

        # Handle product compositions
        # Clear existing compositions
        instance.product_compositions.all().delete()
        # Add new compositions
        for comp_id in composition_ids:
            ProductComposition.objects.create(product=instance, composition=comp_id)
        
        return instance

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_tags(self, obj):
        tag_assignments = obj.tags.select_related('tag').all()
        return [{'name': ta.tag.name, 'color': ta.tag.color} for ta in tag_assignments]

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, product=obj).exists()
        return False

    def get_related_products(self, obj):
        related = Product.objects.filter(category=obj.category).exclude(id=obj.id)[:4]
        return ProductSerializer(related, many=True, context=self.context).data

    def get_current_selling_price(self, obj):
        request = self.context.get('request')
        channel = 'online'
        if request:
            channel = request.query_params.get('channel', 'online')
        return calculate_current_selling_price(obj, channel)

    def get_current_cost_price(self, obj):
        return calculate_current_cost_price(obj)

    def get_stock_quantity(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]
        return sum(batch.current_quantity for batch in active_batches)

    def get_stock_status(self, obj):
        total_stock = self.get_stock_quantity(obj)
        if total_stock == 0:
            return 'out_of_stock'
        elif total_stock <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'

    def get_current_batch(self, obj):
        """
        Selects the current batch based on expiry date and quantity,
        prioritizing primary batch, and serializes it.
        """
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        selected_batch = obj.get_default_batch()
        if selected_batch:
            # Debug print to inspect the batch object before serialization
            print(f"DEBUG: EnhancedProductSerializer.get_current_batch - Selected Batch ID: {selected_batch.id}")
            print(f"DEBUG: EnhancedProductSerializer.get_current_batch - Offline MRP: {selected_batch.offline_mrp_price}")
            print(f"DEBUG: EnhancedProductSerializer.get_current_batch - Offline Selling: {selected_batch.offline_selling_price}")
            print(f"DEBUG: EnhancedProductSerializer.get_current_batch - Online MRP: {selected_batch.online_mrp_price}")
            print(f"DEBUG: EnhancedProductSerializer.get_current_batch - Online Selling: {selected_batch.online_selling_price}")
            return CurrentBatchDetailSerializer(selected_batch, context=self.context).data
        return None

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'


class ProductTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTag
        fields = '__all__'


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.CharField(source='user.profile.avatar', read_only=True)

    class Meta:
        model = ProductReview
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at', 'helpful_count')

class FileSerializer(serializers.Serializer):
    file = serializers.FileField()

class BulkProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    generic_name_str = serializers.CharField(write_only=True, required=False, allow_blank=True)
    generic_name_id = serializers.PrimaryKeyRelatedField(
        queryset=GenericName.objects.all(), source='generic_name', write_only=True, required=False, allow_null=True
    )
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    product_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnit.objects.all(), source='product_unit', write_only=True, allow_null=True, required=False
    )
    composition_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Composition.objects.all(), write_only=True, source='compositions', required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'manufacturer', 'medicine_type',
            'prescription_type',
            'min_stock_level',
            'description', 'uses', 'side_effects', 'how_to_use',
            'precautions', 'storage', 'image', 'hsn_code',
            'is_active', 'is_featured', 'category_name', 'category_id', 'generic_name_str', 'generic_name_id', 'created_by',
            'product_unit_id', 'composition_ids'
        ]
        extra_kwargs = {
            'generic_name': {'required': False},
            'category': {'required': False},
            'product_unit': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        category_name = validated_data.pop('category_name', None)
        category_id = validated_data.pop('category_id', None)
        generic_name_str = validated_data.pop('generic_name_str', None)
        generic_name_id = validated_data.pop('generic_name_id', None)
        product_unit_id = validated_data.pop('product_unit_id', None)
        composition_ids = validated_data.pop('compositions', [])
        
        if category_id:
            validated_data['category'] = category_id
        elif category_name:
            category, created = Category.objects.get_or_create(name=category_name)
            validated_data['category'] = category
        
        if generic_name_id:
            validated_data['generic_name'] = generic_name_id
        elif generic_name_str:
            generic_name, created = GenericName.objects.get_or_create(name=generic_name_str)
            validated_data['generic_name'] = generic_name

        if product_unit_id:
            validated_data['product_unit'] = product_unit_id
        
        product = super().create(validated_data)

        for comp_id in composition_ids:
            ProductComposition.objects.create(product=product, composition=comp_id)

        return product

    def update(self, instance, validated_data):
        category_name = validated_data.pop('category_name', None)
        category_id = validated_data.pop('category_id', None)
        generic_name_str = validated_data.pop('generic_name_str', None)
        generic_name_id = validated_data.pop('generic_name_id', None)
        product_unit_id = validated_data.pop('product_unit_id', None)
        composition_ids = validated_data.pop('compositions', [])

        if category_id:
            validated_data['category'] = category_id
        elif category_name:
            category, created = Category.objects.get_or_create(name=category_name)
            validated_data['category'] = category
        
        if generic_name_id:
            validated_data['generic_name'] = generic_name_id
        elif generic_name_str:
            generic_name, created = GenericName.objects.get_or_create(name=generic_name_str)
            validated_data['generic_name'] = generic_name

        if product_unit_id:
            validated_data['product_unit'] = product_unit_id

        product = super().update(instance, validated_data)

        # Handle product compositions
        instance.product_compositions.all().delete()
        for comp_id in composition_ids:
            ProductComposition.objects.create(product=instance, composition=comp_id)

        return product


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Wishlist
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ProductSearchSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    current_selling_price = serializers.SerializerMethodField()
    current_cost_price = serializers.SerializerMethodField()
    is_prescription_required = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'manufacturer',
            'category_name', 'average_rating', 'total_reviews',
            'discount_percentage', 'primary_image',
            'batches',
            'current_selling_price',
            'current_cost_price',
            'is_prescription_required'
        ]

    def get_current_selling_price(self, obj):
        request = self.context.get('request')
        channel = 'online'
        if request:
            channel = request.query_params.get('channel', 'online')
        return calculate_current_selling_price(obj, channel)

    def get_current_cost_price(self, obj):
        return calculate_current_cost_price(obj)

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_discount_percentage(self, obj):
        return calculate_effective_discount_percentage(obj)

    def get_primary_image(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            return obj.image.url
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image_url
        elif obj.images.exists():
            return obj.images.first().image_url
        return None

    def get_is_prescription_required(self, obj):
        return obj.prescription_type in ['prescription', 'controlled']
