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

# --- Custom Authentication Views (Publicly Accessible for Login/Registration) ---

class RegisterView(APIView):
    permission_classes = [AllowAny] # Anyone can register
    # No authentication_classes needed here as it's a public endpoint

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for the newly registered user
            refresh = TokenObtainPairSerializer.get_token(user)
            access_token = str(refresh.access_token)

            return Response({
                'access': access_token,
                'refresh': str(refresh),
                'user': UserSerializer(user).data # Return serialized user data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny] # Anyone can attempt to login
    # No authentication_classes needed here as it's a public endpoint

    def post(self, request):
        # Assuming your USERNAME_FIELD is 'email'
        email = request.data.get('email')
        password = request.data.get('password')

        # Use authenticate with the email as the 'username' argument
        user = authenticate(username=email, password=password)

        if user:
            # Generate JWT tokens upon successful authentication
            refresh = TokenObtainPairSerializer.get_token(user)
            access_token = str(refresh.access_token)

            return Response({
                'access': access_token,
                'refresh': str(refresh),
                # Optionally return basic user info if needed here
                'user_id': user.id,
                'email': user.email,
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)

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
        data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            # Add any other user fields you want to expose from the User model
        }
        return Response(data, status=status.HTTP_200_OK)