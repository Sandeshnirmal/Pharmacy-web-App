from rest_framework import viewsets
from .models import Category, Product, Batch, Inventory,GenericName
from .serializers import CategorySerializer, ProductSerializer, BatchSerializer, InventorySerializer,GenericNameSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer


class GenericNameViewSet(viewsets.ModelViewSet):
    queryset = GenericName.objects.all()
    serializer_class = GenericNameSerializer