from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, F, ExpressionWrapper, fields
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

# Import models from other apps
from orders.models import Order, OrderItem
from offline_sales.models import OfflineSale, OfflineSaleItem
from prescriptions.models import Prescription
from usermanagement.models import User
from product.models import Product, Batch

class SalesReportView(APIView):
    permission_classes = [AllowAny] # Adjust permissions as needed

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        sales_data = []

        # Online Sales
        online_sales = OrderItem.objects.filter(order__order_status='Delivered') # Corrected field name and status value
        if start_date_str:
            online_sales = online_sales.filter(order__order_date__gte=start_date_str)
        if end_date_str:
            online_sales = online_sales.filter(order__order_date__lte=end_date_str)

        online_sales_summary = online_sales.annotate(
            date=TruncDate('order__order_date')
        ).values('date', 'product__name').annotate(
            total_quantity=Sum('quantity'),
            total_price=Sum(F('quantity') * F('unit_price_at_order')) # Corrected field name
        ).order_by('date', 'product__name')

        for item in online_sales_summary:
            sales_data.append({
                'date': item['date'],
                'product_name': item['product__name'],
                'quantity': item['total_quantity'],
                'total_price': item['total_price'],
                'type': 'online'
            })

        # Offline Sales
        offline_sales = OfflineSaleItem.objects.all()
        if start_date_str:
            offline_sales = offline_sales.filter(sale__sale_date__gte=start_date_str)
        if end_date_str:
            offline_sales = offline_sales.filter(sale__sale_date__lte=end_date_str)

        offline_sales_summary = offline_sales.annotate(
            date=TruncDate('sale__sale_date')
        ).values('date', 'product__name').annotate(
            total_quantity=Sum('quantity'),
            total_price=Sum(F('quantity') * F('price_per_unit'))
        ).order_by('date', 'product__name')

        for item in offline_sales_summary:
            sales_data.append({
                'date': item['date'],
                'product_name': item['product__name'],
                'quantity': item['total_quantity'],
                'total_price': item['total_price'],
                'type': 'offline'
            })
        
        # Sort all sales data by date
        sales_data.sort(key=lambda x: x['date'])

        return Response(sales_data, status=status.HTTP_200_OK)

class OrdersReportView(APIView):
    permission_classes = [AllowAny] # Adjust permissions as needed

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')

        orders = Order.objects.all().select_related('user')
        if start_date_str:
            orders = orders.filter(order_date__gte=start_date_str)
        if end_date_str:
            orders = orders.filter(order_date__lte=end_date_str)
        if status_filter:
            orders = orders.filter(status=status_filter)

        report_data = []
        for order in orders:
            report_data.append({
                'order_id': order.id,
                'customer_name': order.user.get_full_name() if order.user else 'Guest',
                'status': order.status,
                'total_amount': order.total_amount,
                'order_date': order.order_date.strftime('%Y-%m-%d %H:%M:%S')
            })
        return Response(report_data, status=status.HTTP_200_OK)

class PrescriptionsReportView(APIView):
    permission_classes = [AllowAny] # Adjust permissions as needed

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')

        prescriptions = Prescription.objects.all().select_related('user')
        if start_date_str:
            prescriptions = prescriptions.filter(upload_date__gte=start_date_str)
        if end_date_str:
            prescriptions = prescriptions.filter(upload_date__lte=end_date_str)
        if status_filter:
            prescriptions = prescriptions.filter(status=status_filter)

        report_data = []
        for prescription in prescriptions:
            report_data.append({
                'prescription_id': prescription.id,
                'user_name': prescription.user.get_full_name() if prescription.user else 'N/A',
                'status': prescription.status,
                'upload_date': prescription.upload_date.strftime('%Y-%m-%d %H:%M:%S'),
                'verification_date': prescription.verification_date.strftime('%Y-%m-%d %H:%M:%S') if prescription.verification_date else None,
            })
        return Response(report_data, status=status.HTTP_200_OK)

class UsersReportView(APIView):
    permission_classes = [AllowAny] # Adjust permissions as needed

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        users = User.objects.all()
        if start_date_str:
            users = users.filter(date_joined__gte=start_date_str)
        if end_date_str:
            users = users.filter(date_joined__lte=end_date_str)

        report_data = []
        for user in users:
            report_data.append({
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
            })
        return Response(report_data, status=status.HTTP_200_OK)
