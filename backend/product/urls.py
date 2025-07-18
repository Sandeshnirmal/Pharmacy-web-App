from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, BatchViewSet, InventoryViewSet,
    GenericNameViewSet, EnhancedProductViewSet, ProductReviewViewSet,
    WishlistViewSet
)

router = DefaultRouter()
router.register(r'generic-names', GenericNameViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'enhanced-products', EnhancedProductViewSet, basename='enhanced-product')
router.register(r'reviews', ProductReviewViewSet)
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'batches', BatchViewSet)
router.register(r'inventory', InventoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
