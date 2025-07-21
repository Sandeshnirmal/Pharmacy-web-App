#!/usr/bin/env python3
"""
Test mobile app authentication and prescription upload flow
"""
import requests
import json
import os

# Configuration
BASE_URL = "http://192.168.129.6:8001"

def test_mobile_authentication():
    """Test mobile authentication flow"""
    print("🧪 Testing Mobile Authentication Flow")
    print("=" * 50)
    
    # Test user credentials
    test_users = [
        {"email": "customer02@gmail.com", "password": "password123"},
        {"email": "test@pharmacy.com", "password": "testpass123"},
        {"email": "customer@pharmacy.com", "password": "password123"}
    ]
    
    for user in test_users:
        print(f"\n🔐 Testing user: {user['email']}")
        
        # Test login
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login/",
                json=user,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📊 Login Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login Success")
                print(f"🔑 Access Token: {data.get('access', 'N/A')[:20]}...")
                print(f"👤 User ID: {data.get('user', {}).get('id', 'N/A')}")
                print(f"📧 Email: {data.get('user', {}).get('email', 'N/A')}")
                
                # Test API call with token
                token = data.get('access')
                if token:
                    test_api_with_token(token, user['email'])
                
                return token, user['email']
            else:
                print(f"❌ Login Failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Login Error: {e}")
    
    return None, None

def test_api_with_token(token, email):
    """Test API calls with authentication token"""
    print(f"\n🔗 Testing API calls for {email}")
    
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    # Test user profile
    try:
        response = requests.get(f"{BASE_URL}/api/auth/user/", headers=headers)
        print(f"👤 User Profile: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ Profile Error: {response.text}")
    except Exception as e:
        print(f"❌ Profile Error: {e}")
    
    # Test products API
    try:
        response = requests.get(f"{BASE_URL}/product/products/", headers=headers)
        print(f"🛒 Products API: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ Products Error: {response.text}")
    except Exception as e:
        print(f"❌ Products Error: {e}")

def test_prescription_upload(token, email):
    """Test prescription upload with authentication"""
    print(f"\n📋 Testing Prescription Upload for {email}")
    
    # Check if test image exists
    test_image_path = "prescription_sample.jpg"
    if not os.path.exists(test_image_path):
        print(f"❌ Test image not found: {test_image_path}")
        return None
    
    headers = {
        "Authorization": f"Token {token}"
    }
    
    try:
        with open(test_image_path, 'rb') as image_file:
            files = {'image': image_file}
            
            response = requests.post(
                f"{BASE_URL}/prescription/mobile/upload/",
                headers=headers,
                files=files
            )
            
            print(f"📤 Upload Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Upload Success")
                print(f"📋 Prescription ID: {data.get('prescription_id')}")
                
                prescription_id = data.get('prescription_id')
                if prescription_id:
                    test_prescription_processing(token, prescription_id)
                
                return prescription_id
            else:
                print(f"❌ Upload Failed: {response.text}")
                
    except Exception as e:
        print(f"❌ Upload Error: {e}")
    
    return None

def test_prescription_processing(token, prescription_id):
    """Test prescription processing status"""
    print(f"\n⏳ Testing Processing for Prescription {prescription_id}")
    
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    max_attempts = 10
    attempts = 0
    
    while attempts < max_attempts:
        try:
            response = requests.get(
                f"{BASE_URL}/prescription/mobile/status/{prescription_id}/",
                headers=headers
            )
            
            print(f"📊 Status Check {attempts + 1}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'Unknown')
                is_ready = data.get('is_ready', False)
                
                print(f"📋 Status: {status}")
                print(f"✅ Ready: {is_ready}")
                
                if is_ready:
                    print(f"🎉 Processing Complete!")
                    test_prescription_suggestions(token, prescription_id)
                    break
                elif status in ['Rejected', 'Failed']:
                    print(f"❌ Processing Failed: {status}")
                    break
                else:
                    print(f"⏳ Still processing... (attempt {attempts + 1}/{max_attempts})")
            else:
                print(f"❌ Status Error: {response.text}")
                break
                
        except Exception as e:
            print(f"❌ Status Error: {e}")
            break
        
        attempts += 1
        if attempts < max_attempts:
            import time
            time.sleep(2)
    
    if attempts >= max_attempts:
        print(f"⏰ Processing Timeout after {max_attempts * 2} seconds")

def test_prescription_suggestions(token, prescription_id):
    """Test getting prescription suggestions"""
    print(f"\n💊 Testing Suggestions for Prescription {prescription_id}")
    
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/prescription/mobile/suggestions/{prescription_id}/",
            headers=headers
        )
        
        print(f"📊 Suggestions Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            medicines = data.get('medicines', [])
            print(f"✅ Found {len(medicines)} medicines")
            
            for i, medicine in enumerate(medicines, 1):
                print(f"  {i}. {medicine.get('medicine_name', 'Unknown')}")
                print(f"     Available: {medicine.get('is_available', False)}")
                print(f"     Confidence: {medicine.get('confidence_score', 0)}")
        else:
            print(f"❌ Suggestions Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Suggestions Error: {e}")

def main():
    """Main test function"""
    print("🧪 Mobile App Authentication & Processing Test")
    print("=" * 60)
    print(f"Backend URL: {BASE_URL}")
    print()
    
    # Test authentication
    token, email = test_mobile_authentication()
    
    if token and email:
        print(f"\n🎯 Authentication successful for {email}")
        
        # Test prescription upload if image exists
        if os.path.exists("prescription_sample.jpg"):
            test_prescription_upload(token, email)
        else:
            print(f"\n📋 Skipping prescription upload (no test image)")
            print(f"💡 To test upload, add a prescription image as 'prescription_sample.jpg'")
    else:
        print(f"\n❌ Authentication failed - cannot test prescription flow")
    
    print(f"\n🎯 Test Complete")

if __name__ == "__main__":
    main()
