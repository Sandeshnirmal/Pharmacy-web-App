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
    PickupScheduleSerializer, ShipmentCreateSerializer,
    TPCPickupRequestSerializer, TPCCODBookingSerializer, TPCPickupAddonSerializer
)
from .services import get_courier_service
from orders.models import Order

class CourierPartnerViewSet(viewsets.ModelViewSet): # Changed to ModelViewSet
    """
    ViewSet for managing the single TPC courier partner.

    Provides CRUD access to the TPC courier partner.
    Only authenticated users can access this endpoint.
    """
    serializer_class = CourierPartnerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only the TPC courier partner is managed
        # If no TPC partner exists, create one.
        tpc_partner, created = CourierPartner.objects.get_or_create(name='TPC')
        return CourierPartner.objects.filter(pk=tpc_partner.pk)

    def get_object(self):
        # Always return the single TPC courier partner
        tpc_partner, created = CourierPartner.objects.get_or_create(name='TPC')
        return tpc_partner

    def perform_create(self, serializer):
        # Ensure only one TPC partner can be created
        if CourierPartner.objects.filter(name='TPC').exists():
            raise serializers.ValidationError("Only one TPC courier partner can exist.")
        serializer.save(name='TPC')

    def perform_update(self, serializer):
        # Ensure the name remains TPC
        serializer.save(name='TPC')

    @action(detail=False, methods=['get']) # Changed detail to False as we operate on the single TPC instance
    def check_pincode_service(self, request):
        """Check if a pincode is serviceable by TPC courier partner"""
        courier_partner = self.get_object() # Get the single TPC partner

        pincode = request.query_params.get('pincode')
        if not pincode:
            return Response({'error': 'Pincode parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tpc_service = get_courier_service(courier_partner.name) # Use name as identifier
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            response_data = tpc_service.check_pincode_service(pincode)
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get']) # Changed detail to False
    def search_area_name(self, request):
        """Search for area names by TPC courier partner"""
        courier_partner = self.get_object() # Get the single TPC partner

        area_name = request.query_params.get('area_name')
        if not area_name:
            return Response({'error': 'AreaName parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tpc_service = get_courier_service(courier_partner.name) # Use name as identifier
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            response_data = tpc_service.search_area_name(area_name)
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post']) # Changed detail to False
    def request_consignment_notes(self, request):
        """Request consignment notes stock from TPC"""
        courier_partner = self.get_object() # Get the single TPC partner

        qty = request.data.get('qty')
        if not qty:
            return Response({'error': 'Quantity (qty) parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            qty = int(qty)
            tpc_service = get_courier_service(courier_partner.name) # Use name as identifier
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            response_data = tpc_service.request_consignment_notes(qty)
            return Response(response_data)
        except ValueError:
            return Response({'error': 'Quantity (qty) must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get']) # Changed detail to False
    def get_consignment_note_stock(self, request):
        """Get available consignment notes stock from TPC"""
        courier_partner = self.get_object() # Get the single TPC partner

        try:
            tpc_service = get_courier_service(courier_partner.name) # Use name as identifier
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            response_data = tpc_service.get_consignment_note_stock()
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get']) # Changed detail to False
    def get_consignment_note_stock_details(self, request):
        """Get detailed consignment notes stock from TPC"""
        courier_partner = self.get_object() # Get the single TPC partner

        try:
            tpc_service = get_courier_service(courier_partner.name) # Use name as identifier
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            response_data = tpc_service.get_consignment_note_stock_details()
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                
                # Get the single TPC courier partner
                courier_partner = CourierPartner.objects.get(name='TPC', is_active=True)
                courier_service = get_courier_service(courier_partner.name) # Use name as identifier
                
                if not courier_service:
                    return Response(
                        {'error': 'TPC courier service not available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # For TPC, the serializer data directly forms the shipment_data
                response_data = courier_service.create_shipment(
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
                        courier_partner=courier_service.courier_partner,
                        tracking_number=tracking_number,
                        courier_order_id=ref_no,
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
                        courier_response=response_data
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
            
            if shipment.courier_partner.courier_type == 'tpc':
                # For TPC, the cancel_shipment method expects podno
                response_data = courier_service.cancel_shipment(shipment.tracking_number)
                if response_data.get('status') == 'success':
                    shipment.status = 'cancelled'
                    shipment.courier_response.update(response_data)
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
            else:
                # Existing logic for mock/other couriers
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
            courier_service = get_courier_service(shipment.courier_partner.courier_type)
            
            if shipment.courier_partner.courier_type == 'tpc':
                response_data = courier_service.track_shipment(
                    tracking_identifier, new_version=new_version, with_contact=with_contact
                )
                # TPC tracking APIs return a list of events or a message
                if response_data and not response_data.get('message', {}).get('error') and not response_data.get('error_description'):
                    # Assuming the response_data is the tracking history itself or contains it
                    # We need to parse this into a format suitable for CourierTrackingSerializer
                    # This part might need more specific mapping based on actual TPC response structure
                    
                    # For simplicity, let's assume the TPC API returns a list of tracking events
                    # and we'll try to extract the latest status and location.
                    
                    # Example: TPC tracktracejsonnew.ashx returns a list of dicts
                    # [{"T_Date":"01/08/2024","T_Time":"18:36","City":"Mumbai-Kurla","Activity":"Booking Completed", ...}]
                    
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
            else:
                # Existing logic for mock/other couriers
                updated_shipment = courier_service.track_shipment(tracking_identifier)
                
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

    @action(detail=False, methods=['post'])
    def create_cod_booking(self, request):
        """Create a COD booking using TPC API"""
        serializer = TPCCODBookingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                order_id = request.data.get('order_id') # Assuming order_id is passed for linking
                order = get_object_or_404(Order, id=order_id)
                
                courier_partner = get_object_or_404(CourierPartner, courier_type='tpc', is_active=True)
                tpc_service = get_courier_service(courier_partner.courier_type)

                if not tpc_service:
                    return Response(
                        {'error': 'TPC service not available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
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
                        courier_partner=tpc_service.courier_partner,
                        tracking_number=tracking_number,
                        courier_order_id=ref_no,
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
                        courier_response=response_data
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
        if shipment.courier_partner.courier_type != 'tpc':
            return Response({'error': 'This action is only for TPC courier partners'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TPCPickupAddonSerializer(data=request.data)
        if serializer.is_valid():
            try:
                tpc_service = get_courier_service(shipment.courier_partner.courier_type)
                if not tpc_service:
                    return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                response_data = tpc_service.add_pickup_addon_details(serializer.validated_data)
                
                if response_data.get('status') == 'success':
                    shipment.weight = serializer.validated_data.get('WEIGHT', shipment.weight)
                    shipment.pieces = serializer.validated_data.get('PIECES', shipment.pieces)
                    shipment.declared_value = serializer.validated_data.get('DECLARED_VALUE', shipment.declared_value)
                    shipment.courier_response.update(response_data)
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
            courier_partner = get_object_or_404(CourierPartner, courier_type='tpc', is_active=True)
            tpc_service = get_courier_service(courier_partner.courier_type)
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            response_data = tpc_service.check_duplicate_ref_no(ref_no)
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def get_tracking_webpage_url(self, request, pk=None):
        """Get TPC tracking webpage URL for a shipment"""
        shipment = self.get_object()
        if shipment.courier_partner.courier_type != 'tpc':
            return Response({'error': 'This action is only for TPC courier partners'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tpc_service = get_courier_service(shipment.courier_partner.courier_type)
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            tracking_url = tpc_service.get_tracking_webpage_url(shipment.tracking_number)
            return Response({'tracking_url': tracking_url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def print_consignment_note(self, request, pk=None):
        """Get TPC consignment note printing URL for a shipment"""
        shipment = self.get_object()
        if shipment.courier_partner.courier_type != 'tpc':
            return Response({'error': 'This action is only for TPC courier partners'}, status=status.HTTP_400_BAD_REQUEST)
        
        single_copy = request.query_params.get('single_copy', 'false').lower() == 'true'

        try:
            tpc_service = get_courier_service(shipment.courier_partner.courier_type)
            if not tpc_service:
                return Response({'error': 'TPC service not initialized'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            print_url = tpc_service.print_consignment_note(shipment.tracking_number, single_copy=single_copy)
            return Response({'print_url': print_url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
