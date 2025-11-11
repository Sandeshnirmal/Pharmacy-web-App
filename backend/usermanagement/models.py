from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin # PermissionsMixin is important for is_superuser/is_staff
from django.utils import timezone
import uuid
from django.apps import apps # Import apps to get models dynamically

# ============================================================================
# USER ROLE MANAGEMENT SYSTEM
# ============================================================================

class UserRole(models.Model):
    """Enhanced user role classification system"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('pharmacist', 'Pharmacist'),
        ('verifier', 'Verifier'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ]

    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict)  # Store role-specific permissions
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_roles'
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'

    def __str__(self):
        return self.display_name



class CustomUserManager(BaseUserManager):
    def _create_user_with_role(self, email, password, role_name, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)

        UserRoleModel = apps.get_model('usermanagement', 'UserRole')
        try:
            role = UserRoleModel.objects.get(name=role_name)
        except UserRoleModel.DoesNotExist:
            print(f"Creating missing '{role_name}' role.")
            # Create the role with a default display name.
            # You might want to add more sophisticated default permissions here.
            role = UserRoleModel.objects.create(name=role_name, display_name=role_name.capitalize())

        extra_fields.setdefault('user_role', role) # Ensure user_role is set in extra_fields

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_active', True)
        return self._create_user_with_role(email, password, 'customer', **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self._create_user_with_role(email, password, 'admin', **extra_fields)


class User(AbstractBaseUser, PermissionsMixin): # <--- MUST inherit from both
    """Enhanced user model with role-based classification"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)

    # Enhanced user fields
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)

    # Role management
    user_role = models.ForeignKey(UserRole, on_delete=models.PROTECT, related_name='users', null=False, blank=False)

    # Professional credentials (for doctors/pharmacists)
    license_number = models.CharField(max_length=100, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('verified', 'Verified'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )

    # Profile information
    # Removed profile_picture_url, relying on UserProfile.avatar

    # System fields
    date_joined = models.DateTimeField(auto_now_add=True)
    registration_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True) # <--- REQUIRED by AbstractBaseUser
    is_staff = models.BooleanField(default=False) # <--- REQUIRED by PermissionsMixin
    is_superuser = models.BooleanField(default=False) # <--- REQUIRED by PermissionsMixin
    last_login = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager() # <--- REQUIRED to use your custom manager

    USERNAME_FIELD = 'email' # <--- ABSOLUTELY REQUIRED, and must be unique
    REQUIRED_FIELDS = ['first_name', 'last_name'] # Removed phone_number as it is nullable

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return self.email

    # These methods are required by AbstractBaseUser / PermissionsMixin
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name
    
    def save(self, *args, **kwargs):
        # Only attempt to set permissions if user_role is already assigned
        if self.user_role_id: # Check if the foreign key exists
            permissions = self.user_role.permissions
            self.is_staff = permissions.get('is_staff', False)
            self.is_superuser = permissions.get('is_superuser', False)
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    avatar = models.URLField(blank=True)
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    newsletter_subscription = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    preferred_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()}'s Profile"


class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    preferred_categories = models.JSONField(default=list, blank=True)
    favorite_brands = models.JSONField(default=list, blank=True)
    price_range_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_range_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_time_preference = models.CharField(max_length=20, choices=[
        ('morning', 'Morning (9 AM - 12 PM)'),
        ('afternoon', 'Afternoon (12 PM - 5 PM)'),
        ('evening', 'Evening (5 PM - 9 PM)'),
        ('anytime', 'Anytime')
    ], default='anytime')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()}'s Preferences"


class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=[
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('product_view', 'Product View'),
        ('search', 'Search'),
        ('order_placed', 'Order Placed'),
        ('review_added', 'Review Added'),
        ('wishlist_added', 'Wishlist Added'),
    ])
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.activity_type}"


class Address(models.Model): 
    ADDRESS_TYPES = [('Home', 'Home'), ('Work', 'Work'), ('Other', 'Other')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    landmark = models.CharField(max_length=100, blank=True, null=True)
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPES)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email}'s {self.address_type} Address"
