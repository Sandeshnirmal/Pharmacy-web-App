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

    class Meta:
        model = Product
        fields = '__all__'



class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'

