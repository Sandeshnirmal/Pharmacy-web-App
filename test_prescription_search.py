#!/usr/bin/env python3
"""
Test script for prescription-based search functionality
"""
import requests
import json

# Configuration
BASE_URL = "http://192.168.129.6:8001"
TEST_USER = {
    "email": "test@pharmacy.com",
    "password": "testpass123"
}

def get_auth_token():
    """Get authentication token for mobile API"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json=TEST_USER,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        data = response.json()
        return data.get('access')  # Token authentication returns 'access'
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        print(response.text)
        return None

def test_prescription_products_api():
    """Test the new prescription products API"""
    print("🧪 Testing Prescription Products API")
    print("=" * 50)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return False
    
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    # Test with prescription ID 33 (from our previous test)
    prescription_id = 33
    
    try:
        response = requests.get(
            f"{BASE_URL}/prescription/mobile/products/{prescription_id}/",
            headers=headers
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success', False)}")
            print(f"📋 Prescription ID: {data.get('prescription_id')}")
            print(f"🔢 Total Products: {data.get('total_products', 0)}")
            print(f"📊 Prescription Status: {data.get('prescription_status')}")
            
            products = data.get('products', [])
            print(f"\n💊 Products Found:")
            print("-" * 40)
            
            for i, product in enumerate(products, 1):
                print(f"{i}. {product['name']}")
                print(f"   Manufacturer: {product['manufacturer']}")
                print(f"   Price: ₹{product['price']} (MRP: ₹{product['mrp']})")
                print(f"   Extracted Medicine: {product['extracted_medicine']}")
                print(f"   Confidence: {product['confidence_score']}")
                print(f"   In Stock: {product['in_stock']}")
                if product.get('is_suggested'):
                    print(f"   Type: Suggested Product")
                else:
                    print(f"   Type: Mapped Product")
                print()
            
            return True
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_regular_medicine_suggestions():
    """Test the regular medicine suggestions API for comparison"""
    print("\n🧪 Testing Regular Medicine Suggestions API (for comparison)")
    print("=" * 60)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return False
    
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    prescription_id = 33
    
    try:
        response = requests.get(
            f"{BASE_URL}/prescription/mobile/suggestions/{prescription_id}/",
            headers=headers
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success', True)}")
            print(f"📋 Prescription ID: {data.get('prescription_id')}")
            print(f"🔢 Total Medicines: {len(data.get('medicines', []))}")
            
            medicines = data.get('medicines', [])
            print(f"\n💊 Medicines Found:")
            print("-" * 40)
            
            for i, medicine in enumerate(medicines, 1):
                print(f"{i}. {medicine['medicine_name']}")
                print(f"   Dosage: {medicine.get('dosage', 'N/A')}")
                print(f"   Available: {medicine['is_available']}")
                print(f"   Confidence: {medicine['confidence_score']}")
                
                if medicine['is_available'] and medicine.get('product_info'):
                    product = medicine['product_info']
                    print(f"   → Product: {product['name']}")
                    print(f"   → Price: ₹{product['price']}")
                print()
            
            return True
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Prescription Search API Test Suite")
    print("=" * 50)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print()
    
    # Test new prescription products API
    products_test = test_prescription_products_api()
    
    # Test regular suggestions API for comparison
    suggestions_test = test_regular_medicine_suggestions()
    
    print("\n🎯 Test Results Summary")
    print("=" * 30)
    print(f"✅ Prescription Products API: {'PASS' if products_test else 'FAIL'}")
    print(f"✅ Medicine Suggestions API: {'PASS' if suggestions_test else 'FAIL'}")
    
    if products_test and suggestions_test:
        print("\n🎉 All tests passed! Prescription search is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the API implementation.")

if __name__ == "__main__":
    main()
