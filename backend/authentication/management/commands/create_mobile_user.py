from django.core.management.base import BaseCommand
from usermanagement.models import User
from django.contrib.auth import authenticate

class Command(BaseCommand):
    help = 'Create a test user for mobile app authentication'

    def handle(self, *args, **options):
        email = "mobile@test.com"
        password = "mobile123"
        
        self.stdout.write("🔧 Creating Mobile Test User")
        self.stdout.write("=" * 40)
        
        # Check if user exists
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Found existing user: {email}')
            )
            self.stdout.write(f'   ID: {user.id}')
            self.stdout.write(f'   Active: {user.is_active}')
            self.stdout.write(f'   Role: {user.role}')
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
            self.stdout.write(
                self.style.SUCCESS(f'✅ Created new user: {email}')
            )
        
        # Update password and ensure user is active
        user.set_password(password)
        user.is_active = True
        user.save()
        self.stdout.write(
            self.style.SUCCESS(f'✅ Updated password and activated user')
        )
        
        # Test authentication
        auth_user = authenticate(email=email, password=password)
        if auth_user:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Authentication test PASSED')
            )
            self.stdout.write(f'   User ID: {auth_user.id}')
            self.stdout.write(f'   Active: {auth_user.is_active}')
            self.stdout.write(f'   Role: {auth_user.role}')
        else:
            self.stdout.write(
                self.style.ERROR(f'❌ Authentication test FAILED')
            )
            self.stdout.write("Trying to debug...")
            
            # Debug authentication
            try:
                user_check = User.objects.get(email=email)
                self.stdout.write(f'   User exists: {user_check.email}')
                self.stdout.write(f'   User active: {user_check.is_active}')
                self.stdout.write(f'   User password set: {user_check.has_usable_password()}')
                
                # Try to authenticate with raw password
                if user_check.check_password(password):
                    self.stdout.write(f'   Password check: PASSED')
                else:
                    self.stdout.write(f'   Password check: FAILED')
                    
            except Exception as e:
                self.stdout.write(f'   Debug error: {e}')
        
        self.stdout.write(f'\n🎯 Test Credentials:')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write(
            self.style.SUCCESS('\n✅ Ready for mobile app testing!')
        ) 