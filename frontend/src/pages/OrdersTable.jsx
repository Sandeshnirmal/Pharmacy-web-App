// OrdersTable.jsx
import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Uncomment if you want to use useNavigate for routing

const OrdersTable = () => {
  // const navigate = useNavigate(); // Initialize useNavigate hook

  // Sample data for orders
  const ordersData = [
    {
      orderId: '#12345',
      customer: 'Sophia Clark',
      orderDate: '2024-01-15',
      totalAmount: '$75.00',
      status: 'Shipped',
      prescriptionStatus: 'Verified',
    },
    {
      orderId: '#12346',
      customer: 'Liam Carter',
      orderDate: '2024-01-16',
      totalAmount: '$120.00',
      status: 'Delivered',
      prescriptionStatus: 'Not Required',
    },
    {
      orderId: '#12347',
      customer: 'Olivia Bennett',
      orderDate: '2024-01-17',
      totalAmount: '$50.00',
      status: 'Pending',
      prescriptionStatus: 'Pending Verification',
    },
    {
      orderId: '#12348',
      customer: 'Noah Foster',
      orderDate: '2024-01-18',
      totalAmount: '$90.00',
      status: 'Shipped',
      prescriptionStatus: 'Verified',
    },
    {
      orderId: '#12349',
      customer: 'Ava Harper',
      orderDate: '2024-01-19',
      totalAmount: '$60.00',
      status: 'Delivered',
      prescriptionStatus: 'Not Required',
    },
    {
      orderId: '#12350',
      customer: 'Ethan Hayes',
      orderDate: '2024-01-20',
      totalAmount: '$100.00',
      status: 'Pending',
      prescriptionStatus: 'Pending Verification',
    },
    {
      orderId: '#12351',
      customer: 'Isabella Reed',
      orderDate: '2024-01-21',
      totalAmount: '$85.00',
      status: 'Shipped',
      prescriptionStatus: 'Verified',
    },
    {
      orderId: '#12352',
      customer: 'Jackson Cole',
      orderDate: '2024-01-22',
      totalAmount: '$110.00',
      status: 'Delivered',
      prescriptionStatus: 'Not Required',
    },
    {
      orderId: '#12353',
      customer: 'Mia Morgan',
      orderDate: '2024-01-23',
      totalAmount: '$45.00',
      status: 'Pending',
      prescriptionStatus: 'Pending Verification',
    },
    {
      orderId: '#12354',
      customer: 'Aiden Parker',
      orderDate: '2024-01-24',
      totalAmount: '$70.00',
      status: 'Shipped',
      prescriptionStatus: 'Verified',
    },
  ];

  /**
   * Returns Tailwind CSS classes for the status badge based on its value.
   * @param {string} status - The status string (e.g., 'Pending', 'Shipped', 'Delivered').
   * @returns {string} - Tailwind CSS classes for background and text color.
   */
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Returns Tailwind CSS classes for the prescription status badge.
   * @param {string} status - The prescription status string (e.g., 'Verified', 'Pending Verification', 'Not Required').
   * @returns {string} - Tailwind CSS classes for background and text color.
   */
  const getPrescriptionStatusClasses = (status) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Pending Verification':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Required':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Handles the click event for the "New Order" button.
   */
  const handleNewOrder = () => {
    console.log('New Order button clicked!');
    // In a real app, this would navigate to an order creation form.
  };

  /**
   * Handles the click event for a "View Details" button in a table row.
   * @param {string} orderId - The Order ID for the clicked row.
   */
  const handleViewDetails = (orderId) => {
    console.log('Viewing details for Order ID:', orderId);
    // When using <Link>, the actual navigation is handled by the Link component's `to` prop.
    // If using useNavigate: navigate(`/order-details/${orderId}`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header with Title and New Order Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Orders</h1>
        <button
          onClick={handleNewOrder}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          New Order
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search orders"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['Status', 'Date Range', 'Customer', 'Prescription Status', 'More Filters'].map((filter, index) => (
          <div key={index} className="relative inline-block text-left">
            <button
              type="button"
              className="inline-flex justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              id={`menu-button-${index}`}
              aria-expanded="true"
              aria-haspopup="true"
            >
              {filter}
              <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {/* Dropdown content for filters would go here, hidden by default */}
            {/* <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="menu-button-0" tabIndex="-1">
              <div className="py-1" role="none">
                <a href="#" className="text-gray-700 block px-4 py-2 text-sm" role="menuitem" tabIndex="-1" id="menu-item-0">Option 1</a>
              </div>
            </div> */}
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersData.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{order.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrescriptionStatusClasses(order.prescriptionStatus)}`}>
                      {order.prescriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    {/* Using a regular button for now, can be wrapped in <Link> or use navigate() later */}
                    <button
                      onClick={() => handleViewDetails(order.orderId)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                 p-1 rounded-md transition duration-150 ease-in-out"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-4">
        &copy; {new Date().getFullYear()} MediCo
      </footer>
    </div>
  );
};

export default OrdersTable;
