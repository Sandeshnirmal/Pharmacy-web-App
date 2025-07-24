#!/usr/bin/env python3
"""
Test OCR to Medicine Matching Flow
Tests the complete flow from OCR extraction to medicine database matching
"""

import os
import sys
import django
import requests
import json
from PIL import Image, ImageDraw, ImageFont

# Setup Django
sys.path.append('/home/santhakumar/Documents/project/Pharmacy-web-App/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from prescriptions.ocr_service import OCRService
from product.models import Product, GenericName, Category

def create_test_prescription_image():
    """Create a test prescription image with medicine names"""
    
    # Create a white image
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw prescription header
    draw.text((50, 50), "Dr. Smith's Clinic", fill='black', font=font)
    draw.text((50, 80), "Prescription", fill='black', font=font)
    draw.text((50, 110), "Patient: John Doe", fill='black', font=small_font)
    draw.text((50, 130), "Date: 2025-01-20", fill='black', font=small_font)
    
    # Draw medicines (using medicines from our database)
    medicines = [
        "1. Crocin 650mg - Take 1 tablet twice daily after food for 3 days",
        "2. Azithral 500mg - Take 1 tablet once daily before food for 5 days", 
        "3. Omez 20mg - Take 1 capsule twice daily before meals for 7 days",
        "4. Cetrizine 10mg - Take 1 tablet at bedtime for 5 days"
    ]
    
    y_pos = 180
    for medicine in medicines:
        draw.text((50, y_pos), medicine, fill='black', font=small_font)
        y_pos += 40
    
    # Draw doctor signature area
    draw.text((50, y_pos + 50), "Dr. Smith", fill='black', font=small_font)
    draw.text((50, y_pos + 70), "MBBS, MD", fill='black', font=small_font)
    
    # Save the image
    img_path = '/tmp/test_prescription.png'
    img.save(img_path)
    print(f"✅ Test prescription image created: {img_path}")
    return img_path

def test_ocr_extraction(image_path):
    """Test OCR extraction from prescription image"""
    print("\n🔍 Testing OCR Extraction...")
    
    ocr_service = OCRService()
    result = ocr_service.extract_text_from_prescription(image_path)
    
    if result['success']:
        print(f"✅ OCR extraction successful!")
        print(f"   Confidence: {result['confidence_score']}")
        print(f"   Medicines found: {len(result['medicines'])}")
        
        for i, medicine in enumerate(result['medicines'], 1):
            print(f"   {i}. {medicine.get('name', 'Unknown')} - {medicine.get('strength', 'N/A')}")
        
        return result
    else:
        print(f"❌ OCR extraction failed: {result['error']}")
        return None

def test_medicine_matching(ocr_result):
    """Test medicine matching with database"""
    print("\n🔍 Testing Medicine Matching...")
    
    if not ocr_result or not ocr_result['success']:
        print("❌ No OCR result to test matching")
        return None
    
    ocr_service = OCRService()
    matching_result = ocr_service.match_medicines_with_database(ocr_result['medicines'])
    
    print(f"✅ Medicine matching completed!")
    print(f"   Total medicines processed: {len(matching_result)}")
    
    for i, match in enumerate(matching_result, 1):
        extracted = match['extracted_info']
        matches = match['database_matches']
        confidence = match['match_confidence']
        
        print(f"\n   Medicine {i}: {extracted.get('name', 'Unknown')}")
        print(f"   Confidence: {confidence:.2f}")
        print(f"   Database matches: {len(matches)}")
        
        if matches:
            best_match = matches[0]
            print(f"   Best match: {best_match['name']} (Score: {best_match['match_score']:.2f})")
            print(f"   Price: ₹{best_match['price']}")
            print(f"   Stock: {best_match['stock_quantity']}")
        else:
            print("   No database matches found")
    
    return matching_result

def test_database_products():
    """Test database products availability"""
    print("\n🔍 Testing Database Products...")
    
    total_products = Product.objects.count()
    categories = Category.objects.count()
    generic_names = GenericName.objects.count()
    
    print(f"✅ Database Status:")
    print(f"   Total products: {total_products}")
    print(f"   Categories: {categories}")
    print(f"   Generic names: {generic_names}")
    
    # Show sample products
    print(f"\n   Sample products:")
    for product in Product.objects.all()[:5]:
        print(f"   - {product.name} ({product.generic_name.name}) - ₹{product.price}")
    
    return total_products > 0

def test_api_endpoints():
    """Test API endpoints for mobile app"""
    print("\n🔍 Testing API Endpoints...")
    
    base_url = "http://192.168.129.6:8001"
    
    # Test product search API
    try:
        response = requests.get(f"{base_url}/product/products/?search=crocin", timeout=10)
        if response.status_code == 200:
            data = response.json()
            products_count = len(data) if isinstance(data, list) else len(data.get('results', []))
            print(f"✅ Product search API working - Found {products_count} products for 'crocin'")
        else:
            print(f"❌ Product search API failed - Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Product search API error: {e}")
    
    # Test enhanced product search
    try:
        response = requests.get(f"{base_url}/product/enhanced-products/?search=azithromycin", timeout=10)
        if response.status_code == 200:
            data = response.json()
            products_count = len(data) if isinstance(data, list) else len(data.get('results', []))
            print(f"✅ Enhanced product search API working - Found {products_count} products for 'azithromycin'")
        else:
            print(f"❌ Enhanced product search API failed - Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Enhanced product search API error: {e}")

def main():
    """Run complete OCR to medicine matching test"""
    print("🧪 OCR to Medicine Matching Flow Test")
    print("=" * 50)
    
    # Test 1: Database products
    if not test_database_products():
        print("❌ Database test failed - no products found")
        return
    
    # Test 2: Create test prescription
    try:
        image_path = create_test_prescription_image()
    except Exception as e:
        print(f"❌ Failed to create test image: {e}")
        return
    
    # Test 3: OCR extraction
    ocr_result = test_ocr_extraction(image_path)
    if not ocr_result:
        print("❌ OCR extraction failed")
        return
    
    # Test 4: Medicine matching
    matching_result = test_medicine_matching(ocr_result)
    if not matching_result:
        print("❌ Medicine matching failed")
        return
    
    # Test 5: API endpoints
    test_api_endpoints()
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    
    total_medicines = len(matching_result)
    matched_medicines = sum(1 for match in matching_result if match['database_matches'])
    high_confidence = sum(1 for match in matching_result if match['match_confidence'] > 0.8)
    
    print(f"   Total medicines extracted: {total_medicines}")
    print(f"   Successfully matched: {matched_medicines}")
    print(f"   High confidence matches: {high_confidence}")
    print(f"   Success rate: {(matched_medicines/total_medicines*100):.1f}%")
    
    if matched_medicines > 0:
        print("✅ OCR to Medicine Matching Flow: WORKING")
    else:
        print("❌ OCR to Medicine Matching Flow: NEEDS IMPROVEMENT")
    
    # Cleanup
    try:
        os.remove(image_path)
        print(f"🧹 Cleaned up test image")
    except:
        pass

if __name__ == "__main__":
    main()
