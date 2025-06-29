from rest_framework import viewsets
from .models import Prescription, PrescriptionDetail
from .serializers import PrescriptionSerializer, PrescriptionDetailSerializer

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

class PrescriptionDetailViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionDetail.objects.all()
    serializer_class = PrescriptionDetailSerializer
