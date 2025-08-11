import requests
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import CourierPartner, CourierShipment, CourierServiceArea, CourierRateCard
from orders.models import Order
import logging

logger = logging.getLogger(__name__)

class CourierService:
    """
    Base class for courier service integration

    This class provides the interface for all courier service implementations.
    Each courier service (Delhivery, Blue Dart, Professional Courier, etc.)
    should inherit from this class and implement the required methods.
    """

    def __init__(self, courier_partner):
        """
        Initialize courier service with partner configuration

        Args:
            courier_partner: CourierPartner model instance
        """
        if not courier_partner:
            raise ValueError("Courier partner is required")

        self.courier_partner = courier_partner
        self.api_endpoint = courier_partner.api_endpoint
        self.api_key = courier_partner.api_key
        self.api_secret = courier_partner.api_secret

        # Validate configuration
        if not self.api_endpoint:
            raise ValueError("API endpoint is required for courier service")
        if not self.api_key:
            raise ValueError("API key is required for courier service")

    def create_shipment(self, order, pickup_address, delivery_address):
        """Create a new shipment"""
        raise NotImplementedError("Subclasses must implement create_shipment")

    def track_shipment(self, tracking_number):
        """Track shipment status"""
        raise NotImplementedError("Subclasses must implement track_shipment")

    def cancel_shipment(self, tracking_number):
        """Cancel a shipment"""
        raise NotImplementedError("Subclasses must implement cancel_shipment")

    def schedule_pickup(self, shipment_id, pickup_date):
        """Schedule pickup for shipment"""
        raise NotImplementedError("Subclasses must implement schedule_pickup")

    def validate_address(self, address):
        """Validate address format"""
        required_fields = ['name', 'phone', 'address_line_1', 'city', 'state', 'pincode']

        if not isinstance(address, dict):
            raise ValueError("Address must be a dictionary")

        for field in required_fields:
            if not address.get(field):
                raise ValueError(f"Missing required address field: {field}")

        return True

