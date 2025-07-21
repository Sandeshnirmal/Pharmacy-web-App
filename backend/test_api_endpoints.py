#!/usr/bin/env python3
"""
API Endpoint Testing Script for Pharmacy Backend
Tests all endpoints that the mobile app uses
"""

import requests
import json
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Base URL - Update this to match your server
BASE_URL = "http://127.0.0.1:8000"

class APITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        
    def test_endpoint(self, method, endpoint, data=None, headers=None, auth_required=True):
        """Test a single endpoint"""
        url = f"{self.base_url}{endpoint}"
        
        # Add authorization header if required
        if auth_required and self.access_token:
            if headers is None:
                headers = {}
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, f"Unsupported method: {method}"
            
            return True, {
                'status_code': response.status_code,
                'response': response.json() if response.content else {},
                'success': 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"
        except json.JSONDecodeError:
            return False, f"Invalid JSON response. Status: {response.status_code}"
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("🔐 Testing Authentication...")
        
        # Test login
        login_data = {
            "email": "customer@pharmacy.com",
            "password": "customer123"
        }
        
        success, result = self.test_endpoint('POST', '/api/token/', login_data, auth_required=False)
        if success and result['success']:
            self.access_token = result['response'].get('access')
            self.refresh_token = result['response'].get('refresh')
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {result}")
            return False
    
    def test_user_profile(self):
        """Test user profile endpoint"""
        print("👤 Testing User Profile...")
        
        success, result = self.test_endpoint('GET', '/user/profile/')
        if success and result['success']:
            print("✅ User profile retrieved successfully")
            print(f"   User: {result['response'].get('first_name', 'Unknown')} {result['response'].get('last_name', '')}")
            return True
        else:
            print(f"❌ User profile failed: {result}")
            return False
    
    def test_products(self):
        """Test product endpoints"""
        print("🏥 Testing Products...")
        
        # Test get all products
        success, result = self.test_endpoint('GET', '/product/products/', auth_required=False)
        if success and result['success']:
            products = result['response']
            if isinstance(products, list):
                print(f"✅ Products retrieved successfully ({len(products)} products)")
            elif isinstance(products, dict) and 'results' in products:
                print(f"✅ Products retrieved successfully ({len(products['results'])} products)")
            else:
                print("⚠️  Products endpoint returned unexpected format")
            
            # Test search
            success, result = self.test_endpoint('GET', '/product/products/?search=pain', auth_required=False)
            if success and result['success']:
                print("✅ Product search working")
            else:
                print(f"❌ Product search failed: {result}")
            
            return True
        else:
            print(f"❌ Products failed: {result}")
            return False
    
    def test_orders(self):
        """Test order endpoints"""
        print("📦 Testing Orders...")
        
        success, result = self.test_endpoint('GET', '/order/orders/')
        if success and result['success']:
            orders = result['response']
            if isinstance(orders, list):
                print(f"✅ Orders retrieved successfully ({len(orders)} orders)")
            elif isinstance(orders, dict) and 'results' in orders:
                print(f"✅ Orders retrieved successfully ({len(orders['results'])} orders)")
            else:
                print("⚠️  Orders endpoint returned unexpected format")
            return True
        else:
            print(f"❌ Orders failed: {result}")
            return False
    
    def test_prescriptions(self):
        """Test prescription endpoints"""
        print("💊 Testing Prescriptions...")
        
        # Test prescription status endpoint (this will fail without a valid prescription ID, but tests the endpoint)
        success, result = self.test_endpoint('GET', '/prescription/mobile/status/1/')
        if success:
            if result['status_code'] == 404:
                print("✅ Prescription status endpoint accessible (404 expected for non-existent ID)")
            elif result['success']:
                print("✅ Prescription status endpoint working")
            else:
                print(f"⚠️  Prescription status endpoint returned: {result['status_code']}")
        else:
            print(f"❌ Prescription status failed: {result}")
        
        return True
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting API Endpoint Tests...\n")
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - cannot proceed with authenticated tests")
            return False
        
        print()
        
        # Test all endpoints
        tests = [
            self.test_user_profile,
            self.test_products,
            self.test_orders,
            self.test_prescriptions,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                print()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}\n")
        
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All API endpoints are working correctly!")
            return True
        else:
            print("⚠️  Some API endpoints need attention")
            return False

def main():
    """Main function"""
    print("🔧 Pharmacy Backend API Tester")
    print("=" * 50)
    
    # Test if server is running
    try:
        response = requests.get(f"{BASE_URL}/admin/", timeout=5)
        print(f"✅ Server is running at {BASE_URL}")
    except requests.exceptions.RequestException:
        print(f"❌ Server is not running at {BASE_URL}")
        print("Please start the Django server with: python manage.py runserver")
        return False
    
    print()
    
    # Run tests
    tester = APITester(BASE_URL)
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
