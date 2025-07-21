#!/usr/bin/env python3
"""
Test OCR and Medicine Search with Existing Prescription Images
Cross-checks OCR functionality with real prescription images in the database
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from prescriptions.models import Prescription, PrescriptionDetail
from product.models import Product
from prescriptions.ocr_service import OCRService

class ExistingPrescriptionTester:
    def __init__(self):
        self.base_url = "http://192.168.129.6:8001"
        self.ocr_service = OCRService()
        
    def get_existing_prescriptions(self):
        """Get existing prescriptions from database"""
        return Prescription.objects.filter(
            ai_processed=True
        ).prefetch_related('details', 'details__mapped_product', 'details__suggested_products')
    
    def get_all_products(self):
        """Get all products for comparison"""
        return Product.objects.all()
    
    def test_existing_prescription_ocr(self, prescription):
        """Test OCR on existing prescription"""
        print(f"\n📋 Testing Prescription ID: {prescription.id}")
        print(f"   Status: {prescription.verification_status}")
        print(f"   AI Confidence: {prescription.ai_confidence_score:.2f}")
        print(f"   Upload Date: {prescription.upload_date}")
        
        # Get prescription details
        details = prescription.details.all()
        print(f"   Medicines in DB: {details.count()}")
        
        for detail in details:
            print(f"     - {detail.ai_extracted_medicine_name} ({detail.ai_extracted_dosage})")
            print(f"       Confidence: {detail.ai_confidence_score:.2f}")
            print(f"       Mapped: {detail.mapped_product.name if detail.mapped_product else 'None'}")
            print(f"       Status: {detail.mapping_status}")
    
    def test_medicine_search_api(self, medicine_name):
        """Test medicine search API"""
        try:
            response = requests.get(
                f"{self.base_url}/product/products/",
                params={'search': medicine_name},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', []) if isinstance(data, dict) else data
                return len(results), results[:3]  # Return count and first 3 results
            else:
                return 0, []
                
        except Exception as e:
            print(f"   API Error: {e}")
            return 0, []
    
    def test_prescription_products_api(self, prescription_id):
        """Test prescription products API"""
        try:
            response = requests.get(
                f"{self.base_url}/prescription/mobile/products/{prescription_id}/",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    products = data.get('products', [])
                    return len(products), products[:3]
                else:
                    return 0, []
            else:
                return 0, []
                
        except Exception as e:
            print(f"   API Error: {e}")
            return 0, []
    
    def cross_check_medicines(self):
        """Cross-check medicines between OCR results and database"""
        print("\n🔍 Cross-Checking Medicines in Database")
        print("=" * 50)
        
        # Get all products
        all_products = self.get_all_products()
        print(f"Total products in database: {all_products.count()}")
        
        # Get existing prescriptions
        prescriptions = self.get_existing_prescriptions()
        print(f"Total processed prescriptions: {prescriptions.count()}")
        
        if not prescriptions.exists():
            print("❌ No processed prescriptions found in database")
            return
        
        # Test each prescription
        for prescription in prescriptions:
            self.test_existing_prescription_ocr(prescription)
            
            # Test medicine search for each extracted medicine
            details = prescription.details.all()
            for detail in details:
                medicine_name = detail.ai_extracted_medicine_name
                if medicine_name:
                    print(f"\n   🔎 Testing search for: {medicine_name}")
                    count, results = self.test_medicine_search_api(medicine_name)
                    print(f"     Found {count} products")
                    
                    for result in results:
                        print(f"       - {result.get('name', 'N/A')} ({result.get('manufacturer', 'N/A')})")
            
            # Test prescription products API
            print(f"\n   📦 Testing prescription products API for ID: {prescription.id}")
            count, results = self.test_prescription_products_api(prescription.id)
            print(f"     Found {count} prescription-specific products")
            
            for result in results:
                print(f"       - {result.get('name', 'N/A')} ({result.get('manufacturer', 'N/A')})")
    
    def test_random_medicine_search(self, num_tests=10):
        """Test random medicine search from database"""
        print(f"\n🎲 Testing Random Medicine Search ({num_tests} tests)")
        print("=" * 50)
        
        all_products = list(self.get_all_products())
        if not all_products:
            print("❌ No products found in database")
            return
        
        # Test random medicines
        for i in range(min(num_tests, len(all_products))):
            product = all_products[i]
            print(f"\n   Test {i+1}: {product.name}")
            
            # Test exact name search
            count, results = self.test_medicine_search_api(product.name)
            print(f"     Exact search: {count} results")
            
            # Test generic name search
            if product.generic_name:
                count, results = self.test_medicine_search_api(product.generic_name.name)
                print(f"     Generic search: {count} results")
            
            # Test partial name search
            partial_name = product.name.split()[0]  # First word
            count, results = self.test_medicine_search_api(partial_name)
            print(f"     Partial search ('{partial_name}'): {count} results")
    
    def generate_search_statistics(self):
        """Generate statistics about medicine search"""
        print(f"\n📊 Medicine Search Statistics")
        print("=" * 50)
        
        all_products = self.get_all_products()
        prescriptions = self.get_existing_prescriptions()
        
        # Count medicines by category
        categories = {}
        for product in all_products:
            category = product.category.name if product.category else 'Uncategorized'
            categories[category] = categories.get(category, 0) + 1
        
        print(f"Products by Category:")
        for category, count in categories.items():
            print(f"   {category}: {count} products")
        
        # Count prescription medicines
        prescription_medicines = all_products.filter(is_prescription_required=True).count()
        otc_medicines = all_products.filter(is_prescription_required=False).count()
        
        print(f"\nMedicine Types:")
        print(f"   Prescription Required: {prescription_medicines}")
        print(f"   Over-the-Counter: {otc_medicines}")
        
        # Count mapped vs unmapped prescriptions
        total_details = 0
        mapped_details = 0
        
        for prescription in prescriptions:
            details = prescription.details.all()
            total_details += details.count()
            mapped_details += details.filter(mapping_status='Mapped').count()
        
        if total_details > 0:
            mapping_rate = (mapped_details / total_details) * 100
            print(f"\nPrescription Mapping:")
            print(f"   Total Medicines: {total_details}")
            print(f"   Mapped Medicines: {mapped_details}")
            print(f"   Mapping Rate: {mapping_rate:.1f}%")
    
    def run_comprehensive_analysis(self):
        """Run comprehensive analysis of existing data"""
        print("🚀 Starting Comprehensive OCR and Medicine Search Analysis")
        print("=" * 60)
        
        try:
            # Cross-check existing prescriptions
            self.cross_check_medicines()
            
            # Test random medicine search
            self.test_random_medicine_search(num_tests=5)
            
            # Generate statistics
            self.generate_search_statistics()
            
            print("\n✅ Comprehensive analysis completed!")
            
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
            import traceback
            traceback.print_exc()

def main():
    """Main function to run the analysis"""
    tester = ExistingPrescriptionTester()
    tester.run_comprehensive_analysis()

if __name__ == '__main__':
    main() 