from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import Order, OrderItem, OrderStatusHistory
from .cart_service import CartService
from prescriptions.models import Prescription
from prescriptions.ocr_service import OCRService
from product.models import Product
import logging
import json

logger = logging.getLogger(__name__)

# ============================================================================
# NEW ORDER FLOW API VIEWS
# 1. Add medicines to cart
# 2. Upload prescription if required medicines need admin verification
# 3. Make payment (Razorpay only)
# 4. List for prescription verification
# 5. After verification, move to order list and trigger courier shipment
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_with_cart(request):
    """
    Create order from cart with prescription upload and payment
    
    Flow:
    1. Validate cart items
    2. Check if prescription is required
    3. Upload prescription if provided
    4. Process payment (Razorpay only)
    5. Create order
    6. Set appropriate status based on prescription requirement
    
    Request Body:
    {
        "items": [
            {"product_id": 1, "quantity": 2},
            {"product_id": 2, "quantity": 1}
        ],
        "delivery_address": {
            "name": "John Doe",
            "phone": "+91-9876543210",
            "address_line_1": "123 Main Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        },
        "payment_data": {
            "method": "RAZORPAY",
            "payment_id": "pay_xyz123",
            "amount": 500.00
        },
        "prescription_file": "base64_encoded_image_or_file_path"
    }
    """
    try:
        # Extract request data
        items = request.data.get('items', [])
        delivery_address = request.data.get('delivery_address', {})
        payment_data = request.data.get('payment_data', {})
        prescription_file = request.FILES.get('prescription_file') or request.data.get('prescription_file')
        
        # Validate required fields
        if not items:
            return Response({
                'success': False,
                'error': 'Cart items are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not delivery_address:
            return Response({
                'success': False,
                'error': 'Delivery address is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not payment_data:
            return Response({
                'success': False,
                'error': 'Payment data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create order using cart service
        result = CartService.create_order_with_payment(
            user=request.user,
            items=items,
            delivery_address=delivery_address,
            payment_data=payment_data,
            prescription_file=prescription_file
        )
        
        if result['success']:
            order = result['order']
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'status': order.order_status,
                'total_amount': float(order.total_amount),
                'prescription_required': result['prescription_required'],
                'delivery_address': order.delivery_address,
                'tracking_number': order.tracking_number,
                'message': result['message']
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while creating the order'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_prescription_image_ocr(request):
    """
    Upload prescription image and extract medicines using OCR
    
    Request Body:
    - prescription_image: Image file
    
    Response:
    {
        "success": true,
        "extracted_text": "OCR extracted text",
        "extracted_medicines": [...],
        "suggestions": [...],
        "total_suggestions": 5
    }
    """
    try:
        prescription_image = request.FILES.get('prescription_image')
        
        if not prescription_image:
            return Response({
                'success': False,
                'error': 'Prescription image is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process image using OCR service
        ocr_service = OCRService()
        result = ocr_service.process_prescription_image(prescription_image)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error processing prescription image: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while processing the prescription image'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_orders_for_prescription_verification(request):
    """
    Get orders that need prescription verification (Admin only)
    
    Response:
    {
        "success": true,
        "orders": [...],
        "total_orders": 5
    }
    """
    try:
        # Get orders that need prescription verification
        orders = Order.objects.filter(
            order_status__in=['prescription_uploaded', 'awaiting_prescription'],
            is_prescription_order=True
        ).select_related('user', 'prescription').prefetch_related('items__product').order_by('-created_at')
        
        orders_data = []
        for order in orders:
            order_data = {
                'id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'user': {
                    'id': order.user.id,
                    'username': order.user.username,
                    'email': order.user.email
                },
                'total_amount': float(order.total_amount),
                'status': order.order_status,
                'created_at': order.created_at.isoformat(),
                'delivery_address': order.delivery_address,
                'items': [
                    {
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'unit_price': float(item.unit_price),
                        'requires_prescription': item.product.is_prescription_required
                    }
                    for item in order.items.all()
                ],
                'prescription': None
            }
            
            if order.prescription:
                order_data['prescription'] = {
                    'id': order.prescription.id,
                    'upload_date': order.prescription.upload_date.isoformat(),
                    'image_url': order.prescription.image_url,
                    'status': order.prescription.status
                }
            
            orders_data.append(order_data)
        
        return Response({
            'success': True,
            'orders': orders_data,
            'total_orders': len(orders_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching orders for verification: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while fetching orders'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def verify_prescription_and_process_order(request, order_id):
    """
    Admin verifies prescription and processes order
    
    Request Body:
    {
        "approved": true,
        "verification_notes": "Prescription verified successfully"
    }
    
    Response:
    {
        "success": true,
        "order_id": 123,
        "approved": true,
        "courier_scheduled": true,
        "tracking_number": "PC20240115000123",
        "message": "Prescription verified and order confirmed"
    }
    """
    try:
        approved = request.data.get('approved', False)
        verification_notes = request.data.get('verification_notes', '')
        
        # Verify prescription using cart service
        result = CartService.verify_prescription_and_process_order(
            order_id=order_id,
            admin_user=request.user,
            approved=approved,
            verification_notes=verification_notes
        )
        
        if result['success']:
            order = result['order']
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'status': order.order_status,
                'approved': result['approved'],
                'courier_scheduled': result.get('courier_scheduled', False),
                'tracking_number': order.tracking_number,
                'message': result['message']
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error verifying prescription: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while verifying the prescription'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    """
    Get user's orders with status tracking
    
    Response:
    {
        "success": true,
        "orders": [...],
        "total_orders": 5
    }
    """
    try:
        orders = Order.objects.filter(
            user=request.user
        ).prefetch_related('items__product').order_by('-created_at')
        
        orders_data = []
        for order in orders:
            order_data = {
                'id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'total_amount': float(order.total_amount),
                'status': order.order_status,
                'payment_status': order.payment_status,
                'tracking_number': order.tracking_number,
                'created_at': order.created_at.isoformat(),
                'delivery_address': order.delivery_address,
                'items': [
                    {
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'unit_price': float(item.unit_price),
                        'total_price': float(item.unit_price * item.quantity)
                    }
                    for item in order.items.all()
                ]
            }
            orders_data.append(order_data)
        
        return Response({
            'success': True,
            'orders': orders_data,
            'total_orders': len(orders_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching user orders: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while fetching orders'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def track_order(request, order_id):
    """
    Track order status and courier information
    
    Response:
    {
        "success": true,
        "order": {...},
        "tracking_info": {...}
    }
    """
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        # Get order status history
        status_history = OrderStatusHistory.objects.filter(
            order=order
        ).order_by('-created_at')
        
        order_data = {
            'id': order.id,
            'order_number': f'ORD{order.id:06d}',
            'status': order.order_status,
            'payment_status': order.payment_status,
            'total_amount': float(order.total_amount),
            'tracking_number': order.tracking_number,
            'created_at': order.created_at.isoformat(),
            'delivery_address': order.delivery_address,
            'status_history': [
                {
                    'status': history.new_status,
                    'timestamp': history.created_at.isoformat(),
                    'reason': history.reason
                }
                for history in status_history
            ]
        }
        
        return Response({
            'success': True,
            'order': order_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error tracking order: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while tracking the order'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
