from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, AuthMeView
from . import views
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'addresses', views.AddressViewSet)

urlpatterns = [
    path('', include(router.urls)),

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('auth-me/', AuthMeView.as_view(), name='auth-me'),
]
