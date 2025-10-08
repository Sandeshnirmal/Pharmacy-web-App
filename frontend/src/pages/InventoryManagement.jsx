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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGenericNameModal, setShowGenericNameModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [showAddBatchForm, setShowAddBatchForm] = useState(false); // New state for add batch form visibility

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
      const fetchedProducts = Array.isArray(response.data)? response.data:response.data.results || [];
      setProducts(fetchedProducts);

      // Extract all batches from the fetched products
      const allBatches = fetchedProducts.flatMap(product => product.batches || []);
      setBatches(allBatches);

    } catch(error){
      const errorInfo = apiUtils.handleError(error);
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
    is_primary: false, // Add is_primary to newBatch state
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
    selling_price: "",
    is_primary: false, // Add is_primary to newProduct's initial batch details
    min_stock_level: "10", // Keep min_stock_level for product
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
      const batchData = {
        ...newBatch,
        product: selectedProduct.id, // Ensure the product ID is set
      };
      await productAPI.createBatch(selectedProduct.id, batchData); // Use createBatch for adding new batches
      setShowAddBatchForm(false); // Hide the form
      setNewBatch({
        product: "",
        batch_number: "",
        quantity: "",
        expiry_date: "",
        cost_price: "",
        selling_price: "",
        is_primary: false, // Reset is_primary
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

      const batchData = {
        product: productId,
        batch_number: newProduct.batch_number,
        quantity: newProduct.quantity,
        expiry_date: newProduct.expiry_date,
        cost_price: newProduct.cost_price,
        selling_price: newProduct.selling_price,
        is_primary: newProduct.is_primary, // Pass is_primary for initial batch
      };

      await productAPI.createBatch(productId, batchData); // Using createBatch for adding initial batch
      
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
        selling_price: "",
        is_primary: false, // Reset is_primary
      });
      fetchMedicines(); // Refetch products
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
    // Use the stock_quantity provided by the backend serializer
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
    total_stock_quantity: products.reduce((sum, product) => sum + (product.stock_quantity || 0), 0),
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

  const handleSetPrimaryBatch = async (batchId) => {
    if (!selectedProduct) {
      setError("No product selected.");
      return;
    }
    try {
      // Call the updateStock API with set_as_primary: true
      await productAPI.updateStock(selectedProduct.id, {
        batch_id: batchId,
        set_as_primary: true,
        // No quantity or operation needed if just setting primary, but API expects it.
        // We can send a dummy quantity and 'set' operation if the backend requires it.
        quantity: selectedProductBatches.find(b => b.id === batchId)?.current_quantity || 0,
        operation: 'set'
      });
      fetchMedicines(); // Refetch all medicines to update UI
      // Re-fetch batches for the selected product to update the modal
      const updatedProductResponse = await productAPI.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProductResponse.data);
      setSelectedProductBatches(updatedProductResponse.data.batches || []);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error setting primary batch:", error);
    }
  };

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
                  Selling Price
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
                      ₹{product.current_selling_price !== null && product.current_selling_price !== undefined ? Number(product.current_selling_price).toFixed(2) : 'N/A'}
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
                        onClick={() => handleViewBatches(product)}
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
                    Selling Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.selling_price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, selling_price: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center col-span-full md:col-span-1">
                  <input
                    type="checkbox"
                    checked={newProduct.is_primary}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        is_primary: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Set as Primary Batch?
                  </label>
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
                      Selling Price
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Expiry Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Primary
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
                    return (
                      <tr
                        key={batch.id}
                        className={`border-b ${
                          batch.is_primary ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {batch.batch_number}
                        </td>
                        <td className="px-6 py-4">{batch.current_quantity}</td>
                        <td className="px-6 py-4">
                          {/* Display expiry date */}
                          {new Date(batch.expiry_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          ₹{batch.selling_price !== null && batch.selling_price !== undefined ? Number(batch.selling_price).toFixed(2) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {batch.is_primary ? (
                            <span className="text-green-600 font-bold">Primary</span>
                          ) : (
                            "No"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!batch.is_primary && (
                            <button
                              onClick={() => handleSetPrimaryBatch(batch.id)}
                              className="font-medium text-purple-600 hover:underline"
                            >
                              Set as Primary
                            </button>
                          )}
                        </td>
                      </tr>
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
                        Selling Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newBatch.selling_price}
                        onChange={(e) =>
                          setNewBatch({ ...newBatch, selling_price: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-center col-span-full md:col-span-1">
                      <input
                        type="checkbox"
                        checked={newBatch.is_primary}
                        onChange={(e) =>
                          setNewBatch({
                            ...newBatch,
                            is_primary: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Set as Primary Batch?
                      </label>
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
