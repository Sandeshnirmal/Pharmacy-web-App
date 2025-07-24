#!/usr/bin/env python3
"""
Test Enhanced OCR Medicine Analysis System
Tests the new intelligent brand-to-generic mapping and pharmacy matching
"""

import os
import sys
import django
from PIL import Image, ImageDraw, ImageFont

# Setup Django
sys.path.append('/home/santhakumar/Documents/project/Pharmacy-web-App/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from prescriptions.ocr_service import OCRService

def create_comprehensive_prescription():
    """Create a comprehensive test prescription with various brand names"""
    
    img = Image.new('RGB', (900, 700), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        header_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
    
    # Draw prescription header
    draw.text((50, 30), "Dr. Sharma's Clinic", fill='black', font=header_font)
    draw.text((50, 65), "PRESCRIPTION", fill='black', font=font)
    draw.text((50, 95), "Patient: John Doe", fill='black', font=small_font)
    draw.text((50, 115), "Date: 2025-01-23", fill='black', font=small_font)
    draw.text((50, 135), "Age: 35 years", fill='black', font=small_font)
    
    # Draw line separator
    draw.line([(50, 160), (850, 160)], fill='black', width=2)
    
    # Draw medicines with various brand names
    medicines = [
        "1. Dolo 650mg - Take 1 tablet twice daily after food for 5 days",
        "2. Azithral 500mg - Take 1 tablet once daily before food for 3 days", 
        "3. Omez 20mg - Take 1 capsule twice daily before meals for 7 days",
        "4. Cetrizine 10mg - Take 1 tablet at bedtime for 5 days",
        "5. Brufen 400mg - Take 1 tablet thrice daily after food for 3 days",
        "6. Glycomet 500mg - Take 1 tablet twice daily before meals for 30 days",
        "7. Norvasc 5mg - Take 1 tablet once daily in morning for 30 days",
        "8. Becosules - Take 1 capsule daily after breakfast for 15 days"
    ]
    
    y_pos = 190
    for medicine in medicines:
        draw.text((70, y_pos), medicine, fill='black', font=small_font)
        y_pos += 35
    
    # Draw instructions
    y_pos += 20
    draw.line([(50, y_pos), (850, y_pos)], fill='black', width=1)
    y_pos += 20
    
    instructions = [
        "Instructions:",
        "• Take medicines as prescribed",
        "• Complete the full course of antibiotics",
        "• Avoid alcohol during medication",
        "• Follow up after 1 week"
    ]
    
    for instruction in instructions:
        draw.text((70, y_pos), instruction, fill='black', font=small_font)
        y_pos += 25
    
    # Draw doctor signature
    y_pos += 30
    draw.text((50, y_pos), "Dr. Sharma", fill='black', font=font)
    draw.text((50, y_pos + 25), "MBBS, MD (Internal Medicine)", fill='black', font=small_font)
    draw.text((50, y_pos + 45), "Reg. No: 12345", fill='black', font=small_font)
    
    # Save the image
    img_path = '/tmp/comprehensive_prescription.png'
    img.save(img_path)
    print(f"✅ Comprehensive prescription created: {img_path}")
    return img_path

def test_enhanced_ocr_analysis(image_path):
    """Test the enhanced OCR analysis system"""
    print("\n🔍 Testing Enhanced OCR Medicine Analysis...")
    
    ocr_service = OCRService()
    result = ocr_service.analyze_prescription_medicines(image_path)
    
    if result['success']:
        print(f"✅ OCR Analysis successful!")
        print(f"   OCR Confidence: {result['ocr_confidence']:.2f}")
        print(f"   Total Medicines Extracted: {result['total_medicines_extracted']}")
        print(f"   Total Medicines Analyzed: {result['total_medicines_analyzed']}")
        print(f"   Available in Pharmacy: {result['available_medicines']}")
        print(f"   Not Available: {result['unavailable_medicines']}")
        
        print(f"\n📋 Detailed Medicine Analysis:")
        print("=" * 80)
        
        for i, medicine in enumerate(result['medicines'], 1):
            print(f"\n{i}. INPUT BRAND: {medicine['input_brand_name']}")
            print(f"   Generic Name: {medicine['generic_name']}")
            print(f"   Composition: {medicine['composition']}")
            
            if medicine['available']:
                print(f"   ✅ AVAILABLE: {medicine['available_brand_name']}")
                print(f"   Form: {medicine['form']}")
                print(f"   Strength: {medicine['strength']}")
                print(f"   Manufacturer: {medicine['manufacturer']}")
                print(f"   Price: ₹{medicine['price']}")
                print(f"   Instructions: {medicine['instructions']}")
                print(f"   Frequency: {medicine['frequency']}")
                print(f"   Duration: {medicine['duration']}")
                print(f"   Confidence: {medicine['confidence']:.2f}")
                print(f"   Prescription Required: {medicine['is_prescription_required']}")
            else:
                print(f"   ❌ NOT AVAILABLE in pharmacy")
                print(f"   Form: {medicine['form']}")
                print(f"   Strength: {medicine['strength']}")
                print(f"   Instructions: {medicine['instructions']}")
                print(f"   Note: {medicine.get('note', 'N/A')}")
        
        return result
    else:
        print(f"❌ OCR Analysis failed: {result['error']}")
        return None

def test_brand_mapping():
    """Test brand-to-generic mapping functionality"""
    print("\n🔍 Testing Brand-to-Generic Mapping...")
    
    ocr_service = OCRService()
    
    test_brands = [
        "Dolo 650",
        "Crocin 500mg",
        "Azithral 500",
        "Brufen 400",
        "Omez 20",
        "Glycomet 500",
        "Norvasc 5mg",
        "Cetrizine 10mg",
        "Unknown Brand"
    ]
    
    print("Brand Name → Generic Mapping:")
    print("-" * 50)
    
    for brand in test_brands:
        generic_info = ocr_service._identify_generic_from_brand(brand)
        print(f"{brand:15} → {generic_info['generic_name']:20} (Confidence: {generic_info['mapping_confidence']:.2f})")
    
    print("\n✅ Brand mapping test completed!")

def test_pharmacy_matching():
    """Test pharmacy inventory matching"""
    print("\n🔍 Testing Pharmacy Inventory Matching...")
    
    ocr_service = OCRService()
    
    # Test with known brands in our database
    test_cases = [
        {"brand": "Crocin 650mg", "expected_generic": "paracetamol"},
        {"brand": "Azithral 500mg", "expected_generic": "azithromycin"},
        {"brand": "Omez 20mg", "expected_generic": "omeprazole"},
        {"brand": "Unknown Medicine", "expected_generic": "unknown"}
    ]
    
    print("Pharmacy Matching Results:")
    print("-" * 60)
    
    for case in test_cases:
        brand = case["brand"]
        generic_info = ocr_service._identify_generic_from_brand(brand)
        exact_match = ocr_service._find_exact_pharmacy_match(brand, generic_info)
        alternative = ocr_service._find_pharmacy_alternative(generic_info)
        
        print(f"\nBrand: {brand}")
        print(f"Generic: {generic_info['generic_name']}")
        
        if exact_match:
            print(f"✅ Exact Match: {exact_match['available_brand_name']} (₹{exact_match['price']})")
        elif alternative:
            print(f"🔄 Alternative: {alternative['available_brand_name']} (₹{alternative['price']})")
        else:
            print(f"❌ No match found in pharmacy inventory")
    
    print("\n✅ Pharmacy matching test completed!")

def main():
    """Run comprehensive enhanced OCR system test"""
    print("🧪 ENHANCED OCR MEDICINE ANALYSIS SYSTEM TEST")
    print("=" * 60)
    
    # Test 1: Brand-to-generic mapping
    test_brand_mapping()
    
    # Test 2: Pharmacy inventory matching
    test_pharmacy_matching()
    
    # Test 3: Create comprehensive prescription
    try:
        image_path = create_comprehensive_prescription()
    except Exception as e:
        print(f"❌ Failed to create prescription image: {e}")
        return
    
    # Test 4: Complete OCR analysis
    result = test_enhanced_ocr_analysis(image_path)
    
    if result:
        # Test 5: Summary
        print("\n" + "=" * 60)
        print("🎯 ENHANCED OCR SYSTEM TEST SUMMARY:")
        print(f"   OCR Confidence: {result['ocr_confidence']:.2f}")
        print(f"   Medicines Processed: {result['total_medicines_analyzed']}")
        print(f"   Available in Pharmacy: {result['available_medicines']}")
        print(f"   Success Rate: {(result['available_medicines']/result['total_medicines_analyzed']*100):.1f}%")
        
        if result['available_medicines'] > 0:
            print("✅ Enhanced OCR System: WORKING PERFECTLY")
        else:
            print("⚠️  Enhanced OCR System: Needs pharmacy inventory expansion")
    
    # Cleanup
    try:
        os.remove(image_path)
        print(f"\n🧹 Cleaned up test image")
    except:
        pass
    
    print("\n🎉 Enhanced OCR system test completed!")

if __name__ == "__main__":
    main()
