from rest_framework import serializers
from .models import Category, Product, Batch, Inventory,GenericName

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

