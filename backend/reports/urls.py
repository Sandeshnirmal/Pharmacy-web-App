from django.urls import path
from .views import SalesReportView, OrdersReportView, PrescriptionsReportView, UsersReportView

urlpatterns = [
    path('sales/', SalesReportView.as_view(), name='sales_report'),
    path('orders/', OrdersReportView.as_view(), name='orders_report'),
    path('prescriptions/', PrescriptionsReportView.as_view(), name='prescriptions_report'),
    path('users/', UsersReportView.as_view(), name='users_report'),
]
