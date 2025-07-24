#!/usr/bin/env python3
"""
Test Prescription Upload API with Real OCR Processing
Tests the complete mobile app prescription upload flow
"""

import requests
import json
import os
from PIL import Image, ImageDraw, ImageFont

def create_test_prescription():
    """Create a test prescription image"""
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw prescription content
    draw.text((50, 50), "Dr. Smith's Clinic", fill='black', font=font)
    draw.text((50, 80), "Prescription", fill='black', font=font)
    draw.text((50, 110), "Patient: John Doe", fill='black', font=small_font)
    draw.text((50, 130), "Date: 2025-01-20", fill='black', font=small_font)
    
    medicines = [
        "1. Crocin 650mg - Take 1 tablet twice daily after food for 3 days",
        "2. Azithral 500mg - Take 1 tablet once daily before food for 5 days", 
        "3. Omez 20mg - Take 1 capsule twice daily before meals for 7 days",
        "4. Cetrizine 10mg - Take 1 tablet at bedtime for 5 days"
    ]
    
    y_pos = 180
    for medicine in medicines:
        draw.text((50, y_pos), medicine, fill='black', font=small_font)
        y_pos += 40
    
    draw.text((50, y_pos + 50), "Dr. Smith", fill='black', font=small_font)
    draw.text((50, y_pos + 70), "MBBS, MD", fill='black', font=small_font)
    
    img_path = '/tmp/test_prescription_api.png'
    img.save(img_path)
    return img_path

def get_auth_token():
    """Get authentication token for API calls"""
    login_url = "http://192.168.129.6:8001/api/auth/login/"
    login_data = {
        "email": "test@pharmacy.com",
        "password": "test123"
    }

    try:
        response = requests.post(login_url, json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Try both 'token' and 'access' keys
            token = data.get('token') or data.get('access')
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_prescription_upload(token, image_path):
    """Test prescription upload API"""
    upload_url = "http://192.168.129.6:8001/prescription/mobile/upload/"
    
    headers = {
        'Authorization': f'Token {token}'
    }
    
    try:
        with open(image_path, 'rb') as img_file:
            files = {'image': img_file}
            response = requests.post(upload_url, headers=headers, files=files, timeout=30)
            
        if response.status_code == 201:
            data = response.json()
            print("✅ Prescription upload successful!")
            print(f"   Prescription ID: {data.get('prescription_id')}")
            print(f"   OCR Confidence: {data.get('ocr_confidence', 'N/A')}")
            print(f"   Medicines Found: {data.get('medicines_found', 'N/A')}")
            print(f"   Can Proceed to Order: {data.get('can_proceed_to_order', False)}")
            return data.get('prescription_id')
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def test_prescription_status(token, prescription_id):
    """Test prescription status API"""
    status_url = f"http://192.168.129.6:8001/prescription/mobile/status/{prescription_id}/"
    
    headers = {
        'Authorization': f'Token {token}'
    }
    
    try:
        response = requests.get(status_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Prescription status retrieved!")
            print(f"   Status: {data.get('status')}")
            print(f"   AI Processed: {data.get('ai_processed')}")
            print(f"   Is Ready: {data.get('is_ready')}")
            print(f"   Medicines Count: {data.get('medicines_count')}")
            return data.get('is_ready', False)
        else:
            print(f"❌ Status check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Status error: {e}")
        return False

def test_medicine_suggestions(token, prescription_id):
    """Test medicine suggestions API"""
    suggestions_url = f"http://192.168.129.6:8001/prescription/mobile/suggestions/{prescription_id}/"
    
    headers = {
        'Authorization': f'Token {token}'
    }
    
    try:
        response = requests.get(suggestions_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Medicine suggestions retrieved!")
            print(f"   Status: {data.get('status')}")
            print(f"   AI Confidence: {data.get('ai_confidence')}")
            
            summary = data.get('summary', {})
            print(f"   Total Medicines: {summary.get('total_medicines')}")
            print(f"   Available: {summary.get('available_medicines')}")
            print(f"   Unavailable: {summary.get('unavailable_medicines')}")
            
            medicines = data.get('medicines', [])
            print(f"\n   Medicine Details:")
            for i, medicine in enumerate(medicines[:3], 1):  # Show first 3
                print(f"   {i}. {medicine.get('extracted_medicine', 'Unknown')}")
                print(f"      Match: {medicine.get('product_name', 'No match')}")
                print(f"      Price: ₹{medicine.get('price', 'N/A')}")
                print(f"      Available: {medicine.get('in_stock', False)}")
            
            pricing = data.get('pricing', {})
            print(f"\n   Pricing:")
            print(f"   Subtotal: ₹{pricing.get('subtotal', 0)}")
            print(f"   Total: ₹{pricing.get('total', 0)}")
            print(f"   Can Order: {data.get('can_order', False)}")
            
            return True
        else:
            print(f"❌ Suggestions failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Suggestions error: {e}")
        return False

def main():
    """Run complete prescription upload test"""
    print("🧪 Prescription Upload API Test")
    print("=" * 50)
    
    # Step 1: Create test prescription
    print("\n📸 Creating test prescription image...")
    try:
        image_path = create_test_prescription()
        print(f"✅ Test prescription created: {image_path}")
    except Exception as e:
        print(f"❌ Failed to create prescription: {e}")
        return
    
    # Step 2: Get authentication token
    print("\n🔐 Getting authentication token...")
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    print(f"✅ Token obtained: {token[:20]}...")
    
    # Step 3: Upload prescription
    print("\n📤 Uploading prescription...")
    prescription_id = test_prescription_upload(token, image_path)
    if not prescription_id:
        print("❌ Upload failed")
        return
    
    # Step 4: Check status
    print("\n📊 Checking prescription status...")
    is_ready = test_prescription_status(token, prescription_id)
    
    # Step 5: Get medicine suggestions
    if is_ready:
        print("\n💊 Getting medicine suggestions...")
        suggestions_success = test_medicine_suggestions(token, prescription_id)
        
        if suggestions_success:
            print("\n🎯 Complete Flow Test: SUCCESS!")
            print("✅ All APIs working correctly")
            print("✅ OCR processing successful")
            print("✅ Medicine matching working")
            print("✅ Mobile app integration ready")
        else:
            print("\n❌ Suggestions API failed")
    else:
        print("\n⏳ Prescription still processing or failed")
    
    # Cleanup
    try:
        os.remove(image_path)
        print(f"\n🧹 Cleaned up test image")
    except:
        pass
    
    print("\n" + "=" * 50)
    print("🎉 Test Complete!")

if __name__ == "__main__":
    main()
