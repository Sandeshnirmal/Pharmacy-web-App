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
from courier.services import get_courier_service
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
                
                # Create order with payment_completed status
                order = Order.objects.create(
                    user=user,
                    order_status='payment_completed',  # New status for paid orders awaiting prescription
                    payment_status='Paid',
                    payment_method=payment_data.get('method', 'RAZORPAY'),
                    total_amount=final_amount,
                    discount_amount=discount_amount,
                    shipping_fee=shipping_fee,
                    is_prescription_order=True,
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
            # Get courier service
            courier_service = get_courier_service('professional')
            
            if not courier_service:
                return {
                    'success': False,
                    'error': 'Courier service not available'
                }
            
            # Prepare addresses
            pickup_address = {
                'name': 'InfxMart Pharmacy',
                'phone': '+91-9876543210',
                'address_line_1': '123 Pharmacy Street',
                'address_line_2': 'Medical District',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001',
                'country': 'India'
            }
            
            delivery_address = order.delivery_address if hasattr(order, 'delivery_address') else {
                'name': order.user.get_full_name() or order.user.email,
                'phone': getattr(order.user, 'phone', '+91-0000000000'),
                'address_line_1': 'Customer Address',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560001',
                'country': 'India'
            }
            
            # Create shipment
            shipment = courier_service.create_shipment(
                order=order,
                pickup_address=pickup_address,
                delivery_address=delivery_address
            )
            
            # Update order status
            order.order_status = 'processing'
            order.tracking_number = shipment.tracking_number
            order.save()
            
            # Record status history
            OrderStatusHistory.objects.create(
                order=order,
                old_status='verified',
                new_status='processing',
                changed_by=None,
                reason=f'Courier pickup scheduled. Tracking: {shipment.tracking_number}'
            )
            
            return {
                'success': True,
                'shipment': shipment,
                'tracking_number': shipment.tracking_number,
                'message': 'Courier pickup scheduled successfully'
            }
            
        except Exception as e:
            logger.error(f"Error scheduling courier pickup: {str(e)}")
            return {
                'success': False,
                'error': str(e)
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
