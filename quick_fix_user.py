#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usermanagement.models import User
from django.contrib.auth import authenticate

def quick_fix():
    email = "mobile@test.com"
    password = "mobile123"
    
    print("🔧 Quick Fix for Mobile User")
    print("=" * 40)
    
    # Delete existing user if exists
    try:
        old_user = User.objects.get(email=email)
        old_user.delete()
        print(f"✅ Deleted existing user: {email}")
    except User.DoesNotExist:
        print(f"✅ No existing user found")
    
    # Create fresh user
    try:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name="Mobile",
            last_name="Test",
            phone_number="9876543210",
            role="customer",
            is_active=True
        )
        print(f"✅ Created fresh user: {email}")
        print(f"   ID: {user.id}")
        print(f"   Active: {user.is_active}")
        print(f"   Role: {user.role}")
        
        # Test authentication immediately
        auth_user = authenticate(email=email, password=password)
        if auth_user:
            print(f"✅ Authentication test PASSED")
            print(f"   Auth User ID: {auth_user.id}")
            print(f"   Auth User Active: {auth_user.is_active}")
        else:
            print(f"❌ Authentication test FAILED")
            
            # Additional debugging
            user_check = User.objects.get(email=email)
            print(f"   User exists: {user_check.email}")
            print(f"   User active: {user_check.is_active}")
            print(f"   Password set: {user_check.has_usable_password()}")
            print(f"   Password check: {user_check.check_password(password)}")
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
    
    print(f"\n🎯 Test Credentials:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("\n✅ Ready for testing!")

if __name__ == "__main__":
    quick_fix() 