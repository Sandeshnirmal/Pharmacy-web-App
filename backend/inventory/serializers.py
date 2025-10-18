from rest_framework import serializers
from .models import StockMovement, StockAlert, Supplier, PurchaseOrder, PurchaseOrderItem
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

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'
        read_only_fields = ('subtotal', 'received_quantity') # received_quantity should not be set by client

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ('total_amount', 'created_by', 'updated_by')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # Set initial status to RECEIVED if not explicitly provided, assuming immediate inventory reflection
        if 'status' not in validated_data:
            validated_data['status'] = 'RECEIVED'
        
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        total_amount = 0
        
        for item_data in items_data:
            product_id = item_data['product'].id # product is an object here
            quantity = item_data['quantity']
            unit_price = item_data['unit_price']
            batch_number = item_data.get('batch_number')
            expiry_date = item_data.get('expiry_date')

            subtotal = quantity * unit_price
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, subtotal=subtotal, **item_data)
            total_amount += subtotal

            # Update product stock and handle batches immediately upon creation
            product = Product.objects.get(id=product_id)
            product.stock_quantity += quantity
            product.save()

            # Find or create batch
            batch, created = Batch.objects.get_or_create(
                product=product,
                batch_number=batch_number,
                expiry_date=expiry_date,
                defaults={'quantity': 0, 'current_quantity': 0}
            )
            batch.quantity += quantity
            batch.current_quantity += quantity
            batch.save()

            # Create stock movement record
            StockMovement.objects.create(
                product=product,
                batch=batch,
                movement_type='IN',
                quantity=quantity,
                reference_number=f"PO-{purchase_order.id}",
                notes=f"Received {quantity} units for Purchase Order #{purchase_order.id} into batch {batch.batch_number} upon creation.",
                created_by=self.context.get('request').user if self.context.get('request') else None
            )

        purchase_order.total_amount = total_amount
        purchase_order.save()
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        instance.supplier = validated_data.get('supplier', instance.supplier)
        instance.expected_delivery_date = validated_data.get('expected_delivery_date', instance.expected_delivery_date)
        instance.delivery_date = validated_data.get('delivery_date', instance.delivery_date)
        instance.status = validated_data.get('status', instance.status)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.updated_by = self.context['request'].user # Assuming user is available in context
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            total_amount = 0
            for item_data in items_data:
                quantity = item_data['quantity']
                unit_price = item_data['unit_price']
                subtotal = quantity * unit_price
                PurchaseOrderItem.objects.create(purchase_order=instance, subtotal=subtotal, **item_data)
                total_amount += subtotal
            instance.total_amount = total_amount
            instance.save()

        return instance
