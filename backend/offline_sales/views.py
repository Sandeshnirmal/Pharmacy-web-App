from rest_framework import viewsets
from .models import OfflineSale, OfflineSaleItem, BillReturn, OfflineCustomer
from .serializers import OfflineSaleSerializer, OfflineSaleItemSerializer, BillReturnSerializer, BillReturnItemSerializer, OfflineCustomerSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
import io
from django_filters.rest_framework import DjangoFilterBackend # Import DjangoFilterBackend

class OfflineSaleViewSet(viewsets.ModelViewSet):
    queryset = OfflineSale.objects.all().order_by('-sale_date')
    serializer_class = OfflineSaleSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='generate-invoice')
    def generate_invoice(self, request, pk=None):
        try:
            offline_sale = self.get_object()
        except OfflineSale.DoesNotExist:
            return Response({"detail": "Offline Sale not found."}, status=status.HTTP_404_NOT_FOUND)

        # For simplicity, we'll return structured data.
        # For actual PDF generation, you'd use a library like ReportLab or xhtml2pdf.
        invoice_data = {
            "sale_id": offline_sale.id,
            "customer_name": offline_sale.customer_name,
            "customer_phone": offline_sale.customer_phone,
            "sale_date": offline_sale.sale_date.isoformat(),
            "total_amount": str(offline_sale.total_amount),
            "paid_amount": str(offline_sale.paid_amount),
            "change_amount": str(offline_sale.change_amount),
            "payment_method": offline_sale.payment_method,
            "items": []
        }
        for item in offline_sale.items.all():
            invoice_data["items"].append({
                "product_name": item.product.name,
                "batch_number": item.batch.batch_number if item.batch else None,
                "quantity": item.quantity,
                "price_per_unit": str(item.price_per_unit),
                "subtotal": str(item.subtotal)
            })
        
        # Example of PDF generation (requires xhtml2pdf and a template)
        # For this to work, you'd need to:
        # 1. pip install xhtml2pdf
        # 2. Create an invoice_template.html in a templates directory accessible by Django
        # 3. Configure Django settings to find templates
        # template_path = 'invoice_template.html'
        # context = {'invoice_data': invoice_data}
        # template = get_template(template_path)
        # html = template.render(context)
        # response = io.BytesIO()
        # pdf = pisa.pisaDocument(io.BytesIO(html.encode("UTF-8")), response)
        # if not pdf.err:
        #     response = HttpResponse(response.getvalue(), content_type='application/pdf')
        #     response['Content-Disposition'] = f'attachment; filename="invoice_{offline_sale.id}.pdf"'
        #     return response
        # return Response({"detail": "Error generating PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(invoice_data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

from .models import OfflineSale, OfflineSaleItem, BillReturn, BillReturnItem
from .serializers import OfflineSaleSerializer, OfflineSaleItemSerializer, BillReturnSerializer, BillReturnItemSerializer

class OfflineSaleItemViewSet(viewsets.ModelViewSet):
    queryset = OfflineSaleItem.objects.all()
    serializer_class = OfflineSaleItemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

class BillReturnViewSet(viewsets.ModelViewSet):
    queryset = BillReturn.objects.all().order_by('-return_date')
    serializer_class = BillReturnSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(returned_by=self.request.user)

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
