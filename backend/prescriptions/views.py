from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q
from .models import Prescription, PrescriptionDetail
from .serializers import PrescriptionSerializer, PrescriptionDetailSerializer

class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    Enhanced ViewSet for admin dashboard to manage prescriptions.
    Supports full CRUD operations and statistics.
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

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get prescription statistics"""
        total_prescriptions = Prescription.objects.count()

        # Count by verification status
        stats_by_status = Prescription.objects.values('verification_status').annotate(
            count=Count('id')
        )

        # Convert to dictionary
        status_counts = {}
        for item in stats_by_status:
            status_counts[item['verification_status']] = item['count']

        # Calculate percentages
        verified_count = status_counts.get('Verified', 0)
        pending_count = status_counts.get('Pending_Review', 0)
        rejected_count = status_counts.get('Rejected', 0)
        uploaded_count = status_counts.get('Uploaded', 0)
        ai_processing_count = status_counts.get('AI_Processing', 0)
        ai_processed_count = status_counts.get('AI_Processed', 0)

        return Response({
            'total_prescriptions': total_prescriptions,
            'verified': verified_count,
            'pending_review': pending_count,
            'rejected': rejected_count,
            'uploaded': uploaded_count,
            'ai_processing': ai_processing_count,
            'ai_processed': ai_processed_count,
            'verification_rate': round((verified_count / max(total_prescriptions, 1)) * 100, 2),
            'status_breakdown': status_counts
        })



class PrescriptionDetailViewSet(viewsets.ModelViewSet):
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
