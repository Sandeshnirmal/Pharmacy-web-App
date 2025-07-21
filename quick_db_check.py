#!/usr/bin/env python3
"""
Quick Database Check Script
Verifies medicines in the database for OCR cross-check
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from product.models import Product, GenericName, Category

def check_database_contents():
    """Check and display database contents"""
    print("🔍 Quick Database Contents Check")
    print("=" * 50)
    
    # Check products
    products = Product.objects.all()
    print(f"📦 Total Products: {products.count()}")
    
    if products.count() == 0:
        print("❌ No products found in database!")
        return
    
    # Group by category
    categories = {}
    for product in products:
        category_name = product.category.name if product.category else 'Uncategorized'
        if category_name not in categories:
            categories[category_name] = []
        categories[category_name].append(product)
    
    print(f"\n📋 Products by Category:")
    for category_name, category_products in categories.items():
        print(f"\n   {category_name} ({len(category_products)} products):")
        for product in category_products:
            generic_name = product.generic_name.name if product.generic_name else 'N/A'
            prescription_required = "Prescription" if product.is_prescription_required else "OTC"
            print(f"     - {product.name} ({product.strength}) - {generic_name}")
            print(f"       Manufacturer: {product.manufacturer}")
            print(f"       Price: ₹{product.price} | Type: {prescription_required}")
            print(f"       Stock: {product.stock_quantity}")
    
    # Check generic names
    generics = GenericName.objects.all()
    print(f"\n💊 Generic Names ({generics.count()}):")
    for generic in generics:
        print(f"   - {generic.name}")
    
    # Check categories
    cats = Category.objects.all()
    print(f"\n🏷️ Categories ({cats.count()}):")
    for cat in cats:
        print(f"   - {cat.name}")
    
    # Test search patterns
    print(f"\n🔍 Testing Search Patterns:")
    test_medicines = ['Amoxil', 'Crocin', 'Paracetamol', 'Omez', 'Glycomet']
    
    for medicine in test_medicines:
        matches = Product.objects.filter(name__icontains=medicine)
        print(f"   '{medicine}': {matches.count()} matches")
        for match in matches[:2]:  # Show first 2 matches
            print(f"     - {match.name} ({match.manufacturer})")

def check_ocr_patterns():
    """Check OCR service patterns"""
    print(f"\n🧠 OCR Pattern Analysis:")
    print("-" * 30)
    
    # Common medicine patterns from OCR service
    patterns = {
        'paracetamol': ['paracetamol', 'acetaminophen', 'tylenol', 'crocin', 'dolo'],
        'ibuprofen': ['ibuprofen', 'brufen', 'advil', 'nurofen'],
        'amoxicillin': ['amoxicillin', 'amoxil', 'amoxy', 'cipmox'],
        'omeprazole': ['omeprazole', 'omez', 'prilosec'],
        'metformin': ['metformin', 'glycomet', 'glucophage'],
        'cetirizine': ['cetirizine', 'zyrtec', 'cetrizet'],
        'azithromycin': ['azithromycin', 'azee', 'zithromax'],
    }
    
    for generic, variations in patterns.items():
        print(f"\n   {generic.upper()}:")
        for variation in variations:
            matches = Product.objects.filter(
                name__icontains=variation
            ).count()
            print(f"     '{variation}': {matches} matches")

def main():
    """Main function"""
    try:
        check_database_contents()
        check_ocr_patterns()
        
        print(f"\n✅ Database check completed successfully!")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main() 