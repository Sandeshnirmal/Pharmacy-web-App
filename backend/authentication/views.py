from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from usermanagement.models import User  # Use your custom User model
import json

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user for mobile app"""
    try:
        data = json.loads(request.body)

        # Extract user data
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        phone_number = data.get('phone', '')  # Mobile app sends 'phone', model expects 'phone_number'
        date_of_birth = data.get('date_of_birth', '')
        gender = data.get('gender', '')

        # Validate required fields
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create user using your custom User model
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number if phone_number else None,  # Handle empty phone numbers
        )

        # Handle UserRole
        from usermanagement.models import UserRole, UserProfile # Import UserProfile
        customer_role, created = UserRole.objects.get_or_create(name='customer', defaults={'display_name': 'Customer'})
        user.user_role = customer_role
        user.save()

        # Create UserProfile and assign date_of_birth and gender
        UserProfile.objects.create(
            user=user,
            birth_date=date_of_birth if date_of_birth else None,
            # Removed gender as it's not in UserProfile model
        )
        # Set gender directly on the User model if it exists
        if gender:
            user.gender = gender
            user.save()

        return Response({
            'message': 'User created successfully',
            'user_id': user.id,
            'email': user.email
        }, status=status.HTTP_201_CREATED)

    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Registration failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return token for mobile app"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(request, email=email, password=password)

        if user and user.is_active:
            # Get or create token
            token, created = Token.objects.get_or_create(user=user)

            return Response({
                'token': token.key,  # Primary token for mobile app
                'access': token.key,  # For compatibility
                'refresh': token.key,  # For compatibility
                'user': {
                    'id': str(user.id),  # Convert UUID to string
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone_number or '',  # Handle None values
                    'phone_number': user.phone_number or '',  # Alternative field name
                    'role': user.user_role.name if user.user_role else None,
                    'is_verified': getattr(user, 'is_verified', True),
                    'is_active': user.is_active,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials or account is inactive'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user profile for mobile app"""
    try:
        user = request.user
        return Response({
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone_number or '',
            'phone_number': user.phone_number or '',
            'role': user.role,
            'is_verified': getattr(user, 'is_verified', True),
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Failed to get user profile: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user profile - THIS FIXES THE 404 ERROR"""
    try:
        user = request.user
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone_number,  # Use correct field name
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'gender': user.gender,
            'role': user.role,
            'is_verified': getattr(user, 'is_verified', True),  # Default to True if field doesn't exist
            'created_at': user.date_joined.isoformat(),
            'updated_at': user.date_joined.isoformat(),  # Use date_joined since updated_at doesn't exist
            'address': getattr(user, 'address', ''),
            'city': getattr(user, 'city', ''),
            'state': getattr(user, 'state', ''),
            'pincode': getattr(user, 'pincode', ''),
            'country': getattr(user, 'country', 'India'),
            'blood_group': getattr(user, 'blood_group', ''),
            'emergency_contact': getattr(user, 'emergency_contact', ''),
            'emergency_contact_name': getattr(user, 'emergency_contact_name', ''),
            'allergies': getattr(user, 'allergies', []),
            'chronic_conditions': getattr(user, 'chronic_conditions', []),
            'current_medications': getattr(user, 'current_medications', []),
            'insurance_provider': getattr(user, 'insurance_provider', ''),
            'insurance_number': getattr(user, 'insurance_number', ''),
            'preferred_language': getattr(user, 'preferred_language', 'English'),
            'profile_image': getattr(user, 'profile_image', None),
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Failed to get user profile: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
