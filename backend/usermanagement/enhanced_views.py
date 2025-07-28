# Enhanced User Management Views
# Role-based user management with comprehensive CRUD operations and permissions

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import timedelta

from .models import UserRole, Address, UserProfile
from .enhanced_serializers import (
    UserRoleSerializer, UserRoleCreateSerializer,
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, PasswordChangeSerializer,
    AdminDashboardSerializer, PharmacistDashboardSerializer, VerifierDashboardSerializer,
    AddressSerializer, UserProfileSerializer
)

User = get_user_model()

# ============================================================================
# CUSTOM PERMISSIONS
# ============================================================================

class IsAdminUser(permissions.BasePermission):
    """Permission for admin users only"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsPharmacistOrAdmin(permissions.BasePermission):
    """Permission for pharmacist and admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pharmacist']

class IsVerifierOrAbove(permissions.BasePermission):
    """Permission for verifier, pharmacist, and admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pharmacist', 'verifier']

class CanManageUsers(permissions.BasePermission):
    """Permission to manage users based on role hierarchy"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admins can manage all users
        if request.user.role == 'admin':
            return True
        
        # Pharmacists can manage staff and customers
        if request.user.role == 'pharmacist' and view.action in ['list', 'retrieve']:
            return True
        
        return False

# ============================================================================
# USER ROLE MANAGEMENT VIEWSET
# ============================================================================

class UserRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user roles with full CRUD operations"""
    queryset = UserRole.objects.all()
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRoleCreateSerializer
        return UserRoleSerializer
    
    def get_queryset(self):
        """Filter roles based on user permissions"""
        queryset = UserRole.objects.all()
        
        # Filter by active status
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle role active status"""
        role = self.get_object()
        role.is_active = not role.is_active
        role.save()
        
        return Response({
            'message': f'Role {role.display_name} {"activated" if role.is_active else "deactivated"}',
            'is_active': role.is_active
        })
    
    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Get users with this role"""
        role = self.get_object()
        users = role.users.filter(is_active=True)
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def permissions_template(self, request):
        """Get permissions template for role creation"""
        template = {
            'prescriptions': {
                'view': False,
                'create': False,
                'update': False,
                'delete': False,
                'verify': False
            },
            'products': {
                'view': False,
                'create': False,
                'update': False,
                'delete': False,
                'manage_inventory': False
            },
            'orders': {
                'view': False,
                'create': False,
                'update': False,
                'delete': False,
                'process': False
            },
            'users': {
                'view': False,
                'create': False,
                'update': False,
                'delete': False,
                'manage_roles': False
            },
            'reports': {
                'view': False,
                'generate': False,
                'export': False
            }
        }
        return Response(template)

# ============================================================================
# ENHANCED USER MANAGEMENT VIEWSET
# ============================================================================

class UserViewSet(viewsets.ModelViewSet):
    """Enhanced user management with role-based permissions"""
    queryset = User.objects.all()
    permission_classes = [CanManageUsers]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users based on requesting user's role"""
        user = self.request.user
        queryset = User.objects.all()
        
        # Admins see all users
        if user.role == 'admin':
            pass
        # Pharmacists see staff and customers
        elif user.role == 'pharmacist':
            queryset = queryset.filter(role__in=['staff', 'customer'])
        # Others see only themselves
        else:
            queryset = queryset.filter(id=user.id)
        
        # Apply filters
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        verification_status = self.request.query_params.get('verification_status')
        if verification_status:
            queryset = queryset.filter(verification_status=verification_status)
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """Change user password"""
        user = self.get_object()
        
        # Users can only change their own password unless admin
        if request.user.id != user.id and request.user.role != 'admin':
            return Response(
                {'error': 'You can only change your own password'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def verify_user(self, request, pk=None):
        """Verify professional user (doctor/pharmacist)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can verify users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        verification_status = request.data.get('verification_status')
        
        if verification_status not in ['verified', 'rejected']:
            return Response(
                {'error': 'Invalid verification status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.verification_status = verification_status
        user.save()
        
        return Response({
            'message': f'User {user.get_full_name()} {verification_status}',
            'verification_status': verification_status
        })
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle user active status"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can toggle user status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'User {user.get_full_name()} {"activated" if user.is_active else "deactivated"}',
            'is_active': user.is_active
        })
    
    @action(detail=False, methods=['get'])
    def role_statistics(self, request):
        """Get user statistics by role"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can view role statistics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = User.objects.values('role').annotate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True)),
            verified=Count('id', filter=Q(verification_status='verified'))
        ).order_by('role')
        
        return Response(list(stats))

# ============================================================================
# ROLE-BASED DASHBOARD VIEWS
# ============================================================================

class DashboardViewSet(viewsets.ViewSet):
    """Role-based dashboard data"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def admin_dashboard(self, request):
        """Admin dashboard data"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from prescriptions.models import Prescription
        from product.models import Product
        
        # Calculate dashboard metrics
        total_users = User.objects.count()
        total_prescriptions = Prescription.objects.count()
        pending_verifications = Prescription.objects.filter(
            status='pending_verification'
        ).count()
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_products = Product.objects.filter(
            stock_quantity__lte=F('min_stock_level'),
            is_active=True
        ).count()
        
        # Recent activities (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_activities = []
        
        # Recent user registrations
        recent_users = User.objects.filter(date_joined__gte=week_ago).count()
        if recent_users > 0:
            recent_activities.append(f"{recent_users} new users registered")
        
        # Recent prescriptions
        recent_prescriptions = Prescription.objects.filter(upload_date__gte=week_ago).count()
        if recent_prescriptions > 0:
            recent_activities.append(f"{recent_prescriptions} prescriptions uploaded")
        
        data = {
            'total_users': total_users,
            'total_prescriptions': total_prescriptions,
            'pending_verifications': pending_verifications,
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'recent_activities': recent_activities
        }
        
        serializer = AdminDashboardSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pharmacist_dashboard(self, request):
        """Pharmacist dashboard data"""
        if request.user.role not in ['admin', 'pharmacist']:
            return Response(
                {'error': 'Pharmacist access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from prescriptions.models import Prescription
        
        today = timezone.now().date()
        
        # Calculate metrics
        pending_prescriptions = Prescription.objects.filter(
            status='pending_verification'
        ).count()
        
        verified_today = Prescription.objects.filter(
            verification_date__date=today,
            status='verified'
        ).count()
        
        rejected_today = Prescription.objects.filter(
            verification_date__date=today,
            status='rejected'
        ).count()
        
        need_clarification = Prescription.objects.filter(
            status='need_clarification'
        ).count()
        
        # Recent prescriptions
        recent_prescriptions = Prescription.objects.filter(
            status__in=['pending_verification', 'need_clarification']
        ).order_by('-upload_date')[:10]
        
        from prescriptions.enhanced_serializers import VerificationQueueSerializer
        recent_data = VerificationQueueSerializer(recent_prescriptions, many=True).data
        
        data = {
            'pending_prescriptions': pending_prescriptions,
            'verified_today': verified_today,
            'rejected_today': rejected_today,
            'need_clarification': need_clarification,
            'recent_prescriptions': recent_data
        }
        
        serializer = PharmacistDashboardSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def verifier_dashboard(self, request):
        """Verifier dashboard data"""
        if request.user.role not in ['admin', 'pharmacist', 'verifier']:
            return Response(
                {'error': 'Verifier access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from prescriptions.models import Prescription
        
        today = timezone.now().date()
        
        # Calculate metrics for this verifier
        assigned_prescriptions = Prescription.objects.filter(
            verified_by_admin=request.user,
            status='pending_verification'
        ).count()
        
        completed_today = Prescription.objects.filter(
            verified_by_admin=request.user,
            verification_date__date=today
        ).count()
        
        # Calculate average processing time
        completed_prescriptions = Prescription.objects.filter(
            verified_by_admin=request.user,
            verification_date__isnull=False
        )
        
        total_time = 0
        count = 0
        for prescription in completed_prescriptions:
            if prescription.upload_date and prescription.verification_date:
                delta = prescription.verification_date - prescription.upload_date
                total_time += delta.total_seconds() / 3600  # Convert to hours
                count += 1
        
        average_processing_time = round(total_time / count, 2) if count > 0 else 0
        
        # Calculate accuracy score (simplified)
        verified_count = Prescription.objects.filter(
            verified_by_admin=request.user,
            status='verified'
        ).count()
        
        total_processed = Prescription.objects.filter(
            verified_by_admin=request.user,
            status__in=['verified', 'rejected']
        ).count()
        
        accuracy_score = round((verified_count / total_processed) * 100, 2) if total_processed > 0 else 0
        
        data = {
            'assigned_prescriptions': assigned_prescriptions,
            'completed_today': completed_today,
            'average_processing_time': average_processing_time,
            'accuracy_score': accuracy_score
        }
        
        serializer = VerifierDashboardSerializer(data)
        return Response(serializer.data)
