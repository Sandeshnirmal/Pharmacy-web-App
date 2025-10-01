from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, AuthMeView, UserProfileView,
    EnhancedProfileView, ChangePasswordView, UserActivityView,
    UserDashboardView
)
from .enhanced_views import (
    UserViewSet as EnhancedUserViewSet, UserRoleViewSet, DashboardViewSet as EnhancedDashboardViewSet
)
from . import views
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'addresses', views.AddressViewSet)

# Enhanced API router
enhanced_router = routers.DefaultRouter()
enhanced_router.register(r'enhanced-users', EnhancedUserViewSet, basename='enhanced-user')
enhanced_router.register(r'roles', UserRoleViewSet, basename='user-role')
enhanced_router.register(r'enhanced-dashboard', EnhancedDashboardViewSet, basename='enhanced-dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(enhanced_router.urls)),

    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('auth-me/', AuthMeView.as_view(), name='auth-me'),

    # Profile management endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('enhanced-profile/', EnhancedProfileView.as_view(), name='enhanced_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    # User activity and dashboard
    path('activity/', UserActivityView.as_view(), name='user_activity'),
    path('dashboard/', UserDashboardView.as_view(), name='user_dashboard'),
]
