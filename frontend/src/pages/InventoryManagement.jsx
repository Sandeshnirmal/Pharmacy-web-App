import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance'
import Medicines from "./MedicinesListPage";
import '../api/apiService'
import { apiUtils, productAPI } from "../api/apiService";
// --- Sample Data ---
// In a real app, this would come from an API.







const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genericNames, setGenericNames] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGenericNameModal, setShowGenericNameModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductBatches, setSelectedProductBatches] = useState([]);



  useEffect(()=>{
    fetchMedicines();
    fetchCategory();
    fetchGericname();
  },[]);

  const fetchMedicines = async()=>{

    try{
      setLoading(true);
      setError(null);
      const response = await productAPI.getProducts();
      console.log("product",response);
      setProducts(Array.isArray(response.data)? response.data:response.data.results || []);
    } catch(error){
      const errorInfo =apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("error fetching medicines",error);

    }finally{
      setLoading(false);
    }
  };

 const fetchCategory = async () => {
    try {
        setLoading(true);
        setError(null);
        const categoriesResponse = await productAPI.getCategories();
        console.log("API response:", categoriesResponse); // Added a more descriptive log message
        
        // Use Array.isArray() for a reliable check
        const data = categoriesResponse.data;
        if (Array.isArray(data)) {
            setCategories(data);
        } else if (data && Array.isArray(data.results)) {
            setCategories(data.results);
        } else {
            // Handle unexpected data format gracefully
            console.warn("Unexpected API response format for categories.");
            setCategories([]);
        }

    } catch (error) { // The error object is now correctly passed
        const errorInfo = apiUtils.handleError(error);
        setError(errorInfo.message);
        console.error("Error fetching category:", error); // Use console.error for errors
    } finally {
        setLoading(false);
    }
};

