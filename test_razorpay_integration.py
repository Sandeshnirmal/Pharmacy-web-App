import requests
import json
import time
import hashlib
import hmac
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000/api"
PAYMENT_BASE = "http://localhost:8000/payment"
TEST_USER_CREDENTIALS = {
    "email": "customer@pharmacy.com",
    "password": "testpass123"
}

class RazorpayIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.order_id = None
        self.payment_id = None
        
    def print_success(self, message):
        print(f"✅ {message}")
        
    def print_error(self, message):
        print(f"❌ {message}")
        
    def print_info(self, message):
        print(f"ℹ️  {message}")
        
    def authenticate_user(self):
        """Authenticate user and get token"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login/",
                json=TEST_USER_CREDENTIALS,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get('token') or data.get('access')
                self.session.headers.update({'Authorization': f'Token {self.user_token}'})
                self.print_success(f"User authenticated successfully: {data.get('user', {}).get('email', 'Unknown')}")
                return True
            else:
                self.print_error(f"Authentication failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Authentication error: {e}")
            return False
    
    def test_payment_order_creation(self):
        """Test creating a payment order"""
        try:
            # First, create an order
            order_data = {
                "order_type": "prescription",
                "total_amount": 1000,  # ₹10.00
                "items": [
                    {
                        "product_id": 1,
                        "quantity": 2,
                        "price": 500,  # ₹5.00
                        "mrp": 600,    # ₹6.00
                        "name": "Test Medicine",
                        "manufacturer": "Test Pharma"
                    }
                ],
                "delivery_address": {
                    "name": "Test Customer",
                    "phone": "+91-9876543210",
                    "address_line_1": "123 Test Street",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001"
                },
                "payment_data": {
                    "method": "RAZORPAY",
                    "payment_id": f"pay_test_{int(time.time())}",
                    "transaction_id": f"txn_{int(time.time())}",
                    "amount": 1000,
                    "currency": "INR"
                },
                "notes": "Test order for payment"
            }
            
            order_response = self.session.post(
                f"{API_BASE}/order/enhanced/create-paid-order/",
                json=order_data,
                timeout=15
            )
            
            if order_response.status_code != 201:
                self.print_error(f"Order creation failed: {order_response.status_code} - {order_response.text}")
                return False
            
            order_data_response = order_response.json()
            self.print_info(f"Order response: {order_data_response}")
            order_id = order_data_response.get('order_id')
            self.print_info(f"Order created: {order_id}")
            
            if not order_id:
                self.print_error("No order ID returned from order creation")
                return False
            
            # Now create payment for this order
            payment_data = {
                "amount": 1000,
                "currency": "INR",
                "order_id": order_id
            }
            
            response = self.session.post(
                f"{PAYMENT_BASE}/create/",
                json=payment_data,
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                self.order_id = data.get('id')
                self.print_success(f"Payment order created: {self.order_id}")
                self.print_info(f"Order amount: ₹{data.get('amount', 0)/100}")
                self.print_info(f"Currency: {data.get('currency')}")
                return True
            else:
                self.print_error(f"Payment order creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Payment order creation error: {e}")
            return False
    
    def test_payment_verification(self):
        """Test payment verification with mock data"""
        try:
            # NOTE: Replace 'YOUR_RAZORPAY_KEY_SECRET' with the actual key from your settings.py
            RAZORPAY_SECRET = "Owlg61rwtT7V3RQKoYGKhsUC"
            
            if not self.order_id:
                self.print_error("Order ID is not available for verification.")
                return False

            mock_payment_id = f"pay_test_{int(time.time())}"
            signature_string = f"{self.order_id}|{mock_payment_id}"
            
            generated_signature = hmac.new(
                RAZORPAY_SECRET.encode('utf-8'),
                signature_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            mock_payment_data = {
                "payment_id": mock_payment_id,
                "order_id": self.order_id,
                "signature": generated_signature
            }
            
            response = self.session.post(
                f"{PAYMENT_BASE}/verify/",
                json=mock_payment_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                self.payment_id = data.get('payment_id')
                
                if self.payment_id is None:
                    self.print_error("Payment ID not returned in the verification response.")
                    return False

                self.print_success(f"Payment verification successful: {self.payment_id}")
                self.print_info(f"Order status: {data.get('order_status')}")
                return True
            else:
                self.print_error(f"Payment verification failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Payment verification error: {e}")
            return False
    
    def test_payment_status(self):
        """Test getting payment status after verification"""
        try:
            if not self.payment_id:
                self.print_error("Payment ID is not available for status check.")
                return False
                
            response = self.session.get(
                f"{PAYMENT_BASE}/status/{self.payment_id}/",
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                self.print_success(f"Payment status check successful: {data.get('status')}")
                return True
            else:
                self.print_error(f"Payment status check failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Payment status check error: {e}")
            return False

    def test_enhanced_order_flow(self):
        """Test the complete enhanced order flow (payment first)"""
        try:
            # Step 1: Create a paid order
            order_data = {
                "order_type": "prescription",
                "total_amount": 1500,  # ₹15.00
                "items": [
                    {
                        "product_id": 1,
                        "quantity": 3,
                        "price": 500,
                        "mrp": 600,
                        "name": "Test Medicine",
                        "manufacturer": "Test Pharma"
                    }
                ],
                "delivery_address": {
                    "name": "Test Customer",
                    "phone": "+91-9876543210",
                    "address_line_1": "123 Test Street",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001"
                },
                "payment_method": "razorpay",
                "notes": "Test order for payment-first flow",
                # ADD THE 'payment_data' FIELD HERE
                "payment_data": {
                    "method": "RAZORPAY",
                    "payment_id": f"pay_test_{int(time.time())}",
                    "transaction_id": f"txn_{int(time.time())}",
                    "amount": 1500,
                    "currency": "INR"
                }
            }
            
            response = self.session.post(
                f"{API_BASE}/order/enhanced/create-paid-order/",
                json=order_data,
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                enhanced_order_id = data.get('id')
                self.print_success(f"Enhanced order created: {enhanced_order_id}")
                self.print_info(f"Order status: {data.get('order_status')}")
                self.print_info(f"Payment status: {data.get('payment_status')}")
                return True
            else:
                self.print_error(f"Enhanced order creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Enhanced order flow error: {e}")
            return False
        
    def test_backend_health(self):
        """Test backend health and API availability"""
        try:
            response = self.session.get(f"{API_BASE}/users/", timeout=10)
            if response.status_code in [200, 401, 403]:
                self.print_success("Backend API is healthy")
                return True
            else:
                self.print_error(f"Backend health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Backend health check error: {e}")
            return False     
    
    def run_complete_test(self):
        """Run the complete test suite"""
        print("🚀 Starting Razorpay Integration Test Suite")
        print("=" * 50)
        
        print("\n1. Testing Backend Health...")
        if not self.test_backend_health():
            self.print_error("Backend is not available. Please start the Django server.")
            return False
        
        print("\n2. Testing User Authentication...")
        if not self.authenticate_user():
            self.print_error("Authentication failed. Please check user credentials.")
            return False
        
        print("\n3. Testing Payment Order Creation...")
        if not self.test_payment_order_creation():
            self.print_error("Payment order creation failed.")
            return False
        
        print("\n4. Testing Payment Verification...")
        if not self.test_payment_verification():
            self.print_error("Payment verification failed.")
            return False
        
        print("\n5. Testing Payment Status Check...")
        if not self.test_payment_status():
            self.print_error("Payment status check failed.")
            return False
        
        print("\n6. Testing Enhanced Order Flow...")
        if not self.test_enhanced_order_flow():
            self.print_error("Enhanced order flow failed.")
            return False
        
        print("\n" + "=" * 50)
        self.print_success("🎉 All Razorpay integration tests completed successfully!")
        return True

# Main execution block
def main():
    """Main test execution"""
    tester = RazorpayIntegrationTester()
    success = tester.run_complete_test()
    
    if success:
        print("\n📋 Test Summary:")
        print("✅ Backend API is healthy")
        print("✅ User authentication working")
        print("✅ Payment order creation working")
        print("✅ Payment verification working")
        print("✅ Payment status checking working")
        print("✅ Enhanced order flow working")
        print("\n🎯 Razorpay integration is properly configured and working!")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        print("💡 Make sure:")
        print("   - Django backend is running on localhost:8000")
        print("   - User credentials are correct")
        print("   - Payment endpoints are properly configured")
        print("   - Razorpay keys are set in settings")

if __name__ == "__main__":
    main()