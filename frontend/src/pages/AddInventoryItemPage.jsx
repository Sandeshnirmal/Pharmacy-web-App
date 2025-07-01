// AddInventoryItemPage.jsx
import React, { useState } from 'react';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing

const AddInventoryItemPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    category: '',
    strength: '',
    supplier: '',
    stock: '',
    minStock: '',
    lastUpdated: new Date().toISOString().slice(0, 10), // Default to current date
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [name]: name === 'stock' || name === 'minStock' ? parseInt(value) || '' : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category || newItem.stock === '' || newItem.minStock === '') {
      console.log('Please fill in all required fields (Name, Category, Stock, Min Stock).');
      return;
    }

    // In a real application, you would send this newItem data to your backend API
    // For demonstration, we'll just log it and simulate adding it.
    const generatedId = `INV${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const itemToAdd = { ...newItem, id: generatedId };
    console.log('New item to add:', itemToAdd);

    // Simulate successful addition and navigate back to the inventory list
    // In a real app, you might wait for an API response before navigating
    navigate('/inventory'); // Navigate back to the inventory list page
  };

  const handleGoBack = () => {
    navigate('/inventory'); // Navigate back to the inventory list page
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Inventory Item</h1>
        <button
          onClick={handleGoBack}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Inventory
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Product Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g., Amoxicillin"
                value={newItem.name}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-gray-700 text-sm font-semibold mb-2">Category <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="category"
                name="category"
                placeholder="e.g., Antibiotics"
                value={newItem.category}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                required
              />
            </div>
          </div>

          {/* Strength and Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="strength" className="block text-gray-700 text-sm font-semibold mb-2">Strength</label>
              <input
                type="text"
                id="strength"
                name="strength"
                placeholder="e.g., 500mg"
                value={newItem.strength}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
            </div>
            <div>
              <label htmlFor="supplier" className="block text-gray-700 text-sm font-semibold mb-2">Supplier</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                placeholder="e.g., PharmaCorp"
                value={newItem.supplier}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
            </div>
          </div>

          {/* Stock and Minimum Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stock" className="block text-gray-700 text-sm font-semibold mb-2">Current Stock <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="stock"
                name="stock"
                placeholder="e.g., 250"
                value={newItem.stock}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                required
              />
            </div>
            <div>
              <label htmlFor="minStock" className="block text-gray-700 text-sm font-semibold mb-2">Minimum Stock <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                placeholder="e.g., 50"
                value={newItem.minStock}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                required
              />
            </div>
          </div>

          {/* Last Updated (read-only or hidden) */}
          <div>
            <label htmlFor="lastUpdated" className="block text-gray-700 text-sm font-semibold mb-2">Last Updated</label>
            <input
              type="text"
              id="lastUpdated"
              name="lastUpdated"
              value={newItem.lastUpdated}
              readOnly
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-xl hover:bg-blue-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryItemPage;
