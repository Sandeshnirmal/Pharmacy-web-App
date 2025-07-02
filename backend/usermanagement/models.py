from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin # PermissionsMixin is important for is_superuser/is_staff



class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True) # Often forgotten for superusers

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin): # <--- MUST inherit from both
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('pharmacist', 'Pharmacist'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)
    # The 'password_hash' field you had previously should be REMOVED.
    # AbstractBaseUser handles the 'password' field internally.
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    date_joined = models.DateTimeField(auto_now_add=True)
    registration_date = models.DateTimeField(auto_now_add=True)
    profile_picture_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True) # <--- REQUIRED by AbstractBaseUser
    is_staff = models.BooleanField(default=False) # <--- REQUIRED by PermissionsMixin
    is_superuser = models.BooleanField(default=False) # <--- REQUIRED by PermissionsMixin
    last_login = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager() # <--- REQUIRED to use your custom manager

    USERNAME_FIELD = 'email' # <--- ABSOLUTELY REQUIRED, and must be unique
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number'] # <--- ABSOLUTELY REQUIRED, as a list/tuple

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
    
class Address(models.Model): # <-- Ensure this class definition exists and is not commented out
    ADDRESS_TYPES = [('Home', 'Home'), ('Work', 'Work'), ('Other', 'Other')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses') # Ensure 'User' is correctly referenced
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    landmark = models.CharField(max_length=100, blank=True, null=True)
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPES)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        # Make sure user.email is accessible, this is correct if User is AbstractBaseUser
        return f"{self.user.email}'s {self.address_type} Address"    