#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usermanagement.models import User
from django.contrib.auth import authenticate

def fix_mobile_user():
    email = "mobile@test.com"
    password = "mobile123"
    
    print("🔧 Fixing Mobile Test User")
    print("=" * 40)
    
    # Check if user exists
    try:
        user = User.objects.get(email=email)
        print(f"✅ Found existing user: {email}")
        print(f"   ID: {user.id}")
        print(f"   Active: {user.is_active}")
        print(f"   Role: {user.role}")
    except User.DoesNotExist:
        print(f"❌ User {email} does not exist")
        print("Creating new user...")
        
        # Create new user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name="Mobile",
            last_name="Test",
            phone_number="9876543210",
            role="customer",
            is_active=True
        )
        print(f"✅ Created new user: {email}")
    
    # Update password and ensure user is active
    user.set_password(password)
    user.is_active = True
    user.save()
    print(f"✅ Updated password and activated user")
    
    # Test authentication
    auth_user = authenticate(email=email, password=password)
    if auth_user:
        print(f"✅ Authentication test PASSED")
        print(f"   User ID: {auth_user.id}")
        print(f"   Active: {auth_user.is_active}")
        print(f"   Role: {auth_user.role}")
    else:
        print(f"❌ Authentication test FAILED")
        print("Trying to debug...")
        
        # Debug authentication
        try:
            user_check = User.objects.get(email=email)
            print(f"   User exists: {user_check.email}")
            print(f"   User active: {user_check.is_active}")
            print(f"   User password set: {user_check.has_usable_password()}")
            
            # Try to authenticate with raw password
            if user_check.check_password(password):
                print(f"   Password check: PASSED")
            else:
                print(f"   Password check: FAILED")
                
        except Exception as e:
            print(f"   Debug error: {e}")
    
    print(f"\n🎯 Test Credentials:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("\n✅ Ready for mobile app testing!")

if __name__ == "__main__":
    fix_mobile_user() 