import razorpay
import hmac
import hashlib
import logging
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Payment
from orders.models import Order
from orders.invoice_service import InvoiceService

logger = logging.getLogger(__name__)

# Initialize Razorpay client (you'll need to add these to settings)
razorpay_client = razorpay.Client(auth=(
    getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_u32HLv2OyCBfAN'),
    getattr(settings, 'RAZORPAY_KEY_SECRET', 'Owlg61rwtT7V3RQKoYGKhsUC')
))

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_order(request):
    """Create a Razorpay order for payment"""
    try:
        amount = request.data.get('amount')  # Amount in paise
        currency = request.data.get('currency', 'INR')
        order_id = request.data.get('order_id')
        
        if not amount or not order_id:
            return Response({
                'error': 'Amount and order_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the order
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            'amount': int(amount),
            'currency': currency,
            'receipt': f'order_{order_id}',
            'payment_capture': 1
        })
        
        # Create payment record
        payment = Payment.objects.create(
            order=order,
            user=request.user,
            razorpay_order_id=razorpay_order['id'],
            amount=amount / 100,  # Convert back to rupees
            currency=currency,
            status='pending'
        )
        
        logger.info(f"Payment order created: {payment.id} for order {order_id}")
        
        return Response({
            'razorpay_order_id': razorpay_order['id'], # Changed 'id' to 'razorpay_order_id' for clarity and consistency with mobile app expectation
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'receipt': razorpay_order['receipt'],
            'payment_id': payment.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.exception("An unexpected error occurred during payment order creation.") # Use exception for full traceback
        return Response({
            'error': f'Failed to create payment order: {str(e)}',
            'detail': 'An unexpected server error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated]) # Revert to IsAuthenticated
def verify_payment(request):
    """Verify Razorpay payment signature"""
    try:
        # Explicitly check if the user is authenticated
        if not request.user.is_authenticated:
            logger.error("Attempted payment verification by unauthenticated user.")
            return Response({
                'error': 'Authentication required for payment verification.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"Verify Payment Request - Raw Body: {request.body}")
        logger.info(f"Verify Payment Request - Parsed Data: {request.data}")

        payment_id = request.data.get('razorpay_payment_id')
        order_id = request.data.get('razorpay_order_id')
        signature = request.data.get('razorpay_signature')
        
        if not all([payment_id, order_id, signature]):
            logger.error(f"Missing required fields for payment verification. payment_id: {payment_id}, order_id: {order_id}, signature: {signature}")
            return Response({
                'error': 'payment_id, order_id, and signature are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify signature
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'YOUR_RAZORPAY_KEY_SECRET') # Use generic placeholder
        
        logger.info(f"RAZORPAY_KEY_SECRET used for verification: {key_secret}")
        logger.info(f"Order ID for signature (Razorpay Order ID): {order_id}")
        logger.info(f"Payment ID for signature (Razorpay Payment ID): {payment_id}")
        logger.info(f"Signature received from Razorpay: {signature}")

        generated_signature = hmac.new(
            key_secret.encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        logger.info(f"Generated signature on backend: {generated_signature}")

        if generated_signature != signature:
            logger.warning(f"Invalid payment signature for order {order_id}. Generated: {generated_signature}, Received: {signature}")
            return Response({
                'error': 'Invalid payment signature'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update payment record
        try:
            # Ensure request.user is used correctly with the Payment model's user field
            payment = Payment.objects.get(razorpay_order_id=order_id, user=request.user)
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.status = 'completed'
            payment.save()
            
            # Update order status
            order = payment.order
            order.payment_status = 'Paid'
            order.order_status = 'payment_completed'
            order.save()

            # Create and mark invoice as paid
            invoice = InvoiceService.create_invoice_for_order(order)
            payment_data = {
                'razorpay_payment_id': payment_id,
                'razorpay_order_id': order_id,
            }
            InvoiceService.mark_invoice_as_paid(invoice, payment_data)
            
            logger.info(f"Payment verified successfully and invoice generated for order {order.id}")
            
            return Response({
                'success': True,
                'message': 'Payment verified successfully and invoice generated',
                'payment_id': payment.id,
                'order_id': order.id,
                'order_status': order.order_status,
                'invoice_number': invoice.invoice_number
            }, status=status.HTTP_200_OK)
            
        except Payment.DoesNotExist:
            logger.error(f"Payment record not found for order {order_id} and user {request.user.id}")
            return Response({
                'error': 'Payment record not found or does not belong to the authenticated user.'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.exception(f"An unexpected error occurred during payment verification: {str(e)}")
        return Response({
            'error': f'Payment verification failed: {str(e)}',
            'detail': 'An unexpected server error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_status(request, payment_id):
    """Get payment status"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        
        return Response({
            'payment_id': payment.id,
            'order_id': payment.order.id,
            'amount': payment.amount,
            'currency': payment.currency,
            'status': payment.status,
            'payment_method': payment.payment_method,
            'payment_date': payment.payment_date,
            'razorpay_payment_id': payment.razorpay_payment_id,
        }, status=status.HTTP_200_OK)
        
    except Payment.DoesNotExist:
        return Response({
            'error': 'Payment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get payment status: {str(e)}")
        return Response({
            'error': f'Failed to get payment status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
