from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, BatchViewSet, InventoryViewSet,
    GenericNameViewSet, EnhancedProductViewSet, ProductReviewViewSet,
    WishlistViewSet,ExcelUploadView,
    BulkCategoryCreateAPIView, BulkGenericNameCreateAPIView, BulkProductCreateAPIView # Import new views
)

# Enhanced imports
try:
    from .enhanced_views import CompositionViewSet, ProductViewSet
    enhanced_available = True
except ImportError:
    enhanced_available = False

# Enhanced router
enhanced_router = DefaultRouter()
if enhanced_available:
    enhanced_router.register(r'compositions', CompositionViewSet, basename='composition')
    enhanced_router.register(r'enhanced-products', ProductViewSet, basename='new-enhanced-product')

# Legacy router
router = DefaultRouter()
router.register(r'generic-names', GenericNameViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'legacy-enhanced-products', EnhancedProductViewSet, basename='legacy-enhanced-product')
router.register(r'reviews', ProductReviewViewSet)
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'batches', BatchViewSet)
router.register(r'inventory', InventoryViewSet)

urlpatterns = [
    # Enhanced API endpoints
    path('', include(enhanced_router.urls)),

    # Legacy endpoints
    path('legacy/', include(router.urls)),

    # Bulk creation endpoints
    path('bulk-categories/', BulkCategoryCreateAPIView.as_view(), name='bulk-category-create'),
    path('bulk-generic-names/', BulkGenericNameCreateAPIView.as_view(), name='bulk-generic-name-create'),
    path('bulk-products/', BulkProductCreateAPIView.as_view(), name='bulk-product-create'),
    path('upload-excel/', ExcelUploadView.as_view(), name='excel-upload'), # New endpoint for Excel upload
]
