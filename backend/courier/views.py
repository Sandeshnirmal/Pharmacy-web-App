from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from .models import CourierShipment
from .serializers import (
    CourierShipmentSerializer, CourierTrackingSerializer,
    TPCPickupRequestSerializer, TPCCODBookingSerializer, TPCPickupAddonSerializer
)
from .services import get_tpc_courier_service
from orders.models import Order

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
        """Create a new shipment for an order using the TPC specific serializer"""
        serializer = TPCPickupRequestSerializer(data=request.data) # Always use TPC serializer
        
        if serializer.is_valid():
            try:
                order_id = request.data.get('order_id') # Assuming order_id is passed for linking
                order = get_object_or_404(Order, id=order_id)
                
                if hasattr(order, 'courier_shipment'):
                    return Response(
                        {'error': 'Shipment already exists for this order'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                tpc_service = get_tpc_courier_service()
                
                response_data = tpc_service.create_shipment(
                    order=order,
                    pickup_address={ # Extract from serializer data or define default
                        "name": serializer.validated_data.get("SENDER"),
                        "address_line_1": serializer.validated_data.get("SENDER_ADDRESS"),
                        "city": serializer.validated_data.get("SENDER_CITY"),
                        "pincode": serializer.validated_data.get("SENDER_PINCODE"),
                        "phone": serializer.validated_data.get("SENDER_MOB"),
                        "email": serializer.validated_data.get("SENDER_EMAIL"),
                    },
                    delivery_address={ # Extract from serializer data or define default
                        "name": serializer.validated_data.get("RECIPIENT"),
                        "company": serializer.validated_data.get("RECIPIENT_COMPANY"),
                        "address_line_1": serializer.validated_data.get("RECIPIENT_ADDRESS"),
                        "city": serializer.validated_data.get("RECIPIENT_CITY"),
                        "pincode": serializer.validated_data.get("RECIPIENT_PINCODE"),
                        "phone": serializer.validated_data.get("RECIPIENT_MOB"),
                        "email": serializer.validated_data.get("RECIPIENT_EMAIL"),
                    },
                    shipment_data=serializer.validated_data
                )
                # TPC API returns POD_NO, REF_NO, status, error directly
                if response_data.get('status') == 'success':
                    tracking_number = response_data.get('POD_NO', '').replace('Saved Successfully with Cons No ', '')
                    ref_no = response_data.get('REF_NO')
                    
                    shipment = CourierShipment.objects.create(
                        order=order,
                        tracking_number=tracking_number,
                        tpc_order_id=ref_no, # Renamed from courier_order_id
                        status='pending', # Initial status
                        pickup_address={
                            "name": serializer.validated_data.get("SENDER"),
                            "address_line_1": serializer.validated_data.get("SENDER_ADDRESS"),
                            "city": serializer.validated_data.get("SENDER_CITY"),
                            "pincode": serializer.validated_data.get("SENDER_PINCODE"),
                            "phone": serializer.validated_data.get("SENDER_MOB"),
                            "email": serializer.validated_data.get("SENDER_EMAIL"),
                        },
                        delivery_address={
                            "name": serializer.validated_data.get("RECIPIENT"),
                            "company": serializer.validated_data.get("RECIPIENT_COMPANY"),
                            "address_line_1": serializer.validated_data.get("RECIPIENT_ADDRESS"),
                            "city": serializer.validated_data.get("RECIPIENT_CITY"),
                            "pincode": serializer.validated_data.get("RECIPIENT_PINCODE"),
                            "phone": serializer.validated_data.get("RECIPIENT_MOB"),
                            "email": serializer.validated_data.get("RECIPIENT_EMAIL"),
                        },
                        delivery_contact=serializer.validated_data.get("RECIPIENT_MOB"),
                        weight=serializer.validated_data.get("WEIGHT"),
                        dimensions={
                            "length": serializer.validated_data.get("VOL_LENGTH"),
                            "width": serializer.validated_data.get("VOL_WIDTH"),
                            "height": serializer.validated_data.get("VOL_HEIGHT"),
                        },
                        declared_value=serializer.validated_data.get("CUST_INVOICEAMT", 0),
                        cod_charges=serializer.validated_data.get("COD_AMOUNT", 0),
                        tpc_response=response_data # Renamed from courier_response
                    )
                    shipment.add_tracking_event(
                        status='pending',
                        location='TPC System',
                        timestamp=timezone.now(),
                        description='Shipment created in TPC system'
                    )
                    response_serializer = CourierShipmentSerializer(shipment)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(
                        {'error': response_data.get('error', 'Unknown TPC error'), 'details': response_data},
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
            tpc_service = get_tpc_courier_service()
            
            # For TPC, the cancel_shipment method expects podno
            response_data = tpc_service.cancel_shipment(shipment.tracking_number)
            if response_data.get('status') == 'success':
                shipment.status = 'cancelled'
                shipment.tpc_response.update(response_data) # Renamed from courier_response
                shipment.save()
                shipment.add_tracking_event(
                    status='cancelled',
                    location='TPC System',
                    timestamp=timezone.now(),
                    description='Shipment cancelled in TPC system'
                )
                response_serializer = CourierShipmentSerializer(shipment)
                return Response({
                    'message': response_data.get('status', 'Shipment cancelled successfully'),
                    'shipment': response_serializer.data
                })
            else:
                return Response(
                    {'error': response_data.get('status', 'Failed to cancel shipment'), 'details': response_data},
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
        tracking_identifier = request.query_params.get('tracking_number')
        new_version = request.query_params.get('new_version', 'false').lower() == 'true'
        with_contact = request.query_params.get('with_contact', 'false').lower() == 'true'
        
        if not tracking_identifier:
            return Response(
                {'error': 'tracking_number parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            shipment = get_object_or_404(CourierShipment, tracking_number=tracking_identifier)
            tpc_service = get_tpc_courier_service()
            
            response_data = tpc_service.track_shipment(
                tracking_identifier, new_version=new_version, with_contact=with_contact
            )
            # TPC tracking APIs return a list of events or a message
            if response_data and not response_data.get('message', {}).get('error') and not response_data.get('error_description'):
                latest_event = response_data[-1] if isinstance(response_data, list) and response_data else {}
                
                updated_shipment_status = latest_event.get('Activity', shipment.status)
                updated_current_location = latest_event.get('City', shipment.current_location)

                # Update shipment model with latest status
                if updated_shipment_status != shipment.status:
                    shipment.status = updated_shipment_status
                    shipment.current_location = updated_current_location
                    shipment.save()
                    shipment.add_tracking_event(
                        status=updated_shipment_status,
                        location=updated_current_location,
                        timestamp=timezone.now(), # Or parse from T_Date, T_Time
                        description=latest_event.get('Remarks', updated_shipment_status)
                    )

                serializer = CourierTrackingSerializer({
                    'tracking_number': tracking_identifier,
                    'status': updated_shipment_status,
                    'status_display': updated_shipment_status, # TPC provides activity directly
                    'current_location': updated_current_location,
                    'estimated_delivery': shipment.estimated_delivery, # TPC API doesn't seem to provide this directly
                    'tracking_history': response_data # Store raw TPC response for now
                })
                return Response(serializer.data)
            else:
                error_message = response_data.get('message', {}).get('description') or \
                                response_data.get('error_description') or \
                                response_data.get('error') or \
                                'Unable to track shipment via TPC'
                return Response(
                    {'error': error_message, 'details': response_data},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def create_cod_booking(self, request):
        """Create a COD booking using TPC API"""
        serializer = TPCCODBookingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                order_id = request.data.get('order_id') # Assuming order_id is passed for linking
                order = get_object_or_404(Order, id=order_id)
                
                tpc_service = get_tpc_courier_service()

                response_data = tpc_service.create_cod_booking(
                    order=order,
                    pickup_address={
                        "name": serializer.validated_data.get("SENDER"),
                        "address_line_1": serializer.validated_data.get("SENDER_ADDRESS"),
                        "city": serializer.validated_data.get("SENDER_CITY"),
                        "pincode": serializer.validated_data.get("SENDER_PINCODE"),
                        "phone": serializer.validated_data.get("SENDER_MOB"),
                        "email": serializer.validated_data.get("SENDER_EMAIL"),
                    },
                    delivery_address={
                        "name": serializer.validated_data.get("RECIPIENT"),
                        "company": serializer.validated_data.get("RECIPIENT_COMPANY"),
                        "address_line_1": serializer.validated_data.get("RECIPIENT_ADDRESS"),
                        "city": serializer.validated_data.get("RECIPIENT_CITY"),
                        "pincode": serializer.validated_data.get("RECIPIENT_PINCODE"),
                        "phone": serializer.validated_data.get("RECIPIENT_MOB"),
                        "email": serializer.validated_data.get("RECIPIENT_EMAIL"),
                    },
                    cod_data=serializer.validated_data
                )

                if response_data.get('status') == 'success':
                    tracking_number = response_data.get('POD_NO', '').replace('Saved Successfully with Cons No ', '')
                    ref_no = response_data.get('REF_NO')
                    
                    shipment = CourierShipment.objects.create(
                        order=order,
                        tracking_number=tracking_number,
                        tpc_order_id=ref_no, # Renamed from courier_order_id
                        status='pending', # Initial status
                        pickup_address={
                            "name": serializer.validated_data.get("SENDER"),
                            "address_line_1": serializer.validated_data.get("SENDER_ADDRESS"),
                            "city": serializer.validated_data.get("SENDER_CITY"),
                            "pincode": serializer.validated_data.get("SENDER_PINCODE"),
                            "phone": serializer.validated_data.get("SENDER_MOB"),
                            "email": serializer.validated_data.get("SENDER_EMAIL"),
                        },
                        delivery_address={
                            "name": serializer.validated_data.get("RECIPIENT"),
                            "company": serializer.validated_data.get("RECIPIENT_COMPANY"),
                            "address_line_1": serializer.validated_data.get("RECIPIENT_ADDRESS"),
                            "city": serializer.validated_data.get("RECIPIENT_CITY"),
                            "pincode": serializer.validated_data.get("RECIPIENT_PINCODE"),
                            "phone": serializer.validated_data.get("RECIPIENT_MOB"),
                            "email": serializer.validated_data.get("RECIPIENT_EMAIL"),
                        },
                        delivery_contact=serializer.validated_data.get("RECIPIENT_MOB"),
                        weight=serializer.validated_data.get("WEIGHT"),
                        pieces=serializer.validated_data.get("PIECES"),
                        declared_value=serializer.validated_data.get("CUST_INVOICEAMT", 0),
                        cod_charges=serializer.validated_data.get("COD_AMOUNT", 0),
                        tpc_response=response_data # Renamed from courier_response
                    )
                    shipment.add_tracking_event(
                        status='pending',
                        location='TPC System',
                        timestamp=timezone.now(),
                        description='COD shipment created in TPC system'
                    )
                    response_serializer = CourierShipmentSerializer(shipment)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(
                        {'error': response_data.get('Desc', 'Unknown TPC error'), 'details': response_data},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_pickup_addon_details(self, request, pk=None):
        """Add additional details to a TPC shipment"""
        shipment = self.get_object()

        serializer = TPCPickupAddonSerializer(data=request.data)
        if serializer.is_valid():
            try:
                tpc_service = get_tpc_courier_service()
                
                response_data = tpc_service.add_pickup_addon_details(serializer.validated_data)
                
                if response_data.get('status') == 'success':
                    shipment.weight = serializer.validated_data.get('WEIGHT', shipment.weight)
                    shipment.pieces = serializer.validated_data.get('PIECES', shipment.pieces)
                    shipment.declared_value = serializer.validated_data.get('DECLARED_VALUE', shipment.declared_value)
                    shipment.tpc_response.update(response_data) # Renamed from courier_response
                    shipment.save()
                    return Response({'message': 'Addon details updated successfully', 'details': response_data})
                else:
                    return Response(
                        {'error': response_data.get('status', 'Failed to update addon details'), 'details': response_data},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def check_duplicate_ref_no(self, request):
        """Check for duplicate reference numbers in TPC system"""
        ref_no = request.query_params.get('ref_no')
        if not ref_no:
            return Response({'error': 'ref_no parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tpc_service = get_tpc_courier_service()
            
            response_data = tpc_service.check_duplicate_ref_no(ref_no)
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def get_tracking_webpage_url(self, request, pk=None):
        """Get TPC tracking webpage URL for a shipment"""
        shipment = self.get_object()
        
        try:
            tpc_service = get_tpc_courier_service()
            
            tracking_url = tpc_service.get_tracking_webpage_url(shipment.tracking_number)
            return Response({'tracking_url': tracking_url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def print_consignment_note(self, request, pk=None):
        """Get TPC consignment note printing URL for a shipment"""
        shipment = self.get_object()
        
        single_copy = request.query_params.get('single_copy', 'false').lower() == 'true'

        try:
            tpc_service = get_tpc_courier_service()
            
            print_url = tpc_service.print_consignment_note(shipment.tracking_number, single_copy=single_copy)
            return Response({'print_url': print_url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def check_pincode_serviceability(self, request):
        """Check if a given pincode is serviceable."""
        pincode = request.query_params.get('pincode')
        if not pincode:
            return Response({'error': 'Pincode parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tpc_service = get_tpc_courier_service()
            service_status = tpc_service.check_pincode_service(pincode)
            return Response(service_status)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
