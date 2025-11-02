// DeliveryListTable.jsx
import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Uncomment if you want to use react-router-dom for navigation

const DeliveryListTable = () => {
  // const navigate = useNavigate(); // Initialize useNavigate hook

  const initialDeliveryOrders = [
    {
      orderId: '#ORD101',
      customerName: 'Alice Johnson',
      address: '123 Main St, City',
      status: 'Out for Delivery',
      deliveryTime: '10:30 AM',
    },
    {
      orderId: '#ORD102',
      customerName: 'Bob Williams',
      address: '456 Oak Ave, Town',
      status: 'Pending Pickup',
      deliveryTime: '11:00 AM',
    },
    {
      orderId: '#ORD103',
      customerName: 'Charlie Brown',
      address: '789 Pine Ln, Village',
      status: 'Delivered',
      deliveryTime: '09:45 AM',
    },
    {
      orderId: '#ORD104',
      customerName: 'Diana Prince',
      address: '101 Hero St, Metropolis',
      status: 'Out for Delivery',
      deliveryTime: '12:00 PM',
    },
    {
      orderId: '#ORD105',
      customerName: 'Eve Adams',
      address: '202 Apple Rd, Orchard',
      status: 'Pending Pickup',
      deliveryTime: '01:30 PM',
    },
    {
      orderId: '#ORD106',
      customerName: 'Frank White',
      address: '303 River Dr, Waterside',
      status: 'Delivered',
      deliveryTime: '08:00 AM',
    },
  ];

  const [deliveryOrders, setDeliveryOrders] = useState(initialDeliveryOrders);
  const [filteredOrders, setFilteredOrders] = useState(initialDeliveryOrders);
  const [searchTerm, setSearchTerm] = useState('');

  // Effect to filter orders whenever searchTerm or deliveryOrders change
  useEffect(() => {
    const query = searchTerm.toLowerCase();
    const newFilteredOrders = deliveryOrders.filter((order) => {
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.address.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query)
      );
    });
    setFilteredOrders(newFilteredOrders);
  }, [searchTerm, deliveryOrders]);

  /**
   * Returns Tailwind CSS classes for the status badge based on its value.
   * @param {string} status - The status string (e.g., 'Out for Delivery', 'Pending Pickup', 'Delivered').
   * @returns {string} - Tailwind CSS classes for background and text color.
   */
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Out for Delivery':
        return 'bg-orange-100 text-orange-800';
      case 'Pending Pickup':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Handles the click event for a "View Details" button.
   * @param {object} order - The order object for the clicked row.
   */
  const handleViewDetails = (order) => {
    console.log('Viewing details for Order ID:', order.orderId);
    // In a real app, you would navigate to a detailed order screen:
    // navigate(`/delivery-details/${order.orderId}`);
    alert(`Viewing details for ${order.customerName} (${order.orderId})`);
  };

  /**
   * Handles the click event for the "Mark Delivered" button.
   * @param {string} orderId - The Order ID to mark as delivered.
   */
  const handleMarkAsDelivered = (orderId) => {
    console.log('Marking Order ID:', orderId, 'as Delivered');
    alert(`Marked ${orderId} as Delivered!`);

    // Update the status in the local state
    setDeliveryOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.orderId === orderId ? { ...order, status: 'Delivered' } : order
      )
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-white min-h-screen"> {/* Changed background to a slightly lighter gray */}
      {/* Header */}
      <div className="mb-8"> {/* Increased bottom margin for header */}
        <h1 className="text-4xl font-bold text-gray-800">Delivery List</h1> {/* Larger, bolder title */}
      </div>

      {/* Search Bar */}
      <div className="mb-8"> {/* Increased bottom margin for search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search orders by ID, customer, address, or status..." 
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* Delivery Orders List */}
      <div className="space-y-6"> {/* Increased space between cards */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 text-xl"> {/* Enhanced empty state card */}
            <p className="mb-2">No orders found matching your search.</p>
            <p className="text-sm text-gray-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.orderId} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"> {/* More rounded, larger padding, enhanced shadow and hover effect */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4"> {/* Increased bottom margin */}
                <h2 className="text-xl font-bold text-gray-900 mb-1 sm:mb-0">Order ID: {order.orderId}</h2> {/* Larger Order ID text */}
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusClasses(order.status)}`}> {/* Larger padding for badge */}
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-gray-700 text-base mb-5"> {/* Increased gaps, larger text */}
                <div>
                  <p className="font-semibold text-gray-600">Customer:</p> {/* Bolder labels */}
                  <p className="text-blue-700 hover:underline cursor-pointer">{order.customerName}</p> {/* Darker blue for links */}
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Address:</p>
                  <p>{order.address}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-semibold text-gray-600">Est. Delivery:</p>
                  <p>{order.deliveryTime}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 border-t border-gray-200 pt-5"> {/* Increased padding top, larger space-x */}
                <button
                  onClick={() => handleViewDetails(order)}
                  className="text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50
                             px-5 py-2.5 rounded-lg font-semibold transition duration-200 ease-in-out border border-blue-200 hover:border-blue-400" 
                >
                  View Details
                </button>
                {order.status !== 'Delivered' && (
                  <button
                    onClick={() => handleMarkAsDelivered(order.orderId)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md
                               transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50" 
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryListTable;
