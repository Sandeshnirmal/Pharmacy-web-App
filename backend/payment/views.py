import razorpay
import hmac
import hashlib
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Payment
from orders.models import Order


# Initialize Razorpay client (you'll need to add these to settings)
razorpay_client = razorpay.Client(auth=(
    getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_YOUR_KEY_ID'),
    getattr(settings, 'RAZORPAY_KEY_SECRET', 'YOUR_KEY_SECRET')
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
        
        return Response({
            'id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'receipt': razorpay_order['receipt'],
            'payment_id': payment.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to create payment order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify Razorpay payment signature"""
    try:
        payment_id = request.data.get('payment_id')
        order_id = request.data.get('order_id')
        signature = request.data.get('signature')
        
        if not all([payment_id, order_id, signature]):
            return Response({
                'error': 'payment_id, order_id, and signature are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify signature
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'YOUR_KEY_SECRET')
        generated_signature = hmac.new(
            key_secret.encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != signature:
            return Response({
                'error': 'Invalid payment signature'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update payment record
        try:
            payment = Payment.objects.get(razorpay_order_id=order_id, user=request.user)
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.status = 'completed'
            payment.save()
            
            # Update order status
            order = payment.order
            order.payment_status = 'paid'
            order.order_status = 'confirmed'
            order.save()
            
            return Response({
                'success': True,
                'message': 'Payment verified successfully',
                'payment_id': payment.id,
                'order_id': order.id
            }, status=status.HTTP_200_OK)
            
        except Payment.DoesNotExist:
            return Response({
                'error': 'Payment record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': f'Payment verification failed: {str(e)}'
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
        return Response({
            'error': f'Failed to get payment status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
