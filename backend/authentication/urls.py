from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('user/', views.get_user_profile, name='user-profile'),  # This fixes the 404
]
