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

    # API endpoints (consistent with working test flow)
    path('api/users/', include('usermanagement.urls')),
    path('api/products/', include('product.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),
    path('api/order/', include('orders.urls')),
    path('api/inventory/', include('inventory.urls')),

    # Legacy endpoints (for backward compatibility)
    path('user/', include('usermanagement.urls')),
    path('product/', include('product.urls')),
    path('prescription/', include('prescriptions.urls')),
    path('order/', include('orders.urls')),

    # Mobile App Authentication Endpoints (Token-based)
    path('api/auth/', include('authentication.urls')),

    # Payment Endpoints (Razorpay integration)
    path('payment/', include('payment.urls')),

    # JWT Authentication Endpoints (for web dashboard)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
