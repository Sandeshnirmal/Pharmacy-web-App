import razorpay
import hmac
import hashlib
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class RazorpayService:
    """Service for handling Razorpay payments"""
    
    def __init__(self):
        self.client = razorpay.Client(auth=(
            getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_u32HLv2OyCBfAN'),
            getattr(settings, 'RAZORPAY_KEY_SECRET', 'Owlg61rwtT7V3RQKoYGKhsUC')
        ))
        self.key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_u32HLv2OyCBfAN')
        self.key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'Owlg61rwtT7V3RQKoYGKhsUC')
    
    def create_order(self, amount: Decimal, currency: str = 'INR', receipt: str = None) -> dict:
        """
        Create Razorpay order
        
        Args:
            amount: Amount in rupees (will be converted to paise)
            currency: Currency code (default: INR)
            receipt: Receipt identifier
            
        Returns:
            Dictionary with order details
        """
        try:
            # Convert amount to paise (multiply by 100)
            amount_in_paise = int(amount * 100)
            
            order_data = {
                'amount': amount_in_paise,
                'currency': currency,
                'receipt': receipt or f'order_{timezone.now().strftime("%Y%m%d%H%M%S")}',
                'payment_capture': 1  # Auto capture payment
            }
            
            razorpay_order = self.client.order.create(order_data)
            
            return {
                'success': True,
                'order_id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'receipt': razorpay_order['receipt'],
                'status': razorpay_order['status'],
                'key_id': self.key_id,
                'amount_in_rupees': float(amount)
            }
            
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Verify Razorpay payment signature
        
        Args:
            razorpay_order_id: Razorpay order ID
            razorpay_payment_id: Razorpay payment ID
            razorpay_signature: Razorpay signature
            
        Returns:
            Boolean indicating if signature is valid
        """
        try:
            # Create the signature string
            signature_string = f"{razorpay_order_id}|{razorpay_payment_id}"
            
            # Generate expected signature
            expected_signature = hmac.new(
                self.key_secret.encode('utf-8'),
                signature_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(expected_signature, razorpay_signature)
            
        except Exception as e:
            logger.error(f"Error verifying payment signature: {str(e)}")
            return False
    
    def get_payment_details(self, payment_id: str) -> dict:
        """
        Get payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
            
        Returns:
            Dictionary with payment details
        """
        try:
            payment = self.client.payment.fetch(payment_id)
            
            return {
                'success': True,
                'payment_id': payment['id'],
                'order_id': payment['order_id'],
                'amount': payment['amount'],
                'currency': payment['currency'],
                'status': payment['status'],
                'method': payment['method'],
                'captured': payment['captured'],
                'created_at': payment['created_at'],
                'email': payment.get('email'),
                'contact': payment.get('contact'),
                'amount_in_rupees': payment['amount'] / 100
            }
            
        except Exception as e:
            logger.error(f"Error fetching payment details: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def capture_payment(self, payment_id: str, amount: Decimal) -> dict:
        """
        Capture payment (if not auto-captured)
        
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to capture in rupees
            
        Returns:
            Dictionary with capture result
        """
        try:
            amount_in_paise = int(amount * 100)
            
            captured_payment = self.client.payment.capture(payment_id, amount_in_paise)
            
            return {
                'success': True,
                'payment_id': captured_payment['id'],
                'amount': captured_payment['amount'],
                'status': captured_payment['status'],
                'captured': captured_payment['captured']
            }
            
        except Exception as e:
            logger.error(f"Error capturing payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def refund_payment(self, payment_id: str, amount: Decimal = None, reason: str = None) -> dict:
        """
        Refund payment
        
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to refund in rupees (None for full refund)
            reason: Reason for refund
            
        Returns:
            Dictionary with refund result
        """
        try:
            refund_data = {}
            
            if amount is not None:
                refund_data['amount'] = int(amount * 100)
            
            if reason:
                refund_data['notes'] = {'reason': reason}
            
            refund = self.client.payment.refund(payment_id, refund_data)
            
            return {
                'success': True,
                'refund_id': refund['id'],
                'payment_id': refund['payment_id'],
                'amount': refund['amount'],
                'status': refund['status'],
                'amount_in_rupees': refund['amount'] / 100
            }
            
        except Exception as e:
            logger.error(f"Error refunding payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def test_connection(self) -> dict:
        """
        Test Razorpay connection

        Returns:
            Dictionary with connection test result
        """
        try:
            # For test mode, just verify credentials format
            if self.key_id.startswith('rzp_test_') and len(self.key_secret) > 10:
                return {
                    'success': True,
                    'message': 'Razorpay test credentials configured',
                    'key_id': self.key_id,
                    'mode': 'test'
                }
            elif self.key_id.startswith('rzp_live_') and len(self.key_secret) > 10:
                return {
                    'success': True,
                    'message': 'Razorpay live credentials configured',
                    'key_id': self.key_id,
                    'mode': 'live'
                }
            else:
                return {
                    'success': False,
                    'error': 'Invalid Razorpay credentials format'
                }

        except Exception as e:
            logger.error(f"Error testing Razorpay connection: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Global instance
razorpay_service = RazorpayService()
