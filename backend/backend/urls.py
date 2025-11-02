from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.routers import DefaultRouter
from product.views import DiscountViewSet # Import DiscountViewSet

# Create a router for DiscountViewSet
discount_router = DefaultRouter()
discount_router.register(r'', DiscountViewSet, basename='discount')


urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints (consistent with working test flow)
    path('api/users/', include('usermanagement.urls')),
    path('api/products/', include('product.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),
    path('api/order/', include('orders.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/offline-sales/', include('offline_sales.urls')),
    path('api/discounts/', include(discount_router.urls)), # Expose discounts directly under /api/discounts/
    path('api/', include('cart.urls')), # Include cart URLs

    # Legacy endpoints (for backward compatibility)
    path('user/', include('usermanagement.urls')),
    path('product/', include('product.urls')),
    path('prescription/', include('prescriptions.urls')),
    path('order/', include('orders.urls')),

    # Mobile App Authentication Endpoints (Token-based)
    path('api/auth/', include('authentication.urls')),

    # Payment Endpoints (Razorpay integration)
    path('payment/', include('payment.urls')),

    # Courier Endpoints (Professional courier integration)
    path('api/courier/', include('courier.urls')),

    # JWT Authentication Endpoints (for web dashboard)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
