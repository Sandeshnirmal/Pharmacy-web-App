# Example of product/urls.py if you have one:
# backend/product/urls.py
from django.urls import path, include # <-- Make sure you're not including yourself!
from . import views # or from .views import some_view

urlpatterns = [
    # path('some-route/', views.some_view),
    # AVOID: path('products/', include('product.urls')),  <--- This would cause a recursion!
]