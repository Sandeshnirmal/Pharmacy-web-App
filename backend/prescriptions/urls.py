from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, PrescriptionDetailViewSet

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'prescription-details', PrescriptionDetailViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
