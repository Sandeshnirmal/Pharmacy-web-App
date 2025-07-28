# Enhanced User Management Serializers
# Role-based user management with comprehensive CRUD operations

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserRole, Address, UserProfile

User = get_user_model()

# ============================================================================
# USER ROLE MANAGEMENT SERIALIZERS
# ============================================================================

class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user roles with permission management"""
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'name', 'display_name', 'description', 'permissions',
            'is_active', 'users_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_users_count(self, obj):
        """Get count of users with this role"""
        return obj.users.filter(is_active=True).count()
    
    def validate_permissions(self, value):
        """Validate permissions structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Permissions must be a dictionary")
        
        # Define allowed permission categories
        allowed_categories = [
            'prescriptions', 'products', 'orders', 'users', 'inventory', 'reports'
        ]
        
        for category, perms in value.items():
            if category not in allowed_categories:
                raise serializers.ValidationError(f"Invalid permission category: {category}")
            
            if not isinstance(perms, dict):
                raise serializers.ValidationError(f"Permissions for {category} must be a dictionary")
        
        return value

class UserRoleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user roles"""
    
    class Meta:
        model = UserRole
        fields = ['name', 'display_name', 'description', 'permissions', 'is_active']
    
    def validate_name(self, value):
        """Validate role name"""
        if UserRole.objects.filter(name=value).exists():
            raise serializers.ValidationError("A role with this name already exists")
        return value

# ============================================================================
# ENHANCED USER SERIALIZERS
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Enhanced user serializer with role-based information"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    user_role_details = UserRoleSerializer(source='user_role', read_only=True)
    profile_details = serializers.SerializerMethodField()
    
    # Permission checks
    can_verify_prescriptions = serializers.SerializerMethodField()
    can_manage_inventory = serializers.SerializerMethodField()
    can_manage_users = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone_number',
            'date_of_birth', 'gender', 'role', 'role_display', 'user_role', 'user_role_details',
            'license_number', 'verification_status', 'profile_picture_url', 'profile_image',
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'profile_details', 'can_verify_prescriptions', 'can_manage_inventory', 'can_manage_users'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'full_name', 'role_display',
            'user_role_details', 'profile_details'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def get_profile_details(self, obj):
        """Get user profile details if exists"""
        try:
            profile = obj.profile
            return {
                'bio': profile.bio,
                'location': profile.location,
                'phone_verified': profile.phone_verified,
                'email_verified': profile.email_verified,
            }
        except:
            return None
    
    def get_can_verify_prescriptions(self, obj):
        """Check if user can verify prescriptions"""
        return obj.role in ['admin', 'pharmacist', 'verifier']
    
    def get_can_manage_inventory(self, obj):
        """Check if user can manage inventory"""
        return obj.role in ['admin', 'pharmacist', 'staff']
    
    def get_can_manage_users(self, obj):
        """Check if user can manage other users"""
        return obj.role in ['admin']

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 'password', 'password_confirm',
            'date_of_birth', 'gender', 'role', 'user_role', 'license_number'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number uniqueness"""
        if value and User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists")
        return value
    
    def validate_license_number(self, value):
        """Validate license number for professional roles"""
        role = self.initial_data.get('role')
        if role in ['doctor', 'pharmacist'] and not value:
            raise serializers.ValidationError("License number is required for professional roles")
        return value
    
    def create(self, validated_data):
        """Create user with encrypted password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth', 'gender',
            'role', 'user_role', 'license_number', 'verification_status',
            'profile_picture_url', 'is_active'
        ]
    
    def validate_role_change(self, attrs):
        """Validate role changes"""
        user = self.instance
        new_role = attrs.get('role', user.role)
        
        # Only admins can change roles
        request_user = self.context['request'].user
        if request_user.role != 'admin' and new_role != user.role:
            raise serializers.ValidationError("Only admins can change user roles")
        
        return attrs
    
    def validate(self, attrs):
        """Custom validation"""
        return self.validate_role_change(attrs)

class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password changes"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Validate password change"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value

# ============================================================================
# ROLE-BASED DASHBOARD SERIALIZERS
# ============================================================================

class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard data"""
    total_users = serializers.IntegerField()
    total_prescriptions = serializers.IntegerField()
    pending_verifications = serializers.IntegerField()
    total_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    recent_activities = serializers.ListField()

class PharmacistDashboardSerializer(serializers.Serializer):
    """Serializer for pharmacist dashboard data"""
    pending_prescriptions = serializers.IntegerField()
    verified_today = serializers.IntegerField()
    rejected_today = serializers.IntegerField()
    need_clarification = serializers.IntegerField()
    recent_prescriptions = serializers.ListField()

class VerifierDashboardSerializer(serializers.Serializer):
    """Serializer for verifier dashboard data"""
    assigned_prescriptions = serializers.IntegerField()
    completed_today = serializers.IntegerField()
    average_processing_time = serializers.FloatField()
    accuracy_score = serializers.FloatField()

# ============================================================================
# USER PROFILE AND ADDRESS SERIALIZERS
# ============================================================================

class AddressSerializer(serializers.ModelSerializer):
    """Enhanced address serializer"""
    
    class Meta:
        model = Address
        fields = [
            'id', 'address_line1', 'address_line2', 'city', 'state',
            'postal_code', 'country', 'address_type', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer"""
    addresses = AddressSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'location', 'birth_date', 'avatar', 'phone_verified',
            'email_verified', 'newsletter_subscription', 'sms_notifications',
            'email_notifications', 'preferred_language', 'timezone',
            'addresses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'phone_verified', 'email_verified']

# ============================================================================
# PERMISSION AND SECURITY SERIALIZERS
# ============================================================================

class UserPermissionSerializer(serializers.Serializer):
    """Serializer for user permissions"""
    user_id = serializers.UUIDField()
    permissions = serializers.DictField()
    
    def validate_permissions(self, value):
        """Validate permission structure"""
        # Add permission validation logic here
        return value

class SecurityLogSerializer(serializers.Serializer):
    """Serializer for security logs"""
    user = serializers.CharField()
    action = serializers.CharField()
    ip_address = serializers.IPAddressField()
    user_agent = serializers.CharField()
    timestamp = serializers.DateTimeField()
    success = serializers.BooleanField()
