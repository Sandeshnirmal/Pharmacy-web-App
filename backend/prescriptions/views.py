from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Prescription, PrescriptionDetail
from .serializers import PrescriptionSerializer, PrescriptionDetailSerializer

class PrescriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Simple read-only ViewSet for admin dashboard to view prescriptions.
    All prescription processing is handled by mobile_api.py
    """
    queryset = Prescription.objects.all().order_by('-upload_date')
    serializer_class = PrescriptionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('verification_status', None)
        user_id = self.request.query_params.get('user_id', None)

        if status_filter:
            queryset = queryset.filter(verification_status=status_filter)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset



class PrescriptionDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Simple read-only ViewSet for admin dashboard to view prescription details.
    All prescription processing is handled by mobile_api.py
    """
    queryset = PrescriptionDetail.objects.all()
    serializer_class = PrescriptionDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Filter prescription details by prescription ID
        """
        queryset = super().get_queryset()
        prescription_id = self.request.query_params.get('prescription', None)

        if prescription_id:
            queryset = queryset.filter(prescription_id=prescription_id)

        return queryset
