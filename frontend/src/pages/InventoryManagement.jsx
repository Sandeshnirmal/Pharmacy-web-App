import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance'
import { apiUtils, productAPI } from "../api/apiService";
// --- Sample Data ---
// In a real app, this would come from an API.







const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genericNames, setGenericNames] = useState([]);
  const [compositions, setCompositions] = useState([]); // New state for compositions

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGenericNameModal, setShowGenericNameModal] = useState(false);
  const [showCompositionModal, setShowCompositionModal] = useState(false); // New state for composition modal
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [showAddBatchForm, setShowAddBatchForm] = useState(false); // New state for add batch form visibility
  const [editingBatch, setEditingBatch] = useState(null); // New state for batch being edited

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductBatches, setSelectedProductBatches] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null); // New state for success messages

  // Function to fetch all initial data
  const fetchAllInitialData = async (page, size) => {
    setLoading(true);
    setError(null);
    try {
      const [productsResponse, categoriesResponse, genericNamesResponse, compositionsResponse] = await Promise.all([
        productAPI.getProducts(page, size),
        productAPI.getCategories(),
        productAPI.getGenericNames(),
        productAPI.getCompositions(),
      ]);

      // Process products
      const productsData = productsResponse.data;
      let productsToSet = [];
      if (Array.isArray(productsData)) {
        productsToSet = productsData;
      } else if (productsData && Array.isArray(productsData.results)) {
        productsToSet = productsData.results;
      }
      setProducts(productsToSet);
      setTotalItems(productsData.count || productsToSet.length);
      setTotalPages(Math.ceil((productsData.count || productsToSet.length) / size));
      const allBatches = productsToSet.flatMap(product => product.batches || []);
      setBatches(allBatches);

      // Process categories
      const categoriesData = categoriesResponse.data;
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else if (categoriesData && Array.isArray(categoriesData.results)) {
        setCategories(categoriesData.results);
      } else {
        console.warn("Unexpected API response format for categories.");
        setCategories([]);
      }

      // Process generic names
      const genericNamesData = genericNamesResponse.data;
      if (Array.isArray(genericNamesData)) {
        setGenericNames(genericNamesData);
      } else if (genericNamesData && Array.isArray(genericNamesData.results)) {
        setGenericNames(genericNamesData.results);
      } else {
        console.warn("Unexpected API response format for generic names.");
        setGenericNames([]);
      }

      // Process compositions
      const compositionsData = compositionsResponse.data;
      if (Array.isArray(compositionsData)) {
        setCompositions(compositionsData);
      } else if (compositionsData && Array.isArray(compositionsData.results)) {
        setCompositions(compositionsData.results);
      } else {
        console.warn("Unexpected API response format for compositions.");
        setCompositions([]);
      }

    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      console.error("Error fetching initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInitialData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Clear success message after a few seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000); // Message disappears after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const [newBatch, setNewBatch] = useState({
    product: "",
    batch_number: "",
    quantity: "",
    expiry_date: "",
    cost_price: "",
    mrp_price: "", // Add mrp_price
    discount_percentage: "", // Add discount_percentage
    selling_price: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    generic_name: "",
    strength: "",
    dosage_form: "",
    manufacturer: "MedCorp",
    is_prescription_required: false,
    hsn_code: "30041000",
    packaging_unit: "",
    pack_size: "",
    // Batch details
    batch_number: "",
    quantity: "",
    expiry_date: "",
    cost_price: "",
    mrp_price: "", // Add mrp_price for initial batch
    discount_percentage: "", // Add discount_percentage for initial batch
    selling_price: "",
    min_stock_level: "10", // Keep min_stock_level for product
    selectedCompositions: [], // Array of { composition_id, strength, unit, is_primary }
  });

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newGenericName, setNewGenericName] = useState({
    name: "",
    description: "",
  });
  const [newComposition, setNewComposition] = useState({
    name: "",
    scientific_name: "",
    description: "",
    category: "",
    side_effects: "",
    contraindications: "",
  });



  const getCategoryName = (id) =>
    categories.find((c) => c.id === id)?.name || "N/A";
  const getGenericName = (id) =>
    genericNames.find((g) => g.id === id)?.name || "N/A";

  const handleAddComposition = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createComposition(newComposition);
      setShowCompositionModal(false);
      setNewComposition({
        name: "",
        scientific_name: "",
        description: "",
        category: "",
        side_effects: "",
        contraindications: "",
      });
      fetchCompositions(); // Refetch compositions
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding composition:", error);
    }
  };

  const EditBatchForm = ({ batch, onSave, onCancel }) => {
    // Ensure mrp_price and discount_percentage are numbers, defaulting to 0 if null/undefined
    const initialMrpPrice = Number(batch.mrp_price || 0);
    const initialDiscountPercentage = Number(batch.discount_percentage || 0);

    const [discountPercentage, setDiscountPercentage] = useState(initialDiscountPercentage);

    const handleDiscountChange = (e) => {
      const value = e.target.value;
      setDiscountPercentage(value === '' ? 0 : parseFloat(value));
    };

    const handleEditSubmit = (e) => {
      e.preventDefault();
      // Basic validation for discount percentage only
      if (discountPercentage < 0 || discountPercentage > 100) {
        alert('Discount percentage must be between 0 and 100.');
        return;
      }
      // Pass only the editable field and necessary read-only fields for calculation
      onSave(batch.id, { 
        discount_percentage: discountPercentage,
        mrp_price: initialMrpPrice, // Use the ensured numeric value
        batch_number: batch.batch_number, // Include batch_number for backend lookup
        quantity: batch.current_quantity, // Include other fields to ensure partial update works correctly
        expiry_date: batch.expiry_date,
        cost_price: batch.cost_price,
      });
    };

    const calculatedSellingPrice = (initialMrpPrice - (initialMrpPrice * discountPercentage / 100)).toFixed(2);

    return (
      <form onSubmit={handleEditSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow-inner">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Edit Batch: {batch.batch_number}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initialMrpPrice}
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="discount_percentage"
              required
              value={discountPercentage}
              onChange={handleDiscountChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Selling Price (Calculated)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={calculatedSellingPrice}
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-100"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    );
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError("Please select a product first to add a batch.");
      return;
    }
    try {
      const calculatedSellingPrice = parseFloat((newBatch.mrp_price - (newBatch.mrp_price * newBatch.discount_percentage / 100)).toFixed(2));

      const batchData = {
        ...newBatch,
        product: selectedProduct.id, // Ensure the product ID is set
        selling_price: calculatedSellingPrice, // Use the calculated selling price
      };
      await productAPI.addBatch(batchData); // Use addBatch for adding new batches
      setShowAddBatchForm(false); // Hide the form
      setNewBatch({
        product: "",
        batch_number: "",
        quantity: "",
        expiry_date: "",
        cost_price: "",
        mrp_price: "",
        discount_percentage: "",
        selling_price: "",
        // is_primary: false, // Reset is_primary
      });
      fetchMedicines(); // Refetch medicines to update stock
      // Re-fetch batches for the selected product to update the modal
      const updatedProductBatches = batches.filter(
        (batch) => batch.product === selectedProduct.id
      );
      setSelectedProductBatches(updatedProductBatches);
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
        is_prescription_required: newProduct.is_prescription_required,
        pack_size: newProduct.pack_size,
        min_stock_level: newProduct.min_stock_level,
        category: newProduct.category_id,
        generic_name: newProduct.generic_name,
        dosage_form: newProduct.dosage_form,
        brand_name: newProduct.name, // Defaulting brand_name to name
        medicine_type: 'tablet', // Default
        prescription_type: newProduct.is_prescription_required ? 'prescription' : 'otc',
        hsn_code: newProduct.hsn_code,
        // The product price and mrp will be derived from the initial batch's selling_price
        price: newProduct.selling_price,
        mrp: newProduct.selling_price,
      };

      const productResponse = await productAPI.createProduct(productData);
      const productId = productResponse.data.id; // Assuming the API returns the created product with an ID

      // Link compositions if any were selected
      if (newProduct.selectedCompositions.length > 0) {
        const compositionsToLink = newProduct.selectedCompositions.map(comp => ({
          composition_id: comp.composition_id,
          strength: comp.strength,
          unit: comp.unit,
          is_primary: comp.is_primary,
        }));
        await productAPI.addCompositions(productId, { compositions: compositionsToLink });
      }

      const batchData = {
        product: productId,
        batch_number: newProduct.batch_number,
        quantity: newProduct.quantity,
        expiry_date: newProduct.expiry_date,
        cost_price: newProduct.cost_price,
        mrp_price: newProduct.mrp_price, // Pass mrp_price
        discount_percentage: newProduct.discount_percentage, // Pass discount_percentage
        selling_price: parseFloat((newProduct.mrp_price - (newProduct.mrp_price * newProduct.discount_percentage / 100)).toFixed(2)),
      };

      await productAPI.addBatch(batchData); // Using addBatch for adding initial batch
      
      setShowProductModal(false);
      setNewProduct({
        name: "",
        category_id: "",
        generic_name: "",
        strength: "",
        dosage_form: "",
        manufacturer: "MedCorp",
        is_prescription_required: false,
        hsn_code: "30041000",
        pack_size: "",
        min_stock_level: "10",
        // Reset batch details
        batch_number: "",
        quantity: "",
        expiry_date: "",
        cost_price: "",
        mrp_price: "",
        discount_percentage: "",
        selling_price: "",
        selectedCompositions: [], // Reset selected compositions
      });
      fetchMedicines(); // Refetch products
      setSuccessMessage("Product and associated compositions added successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding product or batch:", error);
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
    // Use the total_stock_quantity provided by the backend serializer for consistency
    const totalStock = product.total_stock_quantity || 0;
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
    // Filter batches directly from the product's nested batches
    setSelectedProductBatches(product.batches || []);
    console.log("Batches for selected product:", product.batches); // Debug log
    setShowViewBatchModal(true);
  };

  const openAddBatchModal = (product) => {
    setSelectedProduct(product);
    setShowViewBatchModal(true); // Open the view batches modal
    setShowAddBatchForm(true); // Show the add batch form within it
  };

  const handleUpdateBatch = async (batchId, updatedData) => {
    if (!selectedProduct) {
      setError("No product selected.");
      return;
    }
    try {
      // The updatedData already contains mrp_price and discount_percentage
      // The backend's Batch model save method will recalculate selling_price
      await productAPI.updateBatch(batchId, updatedData);
      setEditingBatch(null); // Close edit form
      fetchMedicines(); // Refetch all medicines to update UI
      // Re-fetch batches for the selected product to update the modal
      const updatedProductResponse = await productAPI.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProductResponse.data);
      setSelectedProductBatches(updatedProductResponse.data.batches || []);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error updating batch:", error);
    }
  };

  const getFirstAvailableBatch = (batches) => {
    if (!batches || batches.length === 0) {
      return null;
    }
    const today = new Date();
    // Filter for non-expired batches with quantity > 0
    const availableBatches = batches.filter(batch => {
      const expiry = new Date(batch.expiry_date);
      return expiry > today && batch.current_quantity > 0 && batch.selling_price > 0;
    });

    // Sort by expiry date (earliest first) to get the "first available" in a logical sense
    availableBatches.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

    return availableBatches.length > 0 ? availableBatches[0] : null;
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
    total_stock_quantity: products.reduce((sum, product) => sum + (product.total_stock_quantity || 0), 0),
    lowStock: products.filter(
      (p) => p.total_stock_quantity > 0 && p.total_stock_quantity < p.min_stock_level
    ).length,
    outOfStock: products.filter((p) => p.total_stock_quantity === 0).length,
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
            <button
              onClick={() => setShowCompositionModal(true)}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Composition
            </button>
            <a
              href="/purchase-returns/new"
              className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              Create Purchase Return
            </a>
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

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500">Total Stock Quantity</h3>
          <p className="text-3xl font-semibold text-gray-800">
            {stats.total_stock_quantity}
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
                  Product Selling Price
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Batch Name
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Batch Selling Price
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Total Product Qty
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Number of Batches
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
                      {product.category ? product.category_name :"N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {getGenericName(product.generic_name)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {getFirstAvailableBatch(product.batches) ? `₹${Number(getFirstAvailableBatch(product.batches).selling_price).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getFirstAvailableBatch(product.batches) ? getFirstAvailableBatch(product.batches).batch_number : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {getFirstAvailableBatch(product.batches) ? `₹${Number(getFirstAvailableBatch(product.batches).selling_price).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {product.total_stock_quantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.batches ? product.batches.length : 0}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when page size changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        )}
      </div>

      {/* --- Modals --- */}


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
                    Dosage Form (e.g., Tablet)
                  </label>
                  <input
                    type="text"
                    value={newProduct.dosage_form}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, dosage_form: e.target.value })
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

              {/* Compositions Section */}
              <h4 className="text-lg font-medium text-gray-900 mb-2 mt-4">
                Compositions
              </h4>
              <div className="space-y-3">
                {newProduct.selectedCompositions.map((comp, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 border rounded-md bg-gray-50">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Composition
                      </label>
                      <select
                        required
                        value={comp.composition_id}
                        onChange={(e) => {
                          const updatedCompositions = [...newProduct.selectedCompositions];
                          updatedCompositions[index].composition_id = e.target.value;
                          setNewProduct({ ...newProduct, selectedCompositions: updatedCompositions });
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Composition</option>
                        {compositions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Strength
                      </label>
                      <input
                        type="text"
                        required
                        value={comp.strength}
                        onChange={(e) => {
                          const updatedCompositions = [...newProduct.selectedCompositions];
                          updatedCompositions[index].strength = e.target.value;
                          setNewProduct({ ...newProduct, selectedCompositions: updatedCompositions });
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit
                      </label>
                      <input
                        type="text"
                        required
                        value={comp.unit}
                        onChange={(e) => {
                          const updatedCompositions = [...newProduct.selectedCompositions];
                          updatedCompositions[index].unit = e.target.value;
                          setNewProduct({ ...newProduct, selectedCompositions: updatedCompositions });
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-center justify-between md:col-span-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={comp.is_primary}
                          onChange={(e) => {
                            const updatedCompositions = newProduct.selectedCompositions.map((item, i) => ({
                              ...item,
                              is_primary: i === index ? e.target.checked : false, // Only one can be primary
                            }));
                            setNewProduct({ ...newProduct, selectedCompositions: updatedCompositions });
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Primary Composition
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCompositions = newProduct.selectedCompositions.filter((_, i) => i !== index);
                          setNewProduct({ ...newProduct, selectedCompositions: updatedCompositions });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setNewProduct({
                      ...newProduct,
                      selectedCompositions: [
                        ...newProduct.selectedCompositions,
                        { composition_id: "", strength: "", unit: "", is_primary: false },
                      ],
                    })
                  }
                  className="mt-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Add Another Composition
                </button>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-2 mt-4">
                Initial Batch Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.batch_number}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, batch_number: e.target.value })
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
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, quantity: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newProduct.expiry_date}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, expiry_date: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.cost_price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, cost_price: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.mrp_price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, mrp_price: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={newProduct.discount_percentage}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, discount_percentage: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selling Price (Calculated)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      (newProduct.mrp_price - (newProduct.mrp_price * newProduct.discount_percentage / 100)).toFixed(2)
                    }
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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

      {/* Add Composition Modal */}
      {showCompositionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Composition
            </h3>
            <form onSubmit={handleAddComposition} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Composition Name
                </label>
                <input
                  type="text"
                  required
                  value={newComposition.name}
                  onChange={(e) =>
                    setNewComposition({ ...newComposition, name: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={newComposition.scientific_name}
                  onChange={(e) =>
                    setNewComposition({
                      ...newComposition,
                      scientific_name: e.target.value,
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
                  value={newComposition.description}
                  onChange={(e) =>
                    setNewComposition({
                      ...newComposition,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={newComposition.category}
                  onChange={(e) =>
                    setNewComposition({ ...newComposition, category: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Side Effects
                </label>
                <textarea
                  value={newComposition.side_effects}
                  onChange={(e) =>
                    setNewComposition({
                      ...newComposition,
                      side_effects: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contraindications
                </label>
                <textarea
                  value={newComposition.contraindications}
                  onChange={(e) =>
                    setNewComposition({
                      ...newComposition,
                      contraindications: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCompositionModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Composition
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
                      MRP
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Discount (%)
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Selling Price
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Expiry Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductBatches.map((batch) => {
                    const { status, color } = getExpiryStatus(
                      batch.expiry_date
                    );
                    const calculatedSellingPrice = (batch.mrp_price - (batch.mrp_price * batch.discount_percentage / 100)).toFixed(2);

                    return (
                      <React.Fragment key={batch.id}>
                        <tr
                          className={`border-b bg-white hover:bg-gray-50`}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {batch.batch_number}
                          </td>
                          <td className="px-6 py-4">{batch.current_quantity}</td>
                          <td className="px-6 py-4">
                            ₹{batch.mrp_price}
                          </td>
                          <td className="px-6 py-4">
                            {batch.discount_percentage }%
                          </td>
                          <td className="px-6 py-4">
                            {/* Display expiry date */}
                            {new Date(batch.expiry_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            ₹{Number(batch.selling_price).toFixed(2)}
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
                              onClick={() => setEditingBatch(batch)}
                              className="font-medium text-indigo-600 hover:underline mr-2"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                        {editingBatch && editingBatch.id === batch.id && (
                          <tr className="bg-gray-100">
                            <td colSpan="8" className="p-4">
                              <EditBatchForm
                                batch={editingBatch}
                                onSave={handleUpdateBatch}
                                onCancel={() => setEditingBatch(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setShowAddBatchForm(!showAddBatchForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showAddBatchForm ? "Cancel Add Batch" : "Add New Batch"}
              </button>
              <button
                onClick={() => setShowViewBatchModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>

            {showAddBatchForm && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Batch for {selectedProduct.name}
                </h4>
                <form onSubmit={handleAddBatch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        MRP (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newBatch.mrp_price}
                        onChange={(e) =>
                          setNewBatch({ ...newBatch, mrp_price: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={newBatch.discount_percentage}
                        onChange={(e) =>
                          setNewBatch({ ...newBatch, discount_percentage: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Selling Price (Calculated)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          (newBatch.mrp_price - (newBatch.mrp_price * newBatch.discount_percentage / 100)).toFixed(2)
                        }
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                   
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddBatchForm(false)}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
