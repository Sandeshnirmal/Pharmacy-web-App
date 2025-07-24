#!/usr/bin/env python3
"""
Comprehensive Mobile Login Test
Tests the complete authentication flow for mobile app
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login/"
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

def test_login_with_curl():
    """Test login using curl command"""
    print("\n🔐 Testing Login with curl")
    print("-" * 40)
    
    import subprocess
    
    curl_command = [
        'curl', '-X', 'POST', 
        'http://localhost:8001/api/auth/login/',
        '-H', 'Content-Type: application/json',
        '-d', '{"email":"mobile@test.com","password":"mobile123"}',
        '-v'
    ]
    
    try:
        result = subprocess.run(curl_command, capture_output=True, text=True)
        print(f"Exit Code: {result.returncode}")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        
        if result.returncode == 0:
            print("✅ Curl command executed successfully")
        else:
            print("❌ Curl command failed")
            
    except Exception as e:
        print(f"❌ Curl error: {e}")

def test_login_with_requests():
    """Test login using requests library"""
    print("\n🔐 Testing Login with requests")
    print("-" * 40)
    
    login_data = {
        "email": "mobile@test.com",
        "password": "mobile123"
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
        print(f"Response Body: {response.text}")
        
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

def test_profile_with_token(token):
    """Test user profile endpoint with token"""
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
        print(f"Response Body: {response.text}")
        
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

def test_different_credentials():
    """Test with different possible credentials"""
    print("\n🔍 Testing Different Credentials")
    print("-" * 40)
    
    test_credentials = [
        {"email": "mobile@test.com", "password": "mobile123"},
        {"email": "test@pharmacy.com", "password": "test123"},
        {"email": "admin@pharmacy.com", "password": "admin123"},
        {"email": "customer@pharmacy.com", "password": "password123"},
    ]
    
    for creds in test_credentials:
        print(f"\nTesting: {creds['email']}")
        try:
            response = requests.post(
                LOGIN_ENDPOINT,
                json=creds,
                headers={'Content-Type': 'application/json'},
                timeout=5
            )
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("✅ SUCCESS!")
                data = response.json()
                print(f"Token: {data.get('token', 'Not found')}")
                return data.get('token')
            else:
                print(f"Failed: {response.text[:100]}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    return None

def main():
    """Run all tests"""
    print("🧪 Mobile App Authentication Test")
    print("=" * 50)
    
    # Test server status
    if not test_server_status():
        return
    
    # Test with curl
    test_login_with_curl()
    
    # Test with requests
    token = test_login_with_requests()
    
    # Test profile with token
    test_profile_with_token(token)
    
    # Test different credentials
    if not token:
        token = test_different_credentials()
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main() 