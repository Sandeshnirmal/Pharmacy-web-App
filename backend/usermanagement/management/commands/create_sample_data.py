from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import datetime, timedelta
import random

from usermanagement.models import User, Address
from product.models import Product, Category, GenericName
from orders.models import Order, OrderItem

User = get_user_model()


class Command(BaseCommand):
    help = 'Create comprehensive sample data for the Pharmacy Management System'

    def handle(self, *args, **options):
        self.stdout.write("=== Creating Sample Data for Pharmacy Management System ===")
        
        try:
            # Create users
            users = self.create_sample_users()
            self.stdout.write("")
            
            # Create categories and generics
            categories, generics = self.create_sample_categories_and_generics()
            self.stdout.write("")
            
            # Create products
            products = self.create_sample_products(categories, generics)
            self.stdout.write("")
            
            self.stdout.write(self.style.SUCCESS("=== Sample Data Creation Complete ==="))
            self.stdout.write("✅ Users created with login credentials")
            self.stdout.write("✅ Product categories and generic names")
            self.stdout.write("✅ Sample products with pricing and stock")
            self.stdout.write("✅ User addresses for testing")
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("🔑 Login Credentials:"))
            self.stdout.write("   Admin: admin@pharmacy.com / admin123")
            self.stdout.write("   Customer: customer@pharmacy.com / customer123")
            self.stdout.write("   Pharmacist: pharmacist@pharmacy.com / pharmacist123")
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS("🚀 Ready for testing!"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error creating sample data: {e}"))
            import traceback
            traceback.print_exc()

    def create_sample_users(self):
        """Create sample users for testing"""
        self.stdout.write("Creating sample users...")
        
        users_data = [
            {
                'email': 'admin@pharmacy.com',
                'password': 'admin123',
                'first_name': 'Admin',
                'last_name': 'User',
                'phone_number': '9876543210',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'customer@pharmacy.com',
                'password': 'customer123',
                'first_name': 'John',
                'last_name': 'Doe',
                'phone_number': '9876543211',
                'role': 'customer',
            },
            {
                'email': 'pharmacist@pharmacy.com',
                'password': 'pharmacist123',
                'first_name': 'Dr. Sarah',
                'last_name': 'Smith',
                'phone_number': '9876543212',
                'role': 'pharmacist',
                'is_staff': True,
            },
            {
                'email': 'customer2@pharmacy.com',
                'password': 'customer123',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'phone_number': '9876543213',
                'role': 'customer',
            },
            {
                'email': 'customer3@pharmacy.com',
                'password': 'customer123',
                'first_name': 'Mike',
                'last_name': 'Johnson',
                'phone_number': '9876543214',
                'role': 'customer',
            },
        ]
        
        created_users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f"✅ Created user: {user.email}")
            else:
                self.stdout.write(f"📝 User already exists: {user.email}")
            
            created_users.append(user)
            
            # Create address for each user
            Address.objects.get_or_create(
                user=user,
                defaults={
                    'address_line1': f'{random.randint(100, 999)} Main Street',
                    'city': random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']),
                    'state': random.choice(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal']),
                    'pincode': f'{random.randint(100000, 999999)}',
                    'is_default': True,
                }
            )
        
        self.stdout.write(f"Sample users created: {len(created_users)}")
        return created_users

    def create_sample_categories_and_generics(self):
        """Create sample categories and generic names"""
        self.stdout.write("Creating categories and generic names...")
        
        categories_data = [
            'Pain Relief', 'Antibiotics', 'Vitamins & Supplements', 
            'Diabetes Care', 'Heart & Blood Pressure', 'Digestive Health',
            'Respiratory Care', 'Skin Care', 'Eye Care', 'Women\'s Health'
        ]
        
        generics_data = [
            'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin',
            'Metformin', 'Amlodipine', 'Omeprazole', 'Salbutamol',
            'Cetirizine', 'Vitamin D3', 'Calcium Carbonate', 'Iron'
        ]
        
        categories = []
        for cat_name in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_name,
                defaults={'description': f'{cat_name} medications and products'}
            )
            categories.append(category)
        
        generics = []
        for generic_name in generics_data:
            generic, created = GenericName.objects.get_or_create(
                name=generic_name,
                defaults={'description': f'{generic_name} generic medicine'}
            )
            generics.append(generic)
        
        self.stdout.write(f"Categories created: {len(categories)}")
        self.stdout.write(f"Generic names created: {len(generics)}")
        return categories, generics

    def create_sample_products(self, categories, generics):
        """Create sample products"""
        self.stdout.write("Creating sample products...")
        
        products_data = [
            {
                'name': 'Paracetamol 500mg Tablets',
                'manufacturer': 'Cipla Ltd',
                'strength': '500mg',
                'form': 'Tablet',
                'price': 25.00,
                'mrp': 30.00,
                'stock_quantity': 100,
                'is_prescription_required': False,
            },
            {
                'name': 'Amoxicillin 250mg Capsules',
                'manufacturer': 'Sun Pharma',
                'strength': '250mg',
                'form': 'Capsule',
                'price': 45.00,
                'mrp': 55.00,
                'stock_quantity': 75,
                'is_prescription_required': True,
            },
            {
                'name': 'Vitamin D3 60000 IU Capsules',
                'manufacturer': 'Dr. Reddy\'s',
                'strength': '60000 IU',
                'form': 'Capsule',
                'price': 120.00,
                'mrp': 150.00,
                'stock_quantity': 50,
                'is_prescription_required': False,
            },
            {
                'name': 'Metformin 500mg Tablets',
                'manufacturer': 'Lupin Ltd',
                'strength': '500mg',
                'form': 'Tablet',
                'price': 35.00,
                'mrp': 42.00,
                'stock_quantity': 80,
                'is_prescription_required': True,
            },
            {
                'name': 'Cetirizine 10mg Tablets',
                'manufacturer': 'Ranbaxy',
                'strength': '10mg',
                'form': 'Tablet',
                'price': 18.00,
                'mrp': 22.00,
                'stock_quantity': 120,
                'is_prescription_required': False,
            },
            {
                'name': 'Omeprazole 20mg Capsules',
                'manufacturer': 'Cadila Healthcare',
                'strength': '20mg',
                'form': 'Capsule',
                'price': 65.00,
                'mrp': 78.00,
                'stock_quantity': 60,
                'is_prescription_required': True,
            },
            {
                'name': 'Ibuprofen 400mg Tablets',
                'manufacturer': 'Abbott',
                'strength': '400mg',
                'form': 'Tablet',
                'price': 32.00,
                'mrp': 40.00,
                'stock_quantity': 90,
                'is_prescription_required': False,
            },
            {
                'name': 'Azithromycin 500mg Tablets',
                'manufacturer': 'Zydus Cadila',
                'strength': '500mg',
                'form': 'Tablet',
                'price': 85.00,
                'mrp': 100.00,
                'stock_quantity': 40,
                'is_prescription_required': True,
            },
            {
                'name': 'Calcium Carbonate 500mg Tablets',
                'manufacturer': 'Mankind Pharma',
                'strength': '500mg',
                'form': 'Tablet',
                'price': 28.00,
                'mrp': 35.00,
                'stock_quantity': 110,
                'is_prescription_required': False,
            },
            {
                'name': 'Amlodipine 5mg Tablets',
                'manufacturer': 'Torrent Pharma',
                'strength': '5mg',
                'form': 'Tablet',
                'price': 42.00,
                'mrp': 52.00,
                'stock_quantity': 70,
                'is_prescription_required': True,
            },
        ]
        
        created_products = []
        for i, product_data in enumerate(products_data):
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                defaults={
                    **product_data,
                    'category': categories[i % len(categories)],
                    'generic_name': generics[i % len(generics)],
                    'description': f'{product_data["name"]} - High quality medicine from {product_data["manufacturer"]}',
                    'image_url': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f"✅ Created product: {product.name}")
            else:
                self.stdout.write(f"📝 Product already exists: {product.name}")
            
            created_products.append(product)
        
        self.stdout.write(f"Sample products created: {len(created_products)}")
        return created_products
