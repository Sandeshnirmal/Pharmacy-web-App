import React from "react";
import { useNavigate } from "react-router-dom";

function OrderHistoryContent({ orders }) {
  const navigate = useNavigate(); // Initialize useNavigate
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-700 bg-green-100";
      case "shipped":
        return "text-blue-700 bg-blue-100";
      case "processing":
        return "text-yellow-700 bg-yellow-100";
      default:
        return "text-gray-700 bg-gray-100";
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
                <button
                  onClick={() => navigate(`/order-confirmation/${order.id}`)}
                  className="text-teal-600 hover:text-teal-800 font-medium text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>You have no past orders.</p>
        )}
      </div>
    </div>
  );
}

export default OrderHistoryContent;
