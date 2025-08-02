#!/usr/bin/env python3
"""
Create comprehensive sample data for the Pharmacy Management System
This script creates users, products, orders, and prescriptions for testing
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usermanagement.models import User, Address
from product.models import Product, Category, GenericName
from order.models import Order, OrderItem
from prescriptions.models import Prescription, PrescriptionDetail


def create_sample_users():
    """Create sample users for testing"""
    print("Creating sample users...")
    
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
            print(f"✅ Created user: {user.email}")
        else:
            print(f"📝 User already exists: {user.email}")
        
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
    
    print(f"Sample users created: {len(created_users)}")
    return created_users


def create_sample_categories_and_generics():
    """Create sample categories and generic names"""
    print("Creating categories and generic names...")
    
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
    
    print(f"Categories created: {len(categories)}")
    print(f"Generic names created: {len(generics)}")
    return categories, generics


def create_sample_products(categories, generics):
    """Create sample products"""
    print("Creating sample products...")
    
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
            print(f"✅ Created product: {product.name}")
        else:
            print(f"📝 Product already exists: {product.name}")
        
        created_products.append(product)
    
    print(f"Sample products created: {len(created_products)}")
    return created_products


def main():
    """Main function to create all sample data"""
    print("=== Creating Sample Data for Pharmacy Management System ===")
    print()
    
    try:
        # Create users
        users = create_sample_users()
        print()
        
        # Create categories and generics
        categories, generics = create_sample_categories_and_generics()
        print()
        
        # Create products
        products = create_sample_products(categories, generics)
        print()
        
        print("=== Sample Data Creation Complete ===")
        print("✅ Users created with login credentials")
        print("✅ Product categories and generic names")
        print("✅ Sample products with pricing and stock")
        print("✅ User addresses for testing")
        print()
        print("🔑 Login Credentials:")
        print("   Admin: admin@pharmacy.com / admin123")
        print("   Customer: customer@pharmacy.com / customer123")
        print("   Pharmacist: pharmacist@pharmacy.com / pharmacist123")
        print()
        print("🚀 Ready for testing!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
