import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';

const OrderConfirmationScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrderDetails();
  }, [orderId, isAuthenticated, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/order/orders/${orderId}/`);
      if (response.status >= 200 && response.status < 300) { // Corrected success check
        setOrder(response.data);
        console.log(response.data)
      } else {
        // Use response.data.detail or a generic message if response.data.error is not consistently present
        setError(response.data?.detail || response.data?.error || 'Failed to fetch order details.');
        toast.error(response.data?.detail || response.data?.error || 'Failed to fetch order details.');
      }
    } catch (err) {
      setError('Error fetching order details: ' + err.message);
      toast.error('Error fetching order details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-gray-700">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 text-center text-gray-600">
        <p>No order details found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-2xl mx-auto">
        <svg
          className="w-20 h-20 text-green-500 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 text-lg mb-6">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        <div className="text-left border-t border-b border-gray-200 py-6 mb-6">
          <p className="text-gray-700 text-xl font-semibold mb-2">Order Details</p>
          <p className="text-gray-600">
            <span className="font-medium">Order ID:</span> {order.order_number || order.id}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Total Amount:</span> ₹{(!isNaN(parseFloat(order.total_amount)) ? parseFloat(order.total_amount) : 0).toFixed(2)}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Payment Status:</span> {order.payment_status}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Order Status:</span> {order.order_status}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Delivery Address:</span>{' '}
            {order.delivery_address?.address_line_1}, {order.delivery_address?.address_line_2 && `${order.delivery_address.address_line_2}, `}
            {order.delivery_address?.city}, {order.delivery_address?.state} - {order.delivery_address?.pincode}
          </p>
        </div>

        {/* Ordered Items */}
        {order.items && order.items.length > 0 && (
          <div className="text-left border-b border-gray-200 py-6 mb-6">
            <p className="text-gray-700 text-xl font-semibold mb-4">Ordered Items</p>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between items-center text-gray-700">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{((!isNaN(parseFloat(item.unit_price_at_order)) ? parseFloat(item.unit_price_at_order) : 0) * (!isNaN(parseFloat(item.quantity)) ? parseFloat(item.quantity) : 0)).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => navigate(`/invoice/${order.id}`)}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 mr-4"
        >
          View Invoice
        </button>
        <button
          onClick={() => navigate('/profile/order-history')}
          className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300 mr-4"
        >
          Back to Order History
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-40 py-3 border mt-5 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition duration-300"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmationScreen;
