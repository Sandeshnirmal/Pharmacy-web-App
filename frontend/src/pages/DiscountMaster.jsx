import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance';
import { apiUtils, productAPI, discountAPI } from "../api/apiService";
import DiscountAddEditModal from "../components/DiscountAddEditModal"; // Import the new modal component

const DiscountMaster = () => {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscountType, setSelectedDiscountType] = useState("product"); // "product" or "category"
  const [showAddEditModal, setShowAddEditModal] = useState(false); // To control modal visibility
  const [currentDiscount, setCurrentDiscount] = useState(null); // For editing a specific discount

  // State for new discount form (no longer needed as it's in the modal)
  // const [newDiscount, setNewDiscount] = useState({
  //   name: "",
  //   percentage: "",
  //   description: "",
  //   target_type: "product",
  //   target_id: null,
  //   start_date: "",
  //   end_date: "",
  //   is_active: true,
  // });

  useEffect(() => {
    fetchDiscounts();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await discountAPI.getDiscounts();
      const data = response.data;
      if (data && Array.isArray(data.results)) {
        setDiscounts(data.results);
      } else if (Array.isArray(data)) {
        setDiscounts(data);
      } else {
        console.warn("Unexpected API response format for discounts.");
        setDiscounts([]);
      }
      console.log("Fetched discounts:", data); // Debug log
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscountClick = () => {
    setCurrentDiscount(null); // Clear current discount for new entry
    setShowAddEditModal(true);
  };

  const handleEditDiscountClick = (discount) => {
    setCurrentDiscount(discount);
    setShowAddEditModal(true);
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    setCurrentDiscount(null);
  };

  const handleSaveSuccess = () => {
    fetchDiscounts(); // Refresh the list after save
  };

  const fetchProducts = async (page = 1, size = 100) => { // Fetch more products for selection
    try {
      const response = await productAPI.getProducts(page, size);
      const data = response.data;
      if (data && Array.isArray(data.results)) {
        setProducts(data.results);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.warn("Unexpected API response format for products.");
        setProducts([]);
      }
      console.log("Fetched products for modal:", data); // Debug log
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await productAPI.getCategories();
      const data = categoriesResponse.data;
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && Array.isArray(data.results)) {
        setCategories(data.results);
      } else {
        console.warn("Unexpected API response format for categories.");
        setCategories([]);
      }
      console.log("Fetched categories for modal:", categoriesResponse.data); // Debug log
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching categories:", error);
    }
  };

  // Removed handleAddDiscount, handleEditClick, handleEditFormChange, handleEditTargetTypeChange, handleSaveEdit, handleCancelEdit
  // as their logic is now encapsulated within DiscountAddEditModal or replaced by modal interactions.

  const handleDeleteDiscount = async (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this discount?")) {
        await discountAPI.deleteDiscount(id);
        fetchDiscounts(); // Refresh the list
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error deleting discount:", error);
    }
  };

  const filteredDiscounts = discounts.filter((discount) =>
    discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-800">Discount Master</h1>
            <p className="text-gray-600 mt-1">Manage global and promotional discounts.</p>
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

      {/* Add New Discount Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddDiscountClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors"
        >
          Add New Discount
        </button>
      </div>

      {/* Existing Discounts Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Existing Discounts</h2>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search discounts..."
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
                  Discount Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Percentage (%)
                </th>
                <th scope="col" className="px-6 py-3">
                  Target Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Target
                </th>
                <th scope="col" className="px-6 py-3">
                  Description
                </th>
                <th scope="col" className="px-6 py-3">
                  Start Date
                </th>
                <th scope="col" className="px-6 py-3">
                  End Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Active
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {discount.name}
                  </td>
                  <td className="px-6 py-4">{discount.percentage}%</td>
                  <td className="px-6 py-4 capitalize">{discount.target_type}</td>
                  <td className="px-6 py-4">
                    {discount.target_type === "product"
                      ? products.find(p => p.id === discount.product)?.name || "N/A"
                      : categories.find(c => c.id === discount.category)?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4">{discount.description}</td>
                  <td className="px-6 py-4">{discount.start_date || 'N/A'}</td>
                  <td className="px-6 py-4">{discount.end_date || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {discount.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEditDiscountClick(discount)}
                      className="font-medium text-indigo-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDiscounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No discounts found.
            </div>
          )}
        </div>
      </div>

      <DiscountAddEditModal
        show={showAddEditModal}
        onClose={handleModalClose}
        onSaveSuccess={handleSaveSuccess}
        initialData={currentDiscount}
        products={products}
        categories={categories}
      />
    </div>
  );
};

export default DiscountMaster;
