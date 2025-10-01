import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from product.models import Product, Composition, GenericName, Category, Batch, ProductComposition
from inventory.models import StockMovement, StockAlert, Supplier

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with realistic inventory and product data.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting inventory data seeding...'))

        # Clear existing data (optional, for fresh runs)
        # StockMovement.objects.all().delete()
        # StockAlert.objects.all().delete()
        # Batch.objects.all().delete()
        # ProductComposition.objects.all().delete()
        # Product.objects.all().delete()
        # Composition.objects.all().delete()
        # GenericName.objects.all().delete()
        # Category.objects.all().delete()
        # Supplier.objects.all().delete()
        # self.stdout.write(self.style.WARNING('Cleared existing inventory and product data.'))

        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(self.style.WARNING('No superuser found. Creating a default admin user.'))
                admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
                self.stdout.write(self.style.SUCCESS('Default admin user created: admin/adminpassword'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error getting or creating admin user: {e}"))
            return

        # 1. Create Categories
        categories_data = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cough & Cold', 'Digestive Health', 'Skincare']
        categories = []
        for cat_name in categories_data:
            category, created = Category.objects.get_or_create(name=cat_name, defaults={'description': f'{cat_name} products'})
            categories.append(category)
            if created:
                self.stdout.write(f'Created Category: {category.name}')

        # 2. Create Generic Names
        generic_names_data = ['Paracetamol', 'Amoxicillin', 'Vitamin C', 'Ibuprofen', 'Omeprazole', 'Cetirizine']
        generic_names = []
        for gn_name in generic_names_data:
            generic_name, created = GenericName.objects.get_or_create(name=gn_name, defaults={'description': f'Generic name for {gn_name}'})
            generic_names.append(generic_name)
            if created:
                self.stdout.write(f'Created GenericName: {generic_name.name}')

        # 3. Create Compositions
        compositions_data = [
            {'name': 'Paracetamol', 'scientific_name': 'Acetaminophen', 'therapeutic_class': 'Analgesic'},
            {'name': 'Amoxicillin', 'scientific_name': 'Amoxycillin', 'therapeutic_class': 'Antibiotic'},
            {'name': 'Ascorbic Acid', 'scientific_name': 'Vitamin C', 'therapeutic_class': 'Vitamin'},
            {'name': 'Ibuprofen', 'scientific_name': 'Isobutylphenylpropanoic acid', 'therapeutic_class': 'NSAID'},
            {'name': 'Omeprazole', 'scientific_name': '5-methoxy-2-[[(4-methoxy-3,5-dimethyl-2-pyridinyl)methyl]sulfinyl]-1H-benzimidazole', 'therapeutic_class': 'PPI'},
            {'name': 'Cetirizine', 'scientific_name': '2-[2-[4-[(4-chlorophenyl)phenylmethyl]piperazin-1-yl]ethoxy]acetic acid', 'therapeutic_class': 'Antihistamine'},
        ]
        compositions = []
        for comp_data in compositions_data:
            composition, created = Composition.objects.get_or_create(
                name=comp_data['name'],
                defaults={
                    'scientific_name': comp_data['scientific_name'],
                    'therapeutic_class': comp_data['therapeutic_class'],
                    'created_by': admin_user
                }
            )
            compositions.append(composition)
            if created:
                self.stdout.write(f'Created Composition: {composition.name}')

        # 4. Create Suppliers
        suppliers_data = [
            {'name': 'PharmaDistro Inc.', 'email': 'contact@pharmadistro.com', 'phone': '1234567890', 'address': '123 Pharma Lane'},
            {'name': 'MediSupply Co.', 'email': 'info@medisupply.com', 'phone': '0987654321', 'address': '456 Medical Ave'},
        ]
        suppliers = []
        for sup_data in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                name=sup_data['name'],
                defaults={
                    'contact_person': 'John Doe',
                    'email': sup_data['email'],
                    'phone': sup_data['phone'],
                    'address': sup_data['address']
                }
            )
            suppliers.append(supplier)
            if created:
                self.stdout.write(f'Created Supplier: {supplier.name}')

        # 5. Create Products
        products_data = [
            {
                'name': 'Crocin Advance', 'brand_name': 'Crocin', 'generic_name': 'Paracetamol',
                'manufacturer': 'GSK', 'medicine_type': 'tablet', 'prescription_type': 'otc',
                'strength': '500mg', 'price': 25.00, 'mrp': 30.00, 'stock_quantity': 100,
                'min_stock_level': 20, 'dosage_form': 'Tablet', 'pack_size': '15 Tablets',
                'category': 'Pain Relief', 'compositions': [{'name': 'Paracetamol', 'strength': '500mg'}]
            },
            {
                'name': 'Amoxil 500mg', 'brand_name': 'Amoxil', 'generic_name': 'Amoxicillin',
                'manufacturer': 'Pfizer', 'medicine_type': 'capsule', 'prescription_type': 'prescription',
                'strength': '500mg', 'price': 80.00, 'mrp': 95.00, 'stock_quantity': 50,
                'min_stock_level': 15, 'dosage_form': 'Capsule', 'pack_size': '10 Capsules',
                'category': 'Antibiotics', 'compositions': [{'name': 'Amoxicillin', 'strength': '500mg'}]
            },
            {
                'name': 'Limcee Chewable Tablet', 'brand_name': 'Limcee', 'generic_name': 'Vitamin C',
                'manufacturer': 'Abbott', 'medicine_type': 'tablet', 'prescription_type': 'otc',
                'strength': '500mg', 'price': 45.00, 'mrp': 55.00, 'stock_quantity': 120,
                'min_stock_level': 30, 'dosage_form': 'Chewable Tablet', 'pack_size': '15 Tablets',
                'category': 'Vitamins', 'compositions': [{'name': 'Ascorbic Acid', 'strength': '500mg'}]
            },
            {
                'name': 'Brufen 400', 'brand_name': 'Brufen', 'generic_name': 'Ibuprofen',
                'manufacturer': 'Abbott', 'medicine_type': 'tablet', 'prescription_type': 'otc',
                'strength': '400mg', 'price': 35.00, 'mrp': 40.00, 'stock_quantity': 80,
                'min_stock_level': 25, 'dosage_form': 'Tablet', 'pack_size': '10 Tablets',
                'category': 'Pain Relief', 'compositions': [{'name': 'Ibuprofen', 'strength': '400mg'}]
            },
            {
                'name': 'Omez 20mg', 'brand_name': 'Omez', 'generic_name': 'Omeprazole',
                'manufacturer': 'Dr. Reddy\'s', 'medicine_type': 'capsule', 'prescription_type': 'prescription',
                'strength': '20mg', 'price': 60.00, 'mrp': 70.00, 'stock_quantity': 70,
                'min_stock_level': 20, 'dosage_form': 'Capsule', 'pack_size': '15 Capsules',
                'category': 'Digestive Health', 'compositions': [{'name': 'Omeprazole', 'strength': '20mg'}]
            },
            {
                'name': 'Cetiriz 10mg', 'brand_name': 'Cetiriz', 'generic_name': 'Cetirizine',
                'manufacturer': 'Dr. Reddy\'s', 'medicine_type': 'tablet', 'prescription_type': 'otc',
                'strength': '10mg', 'price': 20.00, 'mrp': 25.00, 'stock_quantity': 150,
                'min_stock_level': 40, 'dosage_form': 'Tablet', 'pack_size': '10 Tablets',
                'category': 'Cough & Cold', 'compositions': [{'name': 'Cetirizine', 'strength': '10mg'}]
            },
        ]

        products = []
        for p_data in products_data:
            generic_name_obj = GenericName.objects.get(name=p_data['generic_name'])
            category_obj = Category.objects.get(name=p_data['category'])
            product, created = Product.objects.get_or_create(
                name=p_data['name'],
                manufacturer=p_data['manufacturer'],
                dosage_form=p_data['dosage_form'],
                defaults={
                    'brand_name': p_data['brand_name'],
                    'generic_name': generic_name_obj,
                    'medicine_type': p_data['medicine_type'],
                    'prescription_type': p_data['prescription_type'],
                    'strength': p_data['strength'],
                    'price': p_data['price'],
                    'mrp': p_data['mrp'],
                    'stock_quantity': p_data['stock_quantity'],
                    'min_stock_level': p_data['min_stock_level'],
                    'pack_size': p_data['pack_size'],
                    'category': category_obj,
                    'created_by': admin_user,
                    'is_prescription_required': True if p_data['prescription_type'] == 'prescription' else False,
                }
            )
            products.append(product)
            if created:
                self.stdout.write(f'Created Product: {product.name}')

            # Add compositions to product
            for comp_info in p_data['compositions']:
                composition_obj = Composition.objects.get(name=comp_info['name'])
                ProductComposition.objects.get_or_create(
                    product=product,
                    composition=composition_obj,
                    defaults={'strength': comp_info['strength'], 'is_primary': True}
                )

        # 6. Create Batches and Stock Movements
        for product in products:
            num_batches = random.randint(1, 3)
            for i in range(num_batches):
                batch_number = f"{product.name[:3].upper()}{random.randint(1000, 9999)}{i}"
                manufacturing_date = timezone.now().date() - timedelta(days=random.randint(30, 365))
                expiry_date = manufacturing_date + timedelta(days=random.randint(365, 730)) # 1-2 years expiry
                quantity = random.randint(50, 200)
                cost_price = product.price * random.uniform(0.7, 0.9)
                selling_price = product.price

                batch, created = Batch.objects.get_or_create(
                    product=product,
                    batch_number=batch_number,
                    defaults={
                        'manufacturing_date': manufacturing_date,
                        'expiry_date': expiry_date,
                        'quantity': quantity,
                        'current_quantity': quantity,
                        'cost_price': cost_price,
                        'selling_price': selling_price,
                    }
                )
                if created:
                    self.stdout.write(f'Created Batch: {batch.batch_number} for {product.name}')

                    # Create initial StockMovement for 'IN'
                    StockMovement.objects.create(
                        product=product,
                        batch=batch,
                        movement_type='IN',
                        quantity=quantity,
                        notes='Initial stock',
                        created_by=admin_user
                    )
                    self.stdout.write(f'Created StockMovement (IN) for {product.name} - Batch {batch.batch_number}')

                    # Create some random OUT movements
                    if quantity > 20:
                        out_quantity = random.randint(5, 20)
                        if batch.current_quantity >= out_quantity:
                            StockMovement.objects.create(
                                product=product,
                                batch=batch,
                                movement_type='OUT',
                                quantity=out_quantity,
                                notes='Simulated sale',
                                created_by=admin_user
                            )
                            batch.current_quantity -= out_quantity
                            batch.save()
                            self.stdout.write(f'Created StockMovement (OUT) for {product.name} - Batch {batch.batch_number}')

            # Update product's overall stock_quantity based on current batches
            product.stock_quantity = sum(b.current_quantity for b in product.batches.all())
            product.save()

        # 7. Create Stock Alerts (simulated)
        for product in products:
            if product.stock_quantity < product.min_stock_level:
                StockAlert.objects.get_or_create(
                    product=product,
                    alert_type='LOW_STOCK',
                    defaults={'message': f'Stock for {product.name} is low: {product.stock_quantity}', 'created_by': admin_user}
                )
                self.stdout.write(f'Created StockAlert (LOW_STOCK) for {product.name}')

            for batch in product.batches.all():
                if batch.expiry_date < timezone.now().date() + timedelta(days=90) and not batch.expiry_date < timezone.now().date():
                    StockAlert.objects.get_or_create(
                        product=product,
                        batch=batch,
                        alert_type='EXPIRING_SOON',
                        defaults={'message': f'Batch {batch.batch_number} of {product.name} expiring soon on {batch.expiry_date}', 'created_by': admin_user}
                    )
                    self.stdout.write(f'Created StockAlert (EXPIRING_SOON) for {product.name} - Batch {batch.batch_number}')
                elif batch.expiry_date < timezone.now().date():
                    StockAlert.objects.get_or_create(
                        product=product,
                        batch=batch,
                        alert_type='EXPIRED',
                        defaults={'message': f'Batch {batch.batch_number} of {product.name} has expired on {batch.expiry_date}', 'created_by': admin_user}
                    )
                    self.stdout.write(f'Created StockAlert (EXPIRED) for {product.name} - Batch {batch.batch_number}')


        self.stdout.write(self.style.SUCCESS('Inventory data seeding completed successfully!'))
