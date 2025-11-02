import React, { useState, useEffect } from 'react';
import { courierAPI } from '../api/apiService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TPCCourierManagementPage = () => {
  const [courierPartner, setCourierPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: 'TPC',
    api_endpoint: '',
    api_key: '',
    api_secret: '',
    is_active: true,
    service_areas: [],
    pricing_config: {},
  });

  useEffect(() => {
    fetchTPCCourierPartner();
  }, []);

  const fetchTPCCourierPartner = async () => {
    try {
      setLoading(true);
      const response = await courierAPI.getTPCCourierPartner();
      setCourierPartner(response.data[0]); // Assuming it returns an array with one item
      setFormData(response.data[0]);
    } catch (err) {
      setError(err);
      toast.error('Failed to fetch TPC Courier Partner details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleJsonChange = (name, value) => {
    try {
      setFormData((prevData) => ({
        ...prevData,
        [name]: JSON.parse(value),
      }));
    } catch (e) {
      toast.error(`Invalid JSON for ${name}`);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await courierAPI.updateTPCCourierPartner(formData);
      toast.success('TPC Courier Partner updated successfully!');
      fetchTPCCourierPartner(); // Re-fetch to ensure latest data
    } catch (err) {
      setError(err);
      toast.error('Failed to update TPC Courier Partner.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TPC Courier Partner Management</h1>

      <form onSubmit={handleUpdateSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-3">Edit TPC Partner Details</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Partner Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            readOnly // Name is hardcoded to TPC
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="api_endpoint">
            API Endpoint
          </label>
          <input
            type="url"
            id="api_endpoint"
            name="api_endpoint"
            value={formData.api_endpoint}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="api_key">
            API Key (UserID)
          </label>
          <input
            type="text"
            id="api_key"
            name="api_key"
            value={formData.api_key}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="api_secret">
            API Secret (Password)
          </label>
          <input
            type="password"
            id="api_secret"
            name="api_secret"
            value={formData.api_secret}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="service_areas">
            Service Areas (JSON Array)
          </label>
          <textarea
            id="service_areas"
            name="service_areas"
            value={JSON.stringify(formData.service_areas, null, 2)}
            onChange={(e) => handleJsonChange('service_areas', e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pricing_config">
            Pricing Configuration (JSON Object)
          </label>
          <textarea
            id="pricing_config"
            name="pricing_config"
            value={JSON.stringify(formData.pricing_config, null, 2)}
            onChange={(e) => handleJsonChange('pricing_config', e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
          />
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="mr-2 leading-tight"
          />
          <label className="text-gray-700 text-sm font-bold" htmlFor="is_active">
            Is Active
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update TPC Partner
          </button>
        </div>
      </form>

      {/* Additional TPC Actions Section */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-3">TPC Specific Actions</h2>
        {/* Implement forms/buttons for other actions here */}
        <p>Further actions like Pincode Service Check, Consignment Note requests, etc., can be added here.</p>
      </div>
    </div>
  );
};

export default TPCCourierManagementPage;
