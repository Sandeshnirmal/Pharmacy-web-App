from rest_framework import serializers
from .models import StockMovement, StockAlert, Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseReturn, PurchaseReturnItem
from product.models import Batch, Product
from product.serializers import ProductSerializer, BatchSerializer, ProductSearchSerializer # Import ProductSearchSerializer
from decimal import Decimal # Import Decimal for precise calculations

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
    # Use ProductSearchSerializer to get detailed product information
    product_details = ProductSearchSerializer(source='product', read_only=True)

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
    purchase_order_item = serializers.PrimaryKeyRelatedField(queryset=PurchaseOrderItem.objects.all(), required=False, allow_null=True) # Allow null for updates where item ID is passed
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True) # For display
    
    class Meta:
        model = PurchaseReturnItem
        fields = ('id', 'purchase_return', 'purchase_order_item', 'product', 'product_name', 'quantity', 'unit_price')
        read_only_fields = ('purchase_return',) # unit_price should be writable
        extra_kwargs = {
            'purchase_return': {'required': False},
            'id': {'read_only': False, 'required': False}, # Allow ID to be passed for updates
        }

class PurchaseOrderReturnItemsSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, required=False, default='Items returned to supplier.')
    notes = serializers.CharField(required=False, allow_blank=True)
    items = PurchaseReturnItemSerializer(many=True)

