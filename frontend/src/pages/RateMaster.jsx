import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance';
import { apiUtils } from "../api/apiService"; // Assuming apiUtils is generic

const RateMaster = () => {
  const [batches, setBatches] = useState([]); // Renamed from rates to batches
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(null); // For editing

  useEffect(() => {
    fetchBatches(); // Renamed from fetchRates
  }, []);

  const fetchBatches = async () => { // Renamed from fetchRates
    try {
      setLoading(true);
      setError(null);
      // Fetch products with their batches
      const response = await axiosInstance.get('/api/products/enhanced-products/'); // Corrected endpoint
      console.log("API Response for /api/products/:", response.data); // Log the response data for debugging
      
      // Check if response.data.results exists and is an array
      if (response.data && Array.isArray(response.data.results)) {
        // Flatten all batches from all products into a single array
        const allBatches = response.data.results.flatMap(product => 
          product.batches.map(batch => ({
            ...batch,
            product_name: product.name // Add product name for display
          }))
        );
        setBatches(allBatches);
      } else {
        console.warn("API response does not contain a 'results' array:", response.data);
        setBatches([]); // Set to empty array to prevent further errors
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter((batch) =>
    batch.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Rate Master</h1>
            <p className="text-gray-600 mt-1">Manage pricing rates and rules.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              // onClick={() => setShowAddRateModal(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              Add New Rate
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search products or batch numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Batch Number
                </th>
                <th scope="col" className="px-6 py-3">
                  Generic MRP
                </th>
                <th scope="col" className="px-6 py-3">
                  Generic Discount (%)
                </th>
                <th scope="col" className="px-6 py-3">
                  Generic Selling Price
                </th>
                <th scope="col" className="px-6 py-3">
                  Online MRP
                </th>
                <th scope="col" className="px-6 py-3">
                  Online Discount (%)
                </th>
                <th scope="col" className="px-6 py-3">
                  Online Selling Price
                </th>
                <th scope="col" className="px-6 py-3">
                  Offline MRP
                </th>
                <th scope="col" className="px-6 py-3">
                  Offline Discount (%)
                </th>
                <th scope="col" className="px-6 py-3">
                  Offline Selling Price
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {batch.product_name}
                  </td>
                  <td className="px-6 py-4">{batch.batch_number}</td>
                  <td className="px-6 py-4">{batch.mrp_price}</td>
                  <td className="px-6 py-4">{batch.discount_percentage}</td>
                  <td className="px-6 py-4">{batch.selling_price}</td>
                  <td className="px-6 py-4">{batch.online_mrp_price}</td>
                  <td className="px-6 py-4">{batch.online_discount_percentage}</td>
                  <td className="px-6 py-4">{batch.online_selling_price}</td>
                  <td className="px-6 py-4">{batch.offline_mrp_price}</td>
                  <td className="px-6 py-4">{batch.offline_discount_percentage}</td>
                  <td className="px-6 py-4">{batch.offline_selling_price}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      // onClick={() => handleEditBatch(batch)}
                      className="font-medium text-indigo-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      // onClick={() => handleDeleteBatch(batch.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBatches.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No batches found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateMaster;
