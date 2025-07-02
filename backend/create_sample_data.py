#!/usr/bin/env python
import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usermanagement.models import User, Address
from product.models import GenericName, Category, Product, Batch
from prescriptions.models import Prescription, PrescriptionDetail
from orders.models import Order, OrderItem
from inventory.models import Supplier, StockMovement
from datetime import datetime
import random

def create_sample_data():
    print("Creating sample data...")
    
    # Create superuser
    if not User.objects.filter(email='admin@pharmacy.com').exists():
        admin = User.objects.create_superuser(
            email='admin@pharmacy.com',
            password='admin123',
            first_name='Admin',
            last_name='User',
            phone_number='1234567890',
            role='admin'
        )
        print("✓ Created admin user")
    
    # Create sample users
    users_data = [
        {
            'email': 'pharmacist@pharmacy.com',
            'password': 'pharma123',
            'first_name': 'John',
            'last_name': 'Pharmacist',
            'phone_number': '9876543210',
            'role': 'pharmacist'
        },
        {
            'email': 'customer1@example.com',
            'password': 'customer123',
            'first_name': 'Alice',
            'last_name': 'Johnson',
            'phone_number': '5555551234',
            'role': 'customer'
        },
        {
            'email': 'customer2@example.com',
            'password': 'customer123',
            'first_name': 'Bob',
            'last_name': 'Smith',
            'phone_number': '5555555678',
            'role': 'customer'
        }
    ]
    
    for user_data in users_data:
        if not User.objects.filter(email=user_data['email']).exists():
            User.objects.create_user(**user_data)
    print("✓ Created sample users")
    
    # Create categories
    categories_data = [
        {'name': 'Antibiotics', 'description': 'Medicines that fight bacterial infections'},
        {'name': 'Pain Relief', 'description': 'Analgesics and pain management medicines'},
        {'name': 'Cardiovascular', 'description': 'Heart and blood pressure medicines'},
        {'name': 'Diabetes', 'description': 'Diabetes management medicines'},
        {'name': 'Gastrointestinal', 'description': 'Digestive system medicines'},
        {'name': 'Respiratory', 'description': 'Breathing and lung medicines'},
    ]
    
    for cat_data in categories_data:
        Category.objects.get_or_create(name=cat_data['name'], defaults=cat_data)
    print("✓ Created categories")
    
    # Create generic names
    generics_data = [
        {'name': 'Amoxicillin', 'description': 'Penicillin antibiotic'},
        {'name': 'Ibuprofen', 'description': 'Non-steroidal anti-inflammatory drug'},
        {'name': 'Paracetamol', 'description': 'Pain reliever and fever reducer'},
        {'name': 'Metformin', 'description': 'Type 2 diabetes medication'},
        {'name': 'Omeprazole', 'description': 'Proton pump inhibitor'},
        {'name': 'Salbutamol', 'description': 'Bronchodilator for asthma'},
        {'name': 'Amlodipine', 'description': 'Calcium channel blocker'},
        {'name': 'Atorvastatin', 'description': 'Cholesterol-lowering medication'},
    ]
    
    for generic_data in generics_data:
        GenericName.objects.get_or_create(name=generic_data['name'], defaults=generic_data)
    print("✓ Created generic names")
    
    # Create products
    products_data = [
        {
            'name': 'Amoxil 500mg',
            'generic_name': 'Amoxicillin',
            'category': 'Antibiotics',
            'strength': '500mg',
            'form': 'Capsule',
            'price': Decimal('25.50'),
            'mrp': Decimal('30.00'),
            'stock_quantity': 150,
            'min_stock_level': 20,
            'is_prescription_required': True,
            'hsn_code': '30041000',
            'packaging_unit': 'Strip',
            'pack_size': '10 Capsules'
        },
        {
            'name': 'Brufen 400mg',
            'generic_name': 'Ibuprofen',
            'category': 'Pain Relief',
            'strength': '400mg',
            'form': 'Tablet',
            'price': Decimal('15.75'),
            'mrp': Decimal('18.00'),
            'stock_quantity': 8,  # Low stock
            'min_stock_level': 15,
            'is_prescription_required': False,
            'hsn_code': '30041000',
            'packaging_unit': 'Strip',
            'pack_size': '10 Tablets'
        },
        {
            'name': 'Crocin 650mg',
            'generic_name': 'Paracetamol',
            'category': 'Pain Relief',
            'strength': '650mg',
            'form': 'Tablet',
            'price': Decimal('12.00'),
            'mrp': Decimal('15.00'),
            'stock_quantity': 200,
            'min_stock_level': 25,
            'is_prescription_required': False,
            'hsn_code': '30041000',
            'packaging_unit': 'Strip',
            'pack_size': '15 Tablets'
        },
        {
            'name': 'Glycomet 500mg',
            'generic_name': 'Metformin',
            'category': 'Diabetes',
            'strength': '500mg',
            'form': 'Tablet',
            'price': Decimal('45.00'),
            'mrp': Decimal('50.00'),
            'stock_quantity': 0,  # Out of stock
            'min_stock_level': 10,
            'is_prescription_required': True,
            'hsn_code': '30041000',
            'packaging_unit': 'Strip',
            'pack_size': '20 Tablets'
        },
        {
            'name': 'Omez 20mg',
            'generic_name': 'Omeprazole',
            'category': 'Gastrointestinal',
            'strength': '20mg',
            'form': 'Capsule',
            'price': Decimal('35.25'),
            'mrp': Decimal('40.00'),
            'stock_quantity': 75,
            'min_stock_level': 15,
            'is_prescription_required': True,
            'hsn_code': '30041000',
            'packaging_unit': 'Strip',
            'pack_size': '10 Capsules'
        },
        {
            'name': 'Asthalin Inhaler',
            'generic_name': 'Salbutamol',
            'category': 'Respiratory',
            'strength': '100mcg',
            'form': 'Inhaler',
            'price': Decimal('125.00'),
            'mrp': Decimal('140.00'),
            'stock_quantity': 30,
            'min_stock_level': 10,
            'is_prescription_required': True,
            'hsn_code': '30041000',
            'packaging_unit': 'Unit',
            'pack_size': '200 doses'
        }
    ]
    
    for product_data in products_data:
        generic_name = GenericName.objects.get(name=product_data.pop('generic_name'))
        category = Category.objects.get(name=product_data.pop('category'))
        
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults={
                **product_data,
                'generic_name': generic_name,
                'category': category
            }
        )
    print("✓ Created products")
    
    # Create batches for products
    products = Product.objects.all()
    for product in products:
        if product.stock_quantity > 0:
            # Create 1-2 batches per product
            batch_count = 1 if product.stock_quantity < 50 else 2
            quantity_per_batch = product.stock_quantity // batch_count
            
            for i in range(batch_count):
                batch_number = f"B{product.id:03d}{i+1:02d}"
                expiry_date = date.today() + timedelta(days=365 + (i * 180))  # 1-2 years from now
                
                Batch.objects.get_or_create(
                    product=product,
                    batch_number=batch_number,
                    defaults={
                        'quantity': quantity_per_batch,
                        'current_quantity': quantity_per_batch,
                        'expiry_date': expiry_date,
                        'cost_price': product.price * Decimal('0.7'),  # 70% of selling price
                        'selling_price': product.price,
                        'manufacturing_date': date.today() - timedelta(days=30)
                    }
                )
    print("✓ Created batches")
    
    # Create suppliers
    suppliers_data = [
        {
            'name': 'MedSupply Corp',
            'contact_person': 'John Doe',
            'email': 'john@medsupply.com',
            'phone': '9876543210',
            'address': '123 Medical Street, Healthcare City',
            'gst_number': 'GST123456789'
        },
        {
            'name': 'PharmaDist Ltd',
            'contact_person': 'Jane Smith',
            'email': 'jane@pharmadist.com',
            'phone': '8765432109',
            'address': '456 Pharma Avenue, Medicine Town',
            'gst_number': 'GST987654321'
        }
    ]
    
    for supplier_data in suppliers_data:
        Supplier.objects.get_or_create(name=supplier_data['name'], defaults=supplier_data)
    print("✓ Created suppliers")

    # Create sample prescriptions
    create_prescription_data()

    print("\n🎉 Sample data created successfully!")
    print("\nLogin credentials:")
    print("Admin: admin@pharmacy.com / admin123")
    print("Pharmacist: pharmacist@pharmacy.com / pharma123")
    print("Customer: customer1@example.com / customer123")