class PurchaseReturnSerializer(serializers.ModelSerializer):
    items = PurchaseReturnItemSerializer(many=True) # Make items writable
    purchase_order_id = serializers.IntegerField(source='purchase_order.id', read_only=True)
    supplier_name = serializers.CharField(source='purchase_order.supplier.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PurchaseReturn
        fields = '__all__'
        read_only_fields = ('total_amount', 'created_by', 'updated_by', 'created_at', 'updated_at') # return_date is now writable

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['created_by'] = self.context['request'].user
        purchase_return = PurchaseReturn.objects.create(**validated_data)
        total_amount = 0

        for item_data in items_data:
            product = item_data.pop('product')
            purchase_order_item = item_data.pop('purchase_order_item', None)
            quantity = item_data['quantity']
            unit_price = item_data['unit_price']

            PurchaseReturnItem.objects.create(
                purchase_return=purchase_return,
                purchase_order_item=purchase_order_item,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
            )
            total_amount += quantity * unit_price

            # Update returned_quantity in the original PurchaseOrderItem if it exists
            if purchase_order_item:
                purchase_order_item.returned_quantity += quantity
                purchase_order_item.save()

            # Create StockMovement for supplier return
            # Assuming there's a way to get the batch from the purchase_order_item
            # For simplicity, let's assume we can find an active batch for the product
            # In a real scenario, you might need to specify which batch is being returned from
            batch = Batch.objects.filter(product=product, current_quantity__gt=0).order_by('expiry_date').first()
            if batch:
                batch.current_quantity -= quantity
                batch.save()
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    movement_type='SUPPLIER_RETURN',
                    quantity=quantity,
                    reference_number=f"PR-{purchase_return.id}",
                    notes=f"Returned {quantity} units of {product.name} from batch {batch.batch_number} for Purchase Return #{purchase_return.id}.",
                    created_by=self.context.get('request').user
                )
            else:
                # Handle case where no active batch is found (e.g., log a warning)
                print(f"Warning: No active batch found for product {product.name} during return processing.")


        purchase_return.total_amount = total_amount
        purchase_return.save()
        return purchase_return

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        validated_data['updated_by'] = self.context['request'].user

        # Update PurchaseReturn fields
        instance.return_date = validated_data.get('return_date', instance.return_date)
        instance.reason = validated_data.get('reason', instance.reason)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        if items_data is not None:
            # Get existing item IDs
            existing_item_ids = [item.id for item in instance.items.all()]
            incoming_item_ids = [item.get('id') for item in items_data if item.get('id')]

            # Items to delete (exist in DB but not in incoming data)
            for item_id in set(existing_item_ids) - set(incoming_item_ids):
                item_to_delete = PurchaseReturnItem.objects.get(id=item_id)
                # Reverse returned_quantity in original PurchaseOrderItem
                item_to_delete.purchase_order_item.returned_quantity -= item_to_delete.quantity
                item_to_delete.purchase_order_item.save()
                item_to_delete.delete()

            total_amount = 0
            for item_data in items_data:
                item_id = item_data.get('id')
                product = item_data.pop('product')
                purchase_order_item = item_data.pop('purchase_order_item', None) # Can be null for existing items

                if item_id: # Update existing item
                    return_item = PurchaseReturnItem.objects.get(id=item_id, purchase_return=instance)
                    old_quantity = return_item.quantity
                    new_quantity = item_data.get('quantity', old_quantity)

                    return_item.quantity = new_quantity
                    return_item.unit_price = item_data.get('unit_price', return_item.unit_price)
                    return_item.save()

                    # Update returned_quantity in original PurchaseOrderItem
                    if return_item.purchase_order_item:
                        return_item.purchase_order_item.returned_quantity += (new_quantity - old_quantity)
                        return_item.purchase_order_item.save()

                else: # Create new item
                    return_item = PurchaseReturnItem.objects.create(
                        purchase_return=instance,
                        purchase_order_item=purchase_order_item,
                        product=product,
                        quantity=item_data['quantity'],
                        unit_price=item_data['unit_price'],
                    )
                    # Update returned_quantity in original PurchaseOrderItem
                    if purchase_order_item:
                        purchase_order_item.returned_quantity += item_data['quantity']
                        purchase_order_item.save()
                
                total_amount += return_item.quantity * return_item.unit_price
            instance.total_amount = total_amount
            instance.save()

        return instance

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ('total_amount', 'created_by', 'updated_by')

    def validate(self, data):
        status = data.get('status', self.instance.status if self.instance else None)
        invoice_number = data.get('invoice_number', self.instance.invoice_number if self.instance else None)
        invoice_date = data.get('invoice_date', self.instance.invoice_date if self.instance else None)

        if status == 'RECEIVED':
            if not invoice_number:
                raise serializers.ValidationError({"invoice_number": "Invoice number is required when status is RECEIVED."})
            if not invoice_date:
                raise serializers.ValidationError({"invoice_date": "Invoice date is required when status is RECEIVED."})
        return data

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
            if product_data is None:
                raise serializers.ValidationError({"product": "Product ID cannot be null for purchase order items."})
            if isinstance(product_data, Product):
                product = product_data
            else: # Assume it's an ID
                product = Product.objects.get(id=product_data)
            
            quantity = Decimal(str(item_data.pop('quantity')))
            unit_price = Decimal(str(item_data.pop('unit_price')))
            tax_percentage = Decimal(str(item_data.pop('tax_percentage', Decimal('0.00'))))
            discount_percentage = Decimal(str(item_data.pop('discount_percentage', Decimal('0.00'))))
            batch_number = item_data.get('batch_number')
            expiry_date = item_data.get('expiry_date')
            cost_price = Decimal(str(item_data.pop('cost_price', Decimal('0.00'))))
            tax_percentage_item = tax_percentage # Use the already converted tax_percentage

            item_base_amount = quantity * unit_price
            item_discount_amount = item_base_amount * (discount_percentage / Decimal('100'))
            item_taxable_amount = item_base_amount - item_discount_amount
            item_tax_amount = item_taxable_amount * (tax_percentage_item / Decimal('100'))
            subtotal = item_taxable_amount + item_tax_amount
            
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order, 
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal, 
                tax_percentage=tax_percentage_item,
                discount_percentage=discount_percentage,
                **item_data
            )
            total_amount += subtotal

            # Find or create batch
            # The product's stock_quantity is a property calculated from batches,
            # so we only need to update the batch quantities.
            batch, created = Batch.objects.get_or_create(
                product=product,
                batch_number=batch_number,
                expiry_date=expiry_date,
                defaults={
                    'quantity': 0, 
                    'current_quantity': 0, 
                    'cost_price': unit_price,
                    'tax_percentage': tax_percentage_item,
                    'online_mrp_price': unit_price,
                    'online_selling_price': unit_price,
                    'offline_mrp_price': unit_price,
                    'offline_selling_price': unit_price,
                }
            )
            batch.quantity += quantity
            batch.current_quantity += quantity
            batch.cost_price = unit_price
            batch.tax_percentage = tax_percentage_item
            
            # Set online/offline prices to unit_price if they are currently 0 or None
            if batch.online_mrp_price is None or batch.online_mrp_price == 0:
                batch.online_mrp_price = unit_price
            if batch.online_selling_price is None or batch.online_selling_price == 0:
                batch.online_selling_price = unit_price
            if batch.offline_mrp_price is None or batch.offline_mrp_price == 0:
                batch.offline_mrp_price = unit_price
            if batch.offline_selling_price is None or batch.offline_selling_price == 0:
                batch.offline_selling_price = unit_price

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
                for old_item in instance.items.all():
                    product = old_item.product
                    quantity = old_item.quantity
                    batch = Batch.objects.filter(product=product, batch_number=old_item.batch_number, expiry_date=old_item.expiry_date).first()
                    if batch:
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
                    else:
                        print(f"Warning: Batch not found for product {product.name}, batch_number {old_item.batch_number}, expiry_date {old_item.expiry_date}. Skipping stock reversal for this item.")

            instance.items.all().delete() # Delete old items

            total_amount = 0
            for item_data in items_data:
                product_data = item_data.pop('product')
                if product_data is None:
                    raise serializers.ValidationError({"product": "Product ID cannot be null for purchase order items."})
                if isinstance(product_data, Product):
                    product = product_data
                else: # Assume it's an ID
                    product = Product.objects.get(id=product_data)
                
                quantity = Decimal(str(item_data.pop('quantity')))
                unit_price = Decimal(str(item_data.pop('unit_price')))
                tax_percentage = Decimal(str(item_data.pop('tax_percentage', Decimal('0.00'))))
                discount_percentage = Decimal(str(item_data.pop('discount_percentage', Decimal('0.00'))))
                batch_number = item_data.get('batch_number')
                expiry_date = item_data.get('expiry_date')
                cost_price = Decimal(str(item_data.pop('cost_price', Decimal('0.00'))))
                tax_percentage_item = tax_percentage # Use the already converted tax_percentage

                item_base_amount = quantity * unit_price
                item_discount_amount = item_base_amount * (discount_percentage / Decimal('100'))
                item_taxable_amount = item_base_amount - item_discount_amount
                item_tax_amount = item_taxable_amount * (tax_percentage_item / Decimal('100'))
                subtotal = item_taxable_amount + item_tax_amount
                
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                    tax_percentage=tax_percentage_item,
                    discount_percentage=discount_percentage,
                    **item_data
                )
                total_amount += subtotal

                # If the new status is RECEIVED, update stock and create stock movement
                if new_status == 'RECEIVED':
                    batch, created = Batch.objects.get_or_create(
                        product=product,
                        batch_number=batch_number,
                        expiry_date=expiry_date,
                        defaults={
                            'quantity': 0,
                            'current_quantity': 0,
                            'cost_price': unit_price,
                            'tax_percentage': tax_percentage_item,
                            'online_mrp_price': unit_price,
                            'online_selling_price': unit_price,
                            'offline_mrp_price': unit_price,
                            'offline_selling_price': unit_price,
                        }
                    )
                    batch.quantity += quantity
                    batch.current_quantity += quantity
                    batch.cost_price = unit_price
                    batch.tax_percentage = tax_percentage_item

                    if batch.online_mrp_price is None or batch.online_mrp_price == 0:
                        batch.online_mrp_price = unit_price
                    if batch.online_selling_price is None or batch.online_selling_price == 0:
                        batch.online_selling_price = unit_price
                    if batch.offline_mrp_price is None or batch.offline_mrp_price == 0:
                        batch.offline_mrp_price = unit_price
                    if batch.offline_selling_price is None or batch.offline_selling_price == 0:
                        batch.offline_selling_price = unit_price

                    batch.save()

                    StockMovement.objects.create(
                        product=product,
                        batch=batch,
                        movement_type='IN',
                        quantity=quantity,
                        reference_number=f"PO-{instance.id}",
                        notes=f"Received {quantity} units for Purchase Order #{instance.id} into batch {batch.batch_number} upon update.",
                        created_by=self.context.get('request').user if self.context.get('request') else None
                    )
            instance.total_amount = total_amount
            instance.save()

        return instance
