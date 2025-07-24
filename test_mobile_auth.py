#!/usr/bin/env python3
"""
Test Mobile App Authentication
Tests the authentication endpoints for the mobile app
"""

import requests
import json

# Configuration
BASE_URL = "http://192.168.129.6:8001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login/"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register/"
PROFILE_ENDPOINT = f"{BASE_URL}/api/auth/user/"

def test_server_status():
    """Test if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"✅ Server is running: HTTP {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Server not accessible: {e}")
        return False

def test_login():
    """Test login endpoint"""
    print("\n🔐 Testing Login Endpoint")
    print("-" * 40)
    
    # Test data
    login_data = {
        "email": "test@pharmacy.com",
        "password": "test123"
    }
    
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Token: {data.get('token', 'Not found')}")
            print(f"Access: {data.get('access', 'Not found')}")
            print(f"Refresh: {data.get('refresh', 'Not found')}")
            print(f"User: {data.get('user', 'Not found')}")
            return data.get('token')
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_profile(token):
    """Test user profile endpoint"""
    if not token:
        print("❌ No token available for profile test")
        return
        
    print("\n👤 Testing Profile Endpoint")
    print("-" * 40)
    
    try:
        headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            PROFILE_ENDPOINT,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Profile retrieved successfully!")
            print(f"User ID: {data.get('id')}")
            print(f"Email: {data.get('email')}")
            print(f"Name: {data.get('first_name')} {data.get('last_name')}")
        else:
            print(f"❌ Profile failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Profile error: {e}")

def test_register():
    """Test registration endpoint"""
    print("\n📝 Testing Registration Endpoint")
    print("-" * 40)
    
    # Test data
    register_data = {
        "email": "mobile_test@pharmacy.com",
        "password": "mobile123",
        "first_name": "Mobile",
        "last_name": "Test",
        "phone": "9876543210"
    }
    
    try:
        response = requests.post(
            REGISTER_ENDPOINT,
            json=register_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Registration successful!")
            print(f"User ID: {data.get('user_id')}")
            print(f"Email: {data.get('email')}")
        else:
            print(f"❌ Registration failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Registration error: {e}")

def main():
    """Run all tests"""
    print("🧪 Mobile App Authentication Test")
    print("=" * 50)
    
    # Test server status
    if not test_server_status():
        return
    
    # Test registration
    test_register()
    
    # Test login
    token = test_login()
    
    # Test profile with token
    test_profile(token)
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main()