class ProfessionalCourierService(CourierService):
    """Professional courier service implementation"""
    
    def create_shipment(self, order, pickup_address, delivery_address):
        """Create shipment with professional courier"""
        try:
            # Generate tracking number
            tracking_number = f"PC{timezone.now().strftime('%Y%m%d')}{order.id:06d}"
            
            # Create shipment record
            shipment = CourierShipment.objects.create(
                order=order,
                courier_partner=self.courier_partner,
                tracking_number=tracking_number,
                pickup_address=pickup_address,
                delivery_address=delivery_address,
                delivery_contact=delivery_address.get('phone', ''),
                declared_value=float(order.total_amount),
                weight=self._calculate_weight(order),
                dimensions=self._get_default_dimensions(),
                shipping_charges=self._calculate_shipping_charges(order, delivery_address),
                estimated_delivery=timezone.now() + timedelta(days=3)
            )
            
            # Simulate API call to professional courier
            api_response = self._call_courier_api('create_shipment', {
                'tracking_number': tracking_number,
                'order_id': order.id,
                'pickup_address': pickup_address,
                'delivery_address': delivery_address,
                'declared_value': float(order.total_amount),
                'weight': shipment.weight,
                'cod_amount': float(order.total_amount) if order.payment_method == 'COD' else 0
            })
            
            shipment.courier_response = api_response
            shipment.courier_order_id = api_response.get('courier_order_id', tracking_number)
            shipment.save()
            
            # Add initial tracking event
            shipment.add_tracking_event(
                status='pending',
                location='Pharmacy',
                timestamp=timezone.now(),
                description='Shipment created and ready for pickup'
            )
            
            return shipment
            
        except Exception as e:
            logger.error(f"Error creating shipment for order {order.id}: {str(e)}")
            raise
    
    def track_shipment(self, tracking_number):
        """Track shipment status"""
        try:
            shipment = CourierShipment.objects.get(tracking_number=tracking_number)
            
            # Simulate API call for tracking
            api_response = self._call_courier_api('track_shipment', {
                'tracking_number': tracking_number
            })
            
            # Update shipment status based on API response
            new_status = api_response.get('status', shipment.status)
            if new_status != shipment.status:
                shipment.status = new_status
                shipment.current_location = api_response.get('current_location', '')
                
                # Add tracking event
                shipment.add_tracking_event(
                    status=new_status,
                    location=api_response.get('current_location', ''),
                    timestamp=timezone.now(),
                    description=api_response.get('status_description', '')
                )
                
                shipment.save()
            
            return shipment
            
        except CourierShipment.DoesNotExist:
            logger.error(f"Shipment not found: {tracking_number}")
            return None
        except Exception as e:
            logger.error(f"Error tracking shipment {tracking_number}: {str(e)}")
            raise
    
    def schedule_pickup(self, shipment_id, pickup_date):
        """Schedule pickup for shipment"""
        try:
            shipment = CourierShipment.objects.get(id=shipment_id)
            
            # Simulate API call for pickup scheduling
            api_response = self._call_courier_api('schedule_pickup', {
                'tracking_number': shipment.tracking_number,
                'pickup_date': pickup_date.isoformat(),
                'pickup_address': shipment.pickup_address
            })
            
            shipment.pickup_scheduled = pickup_date
            shipment.courier_response.update(api_response)
            shipment.save()
            
            # Add tracking event
            shipment.add_tracking_event(
                status='pickup_scheduled',
                location='Pharmacy',
                timestamp=pickup_date,
                description=f'Pickup scheduled for {pickup_date.strftime("%Y-%m-%d %H:%M")}'
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error scheduling pickup for shipment {shipment_id}: {str(e)}")
            return False
    
    def cancel_shipment(self, tracking_number):
        """Cancel a shipment"""
        try:
            shipment = CourierShipment.objects.get(tracking_number=tracking_number)
            
            # Only allow cancellation if not picked up
            if shipment.status in ['picked_up', 'in_transit', 'delivered']:
                return False, "Cannot cancel shipment after pickup"
            
            # Simulate API call for cancellation
            api_response = self._call_courier_api('cancel_shipment', {
                'tracking_number': tracking_number
            })
            
            shipment.status = 'cancelled'
            shipment.courier_response.update(api_response)
            shipment.save()
            
            # Add tracking event
            shipment.add_tracking_event(
                status='cancelled',
                location='Pharmacy',
                timestamp=timezone.now(),
                description='Shipment cancelled'
            )
            
            return True, "Shipment cancelled successfully"
            
        except Exception as e:
            logger.error(f"Error cancelling shipment {tracking_number}: {str(e)}")
            return False, str(e)
    
    def _call_courier_api(self, endpoint, data):
        """Simulate API call to professional courier service"""
        # This is a placeholder for actual API integration
        # Replace with real API calls when integrating with actual courier service
        
        mock_responses = {
            'create_shipment': {
                'success': True,
                'courier_order_id': f"PC{data['tracking_number']}",
                'tracking_number': data['tracking_number'],
                'estimated_delivery': (timezone.now() + timedelta(days=3)).isoformat(),
                'pickup_scheduled': (timezone.now() + timedelta(hours=24)).isoformat()
            },
            'track_shipment': {
                'success': True,
                'status': 'in_transit',
                'current_location': 'Distribution Center',
                'status_description': 'Package is in transit',
                'estimated_delivery': (timezone.now() + timedelta(days=1)).isoformat()
            },
            'schedule_pickup': {
                'success': True,
                'pickup_id': f"PU{data['tracking_number']}",
                'message': 'Pickup scheduled successfully'
            },
            'cancel_shipment': {
                'success': True,
                'message': 'Shipment cancelled successfully'
            }
        }
        
        return mock_responses.get(endpoint, {'success': False, 'error': 'Unknown endpoint'})
    
    def _calculate_weight(self, order):
        """Calculate package weight based on order items"""
        # Default weight calculation - can be enhanced based on product weights
        item_count = sum(item.quantity for item in order.items.all())
        return max(0.5, item_count * 0.1)  # Minimum 0.5kg, 0.1kg per item
    
    def _get_default_dimensions(self):
        """Get default package dimensions"""
        return {
            'length': 20,  # cm
            'width': 15,   # cm
            'height': 10   # cm
        }
    
    def _calculate_shipping_charges(self, order, delivery_address):
        """Calculate shipping charges"""
        # Simple calculation - can be enhanced with rate cards
        base_charge = 50.0  # Base shipping charge
        
        # Add COD charges if applicable
        cod_charge = 0
        if order.payment_method == 'COD':
            cod_charge = float(order.total_amount) * 0.02  # 2% COD charge
        
        return base_charge + cod_charge

def get_courier_service(courier_type='professional'):
    """Factory method to get courier service instance"""
    try:
        courier_partner = CourierPartner.objects.get(
            courier_type=courier_type,
            is_active=True
        )
        
        if courier_type == 'professional':
            return ProfessionalCourierService(courier_partner)
        # Add other courier services here
        else:
            return ProfessionalCourierService(courier_partner)
            
    except CourierPartner.DoesNotExist:
        logger.error(f"No active courier partner found for type: {courier_type}")
        return None
