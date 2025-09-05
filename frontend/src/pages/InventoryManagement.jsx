import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
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
  const [categories, setCategories] = useState([]);
  const [genericNames, setGenericNames] = useState([]);

  const [newBatch, setNewBatch] = useState({
    batch_number: "",
    quantity: "",
    current_quantity: "",
    expiry_date: "",
    cost_price: "",
    selling_price: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    generic_name_id: "",
    strength: "",
    form: "",
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

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const [newGenericName, setNewGenericName] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [productsRes, batchesRes, categoriesRes, genericNamesRes] =
        await Promise.all([
          axiosInstance.get("/api/products/enhanced-products/"),
          axiosInstance.get("/api/products/legacy/batches/"),
          axiosInstance.get("product/legacy/categories/"),
          axiosInstance.get("api/products/compositions/"),
        ]);

      setProducts(productsRes.data.results || productsRes.data);
      setBatches(batchesRes.data.results || batchesRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setGenericNames(genericNamesRes.data.results || genericNamesRes.data);
    } catch (err) {
      setError("Failed to fetch inventory data");
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/api/products/legacy/batches/", {
        ...newBatch,
        product: selectedProduct.id,
      });
      setShowBatchModal(false);
      setNewBatch({
        batch_number: "",
        quantity: "",
        current_quantity: "",
        expiry_date: "",
        cost_price: "",
        selling_price: "",
      });
      await fetchInventoryData();
    } catch (err) {
      console.error("Error adding batch:", err);
      setError("Failed to add batch");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("product/enhanced-products/", newProduct);
      setShowProductModal(false);
      setNewProduct({
        name: "",
        category_id: "",
        generic_name_id: "",
        strength: "",
        form: "",
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
      await fetchInventoryData();
    } catch (err) {
      console.error("Error adding product:", err);
      setError("Failed to add product");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("product/legacy/categories/", newCategory);
      setShowCategoryModal(false);
      setNewCategory({
        name: "",
        description: "",
      });
      await fetchInventoryData();
    } catch (err) {
      console.error("Error adding category:", err);
      setError("Failed to add category");
    }
  };

  const handleAddGenericName = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("api/products/compositions/", newGenericName);
      setShowGenericNameModal(false);
      setNewGenericName({
        name: "",
        description: "",
      });
      await fetchInventoryData();
    } catch (err) {
      console.error("Error adding generic name:", err);
      setError("Failed to add generic name");
    }
  };

  const getStockStatus = (product) => {
    const totalStock = product.stock_quantity || 0;
    if (totalStock === 0) {
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    } else if (totalStock < 10) {
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    } else if (totalStock < 50) {
      return { status: "Medium Stock", color: "bg-blue-100 text-blue-800" };
    } else {
      return { status: "In Stock", color: "bg-green-100 text-green-800" };
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: "Expired", color: "bg-red-100 text-red-800" };
    } else if (daysUntilExpiry < 30) {
      return {
        status: "Expiring Soon",
        color: "bg-yellow-100 text-yellow-800",
      };
    } else if (daysUntilExpiry < 90) {
      return {
        status: "Expires in 3 months",
        color: "bg-blue-100 text-blue-800",
      };
    } else {
      return { status: "Good", color: "bg-green-100 text-green-800" };
    }
  };

  const handleViewBatches = (product) => {
    setSelectedProduct(product);
    const productBatches = batches.filter(
      (batch) => batch.product === product.id
    );
    setSelectedProductBatches(productBatches);
    setShowViewBatchModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchTerm ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.generic_name?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const stockStatus = getStockStatus(product);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && stockStatus.status === "Low Stock") ||
      (stockFilter === "out" && stockStatus.status === "Out of Stock") ||
      (stockFilter === "in" && stockStatus.status === "In Stock");

    return matchesSearch && matchesStock;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              Inventory Management
            </h1>
            <p className="text-gray-600">
              Track medicines, stock levels, categories, and expiry dates
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowGenericNameModal(true)}
              className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-2 rounded font-medium transition-colors"
            >
              Add Generic Name
            </button>
            <button
              onClick={() => setShowProductModal(true)}
              className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-2 rounded font-medium transition-colors"
            >
              Add Medicine
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-gray-600 text-white hover:bg-gray-500 px-6 py-2 rounded font-medium transition-colors"
            >
              Add Category
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="bg-gray-400 text-white hover:bg-gray-300 px-6 py-2 rounded font-medium transition-colors"
            >
              Add Stock
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards, Filters, and Table remain the same... */}

      {/* Add Generic Name Modal */}
      {showGenericNameModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Paracetamol"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newGenericName.description}
                    onChange={(e) =>
                      setNewGenericName({
                        ...newGenericName,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the generic name..."
                  />
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
        </div>
      )}

      {/* Other modals (Add Batch, Add Product, Add Category, View Batches) remain the same... */}
    </div>
  );
};

export default InventoryManagement;
