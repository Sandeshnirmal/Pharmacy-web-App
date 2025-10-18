import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance';
import { apiUtils } from "../api/apiService"; // Assuming apiUtils is generic

const RateMaster = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Replace with actual API call for rates
      // const response = await axiosInstance.get('/api/rates/');
      // setRates(response.data);
      setRates([
        { id: 1, name: "Standard Rate", value: 1.0, description: "Default selling rate multiplier" },
        { id: 2, name: "Wholesale Rate", value: 0.8, description: "20% off for wholesale customers" },
      ]);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRates = rates.filter((rate) =>
    rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search rates..."
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
                  Rate Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Value/Multiplier
                </th>
                <th scope="col" className="px-6 py-3">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((rate) => (
                <tr key={rate.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {rate.name}
                  </td>
                  <td className="px-6 py-4">{rate.value}</td>
                  <td className="px-6 py-4">{rate.description}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      // onClick={() => handleEditRate(rate)}
                      className="font-medium text-indigo-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      // onClick={() => handleDeleteRate(rate.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No rates found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateMaster;
