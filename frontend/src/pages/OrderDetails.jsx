import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const OrderDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');

  // State management
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderRes, itemsRes] = await Promise.all([
        axiosInstance.get(`orders/orders/${orderId}/`),
        axiosInstance.get(`orders/order-items/?order=${orderId}`)
      ]);

      setOrder(orderRes.data);
      setOrderItems(itemsRes.data.results || itemsRes.data);
    } catch (err) {
      setError('Failed to fetch order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await axiosInstance.patch(`orders/orders/${orderId}/`, {
        order_status: newStatus
      });
      await fetchOrderDetails(); // Refresh data
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'Processing': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
      'Shipped': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
      'Delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`px-3 py-1 text-sm rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error || 'Order not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/Orders')}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-semibold text-gray-800">Order #{order.id}</h1>
          <p className="text-sm text-gray-600">
            Placed on {new Date(order.order_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {getStatusBadge(order.order_status)}
          {order.order_status === 'Pending' && (
            <button
              onClick={() => handleStatusUpdate('Processing')}
              disabled={statusUpdating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition duration-150 disabled:opacity-50"
            >
              {statusUpdating ? 'Updating...' : 'Mark Processing'}
            </button>
          )}
          {order.order_status === 'Processing' && (
            <button
              onClick={() => handleStatusUpdate('Shipped')}
              disabled={statusUpdating}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md font-medium transition duration-150 disabled:opacity-50"
            >
              {statusUpdating ? 'Updating...' : 'Mark Shipped'}
            </button>
          )}
          {order.order_status === 'Shipped' && (
            <button
              onClick={() => handleStatusUpdate('Delivered')}
              disabled={statusUpdating}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition duration-150 disabled:opacity-50"
            >
              {statusUpdating ? 'Updating...' : 'Mark Delivered'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.product?.name}</h3>
                      <p className="text-sm text-gray-600">{item.product?.generic_name?.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.product?.strength} - {item.product?.form}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                    <p className="text-sm text-gray-600">₹{item.unit_price} each</p>
                    <p className="font-semibold text-gray-900">₹{item.total_price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-gray-900">₹{order.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Prescription Information */}
          {order.is_prescription_order && order.prescription && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Prescription Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Prescription ID</p>
                  <p className="text-gray-900">#{order.prescription.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Verification Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.prescription.verification_status === 'Verified' ? 'bg-green-100 text-green-800' :
                    order.prescription.verification_status === 'Pending_Review' ? 'bg-yellow-100 text-yellow-800' :
                    order.prescription.verification_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.prescription.verification_status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Upload Date</p>
                  <p className="text-gray-900">
                    {new Date(order.prescription.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pharmacist Notes</p>
                  <p className="text-gray-900">{order.prescription.pharmacist_notes || 'No notes'}</p>
                </div>
              </div>
              {order.prescription.verification_status !== 'Verified' && (
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/Prescription_Review/${order.prescription.id}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition duration-150"
                  >
                    Review Prescription
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-gray-900">
                  {order.user?.first_name} {order.user?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{order.user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-900">{order.user?.phone_number || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                <p className="text-gray-900">{order.delivery_address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Delivery Method</p>
                <p className="text-gray-900">{order.delivery_method || 'Standard Delivery'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expected Delivery</p>
                <p className="text-gray-900">
                  {order.expected_delivery_date
                    ? new Date(order.expected_delivery_date).toLocaleDateString()
                    : 'To be determined'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Placed</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.order_date).toLocaleString()}
                  </p>
                </div>
              </div>

              {order.order_status !== 'Pending' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Processing Started</p>
                    <p className="text-xs text-gray-500">Status updated</p>
                  </div>
                </div>
              )}

              {['Shipped', 'Delivered'].includes(order.order_status) && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                    <p className="text-xs text-gray-500">In transit</p>
                  </div>
                </div>
              )}

              {order.order_status === 'Delivered' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Delivered</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
