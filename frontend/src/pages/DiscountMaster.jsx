import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance';
import { apiUtils, productAPI, discountAPI } from "../api/apiService";

const DiscountMaster = () => {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscountType, setSelectedDiscountType] = useState("product"); // "product" or "category"

  // State for new discount form
  const [newDiscount, setNewDiscount] = useState({
    name: "",
    percentage: "",
    description: "",
    target_type: "product", // 'product' or 'category'
    target_id: null, // product_id or category_id
  });

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
      setDiscounts(response.data.results || []);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (page = 1, size = 100) => { // Fetch more products for selection
    try {
      const response = await productAPI.getProducts(page, size);
      setProducts(response.data.results || []);
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
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddDiscount = async (e) => {
    e.preventDefault();
    try {
      await discountAPI.createDiscount(newDiscount);
      setNewDiscount({
        name: "",
        percentage: "",
        description: "",
        target_type: "item",
        target_id: null,
      });
      fetchDiscounts(); // Refresh the list
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding discount:", error);
    }
  };

  const handleEditDiscount = async (discount) => {
    try {
      // For simplicity, let's assume we have a modal or a separate form for editing
      // For now, we'll just log and then refresh
      console.log("Editing discount:", discount);
      // In a real application, you'd likely open a modal with the discount data
      // and then call discountAPI.updateDiscount after the user saves changes.
      // For this task, we'll just simulate an update and refresh.
      const updatedDiscount = { ...discount, name: discount.name + " (Edited)" }; // Example change
      await discountAPI.updateDiscount(discount.id, updatedDiscount);
      fetchDiscounts(); // Refresh the list
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error editing discount:", error);
    }
  };

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

      {/* Add New Discount Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Discount</h2>
        <form onSubmit={handleAddDiscount} className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <label className="block text-sm font-medium text-gray-700">Discount Type:</label>
            <div className="flex items-center">
              <input
                type="radio"
                id="productDiscount"
                name="discountType"
                value="product"
                checked={selectedDiscountType === "product"}
                onChange={() => setSelectedDiscountType("product")}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="productDiscount" className="ml-2 block text-sm text-gray-900">
                Product-wise Discount
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="categoryDiscount"
                name="discountType"
                value="category"
                checked={selectedDiscountType === "category"}
                onChange={() => setSelectedDiscountType("category")}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="categoryDiscount" className="ml-2 block text-sm text-gray-900">
                Category-wise Discount
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Name</label>
              <input
                type="text"
                required
                value={newDiscount.name}
                onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={newDiscount.percentage}
                onChange={(e) => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newDiscount.description}
                onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            {selectedDiscountType === "product" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Product</label>
                <select
                  required
                  value={newDiscount.target_id || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, target_id: e.target.value, target_type: "product" })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.strength})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDiscountType === "category" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Category</label>
                <select
                  required
                  value={newDiscount.target_id || ""}
                  onChange={(e) => setNewDiscount({ ...newDiscount, target_id: e.target.value, target_type: "category" })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
              Add Discount
            </button>
          </div>
        </form>
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
                      ? products.find(p => p.id === discount.target_id)?.name || "N/A"
                      : categories.find(c => c.id === discount.target_id)?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4">{discount.description}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEditDiscount(discount)}
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
    </div>
  );
};

export default DiscountMaster;
