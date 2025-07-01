// DeliveryListTable.jsx
import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Uncomment if you want to use react-router-dom for navigation
import { Plus as PlusIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-react'; // Import icons

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-100 min-h-screen"> {/* Changed background to a slightly lighter gray */}
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


// Medicines List Page Component
const MedicinesListPage = ({ onAddMedicineClick }) => {
  const medicines = [
    { id: 1, image: 'https://placehold.co/40x40/f0f0f0/333?text=A', name: 'Doxofur', brand: 'MedCorp', type: 'Pain Relif', strength: '25mg', price: '25.99', stock: 50 },
    { id: 2, image: 'https://placehold.co/40x40/f0f0f0/333?text=B', name: 'Acetaminophen', brand: 'MedCorp', type: 'Pain Relif', strength: '500mg', price: '44.80', stock: 220 },
    { id: 3, image: 'https://placehold.co/40x40/f0f0f0/333?text=C', name: 'Amoxicillin', brand: 'MedCorp', type: 'Antibiotic', strength: '250mg', price: '21.99', stock: 100 },
    { id: 4, image: 'https://placehold.co/40x40/f0f0f0/333?text=D', name: 'Lisinopril', brand: 'MedCorp', type: 'Blood Pressure', strength: '10mg', price: '18.70', stock: 90 },
    { id: 5, image: 'https://placehold.co/40x40/f0f0f0/333?text=E', name: 'Metformin', brand: 'MedCorp', type: 'Diabetes', strength: '500mg', price: '12.39', stock: 80 },
    { id: 6, image: 'https://placehold.co/40x40/f0f0f0/333?text=F', name: 'Atorvastatin', brand: 'MedCorp', type: 'Cholesterol', strength: '20mg', price: '27.49', stock: 65 },
    { id: 7, image: 'https://placehold.co/40x40/f0f0f0/333?text=G', name: 'Levothyroxine', brand: 'MedCorp', type: 'Thyroid', strength: '100mcg', price: '10.99', stock: 70 },
    { id: 8, image: 'https://placehold.co/40x40/f0f0f0/333?text=H', name: 'Omeprazole', brand: 'MedCorp', type: 'Acid Reflux', strength: '20mg', price: '15.50', stock: 55 },
    { id: 9, image: 'https://placehold.co/40x40/f0f0f0/333?text=I', name: 'Sertraline', brand: 'MedCorp', type: 'Antidepressant', strength: '50mg', price: '21.20', stock: 120 },
    { id: 10, image: 'https://placehold.co/40x40/f0f0f0/333?text=J', name: 'Albuterol', brand: 'MedCorp', type: 'Asthma', strength: '90mcg', price: '14.70', stock: 20 },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
        <button
          onClick={onAddMedicineClick}
          className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Medicine
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200 text-blue-700 text-left text-sm uppercase font-semibold">
                <th className="px-5 py-3 rounded-tl-lg">Image</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Strength</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, index) => (
                <tr key={med.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                  <td className="px-5 py-4 text-sm text-gray-900">
                    <img src={med.image} alt={med.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/e0e0e0/888?text=N/A"; }} />
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.brand}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.type}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.strength}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">${med.price}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.stock}</td>
                  <td className="px-5 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};


// Add/Edit Medicine Form Component
const AddMedicineForm = ({ onGoBack }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add/Edit Medicine</h1>
        <button
          onClick={onGoBack}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg"> {/* Increased padding */}
        <form className="space-y-6"> {/* Use a form tag and consistent spacing */}
          {/* Brand Name and Generic Composition - Side by Side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="brandName" className="block text-gray-700 text-sm font-semibold mb-2">Brand Name</label> {/* Bolder label */}
              <input
                type="text"
                id="brandName"
                placeholder="Enter brand name"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
            </div>
            <div>
              <label htmlFor="genericComposition" className="block text-gray-700 text-sm font-semibold mb-2">Generic Composition</label>
              <input
                type="text"
                id="genericComposition"
                placeholder="Enter generic composition"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">Description</label>
            <textarea
              id="description"
              placeholder="Enter description"
              rows="4"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 resize-y"
            ></textarea>
          </div>

          {/* Uses */}
          <div>
            <label htmlFor="uses" className="block text-gray-700 text-sm font-semibold mb-2">Uses</label>
            <textarea
              id="uses"
              placeholder="Enter uses"
              rows="4"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 resize-y"
            ></textarea>
          </div>

          {/* Dosage and Inventory Count - Side by Side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dosage" className="block text-gray-700 text-sm font-semibold mb-2">Dosage</label>
              <input
                type="text"
                id="dosage"
                placeholder="Enter dosage"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
            </div>
            <div>
              <label htmlFor="inventoryCount" className="block text-gray-700 text-sm font-semibold mb-2">Inventory Count</label>
              <input
                type="number"
                id="inventoryCount"
                placeholder="Enter inventory count"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
            </div>
          </div>

          {/* Upload Image Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200"> {/* Increased padding, subtle background, hover effect */}
            <p className="text-gray-600 mb-4 text-lg">Drag and drop to upload image</p> {/* Larger text */}
            <p className="text-gray-500 mb-4 text-sm">or</p>
            <button
              type="button" // Important for buttons inside forms
              className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              Browse Files
            </button>
          </div>

          {/* Is Prescription Required Checkbox */}
          <div className="flex items-center pt-2"> {/* Added padding top */}
            <input
              type="checkbox"
              id="prescriptionRequired"
              className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 transition duration-150"
            />
            <label htmlFor="prescriptionRequired" className="ml-3 text-gray-700 text-base font-semibold cursor-pointer">Is Prescription Required?</label> {/* Larger text, bolder label, cursor pointer */}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6"> {/* Increased padding top */}
            <button
              type="submit" // Set type to submit for form submission
              className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-xl hover:bg-blue-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
            >
              Save Medicine
            </button>
          </div>
        </form>
      </div>
    </>
  );
};


function Medicine() {
  // State to manage the sub-page within 'Medicines' section
  const [medicineSubPage, setMedicineSubPage] = useState('list'); // 'list' or 'add'

  const handleAddMedicineClick = () => {
    setMedicineSubPage('add');
  };

  const handleGoBackFromAddMedicine = () => {
    setMedicineSubPage('list');
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      {medicineSubPage === 'list' ? (
        <MedicinesListPage onAddMedicineClick={handleAddMedicineClick} />
      ) : (
        <AddMedicineForm onGoBack={handleGoBackFromAddMedicine} />
      )}
    </div>
  );
}

export default Medicine;
