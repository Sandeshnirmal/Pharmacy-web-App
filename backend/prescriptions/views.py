from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q
from .models import Prescription, PrescriptionDetail
from .serializers import PrescriptionSerializer, PrescriptionDetailSerializer
from .prescription_scanner import PrescriptionScanner

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


class PrescriptionScannerViewSet(viewsets.ViewSet):
    """
    ViewSet for prescription scanning and medicine suggestions

    Endpoints:
    - scan_prescription: Scan prescription text and get medicine suggestions
    - search_medicines: Search medicines by name, composition, or generic name
    - scan_history: Get user's scan history (requires authentication)

    Note: This is for search-only functionality, not for placing orders
    """
    permission_classes = [AllowAny]  # Allow unauthenticated access for medicine search

    @action(detail=False, methods=['post'])
    def scan_prescription(self, request):
        """
        Scan prescription text and suggest medicines from database

        Request Body:
        {
            "prescription_text": "Paracetamol 650mg twice daily\\nAugmentin 625mg thrice daily"
        }

        Response:
        {
            "success": true,
            "extracted_medicines": [...],
            "suggestions": [...],
            "total_suggestions": 5,
            "message": "Found 5 medicine suggestions"
        }

        Note: Does not create orders or affect admin dashboard
        """
        try:
            prescription_text = request.data.get('prescription_text', '')

            # Validate input
            if not prescription_text:
                return Response({
                    'success': False,
                    'error': 'Prescription text is required',
                    'suggestions': [],
                    'total_suggestions': 0
                }, status=status.HTTP_400_BAD_REQUEST)

            if len(prescription_text.strip()) < 5:
                return Response({
                    'success': False,
                    'error': 'Prescription text must be at least 5 characters long',
                    'suggestions': [],
                    'total_suggestions': 0
                }, status=status.HTTP_400_BAD_REQUEST)

            # Initialize scanner
            scanner = PrescriptionScanner()

            # Get user if authenticated
            user = request.user if request.user.is_authenticated else None

            # Scan prescription
            result = scanner.scan_prescription_text(prescription_text, user)

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({
                'success': False,
                'error': str(e),
                'suggestions': [],
                'total_suggestions': 0
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in scan_prescription: {str(e)}")
            return Response({
                'success': False,
                'error': 'An error occurred while processing the prescription',
                'suggestions': [],
                'total_suggestions': 0
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def search_medicines(self, request):
        """
        Search medicines by name or composition
        """
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'name')  # name, composition, generic

        if not query or len(query.strip()) < 2:
            return Response({
                'success': False,
                'error': 'Search query must be at least 2 characters long',
                'suggestions': []
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            scanner = PrescriptionScanner()

            # Create mock medicine data for search
            medicine_data = {
                'extracted_name': query if search_type == 'name' else '',
                'composition': query if search_type == 'composition' else '',
                'strength': '',
                'original_line': query
            }

            suggestions = scanner._find_medicine_suggestions(medicine_data)

            return Response({
                'success': True,
                'query': query,
                'search_type': search_type,
                'suggestions': suggestions,
                'total_suggestions': len(suggestions)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error searching medicines: {str(e)}',
                'suggestions': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def scan_history(self, request):
        """
        Get scan history for authenticated user
        """
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            from .models import PrescriptionScanResult

            scans = PrescriptionScanResult.objects.filter(
                user=request.user
            ).order_by('-created_at')[:20]  # Last 20 scans

            scan_data = []
            for scan in scans:
                scan_data.append({
                    'id': scan.id,
                    'scan_type': scan.scan_type,
                    'total_suggestions': scan.total_suggestions,
                    'created_at': scan.created_at,
                    'extracted_medicines': scan.extracted_medicines
                })

            return Response({
                'success': True,
                'scans': scan_data,
                'total_scans': len(scan_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error fetching scan history: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
