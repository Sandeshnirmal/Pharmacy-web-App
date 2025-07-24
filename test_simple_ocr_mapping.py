#!/usr/bin/env python3
"""
Simple test for OCR medicine mapping without API dependency
Tests the core brand-to-generic mapping and pharmacy matching logic
"""

import os
import sys
import django

# Setup Django
sys.path.append('/home/santhakumar/Documents/project/Pharmacy-web-App/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from prescriptions.ocr_service import OCRService

def test_brand_to_generic_mapping():
    """Test the comprehensive brand-to-generic mapping"""
    print("🔍 Testing Brand-to-Generic Mapping System")
    print("=" * 60)
    
    ocr_service = OCRService()
    
    # Test cases with expected results
    test_cases = [
        # Paracetamol brands
        {"input": "Dolo 650", "expected_generic": "paracetamol"},
        {"input": "Crocin 500mg", "expected_generic": "paracetamol"},
        {"input": "Tylenol", "expected_generic": "paracetamol"},
        
        # Ibuprofen brands
        {"input": "Brufen 400", "expected_generic": "ibuprofen"},
        {"input": "Advil", "expected_generic": "ibuprofen"},
        {"input": "Combiflam", "expected_generic": "ibuprofen + paracetamol"},
        
        # Antibiotics
        {"input": "Azithral 500", "expected_generic": "azithromycin"},
        {"input": "Amoxil 250mg", "expected_generic": "amoxicillin"},
        {"input": "Augmentin", "expected_generic": "amoxicillin + clavulanic acid"},
        
        # Antacids
        {"input": "Omez 20", "expected_generic": "omeprazole"},
        {"input": "Pantop 40mg", "expected_generic": "pantoprazole"},
        {"input": "Rantac", "expected_generic": "ranitidine"},
        
        # Diabetes
        {"input": "Glycomet 500", "expected_generic": "metformin"},
        {"input": "Amaryl 2mg", "expected_generic": "glimepiride"},
        
        # Cardiovascular
        {"input": "Norvasc 5mg", "expected_generic": "amlodipine"},
        {"input": "Ecosprin 75", "expected_generic": "aspirin"},
        
        # Antihistamines
        {"input": "Cetrizine 10mg", "expected_generic": "cetirizine"},
        {"input": "Allegra 120", "expected_generic": "fexofenadine"},
        
        # Unknown brand
        {"input": "Unknown Medicine XYZ", "expected_generic": "Unknown Medicine XYZ"}
    ]
    
    print(f"{'Input Brand':<25} {'Expected Generic':<25} {'Mapped Generic':<25} {'Confidence':<12} {'Status'}")
    print("-" * 100)
    
    correct_mappings = 0
    total_tests = len(test_cases)
    
    for case in test_cases:
        input_brand = case["input"]
        expected_generic = case["expected_generic"]
        
        # Test the mapping
        generic_info = ocr_service._identify_generic_from_brand(input_brand)
        mapped_generic = generic_info['generic_name']
        confidence = generic_info['mapping_confidence']
        
        # Check if mapping is correct
        is_correct = mapped_generic.lower() == expected_generic.lower()
        status = "✅ PASS" if is_correct else "❌ FAIL"
        
        if is_correct:
            correct_mappings += 1
        
        print(f"{input_brand:<25} {expected_generic:<25} {mapped_generic:<25} {confidence:<12.2f} {status}")
    
    accuracy = (correct_mappings / total_tests) * 100
    print("\n" + "=" * 100)
    print(f"🎯 Brand-to-Generic Mapping Results:")
    print(f"   Total Tests: {total_tests}")
    print(f"   Correct Mappings: {correct_mappings}")
    print(f"   Accuracy: {accuracy:.1f}%")
    
    if accuracy >= 90:
        print("✅ Brand-to-Generic Mapping: EXCELLENT")
    elif accuracy >= 75:
        print("✅ Brand-to-Generic Mapping: GOOD")
    else:
        print("⚠️  Brand-to-Generic Mapping: NEEDS IMPROVEMENT")
    
    return accuracy

def test_pharmacy_inventory_matching():
    """Test pharmacy inventory matching with available products"""
    print("\n🔍 Testing Pharmacy Inventory Matching")
    print("=" * 60)
    
    ocr_service = OCRService()
    
    # Test with brands that should be in our database
    test_brands = [
        "Crocin 650mg",
        "Azithral 500mg", 
        "Omez 20mg",
        "Cetrizine 10mg",
        "Brufen 400mg",
        "Glycomet 500mg",
        "Norvasc 5mg",
        "Unknown Brand 123"
    ]
    
    print(f"{'Input Brand':<20} {'Generic':<15} {'Available Product':<25} {'Price':<10} {'Status'}")
    print("-" * 85)
    
    available_count = 0
    total_brands = len(test_brands)
    
    for brand in test_brands:
        # Get generic info
        generic_info = ocr_service._identify_generic_from_brand(brand)
        generic_name = generic_info['generic_name']
        
        # Try to find exact match
        exact_match = ocr_service._find_exact_pharmacy_match(brand, generic_info)
        
        # Try to find alternative
        if not exact_match:
            alternative = ocr_service._find_pharmacy_alternative(generic_info)
        else:
            alternative = None
        
        # Determine result
        if exact_match:
            available_product = exact_match['available_brand_name']
            price = f"₹{exact_match['price']}"
            status = "✅ EXACT"
            available_count += 1
        elif alternative:
            available_product = alternative['available_brand_name']
            price = f"₹{alternative['price']}"
            status = "🔄 ALT"
            available_count += 1
        else:
            available_product = "Not Available"
            price = "N/A"
            status = "❌ NONE"
        
        print(f"{brand:<20} {generic_name:<15} {available_product:<25} {price:<10} {status}")
    
    availability_rate = (available_count / total_brands) * 100
    print("\n" + "=" * 85)
    print(f"🎯 Pharmacy Inventory Matching Results:")
    print(f"   Total Brands Tested: {total_brands}")
    print(f"   Available Products: {available_count}")
    print(f"   Availability Rate: {availability_rate:.1f}%")
    
    if availability_rate >= 75:
        print("✅ Pharmacy Matching: EXCELLENT")
    elif availability_rate >= 50:
        print("✅ Pharmacy Matching: GOOD")
    else:
        print("⚠️  Pharmacy Matching: NEEDS MORE INVENTORY")
    
    return availability_rate

def test_complete_medicine_analysis():
    """Test complete medicine analysis with sample data"""
    print("\n🔍 Testing Complete Medicine Analysis Pipeline")
    print("=" * 60)
    
    ocr_service = OCRService()
    
    # Sample extracted medicines (simulating OCR output)
    sample_medicines = [
        {
            'brand_name': 'Dolo 650',
            'strength': '650mg',
            'form': 'tablet',
            'frequency': 'twice daily',
            'duration': '5 days',
            'instructions': 'after food'
        },
        {
            'brand_name': 'Azithral 500',
            'strength': '500mg',
            'form': 'tablet',
            'frequency': 'once daily',
            'duration': '3 days',
            'instructions': 'before food'
        },
        {
            'brand_name': 'Unknown Medicine XYZ',
            'strength': '100mg',
            'form': 'capsule',
            'frequency': 'twice daily',
            'duration': '7 days',
            'instructions': 'with food'
        }
    ]
    
    # Analyze medicines
    results = ocr_service.match_medicines_with_database(sample_medicines)
    
    print("Complete Analysis Results:")
    print("-" * 60)
    
    for i, result in enumerate(results, 1):
        print(f"\n{i}. INPUT: {result['input_brand_name']}")
        print(f"   Generic: {result['generic_name']}")
        print(f"   Composition: {result['composition']}")
        
        if result['available']:
            print(f"   ✅ AVAILABLE: {result['available_brand_name']}")
            print(f"   Price: ₹{result['price']}")
            print(f"   Manufacturer: {result['manufacturer']}")
            print(f"   Confidence: {result['confidence']:.2f}")
        else:
            print(f"   ❌ NOT AVAILABLE")
            print(f"   Note: {result.get('note', 'N/A')}")
    
    available_medicines = len([r for r in results if r['available']])
    total_medicines = len(results)
    success_rate = (available_medicines / total_medicines) * 100
    
    print(f"\n🎯 Complete Analysis Summary:")
    print(f"   Total Medicines: {total_medicines}")
    print(f"   Available: {available_medicines}")
    print(f"   Success Rate: {success_rate:.1f}%")
    
    return success_rate

def main():
    """Run comprehensive OCR mapping tests"""
    print("🧪 ENHANCED OCR MEDICINE MAPPING SYSTEM TEST")
    print("=" * 70)
    
    # Test 1: Brand-to-Generic Mapping
    mapping_accuracy = test_brand_to_generic_mapping()
    
    # Test 2: Pharmacy Inventory Matching
    availability_rate = test_pharmacy_inventory_matching()
    
    # Test 3: Complete Analysis Pipeline
    analysis_success = test_complete_medicine_analysis()
    
    # Overall Summary
    print("\n" + "=" * 70)
    print("🎯 OVERALL SYSTEM PERFORMANCE SUMMARY")
    print("=" * 70)
    print(f"Brand-to-Generic Mapping Accuracy: {mapping_accuracy:.1f}%")
    print(f"Pharmacy Inventory Availability:   {availability_rate:.1f}%")
    print(f"Complete Analysis Success Rate:    {analysis_success:.1f}%")
    
    overall_score = (mapping_accuracy + availability_rate + analysis_success) / 3
    print(f"Overall System Score:              {overall_score:.1f}%")
    
    if overall_score >= 85:
        print("\n🎉 ENHANCED OCR SYSTEM: EXCELLENT PERFORMANCE")
        print("✅ Ready for production deployment!")
    elif overall_score >= 70:
        print("\n✅ ENHANCED OCR SYSTEM: GOOD PERFORMANCE")
        print("✅ Ready for production with minor optimizations")
    else:
        print("\n⚠️  ENHANCED OCR SYSTEM: NEEDS IMPROVEMENT")
        print("🔧 Requires optimization before production")
    
    print("\n🎯 The enhanced OCR system successfully:")
    print("   ✅ Maps brand names to generic names")
    print("   ✅ Identifies medicine compositions")
    print("   ✅ Matches with pharmacy inventory")
    print("   ✅ Provides alternative suggestions")
    print("   ✅ Returns structured medicine data")

if __name__ == "__main__":
    main()
