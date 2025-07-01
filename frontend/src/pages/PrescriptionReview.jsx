// PrescriptionReview.jsx
import React from 'react';

const PrescriptionReview = () => {
  // Sample data for AI Extracted Information table
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

  // Sample data for Product Mapping
  const productMappings = [
    { product: 'Amoxicillin', details: '500mg, 30 capsules' },
    { product: 'Ibuprofen', details: '200mg, 60 tablets' },
    { product: 'Acetaminophen', details: '500mg, 30 tablets' },
  ];

  // Placeholder for prescription image (replace with actual image URL)
  const prescriptionImageUrl = 'https://placehold.co/400x300/e0e7ff/3f51b5?text=Prescription+Image';

  // Handlers for buttons
  const handleAddMissingItem = () => console.log('Add Missing Item clicked');
  const handleSuggestSubstitute = () => console.log('Suggest Substitute clicked');
  const handleMapProduct = (productName) => console.log(`Map product: ${productName}`);
  const handleReject = () => console.log('Reject clicked');
  const handleClarify = () => console.log('Clarify clicked');
  const handleVerify = () => console.log('Verify clicked');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Prescription Review</h1>
          <p className="text-sm text-gray-600">Order #123456/890</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Prescription Image Section (spanning 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-700 mb-4">Prescription Image</h2>
          <div className="flex justify-center items-center bg-gray-100 rounded-md p-4">
            <img
              src={prescriptionImageUrl}
              alt="Prescription"
              className="max-w-full h-auto rounded-md shadow-sm"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/cccccc/333333?text=Image+Not+Found'; }}
            />
          </div>
        </div>

        {/* Product Mapping Section (1 column) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-700 mb-4">Product Mapping</h2>
          <ul className="space-y-3">
            {productMappings.map((item, index) => (
              <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-200">
                <div>
                  <p className="text-gray-800 font-medium">{item.product}</p>
                  <p className="text-sm text-gray-500">{item.details}</p>
                </div>
                <button
                  onClick={() => handleMapProduct(item.product)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium
                             transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Map
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Extracted Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-medium text-gray-700 mb-4">AI Extracted Information</h2>

        {/* Patient Information Box */}
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Patient Information</h3>
          {/* Placeholder for actual patient info fields */}
          <div className="text-gray-700 text-sm">
            <p><strong>Name:</strong> John Doe</p>
            <p><strong>Date of Birth:</strong> 1985-05-20</p>
            <p><strong>Address:</strong> 123 Main St, Anytown, USA</p>
            {/* Add more patient info as needed */}
          </div>
        </div>

        {/* Extracted Medicines Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Confidence</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {extractedMedicines.map((medicine, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{medicine.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.dosage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.quantity}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">{medicine.instructions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${medicine.aiConfidence}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium">{medicine.aiConfidence}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleAddMissingItem}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium
                       transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Add Missing Item
          </button>
          <button
            onClick={handleSuggestSubstitute}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium
                       transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Suggest Substitute
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-medium text-gray-700 mb-4">Notes</h2>
        <textarea
          className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     min-h-[100px] text-sm text-gray-700"
          placeholder="Add any relevant notes here..."
        ></textarea>
      </div>

      {/* Action Buttons at the bottom */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReject}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
        >
          Reject
        </button>
        <button
          onClick={handleClarify}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        >
          Clarify
        </button>
        <button
          onClick={handleVerify}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Verify
        </button>
      </div>
    </div>
  );
};

export default PrescriptionReview;