const fetchGericname = async () => {
  try {
    setLoading(true);
    setError(null);
    const ResponsegenericName = await productAPI.getGenericNames();
    console.log("API response:", ResponsegenericName);

    // 1. Declare the data variable
    const data = ResponsegenericName.data;

    if (Array.isArray(data)) {
      // 2. Correctly access the data property
      setGenericNames(data);
    } else if (data && Array.isArray(data.results)) {
      // 3. Correctly update the generic names state
      setGenericNames(data.results);
    } else {
      console.log("Unexpected API response format for generic names.");
      // 3. Correctly update the generic names state
      setGenericNames([]);
    }

  } catch (error) { // 4. Add the 'error' parameter
    const errorInfo = apiUtils.handleError(error);
    setError(errorInfo.message);
    console.error("Error fetching generic name:", error); // Use console.error for errors
  } finally {
    setLoading(false);
  }
};

  const [newBatch, setNewBatch] = useState({
    product: "",
    batch_number: "",
    quantity: "",
    expiry_date: "",
    cost_price: "",
    selling_price: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    generic_name: "",
    strength: "",
    dosage_form: "",
    manufacturer: "MedCorp",
    price: "",
    mrp: "",
    is_prescription_required: false,
    hsn_code: "30041000",
    packaging_unit: "",
    pack_size: "",
    stock_quantity: "",
    min_stock_level: "10",
  });

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newGenericName, setNewGenericName] = useState({
    name: "",
    description: "",
  });



  const getCategoryName = (id) =>
    categories.find((c) => c.id === id)?.name || "N/A";
  const getGenericName = (id) =>
    genericNames.find((g) => g.id === id)?.name || "N/A";

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError("Please select a product first to add a batch.");
      return;
    }
    try {
      await productAPI.updateStock(selectedProduct.id, newBatch);
      setShowBatchModal(false);
      setNewBatch({
        product: "",
        batch_number: "",
        quantity: "",
        expiry_date: "",
        cost_price: "",
        selling_price: "",
      });
      fetchMedicines(); // Refetch medicines to update stock
      setSelectedProduct(null);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding stock:", error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: newProduct.name,
        strength: newProduct.strength,
        manufacturer: newProduct.manufacturer,
        price: newProduct.price,
        mrp: newProduct.mrp,
        is_prescription_required: newProduct.is_prescription_required,
        pack_size: newProduct.pack_size,
        stock_quantity: newProduct.stock_quantity,
        min_stock_level: newProduct.min_stock_level,
        category: newProduct.category_id,
        generic_name: newProduct.generic_name,
        dosage_form: newProduct.dosage_form,
        brand_name: newProduct.name, // Defaulting brand_name to name
        medicine_type: 'tablet', // Default
        prescription_type: newProduct.is_prescription_required ? 'prescription' : 'otc',
        hsn_code: newProduct.hsn_code,
      };

      await productAPI.createProduct(productData);
      
      setShowProductModal(false);
      setNewProduct({
        name: "",
        category_id: "",
        generic_name: "",
        strength: "",
        form: "",
        manufacturer: "MedCorp",
        price: "",
        mrp: "",
        is_prescription_required: false,
        hsn_code: "30041000",
        pack_size: "",
        stock_quantity: "",
        min_stock_level: "10",
      });
      fetchMedicines(); // Refetch products
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding product:", error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createCategory(newCategory);
      setShowCategoryModal(false);
      setNewCategory({ name: "", description: "" });
      fetchCategory(); // Refetch categories
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding category:", error);
    }
  };

  const handleAddGenericName = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createGenericName(newGenericName);
      setShowGenericNameModal(false);
      setNewGenericName({ name: "", description: "" });
      fetchGericname(); // Refetch generic names
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding generic name:", error);
    }
  };

  const getStockStatus = (product) => {
    const totalStock = product.stock_quantity || 0;
    if (totalStock === 0)
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (totalStock < product.min_stock_level)
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0)
      return { status: "Expired", color: "bg-red-100 text-red-800" };
    if (daysUntilExpiry < 30)
      return {
        status: "Expiring Soon",
        color: "bg-yellow-100 text-yellow-800",
      };
    if (daysUntilExpiry < 90)
      return {
        status: "Expires in ~3 months",
        color: "bg-blue-100 text-blue-800",
      };
    return { status: "Good", color: "bg-green-100 text-green-800" };
  };

  const handleViewBatches = (product) => {
    setSelectedProduct(product);
    const productBatches = batches.filter(
      (batch) => batch.product === product.id
    );
    setSelectedProductBatches(productBatches);
    setShowViewBatchModal(true);
  };

  const openAddBatchModal = (product) => {
    setSelectedProduct(product);
    setShowBatchModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const genericName = getGenericName(product.generic_name);
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      genericName.toLowerCase().includes(searchTerm.toLowerCase());

    const stockStatus = getStockStatus(product);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && stockStatus.status === "Low Stock") ||
      (stockFilter === "out" && stockStatus.status === "Out of Stock");

    return matchesSearch && matchesStock;
  });

  const stats = {
    totalProducts: products.length,
    lowStock: products.filter(
      (p) => p.stock_quantity > 0 && p.stock_quantity < p.min_stock_level
    ).length,
    outOfStock: products.filter((p) => p.stock_quantity === 0).length,
    expired: batches.filter((b) => new Date(b.expiry_date) < new Date()).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track medicines, stock levels, and expiry dates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowProductModal(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              Add Medicine
            </button>
            <button
              onClick={() => openAddBatchModal(null)}
              className="bg-gray-700 text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              Add Stock
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Category
            </button>
            <button
              onClick={() => setShowGenericNameModal(true)}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Generic Name
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500">Total Products</h3>
          <p className="text-3xl font-semibold text-gray-800">
            {stats.totalProducts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-gray-500">Low Stock</h3>
          <p className="text-3xl font-semibold text-gray-800">
            {stats.lowStock}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-gray-500">Out of Stock</h3>
          <p className="text-3xl font-semibold text-gray-800">
            {stats.outOfStock}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-500">Expired Batches</h3>
          <p className="text-3xl font-semibold text-gray-800">
            {stats.expired}
          </p>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name or generic name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Generic Name
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Stock Qty
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Stock Status
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const { status, color } = getStockStatus(product);
                return (
                  <tr
                    key={product.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {product.name}{" "}
                      <span className="text-gray-500">
                        ({product.strength})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getCategoryName(product.category_name)}
                    </td>
                    <td className="px-6 py-4">
                      {getGenericName(product.generic_name)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {product.stock_quantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openAddBatchModal(product)}
                        className="font-medium text-green-600 hover:underline mr-4"
                      >
                        Add Stock
                      </button>
                      <button
                        onClick={() => handleViewBatches(product)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Batches
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}

      {/* Add/Edit Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Stock Batch
            </h3>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product
                </label>
                <select
                  required
                  value={selectedProduct?.id || ""}
                  onChange={(e) =>
                    setSelectedProduct(
                      products.find((p) => p.id === parseInt(e.target.value))
                    )
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select a product
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newBatch.batch_number}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, batch_number: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={newBatch.quantity}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, quantity: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={newBatch.expiry_date}
                  onChange={(e) =>
                      setNewBatch({ ...newBatch, expiry_date: e.target.value })
                    }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBatch.cost_price}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, cost_price: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selling Price / MRP
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBatch.selling_price}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        selling_price: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Medicine
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={newProduct.strength}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, strength: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    required
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category_id: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                      
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Generic Name
                  </label>
                  <select
                    required
                    value={newProduct.generic_name}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        generic_name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Generic Name</option>
                    {genericNames.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={newProduct.manufacturer}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        manufacturer: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Form (e.g., Tablet)
                  </label>
                  <input
                    type="text"
                    value={newProduct.form}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, form: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MRP
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.mrp}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, mrp: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={newProduct.pack_size}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, pack_size: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock_quantity}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.min_stock_level}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        min_stock_level: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newProduct.is_prescription_required}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      is_prescription_required: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Prescription Required?
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Category
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Generic Name Modal */}
      {showGenericNameModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Generic Name
            </h3>
            <form onSubmit={handleAddGenericName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Generic Name
                </label>
                <input
                  type="text"
                  required
                  value={newGenericName.name}
                  onChange={(e) =>
                    setNewGenericName({
                      ...newGenericName,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newGenericName.description}
                  onChange={(e) =>
                    setNewGenericName({
                      ...newGenericName,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenericNameModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Generic Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Batches Modal */}
      {showViewBatchModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Batches for:{" "}
              <span className="font-bold">{selectedProduct.name}</span>
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Batch #
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Expiry Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductBatches.map((batch) => {
                    const { status, color } = getExpiryStatus(
                      batch.expiry_date
                    );
                    return (
                      <tr key={batch.id} className="bg-white border-b">
                        <td className="px-6 py-4">{batch.batch_number}</td>
                        <td className="px-6 py-4">{batch.current_quantity}</td>
                        <td className="px-6 py-4">
                          {new Date(batch.expiry_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {selectedProductBatches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No batches found for this product.
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
              <button
                onClick={() => setShowViewBatchModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
