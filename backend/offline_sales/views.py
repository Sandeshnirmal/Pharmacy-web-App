from rest_framework import viewsets
from .models import OfflineSale, OfflineSaleItem, BillReturn, OfflineCustomer
from .serializers import OfflineSaleSerializer, OfflineSaleItemSerializer, BillReturnSerializer, BillReturnItemSerializer, OfflineCustomerSerializer
from rest_framework.permissions import IsAuthenticated , AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
import io
from django_filters.rest_framework import DjangoFilterBackend # Import DjangoFilterBackend
from rest_framework_simplejwt.authentication import JWTAuthentication # Import JWTAuthentication


from .models import OfflineSale, OfflineSaleItem, BillReturn, BillReturnItem
from .serializers import OfflineSaleSerializer, OfflineSaleItemSerializer, BillReturnSerializer, BillReturnItemSerializer

class OfflineSaleItemViewSet(viewsets.ModelViewSet):
    queryset = OfflineSaleItem.objects.all()
    serializer_class = OfflineSaleItemSerializer
    authentication_classes = [JWTAuthentication] # Changed to JWTAuthentication
    permission_classes = [IsAuthenticated]

class BillReturnViewSet(viewsets.ModelViewSet):
    queryset = BillReturn.objects.all().order_by('-return_date')
    serializer_class = BillReturnSerializer
    authentication_classes = [JWTAuthentication] # Changed to JWTAuthentication
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(returned_by=self.request.user)

class OfflineSaleViewSet(viewsets.ModelViewSet):
    queryset = OfflineSale.objects.all().order_by('-sale_date')
    serializer_class = OfflineSaleSerializer
    authentication_classes = [JWTAuthentication] # Changed to JWTAuthentication
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sale_date', 'customer_name', 'customer_phone', 'payment_method']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='cancel-bill')
    def cancel_bill(self, request, pk=None):
        offline_sale = self.get_object()
        if offline_sale.status == 'CANCELLED':
            return Response({"detail": "This bill is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        
        cancellation_reason = request.data.get('cancellation_reason', 'No reason provided.')
        
        serializer = self.get_serializer(
            offline_sale, 
            data={'status': 'CANCELLED', 'cancellation_reason': cancellation_reason}, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user) # Ensure updated_by is set
        
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='generate-bill-pdf')
    def generate_bill_pdf(self, request, pk=None):
        offline_sale = self.get_object()
        template_path = 'offline_sales/bill_template.html' # You'll need to create this template
        context = {'sale': offline_sale}

        template = get_template(template_path)
        html = template.render(context)
        result = io.BytesIO()

        pdf = pisa.pisaDocument(io.BytesIO(html.encode("UTF-8")), result)
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="bill_{offline_sale.id}.pdf"'
            return response
        return Response({'detail': 'Error generating PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.permissions import AllowAny # Import AllowAny

class OfflineCustomerViewSet(viewsets.ModelViewSet):
    queryset = OfflineCustomer.objects.all().order_by('name')
    serializer_class = OfflineCustomerSerializer
    # Temporarily allow any user to access this endpoint for debugging purposes.
    # In a production environment, this should be [IsAuthenticated] or more restrictive.
    permission_classes = [AllowAny] 
    authentication_classes = [] # Remove TokenAuthentication if AllowAny is used
    filter_backends = [DjangoFilterBackend] # Add filter backend
    filterset_fields = ['name', 'phone_number'] # Specify fields for filtering

    @action(detail=False, methods=['get'], url_path='search-by-phone')
    def search_by_phone(self, request):
        phone_number = request.query_params.get('phone_number', None)
        if not phone_number:
            return Response({"detail": "Phone number parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            customer = OfflineCustomer.objects.get(phone_number=phone_number)
            serializer = self.get_serializer(customer)
            return Response(serializer.data)
        except OfflineCustomer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='find-or-create')
    def find_or_create_customer(self, request):
        phone_number = request.data.get('phone_number', None)
        if not phone_number:
            return Response({"detail": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = OfflineCustomer.objects.get(phone_number=phone_number)
            serializer = self.get_serializer(customer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except OfflineCustomer.DoesNotExist:
            # Customer not found, create a new one
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
