import React, { useState, useEffect, useCallback } from "react";
import { productAPI, apiUtils } from "../api/apiService";
import RateEditModal from "../components/RateEditModal"; // Import the new modal component

const RateMaster = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // Number of products per page

  const [selectedProduct, setSelectedProduct] = useState(null); // To show batches of a specific product
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(null); // For editing a specific batch

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getProducts(currentPage, pageSize, { search: searchTerm });
      
      if (response.data && response.data.results) { // Check for 'results' key
        setProducts(response.data.results);
        setTotalPages(Math.ceil(response.data.count / pageSize));
      } else if (response.data && Array.isArray(response.data)) { // If 'results' key is missing, assume response.data is the array
        setProducts(response.data);
        setTotalPages(1); // No pagination if direct array, so only one page
      }
      else {
        console.warn("API response does not contain a 'results' array or is not a direct array:", response.data);
        setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setCurrentBatch(null);
    setShowAddEditModal(false);
  };

  const handleAddBatchRate = () => {
    setCurrentBatch(null); // Clear current batch for new entry
    setShowAddEditModal(true);
  };

  const handleEditBatch = (batch) => {
    setCurrentBatch(batch);
    setShowAddEditModal(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this batch rate?")) {
      try {
        setLoading(true);
        setError(null);
        await productAPI.deleteBatch(batchId);
        // After deletion, refresh the selected product's batches
        if (selectedProduct) {
          const updatedProductResponse = await productAPI.getProduct(selectedProduct.id);
          setSelectedProduct(updatedProductResponse.data);
        }
      } catch (error) {
        const errorInfo = apiUtils.handleError(error);
        setError(errorInfo.message);
        console.error("Error deleting batch:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    setCurrentBatch(null);
  };

  const handleSaveSuccess = async () => {
    // After saving, refresh the selected product's batches
    if (selectedProduct) {
      const updatedProductResponse = await productAPI.getProduct(selectedProduct.id);
      setSelectedProduct(updatedProductResponse.data);
    }
    fetchProducts(); // Also refresh the main product list in case of new batch affecting product summary
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
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Rate Master</h1>
            <p className="text-gray-600 mt-1">Manage pricing rates and rules.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProduct && (
              <button
                onClick={handleBackToProducts}
                className="bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
              >
                Back to Products
              </button>
            )}
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        {!selectedProduct ? (
          <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Product Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Manufacturer
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Stock Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleProductClick(product)}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4">{product.manufacturer}</td>
                      <td className="px-6 py-4">{product.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4">{product.stock_quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          View Batches
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products && products.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found.
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 border rounded-md ${
                      currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Batches for {selectedProduct.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Batch Number
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Cost Price
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Online MRP
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Online Discount (%)
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Online Selling Price
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Offline MRP
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Offline Discount (%)
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Offline Selling Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProduct.batches.length > 0 ? (
                    selectedProduct.batches.map((batch) => (
                      <tr key={batch.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{batch.batch_number}</td>
                        <td className="px-6 py-4">{batch.expiry_date}</td>
                        <td className="px-6 py-4">{batch.quantity}</td>
                        <td className="px-6 py-4">{batch.cost_price}</td>
                        <td className="px-6 py-4">{batch.online_mrp_price}</td>
                        <td className="px-6 py-4">{batch.online_discount_percentage}</td>
                        <td className="px-6 py-4">{batch.online_selling_price}</td>
                        <td className="px-6 py-4">{batch.offline_mrp_price}</td>
                        <td className="px-6 py-4">{batch.offline_discount_percentage}</td>
                        <td className="px-6 py-4">{batch.offline_selling_price}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleEditBatch(batch)}
                            className="font-medium text-indigo-600 hover:underline mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch.id)}
                            className="font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="14" className="text-center py-8 text-gray-500">
                        No batches found for this product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <RateEditModal
        show={showAddEditModal}
        onClose={handleModalClose}
        onSaveSuccess={handleSaveSuccess}
        initialData={currentBatch ? { ...currentBatch, product: currentBatch.product } : { product: selectedProduct?.id }}
      />
    </div>
  );
};

export default RateMaster;
