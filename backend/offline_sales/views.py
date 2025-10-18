from rest_framework import viewsets
from .models import OfflineSale, OfflineSaleItem
from .serializers import OfflineSaleSerializer, OfflineSaleItemSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status

class OfflineSaleViewSet(viewsets.ModelViewSet):
    queryset = OfflineSale.objects.all().order_by('-sale_date')
    serializer_class = OfflineSaleSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

class OfflineSaleItemViewSet(viewsets.ModelViewSet):
    queryset = OfflineSaleItem.objects.all()
    serializer_class = OfflineSaleItemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
