from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg
from datetime import date, timedelta # Import date and timedelta here
from .models import (
    Category, Product, Batch, Inventory, GenericName,
    ProductReview, ProductImage, Wishlist, ProductTag,
    ProductTagAssignment, ProductViewHistory
)

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class GenericNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenericName
        fields = '__all__'        

class BatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    expiry_status = serializers.SerializerMethodField()
    days_to_expiry = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = '__all__'

    def get_expiry_status(self, obj):
        from datetime import date, timedelta
        today = date.today()

        if obj.expiry_date < today:
            return 'Expired'
        elif obj.expiry_date <= today + timedelta(days=30):
            return 'Expiring Soon'
        elif obj.expiry_date <= today + timedelta(days=90):
            return 'Expires in 3 months'
        else:
            return 'Good'

    def get_days_to_expiry(self, obj):
        from datetime import date
        today = date.today()
        return (obj.expiry_date - today).days


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
    stock_quantity = serializers.SerializerMethodField() # Add stock_quantity
    total_batches = serializers.SerializerMethodField()
    batches = BatchSerializer(many=True, read_only=True)
    current_selling_price = serializers.SerializerMethodField()
    current_cost_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'manufacturer',
            'medicine_type', 'prescription_type', 'strength', 'form',
            'is_prescription_required', 'min_stock_level', 'dosage_form',
            'pack_size', 'packaging_unit', 'description', 'composition',
            'uses', 'side_effects', 'how_to_use', 'precautions', 'storage',
            'compositions', 'image_url', 'hsn_code', 'category',
            'is_active', 'is_featured', 'created_at', 'updated_at', 'created_by',
            'batches', 'current_selling_price', 'current_cost_price', 'stock_quantity', 'category_id', 'stock_status', 'generic_name_id', 'total_batches' # Add stock_quantity, category_id, stock_status, generic_name_id, and total_batches
        ]

    def get_current_selling_price(self, obj):
        from datetime import date
        # Try to find a primary active batch first
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.selling_price
        
        # If no primary batch, fall back to the lowest selling price among active batches
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('selling_price')
        if active_batches.exists():
            return active_batches.first().selling_price
        return None

    def get_current_cost_price(self, obj):
        from datetime import date
        # Try to find a primary active batch first
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.cost_price

        # If no primary batch, fall back to the lowest cost price among active batches
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('cost_price')
        if active_batches.exists():
            return active_batches.first().cost_price
        return None

    def get_stock_quantity(self, obj):
        # Calculate total stock from all active batches
        return sum(batch.current_quantity for batch in obj.batches.filter(expiry_date__gt=date.today()))

    def get_stock_status(self, obj):
        total_stock = self.get_stock_quantity(obj) # Use the calculated stock_quantity
        if total_stock == 0:
            return 'Out of Stock'
        elif total_stock <= obj.min_stock_level:
            return 'Low Stock'
        else:
            return 'In Stock'

    def get_total_batches(self, obj):
        return obj.batches.count()


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

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class EnhancedProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    generic_name = GenericNameSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()

    # Calculated fields
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    stock_quantity = serializers.SerializerMethodField() # Add stock_quantity
    discount_percentage = serializers.SerializerMethodField()
    is_in_wishlist = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()
    batches = BatchSerializer(many=True, read_only=True)
    current_selling_price = serializers.SerializerMethodField() # Add this line
    current_cost_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand_name', 'generic_name', 'manufacturer',
            'medicine_type', 'prescription_type', 'strength', 'form',
            'is_prescription_required', 'min_stock_level', 'dosage_form',
            'pack_size', 'packaging_unit', 'description', 'composition',
            'uses', 'side_effects', 'how_to_use', 'precautions', 'storage',
            'compositions', 'image_url', 'hsn_code', 'category',
            'is_active', 'is_featured', 'created_at', 'updated_at', 'created_by',
            'images', 'reviews', 'tags', 'average_rating', 'total_reviews',
            'stock_status', 'stock_quantity', 'discount_percentage', 'is_in_wishlist', # Add stock_quantity
            'related_products', 'batches', 'current_selling_price', 'current_cost_price'
        ]

    def get_current_selling_price(self, obj):
        from datetime import date
        # Try to find a primary active batch first
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.selling_price
        
        # If no primary batch, fall back to the lowest selling price among active batches
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('selling_price')
        if active_batches.exists():
            return active_batches.first().selling_price
        return None

    def get_current_cost_price(self, obj):
        from datetime import date
        # Try to find a primary active batch first
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.cost_price

        # If no primary batch, fall back to the lowest cost price among active batches
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('cost_price')
        if active_batches.exists():
            return active_batches.first().cost_price
        return None

    def get_tags(self, obj):
        tag_assignments = obj.tags.select_related('tag').all()
        return [{'name': ta.tag.name, 'color': ta.tag.color} for ta in tag_assignments]

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_stock_quantity(self, obj):
        # Calculate total stock from all active batches
        from datetime import date
        return sum(batch.current_quantity for batch in obj.batches.filter(expiry_date__gt=date.today()))

    def get_stock_status(self, obj):
        total_stock = self.get_stock_quantity(obj) # Use the calculated stock_quantity
        if total_stock == 0:
            return 'out_of_stock'
        elif total_stock <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'

    def get_discount_percentage(self, obj):
        # Discount calculation should now be based on batch selling prices.
        # Since 'price' and 'mrp' are removed from Product, we need to derive a reference.
        # For simplicity, let's assume no direct discount percentage is calculated at product level
        # unless a specific 'mrp' or 'list_price' is introduced at batch level.
        # For now, returning 0.
        return 0

    def get_is_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, product=obj).exists()
        return False

    def get_related_products(self, obj):
        # Get products from same category, excluding current product
        related = Product.objects.filter(
            category=obj.category
        ).exclude(id=obj.id)[:4]

        return ProductSerializer(related, many=True, context=self.context).data


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
    current_selling_price = serializers.SerializerMethodField() # Add this line
    current_cost_price = serializers.SerializerMethodField() # Add this line

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
        from datetime import date
        # Try to find a primary active batch first
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.selling_price
        
        # If no primary batch, fall back to the lowest selling price among active batches
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('selling_price')
        if active_batches.exists():
            return active_batches.first().selling_price
        return None

    def get_current_cost_price(self, obj):
        from datetime import date
        # Try to find a primary active batch first
        primary_batch = obj.batches.filter(expiry_date__gt=date.today(), is_primary=True).first()
        if primary_batch:
            return primary_batch.cost_price

        # If no primary batch, fall back to the lowest cost price among active batches
        active_batches = obj.batches.filter(expiry_date__gt=date.today()).order_by('cost_price')
        if active_batches.exists():
            return active_batches.first().cost_price
        return None

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_discount_percentage(self, obj):
        # Discount calculation should now be based on batch selling prices
        # For simplicity, let's assume we compare current_selling_price with a potential original_mrp from batches
        # If no original_mrp is available, this field might need to be re-evaluated or removed.
        # For now, returning 0 as there's no direct 'mrp' or 'price' on Product.
        return 0

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image_url
        elif obj.images.exists():
            return obj.images.first().image_url
        return obj.image_url
