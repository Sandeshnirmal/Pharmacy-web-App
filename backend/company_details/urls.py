from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyDetailsViewSet

router = DefaultRouter()
router.register(r'', CompanyDetailsViewSet, basename='company-details')

urlpatterns = [
    path('', include(router.urls)),
]