def create_prescription_data():
    """Create realistic prescription demo data"""

    # Get users and products
    customers = User.objects.filter(role='customer')
    pharmacist = User.objects.filter(role='pharmacist').first()
    admin = User.objects.filter(role='admin').first()

    if not customers.exists():
        print("⚠️ No customers found, skipping prescription creation")
        return

    # Sample prescription image URLs (placeholder URLs for demo)
    prescription_images = [
        "https://example.com/prescriptions/rx001.jpg",
        "https://example.com/prescriptions/rx002.jpg",
        "https://example.com/prescriptions/rx003.jpg",
        "https://example.com/prescriptions/rx004.jpg",
        "https://example.com/prescriptions/rx005.jpg",
        "https://example.com/prescriptions/rx006.jpg",
        "https://example.com/prescriptions/rx007.jpg",
        "https://example.com/prescriptions/rx008.jpg"
    ]

    # Realistic prescription scenarios
    prescription_scenarios = [
        {
            'status': 'Pending_Review',
            'ai_processed': True,
            'ai_confidence': 0.85,
            'medicines': [
                {
                    'raw_text': '1. Amoxil 500mg - Take 1 capsule twice daily for 7 days',
                    'ai_medicine': 'Amoxil 500mg',
                    'ai_dosage': '500mg',
                    'ai_quantity': '14 capsules',
                    'ai_instructions': 'Take 1 capsule twice daily for 7 days',
                    'confidence': 0.92
                },
                {
                    'raw_text': '2. Crocin 650mg - 1 tablet when needed for fever',
                    'ai_medicine': 'Crocin 650mg',
                    'ai_dosage': '650mg',
                    'ai_quantity': '10 tablets',
                    'ai_instructions': '1 tablet when needed for fever',
                    'confidence': 0.88
                }
            ]
        },
        {
            'status': 'Verified',
            'ai_processed': True,
            'ai_confidence': 0.91,
            'verified_by': pharmacist,
            'verification_date': datetime.now(),
            'pharmacist_notes': 'Prescription verified. All medications available in stock.',
            'medicines': [
                {
                    'raw_text': '1. Glycomet 500mg - 1 tab twice daily before meals',
                    'ai_medicine': 'Glycomet 500mg',
                    'ai_dosage': '500mg',
                    'ai_quantity': '60 tablets',
                    'ai_instructions': '1 tablet twice daily before meals',
                    'verified_medicine': 'Glycomet 500mg',
                    'verified_dosage': '500mg',
                    'verified_quantity': '60 tablets',
                    'verified_instructions': '1 tablet twice daily before meals',
                    'mapping_status': 'Mapped',
                    'is_valid': True,
                    'confidence': 0.94
                },
                {
                    'raw_text': '2. Omez 20mg - 1 cap daily before breakfast',
                    'ai_medicine': 'Omez 20mg',
                    'ai_dosage': '20mg',
                    'ai_quantity': '30 capsules',
                    'ai_instructions': '1 capsule daily before breakfast',
                    'verified_medicine': 'Omez 20mg',
                    'verified_dosage': '20mg',
                    'verified_quantity': '30 capsules',
                    'verified_instructions': '1 capsule daily before breakfast',
                    'mapping_status': 'Mapped',
                    'is_valid': True,
                    'confidence': 0.89
                }
            ]
        },
        {
            'status': 'Pending_Review',
            'ai_processed': True,
            'ai_confidence': 0.76,
            'medicines': [
                {
                    'raw_text': '1. Asthalin Inhaler - 2 puffs when needed',
                    'ai_medicine': 'Asthalin Inhaler',
                    'ai_dosage': '100mcg',
                    'ai_quantity': '1 inhaler',
                    'ai_instructions': '2 puffs when needed for breathing difficulty',
                    'confidence': 0.87
                },
                {
                    'raw_text': '2. Brufen 400mg - 1 tab after food if pain',
                    'ai_medicine': 'Brufen 400mg',
                    'ai_dosage': '400mg',
                    'ai_quantity': '10 tablets',
                    'ai_instructions': '1 tablet after food if pain',
                    'confidence': 0.82
                }
            ]
        },
        {
            'status': 'Rejected',
            'ai_processed': True,
            'ai_confidence': 0.45,
            'verified_by': pharmacist,
            'verification_date': datetime.now(),
            'rejection_reason': 'Prescription image is unclear and handwriting is illegible. Please upload a clearer image.',
            'pharmacist_notes': 'Unable to read doctor\'s handwriting clearly. Multiple medications cannot be identified.',
            'medicines': [
                {
                    'raw_text': '1. [Unclear text] - dosage unclear',
                    'ai_medicine': None,
                    'ai_dosage': None,
                    'ai_quantity': None,
                    'ai_instructions': None,
                    'mapping_status': 'Unmapped',
                    'is_valid': False,
                    'confidence': 0.23
                },
                {
                    'raw_text': '2. [Illegible handwriting]',
                    'ai_medicine': None,
                    'ai_dosage': None,
                    'ai_quantity': None,
                    'ai_instructions': None,
                    'mapping_status': 'Unmapped',
                    'is_valid': False,
                    'confidence': 0.15
                }
            ]
        },
        {
            'status': 'Verified',
            'ai_processed': True,
            'ai_confidence': 0.89,
            'verified_by': admin,
            'verification_date': datetime.now(),
            'pharmacist_notes': 'Emergency prescription verified by admin. Patient has chronic condition.',
            'medicines': [
                {
                    'raw_text': '1. Amoxil 500mg - 1 cap TID x 10 days',
                    'ai_medicine': 'Amoxil 500mg',
                    'ai_dosage': '500mg',
                    'ai_quantity': '30 capsules',
                    'ai_instructions': '1 capsule three times daily for 10 days',
                    'verified_medicine': 'Amoxil 500mg',
                    'verified_dosage': '500mg',
                    'verified_quantity': '30 capsules',
                    'verified_instructions': '1 capsule three times daily for 10 days',
                    'mapping_status': 'Mapped',
                    'is_valid': True,
                    'confidence': 0.91
                }
            ]
        }
    ]

    # Create prescriptions
    for i, scenario in enumerate(prescription_scenarios):
        customer = random.choice(customers)

        # Create prescription
        prescription_data = {
            'user': customer,
            'image_url': prescription_images[i % len(prescription_images)],
            'verification_status': scenario['status'],
            'ai_processed': scenario['ai_processed'],
            'ai_confidence_score': scenario['ai_confidence'],
            'upload_date': datetime.now() - timedelta(days=random.randint(1, 30))
        }

        # Add verification data if applicable
        if scenario['status'] in ['Verified', 'Rejected']:
            prescription_data['verified_by_admin'] = scenario.get('verified_by')
            prescription_data['verification_date'] = scenario.get('verification_date')
            prescription_data['pharmacist_notes'] = scenario.get('pharmacist_notes')
            if scenario['status'] == 'Rejected':
                prescription_data['rejection_reason'] = scenario.get('rejection_reason')

        prescription, created = Prescription.objects.get_or_create(
            user=customer,
            image_url=prescription_data['image_url'],
            defaults=prescription_data
        )

        if created:
            # Create prescription details
            for line_num, medicine in enumerate(scenario['medicines'], 1):
                detail_data = {
                    'prescription': prescription,
                    'line_number': line_num,
                    'recognized_text_raw': medicine['raw_text'],
                    'ai_extracted_medicine_name': medicine.get('ai_medicine'),
                    'ai_extracted_dosage': medicine.get('ai_dosage'),
                    'ai_extracted_quantity': medicine.get('ai_quantity'),
                    'ai_extracted_instructions': medicine.get('ai_instructions'),
                    'ai_confidence_score': medicine.get('confidence'),
                    'mapping_status': medicine.get('mapping_status', 'Pending'),
                    'is_valid_for_order': medicine.get('is_valid', False)
                }

                # Add verified data if available
                if medicine.get('verified_medicine'):
                    detail_data.update({
                        'verified_medicine_name': medicine['verified_medicine'],
                        'verified_dosage': medicine['verified_dosage'],
                        'verified_quantity': medicine['verified_quantity'],
                        'verified_instructions': medicine['verified_instructions']
                    })

                    # Try to map to actual product
                    try:
                        product = Product.objects.filter(name__icontains=medicine['verified_medicine'].split()[0]).first()
                        if product:
                            detail_data['mapped_product'] = product
                    except:
                        pass

                PrescriptionDetail.objects.create(**detail_data)

    print("✓ Created realistic prescription demo data")

if __name__ == '__main__':
    create_sample_data()
