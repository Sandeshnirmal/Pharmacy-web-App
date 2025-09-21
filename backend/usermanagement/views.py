# backend/usermanagement/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate # For authenticating users
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer # Import for JWT generation
# Import JWTAuthentication if you want to explicitly apply it to views,
# though it's typically set as a default in settings.py
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import User, Address
from .serializers import UserSerializer, AddressSerializer, RegisterSerializer, UserCreateSerializer
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone

# --- ViewSets for CRUD operations (require authentication for most actions) ---
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated] # Requires JWT authentication for all actions
    authentication_classes = [JWTAuthentication] # Explicitly use JWT for this ViewSet

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        is_active = self.request.query_params.get('active', None)
        search = self.request.query_params.get('search', None)

        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'status': 'User status updated',
            'is_active': user.is_active
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        customers = User.objects.filter(role='customer').count()
        staff = User.objects.filter(role__in=['admin', 'pharmacist', 'staff']).count()

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'customers': customers,
            'staff': staff
        })

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        """
        This view should return a list of all the addresses
        for the currently authenticated user.
        """
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Save the address instance, associating it with the authenticated user.
        """
        serializer.save(user=self.request.user)

# --- Custom Authentication Views (Publicly Accessible for Login/Registration) ---

class RegisterView(APIView):
    permission_classes = [AllowAny] # Anyone can register
    # No authentication_classes needed here as it's a public endpoint

    def get(self, request):
        return Response({
            'message': 'Registration endpoint is ready',
            'methods': ['POST'],
            'required_fields': ['first_name', 'last_name', 'email', 'password'],
            'optional_fields': ['phone_number']
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()

                # Generate JWT tokens for the newly registered user
                refresh = TokenObtainPairSerializer.get_token(user)
                access_token = str(refresh.access_token)

                return Response({
                    'access': access_token,
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'phone_number': user.phone_number,
                        'is_active': user.is_active
                    },
                    'message': 'Registration successful'
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': 'Registration failed',
                    'message': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return detailed validation errors
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny] # Anyone can attempt to login
    # No authentication_classes needed here as it's a public endpoint
    def get(self, request):
        return Response({
            'message': 'Login endpoint is ready',
            'methods': ['POST'],
            'required_fields': ['email', 'password']
        }, status=status.HTTP_200_OK)

    def post(self, request):
        # Get credentials from request
        email = request.data.get('email')
        password = request.data.get('password')

        # Validate required fields
        if not email or not password:
            return Response({
                'error': 'Email and password are required',
                'details': {
                    'email': 'This field is required' if not email else None,
                    'password': 'This field is required' if not password else None
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # First check if user exists
            try:
                user_exists = User.objects.get(email=email)
                print(f"User found: {user_exists.email}, active: {user_exists.is_active}")
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found',
                    'detail': 'User not found',
                    'code': 'user_not_found',
                    'message': 'No account found with this email address.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Use authenticate with the email as the 'username' argument
            user = authenticate(username=email, password=password)
            print(f"Authentication result: {user}")

            if user:
                # Check if user is active
                if not user.is_active:
                    return Response({
                        'error': 'Account is deactivated',
                        'detail': 'Account is deactivated',
                        'code': 'account_deactivated',
                        'message': 'Your account has been deactivated. Please contact support.'
                    }, status=status.HTTP_403_FORBIDDEN)

                # Generate JWT tokens upon successful authentication
                refresh = TokenObtainPairSerializer.get_token(user)
                access_token = str(refresh.access_token)

                # Update last login
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])

                # Use UserSerializer to get the profile_image_url
                user_data = UserSerializer(user).data

                return Response({
                    'access': access_token,
                    'refresh': str(refresh),
                    'user': {
                        'id': str(user.id),  # Convert UUID to string
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_staff': user.is_staff,
                        'phone_number': user.phone_number or '',
                        'profile_picture_url': user.profile_picture_url or '' # Use profile_picture_url directly
                    },
                    'message': 'Login successful'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid credentials',
                    'detail': 'Invalid credentials',
                    'code': 'invalid_credentials',
                    'message': 'The email or password you entered is incorrect.'
                }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            print(f"Login error: {e}")
            return Response({
                'error': 'Login failed',
                'detail': str(e),
                'code': 'login_error',
                'message': 'An error occurred during login. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Protected Views (require an authenticated JWT) ---

class AuthMeView(APIView):
    permission_classes = [IsAuthenticated] # Requires a valid JWT
    authentication_classes = [JWTAuthentication] # Explicitly use JWT

    def get(self, request):
        # request.user will be the authenticated User instance
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated] # Requires a valid JWT
    authentication_classes = [JWTAuthentication] # Explicitly use JWT

    def get(self, request):
        user = request.user # The authenticated user object is available
        # Use UserSerializer to get all relevant user data, including the consolidated profile_image_url
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        # UserUpdateSerializer is more appropriate for partial updates of user fields
        from .serializers import UserUpdateSerializer
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return full user data after update
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EnhancedProfileView(APIView):
    """Enhanced user profile management"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get complete user profile with all related data"""
        from .serializers import EnhancedUserSerializer
        serializer = EnhancedUserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        """Update user profile"""
        from .serializers import UserUpdateSerializer
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Update or create user profile
            from .models import UserProfile
            profile_data = request.data.get('profile', {})
            if profile_data:
                profile, created = UserProfile.objects.get_or_create(user=request.user)
                from .serializers import UserProfileSerializer
                profile_serializer = UserProfileSerializer(profile, data=profile_data, partial=True)
                if profile_serializer.is_valid():
                    profile_serializer.save()

            # Update or create user preferences
            from .models import UserPreferences
            preferences_data = request.data.get('preferences', {})
            if preferences_data:
                preferences, created = UserPreferences.objects.get_or_create(user=request.user)
                from .serializers import UserPreferencesSerializer
                pref_serializer = UserPreferencesSerializer(preferences, data=preferences_data, partial=True)
                if pref_serializer.is_valid():
                    pref_serializer.save()

            # Return updated profile
            from .serializers import EnhancedUserSerializer
            response_serializer = EnhancedUserSerializer(request.user, context={'request': request})
            return Response(response_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import ChangePasswordSerializer
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            return Response({'message': 'Password changed successfully'})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserActivityView(APIView):
    """Track and retrieve user activities"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user activity history"""
        from .models import UserActivity
        from .serializers import UserActivitySerializer

        activities = UserActivity.objects.filter(
            user=request.user
        ).order_by('-created_at')[:50]  # Last 50 activities

        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Log user activity"""
        from .models import UserActivity

        activity_type = request.data.get('activity_type')
        description = request.data.get('description', '')
        metadata = request.data.get('metadata', {})

        if not activity_type:
            return Response(
                {'error': 'Activity type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get client IP and user agent
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        UserActivity.objects.create(
            user=request.user,
            activity_type=activity_type,
            description=description,
            metadata=metadata,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return Response({'message': 'Activity logged successfully'})


class UserDashboardView(APIView):
    """User dashboard with statistics and recent activities"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get user statistics
        from product.models import ProductReview, Wishlist, ProductViewHistory
        from .models import UserActivity

        stats = {
            'total_orders': 0,  # Will be implemented with orders enhancement
            'total_reviews': ProductReview.objects.filter(user=user).count(),
            'wishlist_items': Wishlist.objects.filter(user=user).count(),
            'products_viewed': ProductViewHistory.objects.filter(user=user).count(),
            'recent_activities': UserActivity.objects.filter(user=user).count(),
        }

        # Get recent activities
        recent_activities = UserActivity.objects.filter(
            user=user
        ).order_by('-created_at')[:10]

        from .serializers import UserActivitySerializer
        activities_serializer = UserActivitySerializer(recent_activities, many=True)

        # Get recent viewed products
        recent_views = ProductViewHistory.objects.filter(
            user=user
        ).select_related('product').order_by('-viewed_at')[:5]

        viewed_products = []
        for view in recent_views:
            viewed_products.append({
                'id': view.product.id,
                'name': view.product.name,
                'price': view.product.price,
                'image_url': view.product.image_url,
                'viewed_at': view.viewed_at
            })

        # Get wishlist items
        wishlist_items = Wishlist.objects.filter(
            user=user
        ).select_related('product').order_by('-created_at')[:5]

        wishlist_products = []
        for item in wishlist_items:
            wishlist_products.append({
                'id': item.product.id,
                'name': item.product.name,
                'price': item.product.price,
                'image_url': item.product.image_url,
                'added_at': item.created_at
            })

        return Response({
            'stats': stats,
            'recent_activities': activities_serializer.data,
            'recent_views': viewed_products,
            'wishlist_items': wishlist_products
        })
