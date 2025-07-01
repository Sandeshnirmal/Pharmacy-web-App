// OrderDetails.jsx
import React from 'react';
// import { useParams } from 'react-router-dom'; // Uncomment if using react-router-dom to get orderId

const OrderDetails = () => {
  // const { orderId } = useParams(); // Get orderId from URL parameters if using routing
  const orderId = '#12345'; // Hardcoded for standalone display

  const orderDate = 'July 15, 2024, 10:30 AM';

  const orderItems = [
    { product: 'Amoxicillin 500mg', quantity: '30 capsules', price: '$15.00', total: '$45.00' },
    { product: 'Ibuprofen 200mg', quantity: '60 tablets', price: '$8.00', total: '$48.00' },
  ];

  const customerInfo = {
    name: 'Sophia Clark',
    email: 'sophia.clark@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, USA',
  };

  const orderHistory = [
    { status: 'Order Placed', date: 'July 15, 2024, 10:30 AM', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }, // Clock icon
    { status: 'Prescription Verified', date: 'July 15, 2024, 11:00 AM', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }, // Checkmark icon
    { status: 'Order Shipped', date: 'July 15, 2024, 12:00 PM', icon: 'M8 17H5a2 2 0 01-2-2V9a2 2 0 012-2h4l2 4h4l2-4h4a2 2 0 012 2v6a2 2 0 01-2 2h-3m-6-4l-2 2-4-4' }, // Truck icon (simplified for SVG)
  ];

  const paymentDetails = {
    paymentMethod: 'Medical Credit',
    amountPaid: '$93.00',
    transactionId: 'TXN1234567890',
  };

  // Handlers for Order Actions
  const handleLinkPrescription = () => console.log('Link Prescription clicked');
  const handleProcessRefund = () => console.log('Process Refund clicked');
  const handleCancelOrder = () => console.log('Cancel Order clicked');
  const handleChangeOrderStatus = () => console.log('Change Order Status clicked');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Breadcrumbs (conceptual, adapt if using actual routing) */}
      <div className="text-sm text-gray-500 mb-4">
        Orders / <span className="font-semibold text-gray-700">Order {orderId}</span>
      </div>

      {/* Main Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Order {orderId}</h1>
          <p className="text-sm text-gray-600">Placed on {orderDate}</p>
        </div>
        {/* Placeholder for actions like "Print" or "Edit" if needed */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Order Items, Customer Information, Order History) - Spans 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-500">Name</p>
                <p className="text-gray-900">{customerInfo.name}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Email</p>
                <p className="text-blue-600 hover:underline">{customerInfo.email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Phone</p>
                <p className="text-gray-900">{customerInfo.phone}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{customerInfo.address}</p>
              </div>
            </div>
          </div>

          {/* Order History Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Order History</h2>
            <ol className="relative border-l border-gray-200 ml-4">
              {orderHistory.map((history, index) => (
                <li key={index} className="mb-6 ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full ring-8 ring-white">
                    <svg className="w-3 h-3 text-blue-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d={history.icon} clipRule="evenodd"></path>
                    </svg>
                  </span>
                  <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">{history.status}</h3>
                  <time className="block mb-2 text-sm font-normal leading-none text-gray-500">{history.date}</time>
                  {/* You can add a description here if needed */}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right Column (Order Actions, Payment Details, Internal Notes) - Spans 1/3 */}
        <div className="lg:col-span-1 space-y-8">
          {/* Order Actions Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Order Actions</h2>
            <div className="mb-4">
              <label htmlFor="order-status" className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
              <select
                id="order-status"
                name="order-status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                defaultValue="Pending" // Example default value
                onChange={handleChangeOrderStatus}
              >
                <option>Pending</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
                <option>Refunded</option>
              </select>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleLinkPrescription}
                className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium py-2 px-4 rounded-md shadow-sm
                           transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Link Prescription
              </button>
              <button
                onClick={handleProcessRefund}
                className="w-full bg-red-100 text-red-700 hover:bg-red-200 font-medium py-2 px-4 rounded-md shadow-sm
                           transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Process Refund
              </button>
              <button
                onClick={handleCancelOrder}
                className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-2 px-4 rounded-md shadow-sm
                           transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Cancel Order
              </button>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment Details</h2>
            <div className="grid grid-cols-1 gap-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Payment Method</span>
                <span className="text-gray-900">{paymentDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Amount Paid</span>
                <span className="text-gray-900 font-bold">{paymentDetails.amountPaid}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                <span className="font-medium text-gray-500">Transaction ID</span>
                <span className="text-gray-900">{paymentDetails.transactionId}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Internal Notes</h2>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         min-h-[120px] text-sm text-gray-700"
              placeholder="Add internal notes about this order..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* Footer (optional, inherited from main layout generally) */}
      <footer className="text-center text-gray-500 text-sm py-8">
        &copy; {new Date().getFullYear()} MediCo
      </footer>
    </div>
  );
};

export default OrderDetails;
