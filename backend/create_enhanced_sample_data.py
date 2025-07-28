#!/usr/bin/env python3
"""
Enhanced Sample Data Creation Script for Pharmacy Management System
Creates comprehensive test data for orders, prescriptions, and products
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from product.models import Product, GenericName, Category
from orders.models import Order, OrderItem
from prescriptions.models import Prescription, PrescriptionDetail
from usermanagement.models import Address

User = get_user_model()

def create_enhanced_products():
    """Create enhanced product data with better medicine mapping"""
    print("Creating enhanced product data...")
    
    # Manufacturer names (as strings since it's a CharField)
    manufacturers = [
        'Cipla Ltd', 'Sun Pharma', 'Dr. Reddy\'s', 'Lupin', 'Aurobindo Pharma',
        'Torrent Pharma', 'Glenmark', 'Cadila Healthcare', 'Alkem Labs', 'Abbott'
    ]
    
    # Create categories
    categories = [
        'Antibiotics', 'Analgesics', 'Antacids', 'Diabetes Care', 
        'Cardiovascular', 'Respiratory', 'Vitamins', 'Skin Care'
    ]
    
    category_objects = []
    for name in categories:
        category, created = Category.objects.get_or_create(
            name=name,
            defaults={'description': f'{name} medicines and treatments'}
        )
        category_objects.append(category)
    
    # Create generic names
    generic_names = [
        'Amoxicillin', 'Paracetamol', 'Ibuprofen', 'Metformin', 'Omeprazole',
        'Salbutamol', 'Amlodipine', 'Atorvastatin', 'Ciprofloxacin', 'Azithromycin'
    ]
    
    generic_objects = []
    for name in generic_names:
        generic, created = GenericName.objects.get_or_create(
            name=name,
            defaults={'description': f'{name} - Generic medicine'}
        )
        generic_objects.append(generic)
    
    # Enhanced product data with better mapping
    enhanced_products = [
        # Antibiotics
        {'name': 'Amoxil 500mg', 'generic': 'Amoxicillin', 'strength': '500mg', 'form': 'Capsule', 'price': 120, 'mrp': 150, 'category': 'Antibiotics', 'manufacturer': 'Cipla Ltd', 'prescription_required': True},
        {'name': 'Amoxy 250mg', 'generic': 'Amoxicillin', 'strength': '250mg', 'form': 'Tablet', 'price': 80, 'mrp': 100, 'category': 'Antibiotics', 'manufacturer': 'Sun Pharma', 'prescription_required': True},
        {'name': 'Cipmox 500mg', 'generic': 'Amoxicillin', 'strength': '500mg', 'form': 'Capsule', 'price': 115, 'mrp': 140, 'category': 'Antibiotics', 'manufacturer': 'Cipla Ltd', 'prescription_required': True},
        
        # Pain Relief
        {'name': 'Crocin 650mg', 'generic': 'Paracetamol', 'strength': '650mg', 'form': 'Tablet', 'price': 25, 'mrp': 30, 'category': 'Analgesics', 'manufacturer': 'Dr. Reddy\'s', 'prescription_required': False},
        {'name': 'Paracetamol 500mg', 'generic': 'Paracetamol', 'strength': '500mg', 'form': 'Tablet', 'price': 15, 'mrp': 20, 'category': 'Analgesics', 'manufacturer': 'Lupin', 'prescription_required': False},
        {'name': 'Dolo 650mg', 'generic': 'Paracetamol', 'strength': '650mg', 'form': 'Tablet', 'price': 28, 'mrp': 35, 'category': 'Analgesics', 'manufacturer': 'Abbott', 'prescription_required': False},
        {'name': 'Brufen 400mg', 'generic': 'Ibuprofen', 'strength': '400mg', 'form': 'Tablet', 'price': 45, 'mrp': 55, 'category': 'Analgesics', 'manufacturer': 'Abbott', 'prescription_required': False},
        
        # Diabetes
        {'name': 'Glycomet 500mg', 'generic': 'Metformin', 'strength': '500mg', 'form': 'Tablet', 'price': 85, 'mrp': 100, 'category': 'Diabetes Care', 'manufacturer': 'Sun Pharma', 'prescription_required': True},
        {'name': 'Metformin 850mg', 'generic': 'Metformin', 'strength': '850mg', 'form': 'Tablet', 'price': 120, 'mrp': 145, 'category': 'Diabetes Care', 'manufacturer': 'Cipla Ltd', 'prescription_required': True},
        
        # Antacids
        {'name': 'Omez 20mg', 'generic': 'Omeprazole', 'strength': '20mg', 'form': 'Capsule', 'price': 95, 'mrp': 115, 'category': 'Antacids', 'manufacturer': 'Dr. Reddy\'s', 'prescription_required': True},
        {'name': 'Omeprazole 40mg', 'generic': 'Omeprazole', 'strength': '40mg', 'form': 'Capsule', 'price': 140, 'mrp': 170, 'category': 'Antacids', 'manufacturer': 'Lupin', 'prescription_required': True},
        
        # Respiratory
        {'name': 'Asthalin Inhaler', 'generic': 'Salbutamol', 'strength': '100mcg', 'form': 'Inhaler', 'price': 180, 'mrp': 220, 'category': 'Respiratory', 'manufacturer': 'Cipla Ltd', 'prescription_required': True},
        {'name': 'Ventolin Inhaler', 'generic': 'Salbutamol', 'strength': '100mcg', 'form': 'Inhaler', 'price': 195, 'mrp': 240, 'category': 'Respiratory', 'manufacturer': 'Abbott', 'prescription_required': True},
    ]
    
    created_products = []
    for product_data in enhanced_products:
        # Get related objects
        generic = next((g for g in generic_objects if g.name == product_data['generic']), None)
        category = next((c for c in category_objects if c.name == product_data['category']), None)
        
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults={
                'generic_name': generic,
                'strength': product_data['strength'],
                'form': product_data['form'],
                'price': Decimal(str(product_data['price'])),
                'mrp': Decimal(str(product_data['mrp'])),
                'category': category,
                'manufacturer': product_data['manufacturer'],
                'is_prescription_required': product_data['prescription_required'],
                'stock_quantity': random.randint(50, 500),
                'description': f'{product_data["name"]} - {product_data["strength"]} {product_data["form"]}',
                'hsn_code': f'3004{random.randint(10, 99)}',
                'packaging_unit': 'Strip',
                'pack_size': '10 Tablets',
            }
        )
        created_products.append(product)
        if created:
            print(f"Created product: {product.name}")
    
    print(f"Enhanced products created: {len(created_products)}")
    return created_products

def create_sample_orders():
    """Create sample orders for testing"""
    print("Creating sample orders...")
    
    # Get or create test users
    users = []
    for i in range(5):
        user, created = User.objects.get_or_create(
            email=f'customer{i+1}@example.com',
            defaults={
                'first_name': f'Customer{i+1}',
                'last_name': 'User',
                'phone_number': f'98765432{i+1}0',
                'is_active': True,
            }
        )
        users.append(user)
        
        # Create address for user
        Address.objects.get_or_create(
            user=user,
            defaults={
                'address_line1': f'{i+1}23 Main Street',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': f'40000{i+1}',
                'is_default': True,
            }
        )
    
    # Create sample orders
    products = Product.objects.all()[:10]
    order_statuses = ['Pending', 'Processing', 'Shipped', 'Delivered']
    payment_methods = ['UPI', 'Card', 'COD']
    
    for i in range(20):
        user = random.choice(users)
        address = user.addresses.first()
        
        order = Order.objects.create(
            user=user,
            address=address,
            total_amount=Decimal(str(random.randint(200, 2000))),
            payment_method=random.choice(payment_methods),
            payment_status='Paid' if random.choice([True, False]) else 'Pending',
            order_status=random.choice(order_statuses),
            is_prescription_order=random.choice([True, False]),
            order_date=datetime.now() - timedelta(days=random.randint(1, 30))
        )
        
        # Add order items
        num_items = random.randint(1, 4)
        selected_products = random.sample(list(products), min(num_items, len(products)))
        
        for product in selected_products:
            quantity = random.randint(1, 3)
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price_at_order=product.price,
            )
        
        print(f"Created order {order.id} for {user.email}")
    
    print("Sample orders created successfully!")

def create_sample_prescriptions():
    """Create sample prescriptions with AI processing results"""
    print("Creating sample prescriptions...")
    
    users = User.objects.filter(email__startswith='customer')
    products = Product.objects.all()
    
    # Sample prescription scenarios
    prescription_scenarios = [
        {
            'doctor_name': 'Dr. Rajesh Kumar',
            'patient_name': 'John Doe',
            'medicines': [
                {'name': 'Amoxil', 'dosage': '500mg', 'frequency': 'twice daily', 'duration': '7 days'},
                {'name': 'Crocin', 'dosage': '650mg', 'frequency': 'when needed', 'duration': 'for fever'},
                {'name': 'Omez', 'dosage': '20mg', 'frequency': 'once daily', 'duration': '14 days'},
            ]
        },
        {
            'doctor_name': 'Dr. Priya Sharma',
            'patient_name': 'Alice Johnson',
            'medicines': [
                {'name': 'Glycomet', 'dosage': '500mg', 'frequency': 'twice daily', 'duration': '30 days'},
                {'name': 'Brufen', 'dosage': '400mg', 'frequency': 'after food', 'duration': 'if pain'},
            ]
        },
        {
            'doctor_name': 'Dr. Amit Patel',
            'patient_name': 'Bob Smith',
            'medicines': [
                {'name': 'Amoxy', 'dosage': '250mg', 'frequency': 'three times daily', 'duration': '10 days'},
                {'name': 'Paracetamol', 'dosage': '500mg', 'frequency': 'every 6 hours', 'duration': 'for fever'},
            ]
        }
    ]
    
    for i, scenario in enumerate(prescription_scenarios):
        user = random.choice(users)
        
        # Create prescription
        prescription = Prescription.objects.create(
            user=user,
            image_url=f'https://example.com/prescription_{i+1}.jpg',
            verification_status='AI_Processed',
            doctor_name=scenario['doctor_name'],
            patient_name=scenario['patient_name'],
            ai_processed=True,
            ai_confidence_score=random.uniform(0.7, 0.95),
            ai_processing_time=random.uniform(2.0, 5.0),
            upload_date=datetime.now() - timedelta(days=random.randint(1, 10))
        )
        
        # Create prescription details
        for j, medicine in enumerate(scenario['medicines']):
            # Find matching products
            matching_products = products.filter(name__icontains=medicine['name'])
            
            detail = PrescriptionDetail.objects.create(
                prescription=prescription,
                line_number=j + 1,
                recognized_text_raw=f"{j+1}. {medicine['name']} {medicine['dosage']} - {medicine['frequency']} {medicine['duration']}",
                extracted_medicine_name=medicine['name'],
                extracted_dosage=medicine['dosage'],
                extracted_frequency=medicine['frequency'],
                extracted_duration=medicine['duration'],
                extracted_instructions=f"{medicine['frequency']} {medicine['duration']}",
                ai_confidence_score=random.uniform(0.8, 0.95),
                mapping_status='Mapped' if matching_products.exists() else 'Pending',
                is_valid_for_order=matching_products.exists(),
            )
            
            if matching_products.exists():
                best_match = matching_products.first()
                detail.mapped_product = best_match
                detail.verified_medicine_name = best_match.name
                detail.verified_dosage = best_match.strength
                detail.suggested_products.set(matching_products[:3])
                detail.save()
        
        print(f"Created prescription {prescription.id} for {user.email}")
    
    print("Sample prescriptions created successfully!")

def main():
    """Main function to create all sample data"""
    print("=== Creating Enhanced Sample Data ===")
    
    try:
        # Create enhanced products
        create_enhanced_products()
        
        # Create sample orders
        create_sample_orders()
        
        # Create sample prescriptions
        create_sample_prescriptions()
        
        print("\n=== Sample Data Creation Complete ===")
        print("✅ Enhanced products with better medicine mapping")
        print("✅ Sample orders with various statuses")
        print("✅ Sample prescriptions with AI processing results")
        print("✅ Ready for testing prescription scanning and order management")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
