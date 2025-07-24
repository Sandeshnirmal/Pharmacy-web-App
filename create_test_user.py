#!/usr/bin/env python3
import os
import sys
import django

# Setup Django - fix the path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from usermanagement.models import User
from django.contrib.auth import authenticate

def create_mobile_test_user():
    email = "mobile@test.com"
    password = "mobile123"
    
    # Check if user exists
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        user.set_password(password)
        user.is_active = True
        user.save()
        print(f"✅ Updated existing user: {email}")
    else:
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
    
    # Test authentication
    auth_user = authenticate(email=email, password=password)
    if auth_user:
        print(f"✅ Authentication test PASSED")
        print(f"   User ID: {auth_user.id}")
        print(f"   Active: {auth_user.is_active}")
        print(f"   Role: {auth_user.role}")
    else:
        print(f"❌ Authentication test FAILED")
    
    return user

if __name__ == "__main__":
    print("🔧 Creating Mobile Test User")
    print("=" * 40)
    user = create_mobile_test_user()
    print(f"\n🎯 Test Credentials:")
    print(f"Email: mobile@test.com")
    print(f"Password: mobile123")
    print("\n✅ Ready for mobile app testing!") 