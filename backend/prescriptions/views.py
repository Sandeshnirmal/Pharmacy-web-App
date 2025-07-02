from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Prescription, PrescriptionDetail
from .serializers import PrescriptionSerializer, PrescriptionDetailSerializer

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all().order_by('-upload_date')
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('verification_status', None)
        if status:
            queryset = queryset.filter(verification_status=status)
        return queryset

class PrescriptionDetailViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionDetail.objects.all()
    serializer_class = PrescriptionDetailSerializer
    permission_classes = [IsAuthenticated]
