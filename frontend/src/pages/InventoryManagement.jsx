import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance'
import { apiUtils, productAPI } from "../api/apiService";

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genericNames, setGenericNames] = useState([]);
  const [compositions, setCompositions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [showAddBatchForm, setShowAddBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null); // State to hold product being edited

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingGenericName, setEditingGenericName] = useState(null);
  const [editingComposition, setEditingComposition] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [viewingGenericName, setViewingGenericName] = useState(null);
  const [viewingComposition, setViewingComposition] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductBatches, setSelectedProductBatches] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  const [currentView, setCurrentView] = useState('main'); // 'main', 'categories', 'generic-names', 'compositions'

  const fetchAllInitialData = async (page, size) => {
    setLoading(true);
    setError(null);
    try {
      const [
        productsResponse,
        categoriesResponse,
        genericNamesResponse,
        compositionsResponse,
      ] = await Promise.all([
        productAPI.getProducts(page, size),
        productAPI.getCategories(),
        productAPI.getGenericNames(),
        productAPI.getCompositions(),
      ]);

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

      const categoriesData = categoriesResponse.data;
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        console.log(categoriesData)
      } else if (categoriesData && Array.isArray(categoriesData.results)) {
        setCategories(categoriesData.results);
      } else {
        console.warn("Unexpected API response format for categories.");
        setCategories([]);
      }

      const genericNamesData = genericNamesResponse.data;
      if (Array.isArray(genericNamesData)) {
        setGenericNames(genericNamesData);
      } else if (genericNamesData && Array.isArray(genericNamesData.results)) {
        setGenericNames(genericNamesData.results);
      } else {
        console.warn("Unexpected API response format for generic names.");
        setGenericNames([]);
      }

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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const [newBatch, setNewBatch] = useState({
    product: "",
    batch_number: "",
    ordered_quantity_display: "", // User-entered quantity in selected unit
    expiry_date: "",
    cost_price: "",
    mrp_price: "",
    discount_percentage: "",
    selling_price: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    brand_name: "", // Added
    category_id: "",
    generic_name: "",
    medicine_type: "tablet", // Default but allow selection
    prescription_type: "otc", // Added, default to 'otc'
    min_stock_level: "10",
    description: "", // Added
    uses: "", // Added
    side_effects: "", // Added
    how_to_use: "", // Added
    precautions: "", // Added
    storage: "", // Added
    image: null, // Changed from image_url to image, and default to null for file input
    hsn_code: "",
    is_active: true, // Added, default true
    is_featured: false, // Added, default false
    manufacturer: "MedCorp",
    selectedCompositions: [], // Now stores only IDs
    currentImage: null, // To store the URL of the current image when editing
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
  // The getGenericName function is no longer needed as generic_name is now a string from the serializer.
  // const getGenericName = (id) =>
  //   genericNames.find((g) => g.id === id)?.name || "N/A";

  const fetchCompositions = async () => {
    try {
      const response = await productAPI.getCompositions();
      const data = response.data;
      if (Array.isArray(data)) {
        setCompositions(data);
      } else if (data && Array.isArray(data.results)) {
        setCompositions(data.results);
      } else {
        console.warn("Unexpected API response format for compositions.");
        setCompositions([]);
      }
    } catch (error) {
      console.error("Error fetching compositions:", error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await productAPI.getCategories();
      const data = response.data;
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && Array.isArray(data.results)) {
        setCategories(data.results);
      } else {
        console.warn("Unexpected API response format for categories.");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await productAPI.getProducts(currentPage, pageSize);
      const data = response.data;
      let productsToSet = [];
      if (Array.isArray(data)) {
        productsToSet = data;
      } else if (data && Array.isArray(data.results)) {
        productsToSet = data.results;
      }
      setProducts(productsToSet);
      setTotalItems(data.count || productsToSet.length);
      setTotalPages(Math.ceil((data.count || productsToSet.length) / pageSize));
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const fetchGenericNames = async () => {
    try {
      const response = await productAPI.getGenericNames();
      const data = response.data;
      if (Array.isArray(data)) {
        setGenericNames(data);
      } else if (data && Array.isArray(data.results)) {
        setGenericNames(data.results);
      } else {
        console.warn("Unexpected API response format for generic names.");
        setGenericNames([]);
      }
    } catch (error) {
      console.error("Error fetching generic names:", error);
    }
  };


  const EditBatchForm = ({ batch, onSave, onCancel }) => {
    const initialMrpPrice = Number(batch.mrp_price || 0);
    const initialDiscountPercentage = Number(batch.discount_percentage || 0);

    const [discountPercentage, setDiscountPercentage] = useState(initialDiscountPercentage);

    const handleDiscountChange = (e) => {
      const value = e.target.value;
      setDiscountPercentage(value === '' ? 0 : parseFloat(value));
    };

    const handleEditSubmit = (e) => {
      e.preventDefault();
      if (discountPercentage < 0 || discountPercentage > 100) {
        alert('Discount percentage must be between 0 and 100.');
        return;
      }
      onSave(batch.id, {
        discount_percentage: discountPercentage,
        mrp_price: initialMrpPrice,
        batch_number: batch.batch_number,
        quantity: batch.current_quantity,
        expiry_date: batch.expiry_date,
        cost_price: batch.cost_price,
        // Include other fields that might be part of a batch update
        online_mrp_price: batch.online_mrp_price,
        online_discount_percentage: batch.online_discount_percentage,
        offline_mrp_price: batch.offline_mrp_price,
        offline_discount_percentage: batch.offline_discount_percentage,
        manufacturing_date: batch.manufacturing_date,
        mfg_license_number: batch.mfg_license_number,
        is_primary: batch.is_primary,
        selling_price: calculatedSellingPrice, // Include calculated selling price
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
        product: selectedProduct.id,
        batch_number: newBatch.batch_number,
        quantity: newBatch.ordered_quantity_display, // Send display quantity
        expiry_date: newBatch.expiry_date,
        cost_price: newBatch.cost_price,
        mrp_price: newBatch.mrp_price,
        discount_percentage: newBatch.discount_percentage,
        selling_price: calculatedSellingPrice,
      };
      await productAPI.addBatch(batchData);
      setSuccessMessage("Batch added successfully!");
      setShowAddBatchForm(false);
      setNewBatch({
        product: "",
        batch_number: "",
        ordered_quantity_display: "",
        product_unit_id: "",
        expiry_date: "",
        cost_price: "",
        mrp_price: "",
        discount_percentage: "",
        selling_price: "",
      });
      fetchMedicines(); // Refresh overall product list
      // Re-fetch the specific product to get its updated batches
      const updatedProductResponse = await productAPI.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProductResponse.data);
      setSelectedProductBatches(updatedProductResponse.data.batches || []);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding stock:", error);
    }
  };

  const resetProductForm = () => {
    setNewProduct({
      name: "",
      brand_name: "",
      category_id: "",
      generic_name: "",
      medicine_type: "tablet",
      prescription_type: "otc",
      min_stock_level: "10",
      description: "",
      uses: "",
      side_effects: "",
      how_to_use: "",
      precautions: "",
      storage: "",
      image: null,
      hsn_code: "",
      is_active: true,
      is_featured: false,
      manufacturer: "MedCorp",
      selectedCompositions: [],
      currentImage: null,
    });
    setEditingProduct(null);
    setShowProductModal(false);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("brand_name", newProduct.brand_name || newProduct.name);
      formData.append("generic_name_id", newProduct.generic_name); // generic_name now holds the ID
      formData.append("manufacturer", newProduct.manufacturer);
      formData.append("medicine_type", newProduct.medicine_type);
      formData.append("prescription_type", newProduct.prescription_type);
      formData.append("min_stock_level", newProduct.min_stock_level);
      formData.append("description", newProduct.description);
      formData.append("uses", newProduct.uses);
      formData.append("side_effects", newProduct.side_effects);
      formData.append("how_to_use", newProduct.how_to_use);
      formData.append("precautions", newProduct.precautions);
      formData.append("storage", newProduct.storage);
      console.log("DEBUG: newProduct.image state before appending:", newProduct.image, "Type:", typeof newProduct.image, "Is File instance:", newProduct.image instanceof File);

      // Handle image upload:
      if (newProduct.image instanceof File) {
        // If a new file is selected, append it.
        formData.append("image", newProduct.image);
        console.log("DEBUG: Appending new image file.");
      } else if (editingProduct && newProduct.currentImage) {
        // If editing an existing product and no new file is selected, and there's an existing image,
        // we don't append anything for 'image' to retain the current one.
        // The backend should handle the absence of the field as "keep current image".
        console.log("DEBUG: Editing existing product, no new image selected. Retaining current image.");
      } else if (editingProduct && !newProduct.currentImage) {
        // If editing an existing product, no new file is selected, and there was no current image,
        // explicitly send null to ensure the field is present but empty.
        formData.append("image", ""); // Sending an empty string for file fields often works as null
        console.log("DEBUG: Editing existing product, no new image selected, and no current image. Sending empty string for 'image'.");
      } else if (!editingProduct && !newProduct.image) {
        // For a new product without an image, do not append the field.
        console.log("DEBUG: New product without image. 'image' field not appended to FormData.");
      }
      formData.append("hsn_code", newProduct.hsn_code);
      formData.append("category_id", newProduct.category_id); // Use category_id
      formData.append("is_active", newProduct.is_active);
      formData.append("is_featured", newProduct.is_featured);

      // Prepare composition IDs for the backend by appending each ID with '[]'
      const filteredCompositions = newProduct.selectedCompositions.filter(id => id !== null && id !== undefined);
      if (filteredCompositions.length > 0) {
        filteredCompositions.forEach(id => {
          formData.append("composition_ids[]", id); // Use '[]' to indicate a list
        });
      } else {
        // If no compositions are selected, append an empty array indicator if the backend expects it.
        // For DRF, sometimes omitting it is fine, but sending an empty array explicitly can be safer.
        // We'll append an empty string with '[]' to signify an empty list.
        formData.append("composition_ids[]", "");
      }
      // Log the formData before sending the request
      console.log("FormData contents for composition_ids:");
      for (let pair of formData.entries()) {
        if (pair[0].startsWith("composition_ids")) {
          console.log(pair[0] + ': ' + pair[1]);
        }
      }
      // Log the formData before sending the request
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if (editingProduct) {
        // Update existing product
        await productAPI.updateProduct(editingProduct.id, formData);
        setSuccessMessage("Product updated successfully!");
      } else {
        // Create new product
        await productAPI.createProduct(formData);
        setSuccessMessage("Product added successfully!");
      }

      resetProductForm();
      fetchMedicines();
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error saving product:", error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      brand_name: product.brand_name,
      category_id: product.category ? product.category.id : "",
      generic_name: genericNames.find(gn => gn.name === product.generic_name)?.id || "", // Map generic name string to ID
      manufacturer: product.manufacturer,
      medicine_type: product.medicine_type,
      prescription_type: product.prescription_type,
      min_stock_level: product.min_stock_level,
      description: product.description,
      uses: product.uses,
      side_effects: product.side_effects,
      how_to_use: product.how_to_use,
      precautions: product.precautions,
      storage: product.storage,
      image: null, // File input should be null, currentImage will show existing
      hsn_code: product.hsn_code,
      is_active: product.is_active,
      is_featured: product.is_featured,
      selectedCompositions: product.compositions_detail.map(comp => comp.composition), // Use compositions_detail
      currentImage: product.image, // Store current image URL for display
    });
    setShowProductModal(true);
  };

  const handleAddCategory = async (categoryData) => {
    try {
      await productAPI.createCategory(categoryData);
      fetchCategory();
      setSuccessMessage("Category added successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding category:", error);
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData) => {
    try {
      await productAPI.updateCategory(categoryId, categoryData);
      fetchCategory();
      setSuccessMessage("Category updated successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error updating category:", error);
    }
  };

  const handleAddGenericName = async (genericNameData) => {
    try {
      await productAPI.createGenericName(genericNameData);
      fetchGenericNames();
      setSuccessMessage("Generic Name added successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding generic name:", error);
    }
  };

  const handleUpdateGenericName = async (genericNameId, genericNameData) => {
    try {
      await productAPI.updateGenericName(genericNameId, genericNameData);
      fetchGenericNames();
      setSuccessMessage("Generic Name updated successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error updating generic name:", error);
    }
  };

  const handleAddComposition = async (compositionData) => {
    try {
      await productAPI.createComposition(compositionData);
      fetchCompositions();
      setSuccessMessage("Composition added successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error adding composition:", error);
    }
  };

  const handleUpdateComposition = async (compositionId, compositionData) => {
    try {
      await productAPI.updateComposition(compositionId, compositionData);
      fetchCompositions();
      setSuccessMessage("Composition updated successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error updating composition:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        await productAPI.deleteCategory(categoryId);
        fetchCategory();
        setSuccessMessage("Category deleted successfully!");
      } catch (error) {
        const errorInfo = apiUtils.handleError(error);
        setError(errorInfo.message);
        console.error("Error deleting category:", error);
      }
    }
  };

  const getStockStatus = (product) => {
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
    setSelectedProductBatches(product.batches || []);
    setShowViewBatchModal(true);
  };

  const openAddBatchModal = (product) => {
    setSelectedProduct(product);
    setShowViewBatchModal(true);
    setShowAddBatchForm(true);
  };

  const handleUpdateBatch = async (batchId, updatedData) => {
    if (!selectedProduct) {
      setError("No product selected.");
      return;
    }
    try {
      await productAPI.updateBatch(batchId, updatedData);
      setEditingBatch(null);
      fetchMedicines();
      const updatedProductResponse = await productAPI.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProductResponse.data);
      setSelectedProductBatches(updatedProductResponse.data.batches || []);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error updating batch:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await productAPI.deleteProduct(productId);
        fetchMedicines();
        setSuccessMessage("Product deleted successfully!");
      } catch (error) {
        const errorInfo = apiUtils.handleError(error);
        setError(errorInfo.message);
        console.error("Error deleting product:", error);
      }
    }
  };

  const getFirstAvailableBatch = (batches) => {
    if (!batches || batches.length === 0) {
      return null;
    }
    const today = new Date();
    const availableBatches = batches.filter(batch => {
      const expiry = new Date(batch.expiry_date);
      return expiry > today && batch.current_quantity > 0 && batch.selling_price > 0;
    });

    availableBatches.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

    return availableBatches.length > 0 ? availableBatches[0] : null;
  };

      const filteredProducts = products.filter((product) => {
    // generic_name is now a string directly from the serializer
    const genericName = product.generic_name || ""; 
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

  const CategoriesPage = () => {
    const [addCategoryName, setAddCategoryName] = useState("");
    const [addCategoryDescription, setAddCategoryDescription] = useState("");

    const [editCategoryName, setEditCategoryName] = useState("");
    const [editCategoryDescription, setEditCategoryDescription] = useState("");

    useEffect(() => {
      if (editingCategory) {
        setEditCategoryName(editingCategory.name);
        setEditCategoryDescription(editingCategory.description);
      }
    }, [editingCategory]);

    const handleAddCategorySubmit = async (e) => {
      e.preventDefault();
      await handleAddCategory({ name: addCategoryName, description: addCategoryDescription });
      setAddCategoryName("");
      setAddCategoryDescription("");
    };

    const handleUpdateCategorySubmit = async (e) => {
      e.preventDefault();
      await handleUpdateCategory(editingCategory.id, { name: editCategoryName, description: editCategoryDescription });
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryDescription("");
    };

    if (viewingCategory) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">View Category</h1>
            <button
                onClick={() => setViewingCategory(null)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
                Back to Categories
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p><strong>Name:</strong> {viewingCategory.name}</p>
            <p><strong>Description:</strong> {viewingCategory.description}</p>
          </div>
        </div>
      )
    }

    if (editingCategory) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Edit Category</h1>
            <button
                onClick={() => setEditingCategory(null)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
                Cancel
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleUpdateCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Manage Categories</h1>
              <button
                  onClick={() => setCurrentView('main')}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                  Back to Inventory
              </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Category</h2>
              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addCategoryName}
                    onChange={(e) => setAddCategoryName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={addCategoryDescription}
                    onChange={(e) => setAddCategoryDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Category
                  </button>
                </div>
              </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Categories</h2>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                          <tr>
                              <th scope="col" className="px-6 py-3">Name</th>
                              <th scope="col" className="px-6 py-3">Description</th>
                              <th scope="col" className="px-6 py-3 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {categories.map((category) => (
                              <tr key={category.id} className="bg-white border-b hover:bg-gray-50">
                                  <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                                  <td className="px-6 py-4">{category.description}</td>
                                  <td className="px-6 py-4 text-center">
                                      <button
                                          onClick={() => {
                                            setEditingCategory(category);
                                          }}
                                          className="font-medium text-indigo-600 hover:underline mr-2"
                                      >
                                          Edit
                                      </button>
                                      <button
                                          onClick={() => setViewingCategory(category)}
                                          className="font-medium text-blue-600 hover:underline mr-2"
                                      >
                                          View
                                      </button>
                                      <button
                                          onClick={() => handleDeleteCategory(category.id)}
                                          className="font-medium text-red-600 hover:underline"
                                      >
                                          Delete
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    );
  }

  const GenericNamesPage = () => {
    const [addGenericNameName, setAddGenericNameName] = useState("");
    const [addGenericNameDescription, setAddGenericNameDescription] = useState("");

    const [editGenericNameName, setEditGenericNameName] = useState("");
    const [editGenericNameDescription, setEditGenericNameDescription] = useState("");

    useEffect(() => {
      if (editingGenericName) {
        setEditGenericNameName(editingGenericName.name);
        setEditGenericNameDescription(editingGenericName.description);
      }
    }, [editingGenericName]);

    const handleAddGenericNameSubmit = async (e) => {
      e.preventDefault();
      await handleAddGenericName({ name: addGenericNameName, description: addGenericNameDescription });
      setAddGenericNameName("");
      setAddGenericNameDescription("");
    };

    const handleUpdateGenericNameSubmit = async (e) => {
      e.preventDefault();
      await handleUpdateGenericName(editingGenericName.id, { name: editGenericNameName, description: editGenericNameDescription });
      setEditingGenericName(null);
      setEditGenericNameName("");
      setEditGenericNameDescription("");
    };

    const handleDeleteGenericName = async (genericNameId) => {
      if (window.confirm("Are you sure you want to delete this generic name? This action cannot be undone.")) {
        try {
          await productAPI.deleteGenericName(genericNameId);
          fetchGenericNames();
          setSuccessMessage("Generic Name deleted successfully!");
        } catch (error) {
          const errorInfo = apiUtils.handleError(error);
          setError(errorInfo.message);
          console.error("Error deleting generic name:", error);
        }
      }
    };

    if (viewingGenericName) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">View Generic Name</h1>
            <button
                onClick={() => setViewingGenericName(null)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
                Back to Generic Names
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p><strong>Name:</strong> {viewingGenericName.name}</p>
            <p><strong>Description:</strong> {viewingGenericName.description}</p>
          </div>
        </div>
      )
    }

    if (editingGenericName) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Edit Generic Name</h1>
            <button
                onClick={() => setEditingGenericName(null)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
                Cancel
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleUpdateGenericNameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Generic Name
                </label>
                <input
                  type="text"
                  required
                  value={editGenericNameName}
                  onChange={(e) => setEditGenericNameName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editGenericNameDescription}
                  onChange={(e) => setEditGenericNameDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Generic Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Manage Generic Names</h1>
              <button
                  onClick={() => setCurrentView('main')}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                  Back to Inventory
              </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Generic Name</h2>
              <form onSubmit={handleAddGenericNameSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addGenericNameName}
                    onChange={(e) => setAddGenericNameName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={addGenericNameDescription}
                    onChange={(e) => setAddGenericNameDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Generic Name
                  </button>
                </div>
              </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Generic Names</h2>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                          <tr>
                              <th scope="col" className="px-6 py-3">Name</th>
                              <th scope="col" className="px-6 py-3">Description</th>
                              <th scope="col" className="px-6 py-3 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {genericNames.map((gn) => (
                              <tr key={gn.id} className="bg-white border-b hover:bg-gray-50">
                                  <td className="px-6 py-4 font-medium text-gray-900">{gn.name}</td>
                                  <td className="px-6 py-4">{gn.description}</td>
                                  <td className="px-6 py-4 text-center">
                                      <button
                                          onClick={() => {
                                            setEditingGenericName(gn);
                                          }}
                                          className="font-medium text-indigo-600 hover:underline mr-2"
                                      >
                                          Edit
                                      </button>
                                      <button
                                          onClick={() => setViewingGenericName(gn)}
                                          className="font-medium text-blue-600 hover:underline mr-2"
                                      >
                                          View
                                      </button>
                                      <button
                                          onClick={() => handleDeleteGenericName(gn.id)}
                                          className="font-medium text-red-600 hover:underline"
                                      >
                                          Delete
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    );
  }

  const CompositionsPage = () => {
    const [addCompositionName, setAddCompositionName] = useState("");
    const [addScientificName, setAddScientificName] = useState("");
    const [addDescription, setAddDescription] = useState("");
    const [addCategory, setAddCategory] = useState("");
    const [addSideEffects, setAddSideEffects] = useState("");
    const [addContraindications, setAddContraindications] = useState("");

    const [editCompositionName, setEditCompositionName] = useState("");
    const [editScientificName, setEditScientificName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editSideEffects, setEditSideEffects] = useState("");
    const [editContraindications, setEditContraindications] = useState("");

    useEffect(() => {
      if (editingComposition) {
        setEditCompositionName(editingComposition.name);
        setEditScientificName(editingComposition.scientific_name);
        setEditDescription(editingComposition.description);
        setEditCategory(editingComposition.category);
        setEditSideEffects(editingComposition.side_effects);
        setEditContraindications(editingComposition.contraindications);
      }
    }, [editingComposition]);

    const handleAddCompositionSubmit = async (e) => {
      e.preventDefault();
      await handleAddComposition({
        name: addCompositionName,
        scientific_name: addScientificName,
        description: addDescription,
        category: addCategory,
        side_effects: addSideEffects,
        contraindications: addContraindications,
      });
      setAddCompositionName("");
      setAddScientificName("");
      setAddDescription("");
      setAddCategory("");
      setAddSideEffects("");
      setAddContraindications("");
    };

    const handleUpdateCompositionSubmit = async (e) => {
      e.preventDefault();
      await handleUpdateComposition(editingComposition.id, {
        name: editCompositionName,
        scientific_name: editScientificName,
        description: editDescription,
        category: editCategory,
        side_effects: editSideEffects,
        contraindications: editContraindications,
      });
      setEditingComposition(null);
      setEditCompositionName("");
      setEditScientificName("");
      setEditDescription("");
      setEditCategory("");
      setEditSideEffects("");
      setEditContraindications("");
    };

    const handleDeleteComposition = async (compositionId) => {
      if (window.confirm("Are you sure you want to delete this composition? This action cannot be undone.")) {
        try {
          await productAPI.deleteComposition(compositionId);
          fetchCompositions();
          setSuccessMessage("Composition deleted successfully!");
        } catch (error) {
          const errorInfo = apiUtils.handleError(error);
          setError(errorInfo.message);
          console.error("Error deleting composition:", error);
        }
      }
    };

    if (viewingComposition) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">View Composition</h1>
            <button
                onClick={() => setViewingComposition(null)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
                Back to Compositions
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p><strong>Name:</strong> {viewingComposition.name}</p>
            <p><strong>Scientific Name:</strong> {viewingComposition.scientific_name}</p>
            <p><strong>Description:</strong> {viewingComposition.description}</p>
            <p><strong>Category:</strong> {viewingComposition.category}</p>
            <p><strong>Side Effects:</strong> {viewingComposition.side_effects}</p>
            <p><strong>Contraindications:</strong> {viewingComposition.contraindications}</p>
          </div>
        </div>
      )
    }

    if (editingComposition) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Edit Composition</h1>
            <button
                onClick={() => setEditingComposition(null)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
                Cancel
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleUpdateCompositionSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                  type="text"
                  required
                  value={editCompositionName}
                  onChange={(e) => setEditCompositionName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={editScientificName}
                  onChange={(e) => setEditScientificName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
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
                  Side Effects
                </label>
                <textarea
                  value={editSideEffects}
                  onChange={(e) => setEditSideEffects(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contraindications
                </label>
                <textarea
                  value={editContraindications}
                  onChange={(e) => setEditContraindications(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Composition
                </button>
              </div>
            </form>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
          <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Manage Compositions</h1>
              <button
                  onClick={() => setCurrentView('main')}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                  Back to Inventory
              </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Composition</h2>
              <form onSubmit={handleAddCompositionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Composition Name
                </label>
                <input
                  type="text"
                  required
                  value={addCompositionName}
                  onChange={(e) => setAddCompositionName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={addScientificName}
                  onChange={(e) => setAddScientificName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  required
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
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
                  Side Effects
                </label>
                <textarea
                  value={addSideEffects}
                  onChange={(e) => setAddSideEffects(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contraindications
                </label>
                <textarea
                  value={addContraindications}
                  onChange={(e) => setAddContraindications(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Composition
                </button>
              </div>
            </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Compositions</h2>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                          <tr>
                              <th scope="col" className="px-6 py-3">Name</th>
                              <th scope="col" className="px-6 py-3">Description</th>
                              <th scope="col" className="px-6 py-3 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {compositions.map((c) => (
                              <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                                  <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                  <td className="px-6 py-4">{c.description}</td>
                                  <td className="px-6 py-4 text-center">
                                      <button
                                          onClick={() => {
                                            setEditingComposition(c);
                                          }}
                                          className="font-medium text-indigo-600 hover:underline mr-2"
                                      >
                                          Edit
                                      </button>
                                      <button
                                          onClick={() => setViewingComposition(c)}
                                          className="font-medium text-blue-600 hover:underline mr-2"
                                      >
                                          View
                                      </button>
                                      <button
                                          onClick={() => handleDeleteComposition(c.id)}
                                          className="font-medium text-red-600 hover:underline"
                                      >
                                          Delete
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentView === 'categories') {
    return <CategoriesPage />;
  }

  if (currentView === 'generic-names') {
    return <GenericNamesPage />;
  }

  if (currentView === 'compositions') {
    return <CompositionsPage />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
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
              onClick={() => setCurrentView('categories')}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Manage Categories
            </button>
            <button
              onClick={() => setCurrentView('generic-names')}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Manage Generic Names
            </button>
            <button
              onClick={() => setCurrentView('compositions')}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Manage Compositions
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

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {successMessage}
        </div>
      )}

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
                  Image
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
                      {product.composition_summary && product.composition_summary.length > 0 && (
                        <span className="text-gray-500">
                          ({product.composition_summary.join(', ')})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.category_name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {product.generic_name || "N/A"}
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
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 object-cover rounded-full mx-auto"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
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
                        onClick={() => handleEditProduct(product)}
                        className="font-medium text-indigo-600 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Delete
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
                setCurrentPage(1);
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

      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingProduct ? "Edit Medicine" : "Add New Medicine"}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
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
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.brand_name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, brand_name: e.target.value })
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
                      <option key={g.id} value={g.id}> {/* Revert to g.id for value */}
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
                    Medicine Type
                  </label>
                  <select
                    required
                    value={newProduct.medicine_type}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, medicine_type: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="cream">Cream</option>
                    <option value="drops">Drops</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prescription Type
                  </label>
                  <select
                    required
                    value={newProduct.prescription_type}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, prescription_type: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="otc">Over The Counter</option>
                    <option value="prescription">Prescription Required</option>
                    <option value="controlled">Controlled Substance</option>
                  </select>
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
               
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={newProduct.hsn_code}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, hsn_code: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Uses
                  </label>
                  <textarea
                    value={newProduct.uses}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, uses: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Side Effects
                  </label>
                  <textarea
                    value={newProduct.side_effects}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, side_effects: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    How To Use
                  </label>
                  <textarea
                    value={newProduct.how_to_use}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, how_to_use: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Precautions
                  </label>
                  <textarea
                    value={newProduct.precautions}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, precautions: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Storage
                  </label>
                  <textarea
                    value={newProduct.storage}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, storage: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, image: e.target.files[0] })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {newProduct.currentImage && !newProduct.image && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Current Image:</p>
                      <img src={newProduct.currentImage} alt="Current Product" className="h-20 w-20 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-2 mt-4">
                Compositions
              </h4>
              <div className="space-y-3">
                {newProduct.selectedCompositions.map((comp_id, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700">
                        Composition
                      </label>
                      <select
                        required
                        value={comp_id === null ? "" : comp_id}
                        onChange={(e) => {
                          const updatedCompositions = [...newProduct.selectedCompositions];
                          const value = e.target.value === "" ? null : Number(e.target.value); // Convert to Number or null
                          updatedCompositions[index] = value;
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
                    <button
                      type="button"
                      onClick={() => {
                        const updatedCompositions = newProduct.selectedCompositions.filter((_, i) => i !== index);
                        setNewProduct({ ...newProduct, selectedCompositions: updatedCompositions });
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium self-end mb-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setNewProduct({
                      ...newProduct,
                      selectedCompositions: [
                        ...newProduct.selectedCompositions,
                        null, // Use null as a placeholder for new, unselected compositions
                      ],
                    })
                  }
                  className="mt-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Add Another Composition
                </button>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.is_active}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        is_active: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Is Active?
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.is_featured}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        is_featured: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Is Featured?
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      Quantity (Unit)
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Quantity (Base Unit)
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
                          <td className="px-6 py-4">
                            {batch.current_quantity} {batch.selected_unit_abbreviation || 'Units'}
                          </td>
                          <td className="px-6 py-4">
                            {batch.quantity} {batch.product_unit?.base_unit_abbreviation || 'Base Units'}
                          </td>
                          <td className="px-6 py-4">
                            ₹{batch.mrp_price}
                          </td>
                          <td className="px-6 py-4">
                            {batch.discount_percentage }%
                          </td>
                          <td className="px-6 py-4">
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
                        step="0.01"
                        required
                        value={newBatch.ordered_quantity_display}
                        onChange={(e) =>
                          setNewBatch({ ...newBatch, ordered_quantity_display: e.target.value })
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
