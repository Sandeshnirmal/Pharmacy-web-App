# tests.py (can be placed in either the 'orders' or 'payment' app)

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.conf import settings # Import settings
from orders.models import Order, OrderItem, OrderStatusHistory
from product.models import Product, Category, GenericName # Import GenericName model
from payment.models import Payment

# Use the AUTH_USER_MODEL setting to get the correct User model
User = settings.AUTH_USER_MODEL # This will dynamically select the correct user model from your settings

class OrderAndPaymentTests(APITestCase):
    """
    Test suite for the Order and Payment APIs.
    """
    def setUp(self):
        """
        Set up a user and create a sample product for testing.
        """
        # Get the User model dynamically
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Removed 'username' and kept only 'email' and 'password' as per the custom user model's requirements
        self.user = User.objects.create_user(
            email='vjsanthakumar@gmail.com',
            password='sss111'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create a category and product for testing
        self.category = Category.objects.create(name='Test Category')
        # Create a GenericName instance since it's a required field on Product
        self.generic_name = GenericName.objects.create(name='Test Generic')

        self.product = Product.objects.create(
            name='Test Product', 
            description='A product for testing.', 
            price=10.00,
            mrp=12.50,
            category=self.category,
            generic_name=self.generic_name # Pass the generic_name instance
        )
        
    def test_create_order(self):
        """
        Ensure we can create a new order.
        """
        url = reverse('order-list')  # Use the default DRF router URL
        data = {
            'order_items': [
                {
                    'product': self.product.pk,
                    'quantity': 2,
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
        
        order = Order.objects.get(pk=response.data['id'])
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.total_amount, 20.00)

    def test_create_payment(self):
        """
        Ensure we can create a payment record for an existing order.
        """
        # First, create an order to attach the payment to
        order = Order.objects.create(
            user=self.user, 
            total_amount=50.00
        )
        
        url = reverse('create_payment')  # Use the custom URL from payment.urls
        data = {
            'order_id': order.id,
            'payment_provider': 'Stripe',
            'amount': 50.00 # Changed amount to a number
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Payment.objects.count(), 1)
        payment = Payment.objects.first()
        self.assertEqual(payment.order, order)
        self.assertEqual(payment.status, 'Pending')

    def test_verify_payment(self):
        """
        Ensure we can verify a payment and update the order status.
        """
        # First, create an order and a pending payment
        order = Order.objects.create(
            user=self.user, 
            total_amount=50.00
        )
        payment = Payment.objects.create(
            order=order,
            user=self.user, # Explicitly added user
            amount=50.00,
            status='Pending'
        )
        
        url = reverse('verify_payment', args=[payment.id])
        data = {
            'provider_payment_id': 'ch_1JqZz1I9pZz1I9pZz1I9pZz1'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        payment.refresh_from_db()
        order.refresh_from_db()
        
        self.assertEqual(payment.status, 'Completed')
        self.assertEqual(order.payment_status, 'Paid')
        self.assertEqual(order.status, 'Pending')
        self.assertEqual(
            payment.provider_payment_id, 
            'ch_1JqZz1I9pZz1I9pZz1I9pZz1'
        )
