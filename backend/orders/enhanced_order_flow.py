from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Order, OrderItem, OrderStatusHistory
from prescriptions.models import Prescription
from product.models import Product
from courier.services import get_tpc_courier_service, TPCCourierService # Import TPCCourierService
from courier.serializers import TPCPickupRequestSerializer, TPCCODBookingSerializer # Import TPC serializers
from payment.models import Payment
import logging
import json

logger = logging.getLogger(__name__)

class EnhancedOrderFlow:
    """
    Enhanced order flow: Payment First → Prescription Review → Manual Verification → Order Confirmation → Courier Pickup

    This class implements the complete order workflow:
    1. Customer completes payment first
    2. Order is created in 'payment_completed' status
    3. Customer uploads prescription
    4. Admin manually verifies prescription
    5. Order is confirmed and courier pickup is scheduled
    """

    @staticmethod
    def validate_order_items(items):
        
        """Validate order items before processing"""
        if not items or not isinstance(items, list):
            raise ValueError("Items must be a non-empty list")

        validated_items = []
        for item in items:
            if not isinstance(item, dict):
                continue

            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)

            if not product_id:
                continue

            try:
                product = Product.objects.get(id=product_id, is_active=True)
                if product.stock_quantity < quantity:
                    raise ValueError(f"Insufficient stock for {product.name}")

                validated_items.append({
                    'product': product,
                    'quantity': int(quantity),
                    'unit_price': float(product.price),
                    'total_price': float(product.price) * int(quantity)
                })
            except Product.DoesNotExist:
                logger.warning(f"Product {product_id} not found or inactive")
                continue

        if not validated_items:
            raise ValueError("No valid products found in order")

        return validated_items

    @staticmethod
    def validate_delivery_address(delivery_address):
        """Validate delivery address"""
        required_fields = ['name', 'phone', 'address_line_1', 'city', 'state', 'pincode']

        if not isinstance(delivery_address, dict):
            raise ValueError("Delivery address must be a dictionary")

        for field in required_fields:
            if not delivery_address.get(field):
                raise ValueError(f"Missing required field: {field}")

        # Validate phone number (basic validation)
        phone = delivery_address.get('phone', '')
        if not phone.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError("Invalid phone number format")

        # Validate pincode (basic validation for Indian pincodes)
        pincode = delivery_address.get('pincode', '')
        if not pincode.isdigit() or len(pincode) != 6:
            raise ValueError("Invalid pincode format")

        return delivery_address

    @staticmethod
    def create_paid_order_for_prescription_review(user, items, delivery_address, payment_data):
        """
        Step 1: Create order after successful payment, before prescription verification
        This order will be in 'payment_completed' status waiting for prescription verification

        Args:
            user: User object
            items: List of order items with product_id and quantity
            delivery_address: Dictionary with delivery address details
            payment_data: Dictionary with payment information

        Returns:
            Dictionary with success status and order data
        """
        try:
            with transaction.atomic():
                # Check for existing pending or payment_completed orders for the user
                existing_order = Order.objects.filter(
                    user=user,
                    order_status__in=['Pending', 'payment_completed']
                ).first()

                if existing_order:
                    logger.warning(f"Existing order {existing_order.id} found for user {user.id} with status {existing_order.order_status}. Returning existing order.")
                    return {
                        'success': True,
                        'order': existing_order,
                        'message': f'Existing order {existing_order.id} found. No new order created.'
                    }

                # Validate inputs
                validated_items = EnhancedOrderFlow.validate_order_items(items)
                validated_address = EnhancedOrderFlow.validate_delivery_address(delivery_address)

                # Calculate totals
                total_amount = sum(item['total_price'] for item in validated_items)

                if total_amount <= 0:
                    raise ValueError("Order total must be greater than 0")
                
                # Add shipping and calculate final amount
                shipping_fee = 50.0 if total_amount < 500 else 0.0
                discount_amount = total_amount * 0.1 if total_amount > 1000 else 0.0
                final_amount = total_amount + shipping_fee - discount_amount
                
                # Determine if the order requires a prescription based on its products
                requires_prescription_for_order = any(item['product'].is_prescription_required for item in validated_items)

                # Set initial prescription status
                initial_prescription_status = 'pending_review' if requires_prescription_for_order else 'verified'

                # Create order with payment_completed status
                order = Order.objects.create(
                    user=user,
                    order_status='payment_completed',  # New status for paid orders awaiting prescription
                    payment_status='Paid',
                    payment_method=payment_data.get('method', 'RAZORPAY'),
                    total_amount=final_amount,
                    discount_amount=discount_amount,
                    shipping_fee=shipping_fee,
                    is_prescription_order=requires_prescription_for_order,
                    prescription_status=initial_prescription_status, # Explicitly set prescription status
                    notes=f'Paid order awaiting prescription verification. Payment ID: {payment_data.get("payment_id", "N/A")}',
                    delivery_address=validated_address
                )

                # Create order items
                for item_data in validated_items:
                    OrderItem.objects.create(
                        order=order,
                        product=item_data['product'],
                        quantity=item_data['quantity'],
                        unit_price=item_data['unit_price'],
                        unit_price_at_order=item_data['unit_price']
                    )
                
                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status='',
                    new_status='payment_completed',
                    changed_by=user,
                    reason='Order created after successful payment'
                )
                
                logger.info(f"Paid order created successfully: {order.id} for user {user.id}")
                
                return {
                    'success': True,
                    'order': order,
                    'message': 'Order created successfully. Please upload prescription for verification.'
                }
                
        except Exception as e:
            logger.error(f"Error creating paid order: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def link_prescription_to_paid_order(order_id, prescription_id, user):
        """
        Step 2: Link uploaded prescription to paid order
        Order moves to 'prescription_uploaded' status
        """
        try:
            with transaction.atomic():
                order = Order.objects.get(id=order_id, user=user)
                prescription = Prescription.objects.get(id=prescription_id, user=user)
                
                if order.order_status != 'payment_completed':
                    return {
                        'success': False,
                        'error': 'Order must be in payment_completed status'
                    }
                
                # Link prescription to order
                order.prescription = prescription
                order.order_status = 'prescription_uploaded'
                order.save()
                
                # Update prescription with order reference
                prescription.order = order
                prescription.status = 'pending_verification'
                prescription.verification_status = 'Pending_Review' # Ensure legacy field is also updated
                prescription.save()
                
                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status='payment_completed',
                    new_status='prescription_uploaded',
                    changed_by=user,
                    reason=f'Prescription #{prescription.id} uploaded for verification'
                )
                
                return {
                    'success': True,
                    'order': order,
                    'prescription': prescription,
                    'message': 'Prescription linked to order. Awaiting admin verification.'
                }
                
        except (Order.DoesNotExist, Prescription.DoesNotExist) as e:
            return {
                'success': False,
                'error': 'Order or prescription not found'
            }
        except Exception as e:
            logger.error(f"Error linking prescription to order: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def verify_prescription_and_confirm_order(order_id, admin_user, verification_notes='', approved=True):
        """
        Step 3: Admin verifies prescription and confirms order
        Order moves to 'verified' status if approved, or 'prescription_rejected' if rejected
        """
        try:
            with transaction.atomic():
                order = Order.objects.get(id=order_id)
                
                if order.order_status != 'prescription_uploaded':
                    return {
                        'success': False,
                        'error': 'Order must be in prescription_uploaded status'
                    }
                
                if not order.prescription:
                    return {
                        'success': False,
                        'error': 'No prescription linked to this order'
                    }
                
                if approved:
                    # Approve prescription and confirm order
                    order.order_status = 'verified'
                    order.prescription.status = 'verified'
                    order.prescription.verified_by_admin = admin_user
                    order.prescription.verification_date = timezone.now()
                    order.prescription.verification_notes = verification_notes
                    
                    new_status = 'verified'
                    reason = f'Prescription verified and approved by {admin_user.email}'
                    
                    # Trigger courier pickup scheduling
                    courier_result = EnhancedOrderFlow._schedule_courier_pickup(order)
                    
                else:
                    # Reject prescription
                    order.order_status = 'prescription_rejected'
                    order.prescription.status = 'rejected'
                    order.prescription.rejection_reason = verification_notes
                    
                    new_status = 'prescription_rejected'
                    reason = f'Prescription rejected by {admin_user.email}: {verification_notes}'
                    courier_result = {'success': True, 'message': 'No courier needed for rejected order'}
                
                order.save()
                order.prescription.save()
                
                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status='prescription_uploaded',
                    new_status=new_status,
                    changed_by=admin_user,
                    reason=reason
                )
                
                return {
                    'success': True,
                    'order': order,
                    'approved': approved,
                    'courier_scheduled': courier_result.get('success', False),
                    'message': f'Prescription {"approved" if approved else "rejected"} successfully.'
                }
                
        except Order.DoesNotExist:
            return {
                'success': False,
                'error': 'Order not found'
            }
        except Exception as e:
            logger.error(f"Error verifying prescription: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _schedule_courier_pickup(order):
        """
        Step 4: Schedule courier pickup for verified order
        """
        try:
            # Get TPC courier service
            courier_service = get_courier_service('TPC')
            
            if not courier_service or not isinstance(courier_service, TPCCourierService):
                logger.error("TPC Courier service not available or not correctly initialized.")
                return {
                    'success': False,
                    'error': 'TPC Courier service not available'
                }
            
            # Prepare pickup address (pharmacy's address)
            # This should ideally come from a configurable setting or a PharmacyProfile model
            pickup_address = {
                'name': 'InfxMart Pharmacy',
                'phone': '+91-9876543210',
                'address_line_1': '123 Pharmacy Street',
                'address_line_2': 'Medical District',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001',
                'country': 'India',
                'email': 'pharmacy@infxmart.com' # Added email
            }
            
            # Prepare delivery address from order's delivery_address JSONField
            delivery_address = order.delivery_address
            if not delivery_address:
                logger.error(f"Order {order.id} has no delivery address.")
                return {'success': False, 'error': 'Delivery address not found for order'}

            # Ensure required fields are present in delivery_address
            required_delivery_fields = ['name', 'phone', 'address_line_1', 'city', 'pincode']
            for field in required_delivery_fields:
                if field not in delivery_address:
                    logger.error(f"Missing required delivery address field '{field}' for order {order.id}.")
                    return {'success': False, 'error': f"Missing delivery address field: {field}"}

            # Calculate shipment details from order items
            total_weight = 0.0
            total_pieces = 0
            declared_value = 0.0
            for item in order.items.all():
                # Assuming a default weight if product model doesn't have it
                # For now, let's assume 0.1 kg per item if not specified
                product_weight = getattr(item.product, 'weight', 0.1) # Assuming product has a 'weight' attribute
                total_weight += float(product_weight) * item.quantity
                total_pieces += item.quantity
                declared_value += float(item.total_price)

            # Ensure minimum weight for courier API
            if total_weight < 0.1:
                total_weight = 0.1
            if total_pieces == 0:
                total_pieces = 1

            # Determine COD amount
            cod_amount = float(order.total_amount) if order.payment_method == 'COD' else 0.0

            # Prepare shipment data for TPC API
            shipment_data = {
                "REF_NO": str(order.id),
                "BDATE": timezone.now().strftime("%Y-%m-%d"),
                "SENDER": pickup_address['name'],
                "SENDER_ADDRESS": pickup_address['address_line_1'],
                "SENDER_CITY": pickup_address['city'],
                "SENDER_PINCODE": pickup_address['pincode'],
                "SENDER_MOB": pickup_address['phone'],
                "SENDER_EMAIL": pickup_address['email'],
                "RECIPIENT": delivery_address['name'],
                "RECIPIENT_COMPANY": delivery_address.get('company', delivery_address['name']), # Use name if company not provided
                "RECIPIENT_ADDRESS": delivery_address['address_line_1'],
                "RECIPIENT_CITY": delivery_address['city'],
                "RECIPIENT_PINCODE": delivery_address['pincode'],
                "RECIPIENT_MOB": delivery_address['phone'],
                "RECIPIENT_EMAIL": delivery_address.get('email', ''),
                "WEIGHT": str(round(total_weight, 2)),
                "PIECES": total_pieces,
                "CUST_INVOICEAMT": str(round(declared_value, 2)),
                "VOL_LENGTH": "10", # Default dimensions, can be made configurable
                "VOL_WIDTH": "10",
                "VOL_HEIGHT": "10",
                "DESCRIPTION": f"Pharmacy Order #{order.id}",
                "REMARKS": f"Pharmacy Order #{order.id}",
                "COD_AMOUNT": str(round(cod_amount, 2)),
                "PAYMENT_MODE": "CASH" if order.payment_method == 'COD' else "CREDIT",
                "TYPE": "PICKUP",
                "ORDER_STATUS": "HOLD",
                "MODE": "AT", # Air Transit, can be 'ST' for Surface Transit
                "SERVICE": "PRO" # Premium service, if applicable
            }

            # Use appropriate serializer for validation
            if order.payment_method == 'COD':
                serializer = TPCCODBookingSerializer(data=shipment_data)
            else:
                serializer = TPCPickupRequestSerializer(data=shipment_data)

            if not serializer.is_valid():
                logger.error(f"TPC Shipment data validation failed for order {order.id}: {serializer.errors}")
                return {
                    'success': False,
                    'error': f"Invalid shipment data: {serializer.errors}"
                }

            # Call TPC API
            if order.payment_method == 'COD':
                response_data = courier_service.create_cod_booking(
                    order=order,
                    pickup_address=pickup_address,
                    delivery_address=delivery_address,
                    cod_data=serializer.validated_data
                )
            else:
                response_data = courier_service.create_shipment(
                    order=order,
                    pickup_address=pickup_address,
                    delivery_address=delivery_address,
                    shipment_data=serializer.validated_data
                )

            if response_data.get('status') == 'success':
                tracking_number = response_data.get('POD_NO', '').replace('Saved Successfully with Cons No ', '')
                ref_no = response_data.get('REF_NO')

                # Create CourierShipment entry
                from courier.models import CourierShipment # Import here to avoid circular dependency
                shipment_obj = CourierShipment.objects.create(
                    order=order,
                    courier_partner=courier_service.courier_partner,
                    tracking_number=tracking_number,
                    courier_order_id=ref_no,
                    status='pending', # Initial status
                    pickup_address=pickup_address,
                    delivery_address=delivery_address,
                    delivery_contact=delivery_address['phone'],
                    weight=total_weight,
                    dimensions={
                        "length": shipment_data["VOL_LENGTH"],
                        "width": shipment_data["VOL_WIDTH"],
                        "height": shipment_data["VOL_HEIGHT"],
                    },
                    declared_value=declared_value,
                    cod_charges=cod_amount,
                    courier_response=response_data
                )
                shipment_obj.add_tracking_event(
                    status='pending',
                    location='TPC System',
                    timestamp=timezone.now(),
                    description='Shipment created in TPC system'
                )

                # Update order status and tracking number
                order.order_status = 'Processing' # Or 'Shipped' if it's immediately shipped
                order.tracking_number = tracking_number
                order.save()
                
                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status='verified',
                    new_status='Processing',
                    changed_by=None, # Admin user should be passed here if available
                    reason=f'Courier booking successful. Tracking: {tracking_number}'
                )
                
                return {
                    'success': True,
                    'shipment': shipment_obj,
                    'tracking_number': tracking_number,
                    'message': 'Courier booking successful'
                }
            else:
                error_message = response_data.get('error', response_data.get('Desc', 'Unknown TPC error'))
                logger.error(f"TPC API booking failed for order {order.id}: {error_message} - Details: {response_data}")
                return {
                    'success': False,
                    'error': f"Courier booking failed: {error_message}"
                }
            
        except Exception as e:
            logger.exception(f"Error scheduling courier pickup for order {order.id}: {str(e)}")
            return {
                'success': False,
                'error': f"An unexpected error occurred during courier booking: {str(e)}"
            }
    
    @staticmethod
    def get_orders_for_prescription_review():
        """
        Get orders that are waiting for prescription verification
        """
        return Order.objects.filter(
            order_status__in=['prescription_uploaded'],
            is_prescription_order=True
        ).select_related('user', 'prescription').order_by('-created_at')
    
    @staticmethod
    def get_paid_orders_awaiting_prescription():
        """
        Get orders that have been paid but are waiting for prescription upload
        """
        return Order.objects.filter(
            order_status='payment_completed',
            is_prescription_order=True
        ).select_related('user').order_by('-created_at')
