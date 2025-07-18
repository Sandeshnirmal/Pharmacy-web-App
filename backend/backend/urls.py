from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('user/', include('usermanagement.urls')),
    path('product/', include('product.urls')),
    path('prescription/', include('prescriptions.urls')),
    path('order/', include('orders.urls')),  # Fixed: Changed from 'orders/' to 'order/'
    path('inventory/', include('inventory.urls')),

    # Mobile App Authentication Endpoints (Token-based)
    path('api/auth/', include('authentication.urls')),  # This creates /api/auth/user/, /api/auth/register/, etc.

    # JWT Authentication Endpoints (for web dashboard)
    # This endpoint handles username/password login and returns access/refresh tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # This endpoint handles refreshing an expired access token using a refresh token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # (Optional) This endpoint allows clients to verify if an access token is still valid
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
