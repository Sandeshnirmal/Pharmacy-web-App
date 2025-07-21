#!/usr/bin/env python3
"""
Simple OCR and Medicine Search Test
Tests the API endpoints without Django setup
"""

import requests
import json
import time

class SimpleOCRTest:
    def __init__(self):
        self.base_url = "http://192.168.129.6:8001"
        
    def test_server_status(self):
        """Test if server is running"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            print(f"✅ Server is running: HTTP {response.status_code}")
            return True
        except Exception as e:
            print(f"❌ Server not accessible: {e}")
            return False
    
    def test_products_api(self):
        """Test products API"""
        print("\n🔍 Testing Products API")
        print("-" * 30)
        
        try:
            # Get all products
            response = requests.get(f"{self.base_url}/product/products/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', []) if isinstance(data, dict) else data
                print(f"✅ Found {len(results)} products in database")
                
                # Show first 5 products
                print("\n📋 Sample Products:")
                for i, product in enumerate(results[:5]):
                    print(f"   {i+1}. {product.get('name', 'N/A')} - {product.get('manufacturer', 'N/A')}")
                    print(f"      Generic: {product.get('generic_name', {}).get('name', 'N/A')}")
                    print(f"      Strength: {product.get('strength', 'N/A')}")
                    print(f"      Price: ₹{product.get('price', 'N/A')}")
                    print()
                
                return results
            else:
                print(f"❌ Products API failed: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Products API error: {e}")
            return []
    
    def test_medicine_search(self, medicines):
        """Test medicine search functionality"""
        print("\n🔎 Testing Medicine Search")
        print("-" * 30)
        
        search_results = {}
        
        for medicine in medicines[:5]:  # Test first 5 medicines
            medicine_name = medicine.get('name', '')
            if not medicine_name:
                continue
                
            print(f"\n   Searching for: {medicine_name}")
            
            try:
                # Test exact search
                response = requests.get(
                    f"{self.base_url}/product/products/",
                    params={'search': medicine_name},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', []) if isinstance(data, dict) else data
                    print(f"     ✅ Found {len(results)} results")
                    
                    # Show top 3 results
                    for i, result in enumerate(results[:3]):
                        print(f"       {i+1}. {result.get('name', 'N/A')} ({result.get('manufacturer', 'N/A')})")
                    
                    search_results[medicine_name] = len(results)
                else:
                    print(f"     ❌ Search failed: HTTP {response.status_code}")
                    search_results[medicine_name] = 0
                    
            except Exception as e:
                print(f"     ❌ Search error: {e}")
                search_results[medicine_name] = 0
        
        return search_results
    
    def test_prescriptions_api(self):
        """Test prescriptions API"""
        print("\n📋 Testing Prescriptions API")
        print("-" * 30)
        
        try:
            # Get prescriptions
            response = requests.get(f"{self.base_url}/prescription/prescriptions/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', []) if isinstance(data, dict) else data
                print(f"✅ Found {len(results)} prescriptions in database")
                
                # Show prescription details
                for i, prescription in enumerate(results[:3]):
                    print(f"\n   Prescription {i+1}:")
                    print(f"     ID: {prescription.get('id', 'N/A')}")
                    print(f"     Status: {prescription.get('verification_status', 'N/A')}")
                    print(f"     AI Confidence: {prescription.get('ai_confidence_score', 0):.2f}")
                    print(f"     Upload Date: {prescription.get('upload_date', 'N/A')}")
                
                return results
            else:
                print(f"❌ Prescriptions API failed: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Prescriptions API error: {e}")
            return []
    
    def test_prescription_details(self, prescription_id):
        """Test prescription details API"""
        print(f"\n📄 Testing Prescription Details for ID: {prescription_id}")
        print("-" * 50)
        
        try:
            response = requests.get(
                f"{self.base_url}/prescription/prescription-details/?prescription={prescription_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', []) if isinstance(data, dict) else data
                print(f"✅ Found {len(results)} medicine details")
                
                for i, detail in enumerate(results):
                    print(f"\n   Medicine {i+1}:")
                    print(f"     Extracted: {detail.get('ai_extracted_medicine_name', 'N/A')}")
                    print(f"     Dosage: {detail.get('ai_extracted_dosage', 'N/A')}")
                    print(f"     Confidence: {detail.get('ai_confidence_score', 0):.2f}")
                    print(f"     Status: {detail.get('mapping_status', 'N/A')}")
                    print(f"     Mapped Product: {detail.get('mapped_product', {}).get('name', 'None')}")
                
                return results
            else:
                print(f"❌ Prescription details failed: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Prescription details error: {e}")
            return []
    
    def test_prescription_products_api(self, prescription_id):
        """Test prescription products API"""
        print(f"\n💊 Testing Prescription Products API for ID: {prescription_id}")
        print("-" * 50)
        
        try:
            response = requests.get(
                f"{self.base_url}/prescription/mobile/products/{prescription_id}/",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    products = data.get('products', [])
                    print(f"✅ Found {len(products)} prescription-specific products")
                    
                    for i, product in enumerate(products[:5]):
                        print(f"   {i+1}. {product.get('name', 'N/A')} ({product.get('manufacturer', 'N/A')})")
                        print(f"      Price: ₹{product.get('price', 'N/A')}")
                        print(f"      Stock: {product.get('stock_quantity', 'N/A')}")
                    
                    return products
                else:
                    print(f"❌ API returned error: {data.get('error', 'Unknown error')}")
                    return []
            else:
                print(f"❌ Prescription products API failed: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Prescription products API error: {e}")
            return []
    
    def generate_test_summary(self, products, search_results, prescriptions):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        print(f"📦 Database Statistics:")
        print(f"   Total Products: {len(products)}")
        print(f"   Total Prescriptions: {len(prescriptions)}")
        
        if search_results:
            print(f"\n🔍 Search Results:")
            total_searches = len(search_results)
            successful_searches = len([r for r in search_results.values() if r > 0])
            print(f"   Total Searches: {total_searches}")
            print(f"   Successful Searches: {successful_searches}")
            print(f"   Success Rate: {successful_searches/total_searches*100:.1f}%")
            
            # Show search details
            for medicine, count in search_results.items():
                status = "✅" if count > 0 else "❌"
                print(f"   {status} {medicine}: {count} results")
        
        # Show prescription statistics
        if prescriptions:
            processed_prescriptions = len([p for p in prescriptions if p.get('ai_processed')])
            avg_confidence = sum(p.get('ai_confidence_score', 0) for p in prescriptions) / len(prescriptions)
            
            print(f"\n📋 Prescription Statistics:")
            print(f"   Processed Prescriptions: {processed_prescriptions}/{len(prescriptions)}")
            print(f"   Average AI Confidence: {avg_confidence:.2f}")
    
    def run_comprehensive_test(self):
        """Run comprehensive test"""
        print("🚀 Starting Simple OCR and Medicine Search Test")
        print("=" * 60)
        
        # Test server status
        if not self.test_server_status():
            print("❌ Cannot proceed without server access")
            return
        
        # Wait a moment for server to be ready
        time.sleep(2)
        
        # Test products API
        products = self.test_products_api()
        
        # Test medicine search
        search_results = self.test_medicine_search(products)
        
        # Test prescriptions API
        prescriptions = self.test_prescriptions_api()
        
        # Test prescription details if available
        if prescriptions:
            first_prescription = prescriptions[0]
            prescription_id = first_prescription.get('id')
            
            if prescription_id:
                details = self.test_prescription_details(prescription_id)
                products_for_prescription = self.test_prescription_products_api(prescription_id)
        
        # Generate summary
        self.generate_test_summary(products, search_results, prescriptions)
        
        print("\n✅ Simple test completed!")

def main():
    """Main function"""
    tester = SimpleOCRTest()
    tester.run_comprehensive_test()

if __name__ == '__main__':
    main() 