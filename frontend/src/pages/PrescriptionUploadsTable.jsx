// PrescriptionReview.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate for routing

// Component for the Pending Prescriptions table
const PendingPrescriptionsTable = () => {
  // const navigate = useNavigate(); // Initialize useNavigate hook - commented out for Link usage

  const pendingData = [
    { orderId: '#12345', userName: 'Sophia Clark', uploadDate: '2024-01-15', status: 'Pending' },
    { orderId: '#12346', userName: 'Ethan Miller', uploadDate: '2024-01-16', status: 'Pending' },
    { orderId: '#12347', userName: 'Olivia Davis', uploadDate: '2024-01-17', status: 'Pending' },
    { orderId: '#12348', userName: 'Liam Wilson', uploadDate: '2024-01-18', status: 'Pending' },
    { orderId: '#12349', userName: 'Ava Martinez', uploadDate: '2024-01-19', status: 'Pending' },
    { orderId: '#12350', userName: 'Noah Anderson', uploadDate: '2024-01-20', status: 'Pending' },
    { orderId: '#12351', userName: 'Isabella Thomas', uploadDate: '2024-01-21', status: 'Pending' },
    { orderId: '#12352', userName: 'Jackson Jackson', uploadDate: '2024-01-22', status: 'Pending' },
    { orderId: '#12353', userName: 'Mia White', uploadDate: '2024-01-23', status: 'Pending' },
    { orderId: '#12354', userName: 'Aiden Harris', uploadDate: '2024-01-24', status: 'Pending' },
  ];

  const handleViewPendingDetails = (orderId) => {
    console.log('Viewing details for pending order ID:', orderId);
    // When using <Link>, the actual navigation is handled by the Link component's `to` prop.
    // This function is now just for logging or other side effects if needed.
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pending Prescriptions</h2>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID or User Name"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingData.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer">{order.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.uploadDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    {/* Using Link for navigation */}
                    <Link
                      to="/Prescription_Review"//{`/prescription-details/${order.orderId}`} // Link to the details page
                      className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                 p-1 rounded-md transition duration-150 ease-in-out"
                      //onClick={() => handleViewApprovedDetails(order.orderId)} // Optional: for logging or other side effects
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Component for the Approved Prescriptions table
const ApprovedPrescriptionsTable = () => {
  // const navigate = useNavigate(); // Initialize useNavigate hook - commented out for Link usage

  const approvedData = [
    { orderId: '#12301', userName: 'John Doe', uploadDate: '2024-01-01', status: 'Approved', approvalDate: '2024-01-02' },
    { orderId: '#12302', userName: 'Jane Smith', uploadDate: '2024-01-03', status: 'Approved', approvalDate: '2024-01-04' },
    { orderId: '#12303', userName: 'Peter Jones', uploadDate: '2024-01-05', status: 'Approved', approvalDate: '2024-01-06' },
  ];

  const handleViewApprovedDetails = (orderId) => {
    console.log('Viewing details for approved order ID:', orderId);
    // When using <Link>, the actual navigation is handled by the Link component's `to` prop.
    // This function is now just for logging or other side effects if needed.
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Approved Prescriptions</h2>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID or User Name"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedData.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer">{order.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.uploadDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.approvalDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    {/* Using Link for navigation */}
                    <Link
                      to="/Prescription_Review"//{`/prescription-details/${order.orderId}`} // Link to the details page
                      className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                 p-1 rounded-md transition duration-150 ease-in-out"
                      //onClick={() => handleViewApprovedDetails(order.orderId)} // Optional: for logging or other side effects
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const PrescriptionReview = () => {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState('newRequest'); // Default to 'New Request'

  // Sample data for AI Extracted Information table (used in Prescription Review view)
  const extractedMedicines = [
    {
      name: 'Amoxicillin',
      dosage: '500mg',
      quantity: 30,
      instructions: 'Take one capsule three times a day',
      aiConfidence: 85,
    },
    {
      name: 'Ibuprofen',
      dosage: '200mg',
      quantity: 60,
      instructions: 'Take one tablet every 4-6 hours as needed',
      aiConfidence: 92,
    },
    {
      name: 'Acetaminophen',
      dosage: '500mg',
      quantity: 30,
      instructions: 'Take one tablet every 6 hours as needed',
      aiConfidence: 78,
    },
  ];

  // Sample data for Product Mapping (used in Prescription Review view)
  const productMappings = [
    { product: 'Amoxicillin', details: '500mg, 30 capsules' },
    { product: 'Ibuprofen', details: '200mg, 60 tablets' },
    { product: 'Acetaminophen', details: '500mg, 30 tablets' },
  ];

  // Placeholder for prescription image (replace with actual image URL)
  const prescriptionImageUrl = 'https://placehold.co/400x300/e0e7ff/3f51b5?text=Prescription+Image';

  // Handlers for buttons (used in Prescription Review view)
  const handleAddMissingItem = () => console.log('Add Missing Item clicked');
  const handleSuggestSubstitute = () => console.log('Suggest Substitute clicked');
  const handleMapProduct = (productName) => console.log(`Map product: ${productName}`);
  const handleReject = () => console.log('Reject clicked');
  const handleClarify = () => console.log('Clarify clicked');
  const handleVerify = () => console.log('Verify clicked');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header and Search (always visible) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Prescription Management</h1>
          <p className="text-sm text-gray-600">Overview of prescription requests and approvals.</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for products"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('newRequest')}
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'newRequest' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
        >
          New Request
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`py-3 px-6 text-lg font-medium ${activeTab === 'approved' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Approved
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'newRequest' && (
        <div className="space-y-6">
          <PendingPrescriptionsTable />
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="space-y-6">
          <ApprovedPrescriptionsTable />
        </div>
      )}
    </div>
  );
};

export default PrescriptionReview;
