import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductBatches, setSelectedProductBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genericNames, setGenericNames] = useState([]);

  const [newBatch, setNewBatch] = useState({
    batch_number: '',
    quantity: '',
    current_quantity: '',
    expiry_date: '',
    cost_price: '',
    selling_price: ''
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    generic_name_id: '',
    strength: '',
    form: '',
    manufacturer: 'MedCorp',
    price: '',
    mrp: '',
    is_prescription_required: false,
    hsn_code: '30041000',
    packaging_unit: '',
    pack_size: '',
    stock_quantity: '',
    min_stock_level: '10'
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [productsRes, batchesRes, categoriesRes, genericNamesRes] = await Promise.all([
        axiosInstance.get('product/products/'),
        axiosInstance.get('inventory/batches/'),
        axiosInstance.get('product/categories/'),
        axiosInstance.get('product/generic-names/')
      ]);

      setProducts(productsRes.data.results || productsRes.data);
      setBatches(batchesRes.data.results || batchesRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setGenericNames(genericNamesRes.data.results || genericNamesRes.data);
    } catch (err) {
      setError('Failed to fetch inventory data');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('inventory/batches/', {
        ...newBatch,
        product: selectedProduct.id
      });
      setShowBatchModal(false);
      setNewBatch({
        batch_number: '',
        quantity: '',
        current_quantity: '',
        expiry_date: '',
        cost_price: '',
        selling_price: ''
      });
      await fetchInventoryData();
    } catch (err) {
      console.error('Error adding batch:', err);
      setError('Failed to add batch');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('product/products/', newProduct);
      setShowProductModal(false);
      setNewProduct({
        name: '',
        category_id: '',
        generic_name_id: '',
        strength: '',
        form: '',
        manufacturer: 'MedCorp',
        price: '',
        mrp: '',
        is_prescription_required: false,
        hsn_code: '30041000',
        packaging_unit: '',
        pack_size: '',
        stock_quantity: '',
        min_stock_level: '10'
      });
      await fetchInventoryData();
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('product/categories/', newCategory);
      setShowCategoryModal(false);
      setNewCategory({
        name: '',
        description: ''
      });
      await fetchInventoryData();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    }
  };

  const getStockStatus = (product) => {
    const totalStock = product.stock_quantity || 0;
    if (totalStock === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (totalStock < 10) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else if (totalStock < 50) {
      return { status: 'Medium Stock', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (daysUntilExpiry < 30) {
      return { status: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
    } else if (daysUntilExpiry < 90) {
      return { status: 'Expires in 3 months', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'Good', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleViewBatches = (product) => {
    setSelectedProduct(product);
    // Filter batches for the selected product
    console.log('Product ID:', product.id);
    console.log('All batches:', batches);
    const productBatches = batches.filter(batch => {
      console.log('Batch product ID:', batch.product, 'Product ID:', product.id);
      return batch.product === product.id;
    });
    console.log('Filtered batches:', productBatches);
    setSelectedProductBatches(productBatches);
    setShowViewBatchModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.generic_name?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const stockStatus = getStockStatus(product);
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && stockStatus.status === 'Low Stock') ||
      (stockFilter === 'out' && stockStatus.status === 'Out of Stock') ||
      (stockFilter === 'in' && stockStatus.status === 'In Stock');

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
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track medicines, stock levels, categories, and expiry dates</p>
            <div className="mt-3 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded inline-block">
              Pharmacy Stock Control System
            </div>
          </div>
          <div className="flex space-x-3">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Medicines</p>
              <p className="text-2xl font-semibold text-gray-800">{products.length}</p>
              <p className="text-gray-500 text-xs mt-1">Active products</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Low Stock Alert</p>
              <p className="text-2xl font-semibold text-gray-800">
                {products.filter(p => getStockStatus(p).status === 'Low Stock').length}
              </p>
              <p className="text-gray-500 text-xs mt-1">Need restocking</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-800">
                {batches.filter(b => getExpiryStatus(b.expiry_date).status === 'Expiring Soon').length}
              </p>
              <p className="text-gray-500 text-xs mt-1">Within 30 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-2xl font-semibold text-gray-800">7</p>
              <p className="text-gray-500 text-xs mt-1">Medicine types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search medicines, generic names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>
          <div className="flex space-x-4">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500 bg-white"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Medicine Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Stock Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">💊</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-blue-600 font-medium">{product.generic_name?.name}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <span className="bg-gray-100 px-2 py-1 rounded-full mr-2">{product.strength}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full">{product.form}</span>
                          </div>
                          {product.is_prescription_required && (
                            <div className="text-xs text-red-600 font-medium mt-1">🔒 Prescription Required</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        🏷️ {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-lg font-bold text-gray-900">{product.stock_quantity || 0}</div>
                        <div className="text-sm text-gray-500 ml-1">units</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${stockStatus.color} shadow-sm`}>
                        {stockStatus.status === 'Out of Stock' && '🔴'}
                        {stockStatus.status === 'Low Stock' && '🟡'}
                        {stockStatus.status === 'Medium Stock' && '🔵'}
                        {stockStatus.status === 'In Stock' && '🟢'}
                        <span className="ml-1">{stockStatus.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">₹{product.price}</div>
                      {product.mrp && (
                        <div className="text-sm text-gray-500 line-through">MRP: ₹{product.mrp}</div>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowBatchModal(true);
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500"
                        >
                          Add Stock
                        </button>
                        <button
                          onClick={() => handleViewBatches(product)}
                          className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-300"
                        >
                          View Batches
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">No products match your current filters.</p>
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Stock Batch {selectedProduct && `for ${selectedProduct.name}`}
              </h3>

              <form onSubmit={handleAddBatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={newBatch.batch_number}
                    onChange={(e) => setNewBatch({...newBatch, batch_number: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Quantity</label>
                  <input
                    type="number"
                    required
                    value={newBatch.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewBatch({
                        ...newBatch,
                        quantity: value,
                        current_quantity: value // Auto-set current quantity to match initial quantity
                      });
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    placeholder="Total quantity received"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Available Quantity</label>
                  <input
                    type="number"
                    required
                    value={newBatch.current_quantity}
                    onChange={(e) => setNewBatch({...newBatch, current_quantity: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    placeholder="Currently available quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiry_date}
                    onChange={(e) => setNewBatch({...newBatch, expiry_date: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newBatch.cost_price}
                      onChange={(e) => setNewBatch({...newBatch, cost_price: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newBatch.selling_price}
                      onChange={(e) => setNewBatch({...newBatch, selling_price: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBatchModal(false);
                      setSelectedProduct(null);
                      setNewBatch({
                        batch_number: '',
                        quantity: '',
                        current_quantity: '',
                        expiry_date: '',
                        cost_price: '',
                        selling_price: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                  >
                    Add Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">💊 Add New Medicine</h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Paracetamol 500mg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
                  <select
                    value={newProduct.generic_name_id}
                    onChange={(e) => setNewProduct({...newProduct, generic_name_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Generic Name</option>
                    {genericNames.map(generic => (
                      <option key={generic.id} value={generic.id}>{generic.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    value={newProduct.strength}
                    onChange={(e) => setNewProduct({...newProduct, strength: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 500mg, 10ml"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form *</label>
                  <select
                    value={newProduct.form}
                    onChange={(e) => setNewProduct({...newProduct, form: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Form</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.mrp}
                    onChange={(e) => setNewProduct({...newProduct, mrp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Unit *</label>
                  <input
                    type="text"
                    value={newProduct.packaging_unit}
                    onChange={(e) => setNewProduct({...newProduct, packaging_unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Strip, Box, Bottle"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size *</label>
                  <input
                    type="text"
                    value={newProduct.pack_size}
                    onChange={(e) => setNewProduct({...newProduct, pack_size: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10 Tablets, 100ml"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={newProduct.min_stock_level}
                    onChange={(e) => setNewProduct({...newProduct, min_stock_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="prescription_required"
                  checked={newProduct.is_prescription_required}
                  onChange={(e) => setNewProduct({...newProduct, is_prescription_required: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="prescription_required" className="ml-2 block text-sm text-gray-700">
                  🔒 Prescription Required
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  💊 Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">🏷️ Add New Category</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Antibiotics, Pain Relief"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the category"
                  rows="3"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Batches Modal */}
      {showViewBatchModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Batches for {selectedProduct?.name}
              </h3>

              {selectedProductBatches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No batches found for this product.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Batch Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Cost Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Selling Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProductBatches.map((batch) => {
                        const expiryStatus = getExpiryStatus(batch.expiry_date);
                        return (
                          <tr key={batch.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {batch.batch_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {batch.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(batch.expiry_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{parseFloat(batch.cost_price || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{parseFloat(batch.selling_price || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.color}`}>
                                {expiryStatus.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowViewBatchModal(false);
                    setSelectedProduct(null);
                    setSelectedProductBatches([]);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
