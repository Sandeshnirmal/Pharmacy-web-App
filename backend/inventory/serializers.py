from rest_framework import serializers
from .models import StockMovement, StockAlert, Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseReturn, PurchaseReturnItem
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
    # Removed 'product' field definition here. It will be handled as a regular field in Meta.fields for input.
    product_details = serializers.StringRelatedField(source='product', read_only=True) # Changed to StringRelatedField for simpler output

    class Meta:
        model = PurchaseOrderItem
        fields = (
            'id', 'purchase_order', 'product', 'product_details', 'quantity', 'unit_price',
            'discount_percentage', 'tax_percentage', 'subtotal', 'received_quantity',
            'returned_quantity', 'batch_number', 'expiry_date'
        )
        read_only_fields = ('purchase_order', 'subtotal', 'received_quantity', 'returned_quantity', 'product_details')
        extra_kwargs = {
            'product': {'write_only': True}, # Explicitly make product write-only
            'tax_percentage': {'required': False, 'allow_null': True},
            'discount_percentage': {'required': False, 'allow_null': True}
        }

class PurchaseReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PurchaseReturnItem
        fields = '__all__'
        read_only_fields = ('unit_price',) # unit_price is derived from PurchaseOrderItem

class PurchaseReturnSerializer(serializers.ModelSerializer):
    items = PurchaseReturnItemSerializer(many=True, read_only=True) # Items are read-only for display
    purchase_order_id = serializers.IntegerField(source='purchase_order.id', read_only=True)
    supplier_name = serializers.CharField(source='purchase_order.supplier.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PurchaseReturn
        fields = '__all__'
        read_only_fields = ('total_amount', 'created_by', 'updated_by', 'created_at', 'updated_at')

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
            # Ensure product is an ID, then retrieve the Product object
            product_data = item_data.pop('product')
            if isinstance(product_data, Product):
                product = product_data
            else: # Assume it's an ID
                product = Product.objects.get(id=product_data)
            
            quantity = item_data['quantity']
            unit_price = item_data['unit_price']
            tax_percentage = item_data.get('tax_percentage', 0.00) # Get tax_percentage, default to 0
            discount_percentage = item_data.get('discount_percentage', 0.00) # Get discount_percentage, default to 0
            batch_number = item_data.get('batch_number')
            expiry_date = item_data.get('expiry_date')

            item_base_amount = quantity * unit_price
            item_discount_amount = item_base_amount * (discount_percentage / 100)
            item_taxable_amount = item_base_amount - item_discount_amount
            item_tax_amount = item_taxable_amount * (tax_percentage / 100)
            subtotal = item_taxable_amount + item_tax_amount
            
            # Remove tax_percentage, discount_percentage and product from item_data to avoid duplicate keyword arguments
            item_data.pop('tax_percentage', None)
            item_data.pop('discount_percentage', None)
            item_data.pop('product', None) # Remove product (which is now an object) from item_data

            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order, 
                product=product, # Pass the Product object
                subtotal=subtotal, 
                tax_percentage=tax_percentage,
                discount_percentage=discount_percentage,
                **item_data
            )
            total_amount += subtotal

            # Find or create batch
            # The product's stock_quantity is a property calculated from batches,
            # so we only need to update the batch quantities.
            batch, created = Batch.objects.get_or_create(
                product=product, # Use the retrieved Product object
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
        
        old_status = instance.status # Store old status

        instance.supplier = validated_data.get('supplier', instance.supplier)
        instance.invoice_date = validated_data.get('invoice_date', instance.invoice_date)
        instance.invoice_number = validated_data.get('invoice_number', instance.invoice_number)
        instance.status = validated_data.get('status', instance.status)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.updated_by = self.context['request'].user # Assuming user is available in context
        instance.save() # Save instance with new status

        new_status = instance.status # Get the new status after saving

        if items_data is not None:
            # If items are being updated, and old status was RECEIVED, reverse old stock movements
            if old_status == 'RECEIVED':
                for old_item in instance.items.all(): # Iterate through items *before* deletion
                    product = old_item.product
                    quantity = old_item.quantity
                    batch = Batch.objects.get(product=product, batch_number=old_item.batch_number, expiry_date=old_item.expiry_date)
                    batch.quantity -= quantity
                    batch.current_quantity -= quantity
                    batch.save()
                    StockMovement.objects.create(
                        product=product,
                        batch=batch,
                        movement_type='OUT', # Reverse movement
                        quantity=quantity,
                        reference_number=f"PO-UPDATE-REV-{instance.id}",
                        notes=f"Reversed {quantity} units for Purchase Order #{instance.id} due to update from RECEIVED status.",
                        created_by=self.context.get('request').user if self.context.get('request') else None
                    )

            instance.items.all().delete() # Delete old items
            total_amount = 0
            for item_data in items_data:
                # Ensure product is an ID, then retrieve the Product object
                product_data = item_data.pop('product')
                if isinstance(product_data, Product):
                    product = product_data
                else: # Assume it's an ID
                    product = Product.objects.get(id=product_data)

                quantity = item_data['quantity']
                unit_price = item_data['unit_price']
                tax_percentage = item_data.get('tax_percentage', 0.00)
                discount_percentage = item_data.get('discount_percentage', 0.00) # Get discount_percentage
                batch_number = item_data.get('batch_number')
                expiry_date = item_data.get('expiry_date')

                item_base_amount = quantity * unit_price
                item_discount_amount = item_base_amount * (discount_percentage / 100) # Calculate discount amount
                item_taxable_amount = item_base_amount - item_discount_amount
                item_tax_amount = item_taxable_amount * (tax_percentage / 100)
                subtotal = item_taxable_amount + item_tax_amount # Subtotal after discount and tax

                item_data.pop('tax_percentage', None)
                item_data.pop('discount_percentage', None) # Pop discount_percentage
                item_data.pop('product', None)

                purchase_order_item = PurchaseOrderItem.objects.create(
                    purchase_order=instance, 
                    product=product, 
                    subtotal=subtotal, 
                    tax_percentage=tax_percentage,
                    discount_percentage=discount_percentage, # Pass discount_percentage
                    **item_data
                )
                total_amount += subtotal

                # If the new status is RECEIVED, add stock for the new items
                if new_status == 'RECEIVED':
                    batch, created = Batch.objects.get_or_create(
                        product=product,
                        batch_number=batch_number,
                        expiry_date=expiry_date,
                        defaults={'quantity': 0, 'current_quantity': 0}
                    )
                    batch.quantity += quantity
                    batch.current_quantity += quantity
                    batch.save()

                    StockMovement.objects.create(
                        product=product,
                        batch=batch,
                        movement_type='IN',
                        quantity=quantity,
                        reference_number=f"PO-{instance.id}",
                        notes=f"Received {quantity} units for Purchase Order #{instance.id} into batch {batch.batch_number} upon update to RECEIVED status.",
                        created_by=self.context.get('request').user if self.context.get('request') else None
                    )
            instance.total_amount = total_amount
            instance.save() # Save total_amount
        
        # Handle status change without item data update
        elif new_status == 'RECEIVED' and old_status != 'RECEIVED':
            for item in instance.items.all():
                product = item.product
                quantity = item.quantity
                batch = Batch.objects.get(product=product, batch_number=item.batch_number, expiry_date=item.expiry_date)
                batch.quantity += quantity
                batch.current_quantity += quantity
                batch.save()
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    movement_type='IN',
                    quantity=quantity,
                    reference_number=f"PO-{instance.id}",
                    notes=f"Received {quantity} units for Purchase Order #{instance.id} into batch {batch.batch_number} upon status change to RECEIVED.",
                    created_by=self.context.get('request').user if self.context.get('request') else None
                )
        elif new_status != 'RECEIVED' and old_status == 'RECEIVED':
            # If status changes from RECEIVED to something else, reverse stock
            for item in instance.items.all():
                product = item.product
                quantity = item.quantity
                batch = Batch.objects.get(product=product, batch_number=item.batch_number, expiry_date=item.expiry_date)
                batch.quantity -= quantity
                batch.current_quantity -= quantity
                batch.save()
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    movement_type='OUT', # Reverse movement
                    quantity=quantity,
                    reference_number=f"PO-STATUS-REV-{instance.id}",
                    notes=f"Reversed {quantity} units for Purchase Order #{instance.id} due to status change from RECEIVED.",
                    created_by=self.context.get('request').user if self.context.get('request') else None
                )

        return instance
