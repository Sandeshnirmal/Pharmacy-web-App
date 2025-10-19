from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Q
from django.utils import timezone
from datetime import date, timedelta

from .models import (
    Category, Product, Batch, Inventory, GenericName,
    ProductReview, ProductImage, Wishlist, ProductTag,
    ProductTagAssignment, ProductViewHistory, Composition, Discount
)

User = get_user_model()


# ----------------------------
# Discount Serializer
# ----------------------------
class DiscountSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Discount
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def validate(self, data):
        target_type = data.get('target_type')
        product = data.get('product')
        category = data.get('category')

        if target_type == 'product' and not product:
            raise serializers.ValidationError({'product': 'Product must be specified for product-wise discounts.'})
        if target_type == 'category' and not category:
            raise serializers.ValidationError({'category': 'Category must be specified for category-wise discounts.'})
        if target_type == 'product' and category:
            raise serializers.ValidationError({'category': 'Cannot specify category for product-wise discounts.'})
        if target_type == 'category' and product:
            raise serializers.ValidationError({'product': 'Cannot specify product for category-wise discounts.'})
        
        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


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
# Batch Serializer
# ----------------------------
class BatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    expiry_status = serializers.SerializerMethodField()
    days_to_expiry = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    discount_percentage = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

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
            'updated_at', 'days_to_expiry', 'is_expired', 'expiry_status'
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
        if 'current_quantity' not in validated_data:
            validated_data['current_quantity'] = validated_data.get('quantity', 0)
        return super().create(validated_data)


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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_id', 'manufacturer',
            'medicine_type', 'prescription_type', 'strength', 'form',
            'is_prescription_required', 'min_stock_level', 'dosage_form',
            'pack_size', 'packaging_unit', 'description', 'composition', 'uses',
            'side_effects', 'how_to_use', 'precautions', 'storage', 'compositions',
            'image_url', 'hsn_code', 'category', 'category_id', 'is_active',
            'is_featured', 'created_at', 'updated_at', 'created_by',
            'batches', 'current_selling_price', 'current_cost_price',
            'stock_quantity', 'stock_status', 'total_batches'
        ]

    def get_current_selling_price(self, obj):
        request = self.context.get('request')
        channel = request.query_params.get('channel', 'online') # Default to online if not specified

        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        if not active_batches:
            return 0

        active_batches.sort(key=lambda b: b.expiry_date)

        primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
        
        if channel == 'online':
            base_mrp = primary_batch.online_mrp_price if primary_batch else active_batches[0].online_mrp_price
            batch_discount_percentage = primary_batch.online_discount_percentage if primary_batch else active_batches[0].online_discount_percentage
        elif channel == 'offline':
            base_mrp = primary_batch.offline_mrp_price if primary_batch else active_batches[0].offline_mrp_price
            batch_discount_percentage = primary_batch.offline_discount_percentage if primary_batch else active_batches[0].offline_discount_percentage
        else: # Default or generic
            base_mrp = primary_batch.mrp_price if primary_batch else active_batches[0].mrp_price
            batch_discount_percentage = primary_batch.discount_percentage if primary_batch else active_batches[0].discount_percentage


        # Find the highest applicable discount from the Discount model
        today = timezone.now().date()
        product_discounts = obj.discounts.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='product'
        )
        category_discounts = Discount.objects.filter(
            Q(category=obj.category) | Q(category__parent_category=obj.category), # Consider parent categories too
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='category'
        )

        max_discount_from_master = 0
        if product_discounts.exists():
            max_discount_from_master = max(d.percentage for d in product_discounts)
        if category_discounts.exists():
            max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

        # Compare batch-specific discount with master discounts and take the highest
        final_discount_percentage = max(batch_discount_percentage, max_discount_from_master)

        # Calculate final selling price
        if base_mrp is not None:
            discount_amount = base_mrp * (final_discount_percentage / 100)
            return base_mrp - discount_amount
        return 0
    def get_current_cost_price(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        active_batches.sort(key=lambda b: b.expiry_date)

        primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
        if primary_batch:
            return primary_batch.cost_price

        if active_batches:
            return active_batches[0].cost_price
        return 0

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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'generic_name_id', 'manufacturer',
            'medicine_type', 'prescription_type', 'strength', 'form',
            'is_prescription_required', 'min_stock_level', 'dosage_form',
            'pack_size', 'packaging_unit', 'description', 'composition', 'uses',
            'side_effects', 'how_to_use', 'precautions', 'storage',
            'image_url', 'hsn_code', 'category', 'category_id', 'is_active',
            'is_featured', 'created_at', 'updated_at', 'created_by',
            'batches', 'images', 'reviews', 'tags', 'average_rating',
            'total_reviews', 'discount_percentage', 'is_in_wishlist',
            'related_products', 'current_selling_price', 'current_cost_price',
            'stock_quantity', 'stock_status'
        ]

    def get_discount_percentage(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today()]

        batch_max_discount = 0
        if active_batches:
            batch_max_discount = float(max(batch.discount_percentage for batch in active_batches))

        # Find the highest applicable discount from the Discount model
        today = timezone.now().date()
        product_discounts = obj.discounts.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='product'
        )
        category_discounts = Discount.objects.filter(
            Q(category=obj.category) | Q(category__parent_category=obj.category),
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='category'
        )

        max_discount_from_master = 0
        if product_discounts.exists():
            max_discount_from_master = max(d.percentage for d in product_discounts)
        if category_discounts.exists():
            max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

        return max(batch_max_discount, max_discount_from_master)

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
        channel = request.query_params.get('channel', 'online') # Default to online if not specified

        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        if not active_batches:
            return 0

        active_batches.sort(key=lambda b: b.expiry_date)

        primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
        
        if channel == 'online':
            base_mrp = primary_batch.online_mrp_price if primary_batch else active_batches[0].online_mrp_price
            batch_discount_percentage = primary_batch.online_discount_percentage if primary_batch else active_batches[0].online_discount_percentage
        elif channel == 'offline':
            base_mrp = primary_batch.offline_mrp_price if primary_batch else active_batches[0].offline_mrp_price
            batch_discount_percentage = primary_batch.offline_discount_percentage if primary_batch else active_batches[0].offline_discount_percentage
        else: # Default or generic
            base_mrp = primary_batch.mrp_price if primary_batch else active_batches[0].mrp_price
            batch_discount_percentage = primary_batch.discount_percentage if primary_batch else active_batches[0].discount_percentage

        # Find the highest applicable discount from the Discount model
        today = timezone.now().date()
        product_discounts = obj.discounts.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='product'
        )
        category_discounts = Discount.objects.filter(
            Q(category=obj.category) | Q(category__parent_category=obj.category),
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='category'
        )

        max_discount_from_master = 0
        if product_discounts.exists():
            max_discount_from_master = max(d.percentage for d in product_discounts)
        if category_discounts.exists():
            max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

        # Compare batch-specific discount with master discounts and take the highest
        final_discount_percentage = max(batch_discount_percentage, max_discount_from_master)

        # Calculate final selling price
        if base_mrp is not None:
            discount_amount = base_mrp * (final_discount_percentage / 100)
            return base_mrp - discount_amount
        return 0

    def get_current_cost_price(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        active_batches.sort(key=lambda b: b.expiry_date)

        primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
        if primary_batch:
            return primary_batch.cost_price

        if active_batches:
            return active_batches[0].cost_price
        return 0

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
    generic_name_str = serializers.CharField(write_only=True, required=False, allow_blank=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'manufacturer', 'medicine_type',
            'prescription_type', 'strength', 'form', 'is_prescription_required',
            'min_stock_level', 'dosage_form', 'pack_size', 'packaging_unit',
            'description', 'composition', 'uses', 'side_effects', 'how_to_use',
            'precautions', 'storage', 'image_url', 'hsn_code',
            'is_active', 'is_featured', 'category_name', 'generic_name_str', 'created_by'
        ]
        extra_kwargs = {
            'generic_name': {'required': False},
            'category': {'required': False},
        }

    def create(self, validated_data):
        category_name = validated_data.pop('category_name', None)
        generic_name_str = validated_data.pop('generic_name_str', None)
        
        if category_name:
            category, created = Category.objects.get_or_create(name=category_name)
            validated_data['category'] = category
        
        if generic_name_str:
            generic_name, created = GenericName.objects.get_or_create(name=generic_name_str)
            validated_data['generic_name'] = generic_name
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category_name = validated_data.pop('category_name', None)
        generic_name_str = validated_data.pop('generic_name_str', None)

        if category_name:
            category, created = Category.objects.get_or_create(name=category_name)
            validated_data['category'] = category
        
        if generic_name_str:
            generic_name, created = GenericName.objects.get_or_create(name=generic_name_str)
            validated_data['generic_name'] = generic_name

        return super().update(instance, validated_data)


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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'manufacturer', 'strength',
            'category_name', 'average_rating', 'total_reviews',
            'discount_percentage', 'primary_image', 'is_prescription_required',
            'batches',
            'current_selling_price',
            'current_cost_price'
        ]

    def get_current_selling_price(self, obj):
        request = self.context.get('request')
        channel = request.query_params.get('channel', 'online') # Default to online if not specified

        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        if not active_batches:
            return None

        active_batches.sort(key=lambda b: b.expiry_date)

        primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
        
        if channel == 'online':
            base_mrp = primary_batch.online_mrp_price if primary_batch else active_batches[0].online_mrp_price
            batch_discount_percentage = primary_batch.online_discount_percentage if primary_batch else active_batches[0].online_discount_percentage
        elif channel == 'offline':
            base_mrp = primary_batch.offline_mrp_price if primary_batch else active_batches[0].offline_mrp_price
            batch_discount_percentage = primary_batch.offline_discount_percentage if primary_batch else active_batches[0].offline_discount_percentage
        else: # Default or generic
            base_mrp = primary_batch.mrp_price if primary_batch else active_batches[0].mrp_price
            batch_discount_percentage = primary_batch.discount_percentage if primary_batch else active_batches[0].discount_percentage

        # Find the highest applicable discount from the Discount model
        today = timezone.now().date()
        product_discounts = obj.discounts.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='product'
        )
        category_discounts = Discount.objects.filter(
            Q(category=obj.category) | Q(category__parent_category=obj.category),
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='category'
        )

        max_discount_from_master = 0
        if product_discounts.exists():
            max_discount_from_master = max(d.percentage for d in product_discounts)
        if category_discounts.exists():
            max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

        # Compare batch-specific discount with master discounts and take the highest
        final_discount_percentage = max(batch_discount_percentage, max_discount_from_master)

        # Calculate final selling price
        if base_mrp is not None:
            discount_amount = base_mrp * (final_discount_percentage / 100)
            return base_mrp - discount_amount
        return None

    def get_current_cost_price(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

        active_batches.sort(key=lambda b: b.expiry_date)

        primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
        if primary_batch:
            return primary_batch.cost_price

        if active_batches:
            return active_batches[0].cost_price
        return None

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_discount_percentage(self, obj):
        all_batches = list(obj.batches.all())
        active_batches = [batch for batch in all_batches if batch.expiry_date > date.today()]

        batch_max_discount = 0
        if active_batches:
            batch_max_discount = float(max(batch.discount_percentage for batch in active_batches))

        # Find the highest applicable discount from the Discount model
        today = timezone.now().date()
        product_discounts = obj.discounts.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='product'
        )
        category_discounts = Discount.objects.filter(
            Q(category=obj.category) | Q(category__parent_category=obj.category),
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            target_type='category'
        )

        max_discount_from_master = 0
        if product_discounts.exists():
            max_discount_from_master = max(d.percentage for d in product_discounts)
        if category_discounts.exists():
            max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

        return max(batch_max_discount, max_discount_from_master)

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image_url
        elif obj.images.exists():
            return obj.images.first().image_url
        return obj.image_url
