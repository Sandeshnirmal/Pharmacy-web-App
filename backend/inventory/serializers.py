from rest_framework import serializers
from .models import StockMovement, StockAlert, Supplier
from product.models import Batch, Product
from product.serializers import ProductSerializer, BatchSerializer

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ('created_at',)

class StockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = '__all__'
        read_only_fields = ('created_at',)

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class BatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def create(self, validated_data):
        batch = super().create(validated_data)
        
        # Update product stock quantity
        product = batch.product
        product.stock_quantity += batch.quantity
        product.save()
        
        # Create stock movement record
        StockMovement.objects.create(
            product=product,
            batch=batch,
            movement_type='IN',
            quantity=batch.quantity,
            reference_number=f"BATCH-{batch.batch_number}",
            notes=f"New batch added: {batch.batch_number}",
            created_by=self.context.get('request').user if self.context.get('request') else None
        )
        
        return batch

class InventoryStatsSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    out_of_stock_products = serializers.IntegerField()
    expiring_batches = serializers.IntegerField()
    expired_batches = serializers.IntegerField()
    total_inventory_value = serializers.DecimalField(max_digits=15, decimal_places=2)
