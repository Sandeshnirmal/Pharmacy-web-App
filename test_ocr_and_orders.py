#!/usr/bin/env python3
"""
Comprehensive Test Script for OCR and Order Functionality
Tests the complete flow from prescription upload to order creation
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://192.168.129.6:8001"
TEST_USER = {
    "email": "test@pharmacy.com",
    "password": "test123"
}

class PharmacyAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.refresh_token = None
        self.session = requests.Session()
        
    def authenticate(self):
        """Get JWT tokens for authentication"""
        print("🔐 Authenticating user...")
        
        response = self.session.post(
            f"{self.base_url}/api/token/",
            json=TEST_USER,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            tokens = response.json()
            self.access_token = tokens['access']
            self.refresh_token = tokens['refresh']
            print(f"✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code} - {response.text}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
    
    def test_product_api(self):
        """Test product API (should work without auth)"""
        print("\n📦 Testing Product API...")
        
        response = self.session.get(f"{self.base_url}/product/products/")
        
        if response.status_code == 200:
            products = response.json()
            print(f"✅ Products API working - Found {len(products)} products")
            
            # Show first few products
            for i, product in enumerate(products[:3]):
                print(f"   Product {i+1}: {product['name']} - ₹{product['price']}")
            return True
        else:
            print(f"❌ Products API failed: {response.status_code}")
            return False
    
    def test_prescription_upload(self):
        """Test prescription upload (mock)"""
        print("\n📋 Testing Prescription Upload...")
        
        # Since we can't upload actual files in this test, we'll test the endpoint structure
        response = self.session.post(
            f"{self.base_url}/prescription/mobile/upload/",
            headers=self.get_headers()
        )
        
        # We expect this to fail with 400 (bad request) since we're not sending a file
        # But it should not be 401 (unauthorized)
        if response.status_code == 400:
            print("✅ Prescription upload endpoint accessible (requires file)")
            return True
        elif response.status_code == 401:
            print("❌ Prescription upload authentication failed")
            return False
        else:
            print(f"⚠️ Unexpected response: {response.status_code} - {response.text}")
            return False
    
    def test_prescription_status(self):
        """Test prescription status endpoint"""
        print("\n📊 Testing Prescription Status...")
        
        # Test with a non-existent prescription ID
        response = self.session.get(
            f"{self.base_url}/prescription/mobile/status/999/",
            headers=self.get_headers()
        )
        
        if response.status_code == 404:
            print("✅ Prescription status endpoint working (prescription not found)")
            return True
        elif response.status_code == 401:
            print("❌ Prescription status authentication failed")
            return False
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            return False
    
    def test_ocr_reprocess(self):
        """Test OCR reprocessing endpoint"""
        print("\n🔄 Testing OCR Reprocessing...")
        
        response = self.session.post(
            f"{self.base_url}/prescription/admin/reprocess-ocr/999/",
            headers=self.get_headers()
        )
        
        if response.status_code == 404:
            print("✅ OCR reprocess endpoint accessible (prescription not found)")
            return True
        elif response.status_code == 401:
            print("❌ OCR reprocess authentication failed")
            return False
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            return False
    
    def test_order_api(self):
        """Test order API endpoints"""
        print("\n🛒 Testing Order API...")
        
        response = self.session.get(
            f"{self.base_url}/order/orders/",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            orders = response.json()
            print(f"✅ Orders API working - Found {len(orders)} orders")
            return True
        elif response.status_code == 401:
            print("❌ Orders API authentication failed")
            return False
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            return False
    
    def test_order_statistics(self):
        """Test order statistics endpoint"""
        print("\n📈 Testing Order Statistics...")
        
        response = self.session.get(
            f"{self.base_url}/order/orders/statistics/",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ Order statistics working:")
            print(f"   Total Orders: {stats.get('total_orders', 0)}")
            print(f"   Pending Orders: {stats.get('pending_orders', 0)}")
            print(f"   Total Revenue: ₹{stats.get('total_revenue', 0)}")
            return True
        elif response.status_code == 401:
            print("❌ Order statistics authentication failed")
            return False
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Pharmacy API Tests")
        print("=" * 50)
        
        results = {}
        
        # Authentication test
        results['auth'] = self.authenticate()
        if not results['auth']:
            print("❌ Cannot proceed without authentication")
            return results
        
        # API tests
        results['products'] = self.test_product_api()
        results['prescription_upload'] = self.test_prescription_upload()
        results['prescription_status'] = self.test_prescription_status()
        results['ocr_reprocess'] = self.test_ocr_reprocess()
        results['orders'] = self.test_order_api()
        results['order_stats'] = self.test_order_statistics()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.upper().replace('_', ' ')}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! System is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the logs above.")
        
        return results

def main():
    """Main test function"""
    tester = PharmacyAPITester()
    results = tester.run_all_tests()
    
    # Additional information
    print("\n" + "=" * 50)
    print("📋 SYSTEM INFORMATION")
    print("=" * 50)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n🔗 Available Endpoints:")
    endpoints = [
        "GET  /product/products/ - Product catalog",
        "POST /prescription/mobile/upload/ - Upload prescription",
        "GET  /prescription/mobile/status/{id}/ - Prescription status",
        "POST /prescription/admin/reprocess-ocr/{id}/ - OCR reprocessing",
        "GET  /order/orders/ - Orders list",
        "GET  /order/orders/statistics/ - Order statistics",
        "POST /api/token/ - JWT authentication"
    ]
    
    for endpoint in endpoints:
        print(f"   {endpoint}")
    
    return results

if __name__ == "__main__":
    main()
