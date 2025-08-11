from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from .models import CourierPartner, CourierShipment, CourierServiceArea, CourierRateCard
from .serializers import (
    CourierPartnerSerializer, CourierShipmentSerializer, CourierTrackingSerializer,
    CourierServiceAreaSerializer, CourierRateCardSerializer,
    PickupScheduleSerializer, ShipmentCreateSerializer
)
from .services import get_courier_service
from orders.models import Order

class CourierPartnerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing courier partners

    Provides read-only access to active courier partners.
    Only authenticated users can access this endpoint.
    """
    queryset = CourierPartner.objects.filter(is_active=True)
    serializer_class = CourierPartnerSerializer
    permission_classes = [IsAuthenticated]

class CourierShipmentViewSet(viewsets.ModelViewSet):
    queryset = CourierShipment.objects.all()
    serializer_class = CourierShipmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by order if provided
        order_id = self.request.query_params.get('order_id')
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_shipment(self, request):
        """Create a new shipment for an order"""
        serializer = ShipmentCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                order = get_object_or_404(Order, id=serializer.validated_data['order_id'])
                
                # Check if shipment already exists
                if hasattr(order, 'courier_shipment'):
                    return Response(
                        {'error': 'Shipment already exists for this order'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get courier service
                courier_service = get_courier_service(
                    serializer.validated_data.get('courier_type', 'professional')
                )
                
                if not courier_service:
                    return Response(
                        {'error': 'Courier service not available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create shipment
                shipment = courier_service.create_shipment(
                    order=order,
                    pickup_address=serializer.validated_data['pickup_address'],
                    delivery_address=serializer.validated_data['delivery_address']
                )
                
                # Schedule pickup for next day
                pickup_date = timezone.now() + timedelta(days=1)
                courier_service.schedule_pickup(shipment.id, pickup_date)
                
                response_serializer = CourierShipmentSerializer(shipment)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def schedule_pickup(self, request, pk=None):
        """Schedule pickup for a shipment"""
        shipment = self.get_object()
        serializer = PickupScheduleSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                courier_service = get_courier_service(shipment.courier_partner.courier_type)
                
                success = courier_service.schedule_pickup(
                    shipment.id,
                    serializer.validated_data['pickup_date']
                )
                
                if success:
                    shipment.refresh_from_db()
                    response_serializer = CourierShipmentSerializer(shipment)
                    return Response(response_serializer.data)
                else:
                    return Response(
                        {'error': 'Failed to schedule pickup'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel_shipment(self, request, pk=None):
        """Cancel a shipment"""
        shipment = self.get_object()
        
        try:
            courier_service = get_courier_service(shipment.courier_partner.courier_type)
            success, message = courier_service.cancel_shipment(shipment.tracking_number)
            
            if success:
                shipment.refresh_from_db()
                response_serializer = CourierShipmentSerializer(shipment)
                return Response({
                    'message': message,
                    'shipment': response_serializer.data
                })
            else:
                return Response(
                    {'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def track(self, request):
        """Track shipment by tracking number"""
        tracking_number = request.query_params.get('tracking_number')
        
        if not tracking_number:
            return Response(
                {'error': 'tracking_number parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            shipment = get_object_or_404(CourierShipment, tracking_number=tracking_number)
            courier_service = get_courier_service(shipment.courier_partner.courier_type)
            
            # Update tracking information
            updated_shipment = courier_service.track_shipment(tracking_number)
            
            if updated_shipment:
                serializer = CourierTrackingSerializer({
                    'tracking_number': updated_shipment.tracking_number,
                    'status': updated_shipment.status,
                    'status_display': updated_shipment.get_status_display(),
                    'current_location': updated_shipment.current_location,
                    'estimated_delivery': updated_shipment.estimated_delivery,
                    'tracking_history': updated_shipment.tracking_history
                })
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Unable to track shipment'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CourierServiceAreaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourierServiceArea.objects.all()
    serializer_class = CourierServiceAreaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by pincode if provided
        pincode = self.request.query_params.get('pincode')
        if pincode:
            queryset = queryset.filter(pincode=pincode)
        
        # Filter by city if provided
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        return queryset

class CourierRateCardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourierRateCard.objects.all()
    serializer_class = CourierRateCardSerializer
    permission_classes = [IsAuthenticated]
