from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Address, UserProfile, UserPreferences, UserActivity, UserRole

class AddressSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True) # Ensure user is not sent in request body

    class Meta:
        model = Address
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User is deactivated")
        return {
            'user': user
        }

class UserSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    user_role_name = serializers.CharField(source='user_role.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone_number',
            'gender', 'user_role', 'user_role_name', 'date_joined', 'registration_date',
             'is_active', 'is_staff', 'is_superuser', # Use profile_picture_url
            'last_login', 'addresses'
        ]
        # Removed exclude = ('profile_image',) as the field no longer exists

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'gender', 'user_role', 'password'
        ]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class UserActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = UserActivity
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class EnhancedUserSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    profile = UserProfileSerializer(read_only=True)
    preferences = UserPreferencesSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    user_role_name = serializers.CharField(source='user_role.name', read_only=True)
    total_orders = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    wishlist_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone_number',
            'gender', 'user_role', 'user_role_name', 'date_joined', 'registration_date',
             'is_active', 'last_login', 'addresses', # Use profile_picture_url
            'profile', 'preferences', 'total_orders', 'total_reviews', 'wishlist_count'
        ]
        # Removed exclude = ('profile_image',) as the field no longer exists

    def get_total_orders(self, obj):
        # This will be implemented when orders app is enhanced
        return 0

    def get_total_orders(self, obj):
        # This will be implemented when orders app is enhanced
        return 0

    def get_total_reviews(self, obj):
        from product.models import ProductReview
        return ProductReview.objects.filter(user=obj).count()

    def get_wishlist_count(self, obj):
        from product.models import Wishlist
        return Wishlist.objects.filter(user=obj).count()


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['id', 'name', 'display_name']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number',
            'gender', 'user_role', # Added user_role for updates
        ]

    def update(self, instance, validated_data):
        # Handle user_role separately if it's in validated_data
        user_role_data = validated_data.pop('user_role', None)
        if user_role_data:
            instance.user_role = user_role_data

        # Update other user instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value
