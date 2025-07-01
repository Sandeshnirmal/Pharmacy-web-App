// InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus as PlusIcon, SlidersHorizontal as SlidersHorizontalIcon } from 'lucide-react'; // Example icons
import { Link, useLocation } from "react-router-dom"; // BrowserRouter is removed from here

const InventoryManagement = () => {
  const initialInventoryData = [
    {
      id: 'INV001',
      name: 'Amoxicillin',
      category: 'Antibiotics',
      strength: '500mg',
      supplier: 'PharmaCorp',
      stock: 250,
      minStock: 50,
      lastUpdated: '2024-06-28',
    },
    {
      id: 'INV002',
      name: 'Ibuprofen',
      category: 'Pain Relief',
      strength: '200mg',
      supplier: 'Global Meds',
      stock: 30, // Low stock
      minStock: 50,
      lastUpdated: '2024-06-29',
    },
    {
      id: 'INV003',
      name: 'Lisinopril',
      category: 'Cardiovascular',
      strength: '10mg',
      supplier: 'HealthBridge',
      stock: 180,
      minStock: 40,
      lastUpdated: '2024-06-27',
    },
    {
      id: 'INV004',
      name: 'Metformin',
      category: 'Diabetes',
      strength: '500mg',
      supplier: 'PharmaCorp',
      stock: 5, // Out of stock
      minStock: 20,
      lastUpdated: '2024-06-30',
    },
    {
      id: 'INV005',
      name: 'Omeprazole',
      category: 'Gastrointestinal',
      strength: '20mg',
      supplier: 'Global Meds',
      stock: 120,
      minStock: 30,
      lastUpdated: '2024-06-26',
    },
    {
      id: 'INV006',
      name: 'Atorvastatin',
      category: 'Cholesterol',
      strength: '20mg',
      supplier: 'HealthBridge',
      stock: 45,
      minStock: 50,
      lastUpdated: '2024-06-29',
    },
  ];

  const [inventory, setInventory] = useState(initialInventoryData);
  const [filteredInventory, setFilteredInventory] = useState(initialInventoryData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'In Stock', 'Low Stock', 'Out of Stock'
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Derive unique categories for filter dropdown
  const uniqueCategories = ['All', ...new Set(initialInventoryData.map(item => item.category))];

  // Effect to filter inventory based on search term and filters
  useEffect(() => {
    let currentFiltered = inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.strength.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());

      const getStatus = (stock, minStock) => {
        if (stock <= 0) return 'Out of Stock';
        if (stock <= minStock) return 'Low Stock';
        return 'In Stock';
      };

      const matchesStatus =
        statusFilter === 'All' || getStatus(item.stock, item.minStock) === statusFilter;

      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
    setFilteredInventory(currentFiltered);
  }, [searchTerm, statusFilter, categoryFilter, inventory]);

  /**
   * Determines the stock status and returns appropriate classes.
   * @param {number} stock - Current stock quantity.
   * @param {number} minStock - Minimum stock threshold.
   * @returns {object} { text: string, classes: string }
   */
  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) {
      return { text: 'Out of Stock', classes: 'bg-red-100 text-red-800' };
    }
    if (stock <= minStock) {
      return { text: 'Low Stock', classes: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'In Stock', classes: 'bg-green-100 text-green-800' };
  };

  const handleAddNewItem = () => {
    console.log('Add New Item clicked');
    // In a real app, this would navigate to an add/edit form for a new item.
    alert('Navigate to Add New Item Form');
  };

  const handleEditItem = (item) => {
    console.log('Edit item:', item.id);
    // Navigate to an edit form pre-filled with item data.
    alert(`Edit item: ${item.name}`);
  };

  const handleViewDetails = (item) => {
    console.log('View details for item:', item.id);
    // Navigate to a detailed view page for the item.
    alert(`View details for: ${item.name}`);
  };

  const handleAdjustStock = (item) => {
    console.log('Adjust stock for item:', item.id);
    // Open a modal or navigate to a page for stock adjustment.
    const newStock = prompt(`Enter new stock for ${item.name} (current: ${item.stock}):`);
    if (newStock !== null && !isNaN(newStock) && newStock.trim() !== '') {
      setInventory(prevInventory =>
        prevInventory.map(invItem =>
          invItem.id === item.id ? { ...invItem, stock: parseInt(newStock) } : invItem
        )
      );
      alert(`Stock for ${item.name} updated to ${newStock}`);
    } else if (newStock !== null) {
      alert('Invalid stock value entered.');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-lg text-gray-600 mt-2">Oversee product stock, status, and details.</p>
              </div>
              <Link to="/inventory/add">
        <button
          onClick={handleAddNewItem}
          className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Item
        </button></Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by name, category, supplier, or ID..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
          <select
            id="statusFilter"
            className="block w-full py-3 px-4 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-auto">
          <label htmlFor="categoryFilter" className="sr-only">Filter by Category</label>
          <select
            id="categoryFilter"
            className="block w-full py-3 px-4 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200 text-blue-700 text-left text-sm uppercase font-semibold">
                <th className="px-5 py-3 rounded-tl-lg">Product ID</th>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Strength</th>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Updated</th>
                <th className="px-5 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-600 text-lg">
                    No inventory items found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, index) => {
                  const status = getStockStatus(item.stock, item.minStock);
                  return (
                    <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors duration-150`}>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{item.category}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{item.strength}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{item.supplier}</td>
                      <td className="px-5 py-4 text-sm text-gray-900 font-semibold">{item.stock}</td>
                      <td className="px-5 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.classes}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{item.lastUpdated}</td>
                      <td className="px-5 py-4 text-sm flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                     px-2 py-1 rounded-md font-medium transition duration-150 ease-in-out"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
                                     px-2 py-1 rounded-md font-medium transition duration-150 ease-in-out"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item)}
                          className="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
                                     px-2 py-1 rounded-md font-medium transition duration-150 ease-in-out"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;
