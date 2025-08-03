from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_payment_order, name='create_payment_order'),
    path('verify/', views.verify_payment, name='verify_payment'),
    path('status/<int:payment_id>/', views.get_payment_status, name='get_payment_status'),
]
