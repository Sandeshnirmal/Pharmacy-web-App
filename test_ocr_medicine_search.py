#!/usr/bin/env python3
"""
Comprehensive OCR and Medicine Search Testing Script
Cross-checks OCR functionality with random medicines from local database
"""

import os
import sys
import django
import random
import requests
import json
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import io

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from product.models import Product, GenericName
from prescriptions.ocr_service import OCRService

class OCRMedicineSearchTester:
    def __init__(self):
        self.base_url = "http://192.168.129.6:8001"
        self.ocr_service = OCRService()
        self.test_results = []
        
    def get_random_medicines_from_db(self, count=10):
        """Get random medicines from the database"""
        products = list(Product.objects.all())
        if len(products) < count:
            count = len(products)
        
        return random.sample(products, count)
    
    def create_test_prescription_image(self, medicines):
        """Create a test prescription image with given medicines"""
        # Create a white image
        img = Image.new('RGB', (800, 600), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a default font, fallback to default if not available
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Header
        draw.text((50, 50), "DOCTOR'S PRESCRIPTION", fill='black', font=font)
        draw.text((50, 80), f"Date: {datetime.now().strftime('%d/%m/%Y')}", fill='black', font=small_font)
        draw.text((50, 100), "Patient: Test Patient", fill='black', font=small_font)
        draw.text((50, 120), "Doctor: Dr. Test Doctor", fill='black', font=small_font)
        
        # Medicines
        y_position = 180
        for i, medicine in enumerate(medicines):
            medicine_text = f"{i+1}. {medicine.name} {medicine.strength}"
            draw.text((50, y_position), medicine_text, fill='black', font=small_font)
            y_position += 30
            
            # Add dosage instructions
            dosage_text = f"   Dosage: 1-0-1 for 7 days"
            draw.text((70, y_position), dosage_text, fill='black', font=small_font)
            y_position += 30
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        return img_bytes
    
    def test_ocr_extraction(self, medicines):
        """Test OCR extraction with given medicines"""
        print(f"\n🧪 Testing OCR with {len(medicines)} medicines:")
        for medicine in medicines:
            print(f"   - {medicine.name} ({medicine.strength})")
        
        # Create test image
        img_bytes = self.create_test_prescription_image(medicines)
        
        # Save temporary image file
        temp_path = f"/tmp/test_prescription_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        with open(temp_path, 'wb') as f:
            f.write(img_bytes.getvalue())
        
        try:
            # Test OCR extraction
            ocr_result = self.ocr_service.extract_text_from_prescription(temp_path)
            
            print(f"\n📄 OCR Extraction Result:")
            print(f"   Success: {ocr_result['success']}")
            print(f"   Confidence: {ocr_result.get('confidence_score', 0):.2f}")
            print(f"   Raw Text: {ocr_result.get('raw_text', 'N/A')[:200]}...")
            
            return ocr_result
            
        except Exception as e:
            print(f"❌ OCR Error: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    def test_medicine_matching(self, extracted_medicines):
        """Test medicine matching with database"""
        print(f"\n🔍 Testing Medicine Matching:")
        
        if not extracted_medicines:
            print("   No medicines extracted from OCR")
            return []
        
        matched_results = self.ocr_service.match_medicines_with_database(extracted_medicines)
        
        for i, result in enumerate(matched_results):
            extracted_info = result['extracted_info']
            matches = result['database_matches']
            confidence = result['match_confidence']
            
            print(f"\n   Medicine {i+1}: {extracted_info.get('name', 'Unknown')}")
            print(f"   Extracted: {extracted_info}")
            print(f"   Match Confidence: {confidence:.2f}")
            print(f"   Database Matches: {len(matches)}")
            
            for j, match in enumerate(matches[:3]):  # Show top 3 matches
                print(f"     {j+1}. {match['name']} ({match['match_type']}) - Score: {match['match_score']:.2f}")
        
        return matched_results
    
    def test_api_endpoints(self, medicines):
        """Test API endpoints with medicine search"""
        print(f"\n🌐 Testing API Endpoints:")
        
        # Test product search API
        for medicine in medicines[:3]:  # Test first 3 medicines
            try:
                response = requests.get(
                    f"{self.base_url}/product/products/",
                    params={'search': medicine.name},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', []) if isinstance(data, dict) else data
                    print(f"   Search '{medicine.name}': {len(results)} results found")
                    
                    for result in results[:2]:  # Show first 2 results
                        print(f"     - {result.get('name', 'N/A')} ({result.get('manufacturer', 'N/A')})")
                else:
                    print(f"   Search '{medicine.name}': HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"   Search '{medicine.name}': Error - {e}")
    
    def test_prescription_upload_api(self, medicines):
        """Test prescription upload API"""
        print(f"\n📤 Testing Prescription Upload API:")
        
        # Create test image
        img_bytes = self.create_test_prescription_image(medicines)
        
        try:
            # Test upload endpoint
            files = {'image': ('test_prescription.jpg', img_bytes.getvalue(), 'image/jpeg')}
            headers = {'Authorization': 'Token your_test_token_here'}  # Replace with actual token
            
            response = requests.post(
                f"{self.base_url}/prescription/mobile/upload/",
                files=files,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Upload Success: Prescription ID {data.get('prescription_id', 'N/A')}")
                print(f"   OCR Confidence: {data.get('ocr_confidence', 0):.2f}")
                print(f"   Medicines Found: {data.get('total_medicines_found', 0)}")
            else:
                print(f"   Upload Failed: HTTP {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"   Upload Error: {e}")
    
    def run_comprehensive_test(self, num_tests=5):
        """Run comprehensive OCR and medicine search tests"""
        print("🧪 Starting Comprehensive OCR and Medicine Search Testing")
        print("=" * 60)
        
        for test_num in range(num_tests):
            print(f"\n🔬 Test #{test_num + 1}")
            print("-" * 40)
            
            # Get random medicines from database
            medicines = self.get_random_medicines_from_db(random.randint(3, 6))
            
            # Test OCR extraction
            ocr_result = self.test_ocr_extraction(medicines)
            
            if ocr_result['success']:
                # Test medicine matching
                matched_results = self.test_medicine_matching(ocr_result['medicines'])
                
                # Test API endpoints
                self.test_api_endpoints(medicines)
                
                # Store test results
                test_result = {
                    'test_number': test_num + 1,
                    'medicines_tested': [m.name for m in medicines],
                    'ocr_success': ocr_result['success'],
                    'ocr_confidence': ocr_result.get('confidence_score', 0),
                    'medicines_extracted': len(ocr_result.get('medicines', [])),
                    'medicines_matched': len([r for r in matched_results if r['database_matches']]),
                    'total_matches': sum(len(r['database_matches']) for r in matched_results)
                }
                self.test_results.append(test_result)
            else:
                print(f"❌ OCR failed for test #{test_num + 1}")
        
        # Generate test summary
        self.generate_test_summary()
    
    def generate_test_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        if not self.test_results:
            print("❌ No successful tests to summarize")
            return
        
        total_tests = len(self.test_results)
        successful_ocr = len([r for r in self.test_results if r['ocr_success']])
        avg_confidence = sum(r['ocr_confidence'] for r in self.test_results) / total_tests
        total_medicines_tested = sum(len(r['medicines_tested']) for r in self.test_results)
        total_extracted = sum(r['medicines_extracted'] for r in self.test_results)
        total_matched = sum(r['medicines_matched'] for r in self.test_results)
        
        print(f"📈 Test Statistics:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Successful OCR: {successful_ocr}/{total_tests} ({successful_ocr/total_tests*100:.1f}%)")
        print(f"   Average OCR Confidence: {avg_confidence:.2f}")
        print(f"   Total Medicines Tested: {total_medicines_tested}")
        print(f"   Total Medicines Extracted: {total_extracted}")
        print(f"   Total Medicines Matched: {total_matched}")
        print(f"   Extraction Rate: {total_extracted/total_medicines_tested*100:.1f}%")
        print(f"   Matching Rate: {total_matched/total_extracted*100:.1f}%" if total_extracted > 0 else "   Matching Rate: N/A")
        
        print(f"\n🏆 Best Performing Test:")
        best_test = max(self.test_results, key=lambda x: x['ocr_confidence'])
        print(f"   Test #{best_test['test_number']}: {best_test['ocr_confidence']:.2f} confidence")
        print(f"   Medicines: {', '.join(best_test['medicines_tested'])}")
        
        print(f"\n📋 All Test Results:")
        for result in self.test_results:
            status = "✅" if result['ocr_success'] else "❌"
            print(f"   {status} Test #{result['test_number']}: "
                  f"Confidence: {result['ocr_confidence']:.2f}, "
                  f"Extracted: {result['medicines_extracted']}, "
                  f"Matched: {result['medicines_matched']}")

def main():
    """Main function to run the comprehensive test"""
    print("🚀 Starting OCR and Medicine Search Cross-Check")
    
    tester = OCRMedicineSearchTester()
    
    try:
        # Run comprehensive tests
        tester.run_comprehensive_test(num_tests=5)
        
        print("\n✅ Comprehensive testing completed!")
        
    except Exception as e:
        print(f"❌ Testing failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main() 