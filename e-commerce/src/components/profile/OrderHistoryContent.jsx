import React, { useState } from "react"; // Import useState
import { useNavigate } from "react-router-dom";
import { orderAPI } from "../../api/apiService"; // Import orderAPI
import { toast } from 'react-toastify'; // Assuming toast for notifications

function OrderHistoryContent({ orders, onOrderCancelled }) { // Add onOrderCancelled prop
  const navigate = useNavigate(); // Initialize useNavigate

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-700 bg-green-100";
      case "shipped":
        return "text-blue-700 bg-blue-100";
      case "processing":
        return "text-yellow-700 bg-yellow-100";
      case "cancelled": // New status
        return "text-red-700 bg-red-100";
      case "aborted": // New status
        return "text-purple-700 bg-purple-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const isCancellable = (status) => {
    const nonCancellableStatuses = ['delivered', 'cancelled', 'returned', 'aborted'];
    return !nonCancellableStatuses.includes(status.toLowerCase());
  };

  const openCancelModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrderId(null);
    setCancellationReason("");
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }

    setIsCancelling(true);
    try {
      const response = await orderAPI.cancelOrder(selectedOrderId, cancellationReason);
      if (response.success) {
        toast.success("Order cancelled successfully!");
        closeCancelModal();
        if (onOrderCancelled) {
          onOrderCancelled(); // Trigger re-fetch in parent component
        }
      } else {
        toast.error(response.error || "Failed to cancel order.");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("An error occurred while cancelling the order.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
      <div className="space-y-6">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Placed on: {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-left md:text-right mt-2 md:mt-0">
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </p>
                  <span
                    className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusClass(
                      order.order_status
                    )}`}
                  >
                    {order.order_status}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{item.product_name} (x{item.quantity})</span>
                        <span>₹{(item.unit_price_at_order * item.quantity).toFixed(2)}</span>
                      </li>
                    ))
                  ) : (
                    <li>No items found for this order.</li>
                  )}
                </ul>
              </div>
              <div className="mt-4 text-right">
                <div className="flex justify-end space-x-2">
                  {isCancellable(order.order_status) && (
                    <button
                      onClick={() => openCancelModal(order.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/order-confirmation/${order.id}`)}
                    className="px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-md hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">You have no past orders.</p>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order #{selectedOrderId}</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel this order? Please provide a reason.
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 mb-4"
              rows="4"
              placeholder="Reason for cancellation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              disabled={isCancelling}
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isCancelling}
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistoryContent;
