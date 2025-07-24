#!/usr/bin/env python3
"""
Create Mobile Test User
Creates a test user for mobile app authentication
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from usermanagement.models import User

def create_test_user():
    """Create a test user for mobile app"""
    email = "mobile@test.com"
    password = "mobile123"
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"✅ User {email} already exists")
        user = User.objects.get(email=email)
        user.set_password(password)
        user.save()
        print(f"✅ Password updated for {email}")
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
    from django.contrib.auth import authenticate
    auth_user = authenticate(email=email, password=password)
    
    if auth_user:
        print(f"✅ Authentication test passed for {email}")
        print(f"   User ID: {auth_user.id}")
        print(f"   Active: {auth_user.is_active}")
        print(f"   Role: {auth_user.role}")
    else:
        print(f"❌ Authentication test failed for {email}")
    
    return user

def list_all_users():
    """List all users in the database"""
    print("\n📋 All Users in Database:")
    print("-" * 50)
    
    users = User.objects.all()
    for user in users:
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Name: {user.first_name} {user.last_name}")
        print(f"Active: {user.is_active}")
        print(f"Role: {user.role}")
        print(f"Phone: {user.phone_number}")
        print("-" * 30)

if __name__ == "__main__":
    print("🔧 Creating Mobile Test User")
    print("=" * 40)
    
    # Create test user
    user = create_test_user()
    
    # List all users
    list_all_users()
    
    print("\n🎯 Test User Credentials:")
    print(f"Email: mobile@test.com")
    print(f"Password: mobile123")
    print("\n✅ Ready for mobile app testing!") 