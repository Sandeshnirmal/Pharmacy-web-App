from rest_framework import viewsets
from .models import CompanyDetails
from .serializers import CompanyDetailsSerializer

class CompanyDetailsViewSet(viewsets.ModelViewSet):
    queryset = CompanyDetails.objects.all()
    serializer_class = CompanyDetailsSerializer
