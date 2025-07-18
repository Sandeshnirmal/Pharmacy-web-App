#!/usr/bin/env python3
"""
Test script to verify prescription upload functionality
"""

import requests
import json
from io import BytesIO
from PIL import Image

# Configuration
BASE_URL = "http://192.168.129.6:8001"
TEST_USER = {
    "email": "test@pharmacy.com",
    "password": "test123"
}

def get_jwt_token():
    """Get JWT token for authentication"""
    response = requests.post(
        f"{BASE_URL}/api/token/",
        json=TEST_USER,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        tokens = response.json()
        return tokens['access']
    else:
        print(f"Authentication failed: {response.status_code} - {response.text}")
        return None

def create_test_image():
    """Create a test prescription image with medicine text"""
    from PIL import ImageDraw, ImageFont

    # Create a prescription-like image
    img = Image.new('RGB', (600, 800), color='white')
    draw = ImageDraw.Draw(img)

    # Try to use a default font, fallback to basic if not available
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()

    # Draw prescription header
    draw.text((50, 50), "Dr. Smith Medical Clinic", fill='black', font=title_font)
    draw.text((50, 80), "Prescription", fill='black', font=title_font)
    draw.text((50, 120), "Patient: John Doe", fill='black', font=font)
    draw.text((50, 150), "Date: 18/07/2025", fill='black', font=font)

    # Draw medicines
    medicines = [
        "1. Paracetamol 500mg - Take 1 tablet twice daily for 5 days",
        "2. Amoxicillin 250mg - Take 1 capsule three times daily for 7 days",
        "3. Cetirizine 10mg - Take 1 tablet once daily for 3 days",
        "4. Omeprazole 20mg - Take 1 tablet before breakfast for 10 days"
    ]

    y_pos = 200
    for medicine in medicines:
        draw.text((50, y_pos), medicine, fill='black', font=font)
        y_pos += 40

    # Draw doctor signature area
    draw.text((50, y_pos + 50), "Dr. Smith", fill='black', font=font)
    draw.text((50, y_pos + 80), "MBBS, MD", fill='black', font=font)

    # Save to BytesIO
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)

    return img_bytes

def test_prescription_upload():
    """Test prescription upload endpoint"""
    print("🧪 Testing Prescription Upload")
    print("=" * 40)
    
    # Get authentication token
    token = get_jwt_token()
    if not token:
        print("❌ Failed to get authentication token")
        return False
    
    print("✅ Authentication successful")
    
    # Create test image
    test_image = create_test_image()
    
    # Prepare upload request
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    files = {
        'image': ('test_prescription.jpg', test_image, 'image/jpeg')
    }
    
    print("📤 Uploading test prescription...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/prescription/mobile/upload/",
            headers=headers,
            files=files,
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code in [200, 201, 202]:
            try:
                data = response.json()
                if 'prescription_id' in data:
                    prescription_id = data['prescription_id']
                    print(f"✅ Upload successful! Prescription ID: {prescription_id}")

                    # Test status check
                    test_status_check(token, prescription_id)

                    # Test suggestions
                    test_suggestions(token, prescription_id)
                    return True
                else:
                    print("⚠️ Upload response missing prescription_id")
                    return False
            except json.JSONDecodeError:
                print("❌ Invalid JSON response")
                return False
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Upload request timed out")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload request failed: {e}")
        return False

def test_status_check(token, prescription_id):
    """Test prescription status check"""
    print(f"\n🔍 Testing Status Check for Prescription {prescription_id}")
    print("=" * 50)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/prescription/mobile/status/{prescription_id}/",
            headers=headers,
            timeout=10
        )
        
        print(f"📊 Status Response: {response.status_code}")
        print(f"📄 Status Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Status check successful")
            return True
        elif response.status_code == 404:
            print("❌ Prescription not found (404)")
            return False
        else:
            print(f"⚠️ Unexpected status response: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Status check failed: {e}")
        return False

def test_suggestions(token, prescription_id):
    """Test medicine suggestions endpoint"""
    print(f"\n💊 Testing Medicine Suggestions for Prescription {prescription_id}")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/prescription/mobile/suggestions/{prescription_id}/",
            headers=headers,
            timeout=10
        )
        
        print(f"📊 Suggestions Response: {response.status_code}")
        print(f"📄 Suggestions Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Suggestions check successful")
            return True
        else:
            print(f"⚠️ Suggestions response: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Suggestions check failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Prescription Upload Test Suite")
    print("=" * 50)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print()
    
    success = test_prescription_upload()
    
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n❌ Tests failed. Check the logs above.")
    
    return success

if __name__ == "__main__":
    main()
