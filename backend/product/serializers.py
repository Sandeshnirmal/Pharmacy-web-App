from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg
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
    total_batches = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_stock_status(self, obj):
        if obj.stock_quantity == 0:
            return 'Out of Stock'
        elif obj.stock_quantity <= obj.min_stock_level:
            return 'Low Stock'
        else:
            return 'In Stock'

    def get_total_batches(self, obj):
        return obj.batches.count()



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
    discount_percentage = serializers.SerializerMethodField()
    is_in_wishlist = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_tags(self, obj):
        tag_assignments = obj.tags.select_related('tag').all()
        return [{'name': ta.tag.name, 'color': ta.tag.color} for ta in tag_assignments]

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_stock_status(self, obj):
        if obj.stock_quantity == 0:
            return 'out_of_stock'
        elif obj.stock_quantity <= obj.min_stock_level:
            return 'low_stock'
        else:
            return 'in_stock'

    def get_discount_percentage(self, obj):
        if obj.mrp > obj.price:
            return round(((obj.mrp - obj.price) / obj.mrp) * 100, 1)
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

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'mrp', 'manufacturer', 'strength',
            'category_name', 'average_rating', 'total_reviews',
            'discount_percentage', 'primary_image', 'is_prescription_required'
        ]

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_discount_percentage(self, obj):
        if obj.mrp > obj.price:
            return round(((obj.mrp - obj.price) / obj.mrp) * 100, 1)
        return 0

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image_url
        elif obj.images.exists():
            return obj.images.first().image_url
        return obj.image_url
