from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework import status
from .models import Order, OrderItem, OrderStatusHistory
from prescriptions.models import Prescription
from product.models import Product
from courier.services import get_courier_service
import logging

logger = logging.getLogger(__name__)

class CartService:
    """
    Cart and Order Service for the new flow:
    1. Add medicines to cart
    2. Upload prescription if required medicines need admin verification
    3. Make payment (Razorpay only)
    4. List for prescription verification
    5. After verification, move to order list and trigger courier shipment
    """
    
    @staticmethod
    def validate_cart_items(items):
        """Validate cart items"""
        if not items or not isinstance(items, list):
            raise ValidationError("Items must be a non-empty list")
        
        validated_items = []
        prescription_required = False
        
        for item in items:
            if not isinstance(item, dict):
                continue
                
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            if not product_id:
                continue
                
            try:
                product = Product.objects.get(id=product_id, is_active=True)
                
                # Check stock availability
                if product.stock_quantity < quantity:
                    raise ValidationError(f"Insufficient stock for {product.name}. Available: {product.stock_quantity}")
                
                # Check if any item requires prescription
                if product.is_prescription_required:
                    prescription_required = True
                
                validated_items.append({
                    'product': product,
                    'quantity': int(quantity),
                    'unit_price': float(product.price),
                    'total_price': float(product.price) * int(quantity),
                    'requires_prescription': product.is_prescription_required
                })
                
            except Product.DoesNotExist:
                logger.warning(f"Product {product_id} not found or inactive")
                continue
        
        if not validated_items:
            raise ValidationError("No valid products found in cart")
        
        return validated_items, prescription_required
    
    @staticmethod
    def create_order_with_payment(user, items, delivery_address, payment_data, prescription_file=None):
        """
        Create order after payment with prescription upload if required
        
        Flow:
        1. Validate cart items
        2. Check if prescription is required
        3. Create order with payment
        4. Upload prescription if provided
        5. Set appropriate order status
        """
        try:
            with transaction.atomic():
                # Validate cart items
                validated_items, prescription_required = CartService.validate_cart_items(items)
                
                # Validate delivery address
                CartService._validate_delivery_address(delivery_address)
                
                # Validate payment (Razorpay only)
                CartService._validate_payment_data(payment_data)
                
                # Calculate totals
                subtotal = sum(item['total_price'] for item in validated_items)
                shipping_fee = 50.0 if subtotal < 500 else 0.0
                total_amount = subtotal + shipping_fee
                
                # Determine initial order status
                if prescription_required:
                    if prescription_file:
                        initial_status = 'prescription_uploaded'
                    else:
                        initial_status = 'awaiting_prescription'
                else:
                    initial_status = 'confirmed'
                
                # Create order
                order = Order.objects.create(
                    user=user,
                    order_status=initial_status,
                    payment_status='Paid',
                    payment_method='RAZORPAY',
                    total_amount=total_amount,
                    discount_amount=0,
                    shipping_fee=shipping_fee,
                    is_prescription_order=prescription_required,
                    notes=f'Order created with Razorpay payment. Payment ID: {payment_data.get("payment_id", "N/A")}',
                    delivery_address=delivery_address
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
                    
                    # Update stock
                    product = item_data['product']
                    product.stock_quantity -= item_data['quantity']
                    product.save()
                
                # Handle prescription upload if provided
                if prescription_file and prescription_required:
                    prescription = Prescription.objects.create(
                        user=user,
                        order=order,
                        image_url=prescription_file,  # Store file path/URL
                        status='pending_verification',
                        upload_date=timezone.now()
                    )
                    order.prescription = prescription
                    order.save()
                
                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status='',
                    new_status=initial_status,
                    changed_by=user,
                    reason=f'Order created with payment. Prescription required: {prescription_required}'
                )
                
                # If no prescription required, trigger courier immediately
                if not prescription_required:
                    CartService._trigger_courier_shipment(order)
                
                return {
                    'success': True,
                    'order': order,
                    'prescription_required': prescription_required,
                    'message': 'Order created successfully'
                }
                
        except ValidationError as e:
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return {
                'success': False,
                'error': 'An error occurred while creating the order'
            }
    
    @staticmethod
    def verify_prescription_and_process_order(order_id, admin_user, approved, verification_notes=''):
        """
        Admin verifies prescription and processes order
        """
        try:
            with transaction.atomic():
                order = Order.objects.get(id=order_id)
                
                if order.order_status not in ['prescription_uploaded', 'awaiting_prescription']:
                    return {
                        'success': False,
                        'error': 'Order is not in the correct status for verification'
                    }
                
                if approved:
                    # Approve prescription and confirm order
                    order.order_status = 'confirmed'
                    if order.prescription:
                        order.prescription.status = 'verified'
                        order.prescription.verified_by_admin = admin_user
                        order.prescription.verification_date = timezone.now()
                        order.prescription.verification_notes = verification_notes
                        order.prescription.save()
                    
                    # Trigger courier shipment
                    courier_result = CartService._trigger_courier_shipment(order)
                    
                    message = 'Prescription verified and order confirmed'
                    
                else:
                    # Reject prescription
                    order.order_status = 'prescription_rejected'
                    if order.prescription:
                        order.prescription.status = 'rejected'
                        order.prescription.rejection_reason = verification_notes
                        order.prescription.save()
                    
                    # Restore stock
                    for item in order.items.all():
                        product = item.product
                        product.stock_quantity += item.quantity
                        product.save()
                    
                    courier_result = {'success': True, 'message': 'No courier needed for rejected order'}
                    message = 'Prescription rejected'
                
                order.save()
                
                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status='prescription_uploaded',
                    new_status=order.order_status,
                    changed_by=admin_user,
                    reason=f'{message}. Notes: {verification_notes}'
                )
                
                return {
                    'success': True,
                    'order': order,
                    'approved': approved,
                    'courier_scheduled': courier_result.get('success', False),
                    'message': message
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
                'error': 'An error occurred while verifying the prescription'
            }
    
    @staticmethod
    def _validate_delivery_address(delivery_address):
        """Validate delivery address"""
        required_fields = ['name', 'phone', 'address_line_1', 'city', 'state', 'pincode']
        
        if not isinstance(delivery_address, dict):
            raise ValidationError("Delivery address must be a dictionary")
        
        for field in required_fields:
            if not delivery_address.get(field):
                raise ValidationError(f"Missing required field: {field}")
        
        # Validate phone number
        phone = delivery_address.get('phone', '')
        if not phone.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValidationError("Invalid phone number format")
        
        # Validate pincode
        pincode = delivery_address.get('pincode', '')
        if not pincode.isdigit() or len(pincode) != 6:
            raise ValidationError("Invalid pincode format")
    
    @staticmethod
    def _validate_payment_data(payment_data):
        """Validate payment data (Razorpay only)"""
        if not isinstance(payment_data, dict):
            raise ValidationError("Payment data must be a dictionary")
        
        required_fields = ['payment_id', 'amount', 'method']
        for field in required_fields:
            if not payment_data.get(field):
                raise ValidationError(f"Missing required payment field: {field}")
        
        # Only allow Razorpay payments
        if payment_data.get('method') != 'RAZORPAY':
            raise ValidationError("Only Razorpay payments are allowed")
        
        # Validate amount
        try:
            amount = float(payment_data.get('amount', 0))
            if amount <= 0:
                raise ValidationError("Payment amount must be greater than 0")
        except (ValueError, TypeError):
            raise ValidationError("Invalid payment amount")
    
    @staticmethod
    def _trigger_courier_shipment(order):
        """Trigger courier shipment for confirmed order"""
        try:
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
            
            delivery_address = order.delivery_address
            
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
                old_status='confirmed',
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
