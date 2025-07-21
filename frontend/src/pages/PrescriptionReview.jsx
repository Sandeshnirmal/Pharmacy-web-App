// PrescriptionReview.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import OCRReprocessButton from '../components/OCRReprocessButton';
import OCRResultsDisplay from '../components/OCRResultsDisplay';

const PrescriptionReview = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();

  // State management
  const [prescription, setPrescription] = useState(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentDetailId, setCurrentDetailId] = useState(null);

  // Fetch prescription data on component mount
  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionData();
    }
  }, [prescriptionId]);

  // Fetch products after prescription details are loaded
  useEffect(() => {
    if (prescriptionDetails.length > 0) {
      fetchProducts();
    }
  }, [prescriptionDetails]);

  const fetchPrescriptionData = async () => {
    try {
      setLoading(true);
      const [prescriptionRes, detailsRes] = await Promise.all([
        axiosInstance.get(`prescription/prescriptions/${prescriptionId}/`),
        axiosInstance.get(`prescription/prescription-details/?prescription=${prescriptionId}`)
      ]);

      setPrescription(prescriptionRes.data);
      const details = detailsRes.data.results || detailsRes.data;
      setPrescriptionDetails(details);
      setNotes(prescriptionRes.data.pharmacist_notes || '');
    } catch (err) {
      setError('Failed to fetch prescription data');
      console.error('Error fetching prescription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Only fetch products if we have prescription details to match against
      if (prescriptionDetails.length > 0) {
        // Get unique medicine names from OCR results
        const medicineNames = prescriptionDetails
          .map(detail => detail.ai_extracted_medicine_name)
          .filter(name => name && name.trim() !== '')
          .join(',');

        // Fetch products with search filter based on extracted medicines
        const response = await axiosInstance.get(`product/products/?search=${encodeURIComponent(medicineNames)}`);
        setProducts(response.data.results || response.data);
      } else {
        // If no prescription details yet, fetch a limited set
        const response = await axiosInstance.get('product/products/?limit=20');
        setProducts(response.data.results || response.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      // Fallback to limited products
      try {
        const response = await axiosInstance.get('product/products/?limit=20');
        setProducts(response.data.results || response.data);
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
    }
  };

  // Handler functions with API integration
  const handleMapProduct = async (detailId, productId) => {
    try {
      await axiosInstance.patch(`prescription/prescription-details/${detailId}/`, {
        mapped_product: productId,
        mapping_status: 'Mapped'
      });
      await fetchPrescriptionData();
      setShowProductModal(false);
    } catch (err) {
      console.error('Error mapping product:', err);
      setError('Failed to map product');
    }
  };

  const openProductModal = (detailId) => {
    setCurrentDetailId(detailId);
    setShowProductModal(true);
  };

  const handleAddMissingItem = async () => {
    try {
      const newDetail = {
        prescription: prescriptionId,
        line_number: prescriptionDetails.length + 1,
        recognized_text_raw: 'Manually added item',
        mapping_status: 'Pending',
        is_valid_for_order: false
      };
      await axiosInstance.post('prescription/prescription-details/', newDetail);
      await fetchPrescriptionData();
    } catch (err) {
      console.error('Error adding missing item:', err);
      setError('Failed to add missing item');
    }
  };

  const handleSuggestSubstitute = (detailId) => {
    // This would typically open a modal or navigate to a substitute selection page
    console.log('Suggest substitute for detail:', detailId);
  };

  const handleReject = async () => {
    try {
      await axiosInstance.patch(`prescription/prescriptions/${prescriptionId}/`, {
        verification_status: 'Rejected',
        rejection_reason: notes || 'Prescription rejected during review'
      });
      navigate('/prescriptions'); // Navigate back to prescriptions list
    } catch (err) {
      console.error('Error rejecting prescription:', err);
      setError('Failed to reject prescription');
    }
  };

  const handleClarify = async () => {
    try {
      await axiosInstance.patch(`prescription/prescriptions/${prescriptionId}/`, {
        verification_status: 'Pending_Review',
        pharmacist_notes: notes
      });
      navigate('/prescriptions');
    } catch (err) {
      console.error('Error requesting clarification:', err);
      setError('Failed to request clarification');
    }
  };

  const handleVerify = async () => {
    try {
      await axiosInstance.patch(`prescription/prescriptions/${prescriptionId}/`, {
        verification_status: 'Verified',
        pharmacist_notes: notes,
        verification_date: new Date().toISOString()
      });
      navigate('/prescriptions');
    } catch (err) {
      console.error('Error verifying prescription:', err);
      setError('Failed to verify prescription');
    }
  };

  const handleOCRReprocessComplete = (ocrResult) => {
    // Refresh prescription data after OCR reprocessing
    fetchPrescriptionData();

    // Show success message
    setError(null);

    // You could also show a success toast here
    console.log('OCR Reprocessing completed:', ocrResult);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.generic_name?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Prescription Review</h1>
          <p className="text-sm text-gray-600">
            Prescription ID: {prescription?.id} | Status: {prescription?.verification_status}
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* OCR Results Summary - Prominent Display */}
      {prescription && prescriptionDetails.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900">
              📋 OCR Extraction Results
            </h2>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {prescriptionDetails.length} medicines extracted
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {prescription.ai_confidence_score * 100}% confidence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {prescriptionDetails.map((detail, index) => (
              <div key={detail.id} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">Medicine {index + 1}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${detail.ai_confidence_score > 0.8 ? 'bg-green-100 text-green-800' :
                      detail.ai_confidence_score > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {Math.round(detail.ai_confidence_score * 100)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {detail.ai_extracted_medicine_name || 'Unknown'}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {detail.ai_extracted_dosage || 'No dosage'}
                </p>
                <p className="text-xs text-gray-500">
                  {detail.ai_extracted_instructions || 'No instructions'}
                </p>
                {detail.mapped_product && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-green-600 font-medium">
                      ✅ Mapped to: {detail.mapped_product_name || 'Product'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Prescription Image Section (spanning 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-700 mb-4">Prescription Image</h2>
          <div className="flex justify-center items-center bg-gray-100 rounded-md p-4">
            <img
              src={prescription?.image_url || 'https://placehold.co/400x300/e0e7ff/3f51b5?text=Prescription+Image'}
              alt="Prescription"
              className="max-w-full h-auto rounded-md shadow-sm"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/cccccc/333333?text=Image+Not+Found'; }}
            />
          </div>

          {/* OCR Reprocess Button */}
          <div className="mt-4 border-t pt-4">
            <OCRReprocessButton
              prescriptionId={prescriptionId}
              onReprocessComplete={handleOCRReprocessComplete}
            />
          </div>
        </div>

        {/* Product Mapping Section (1 column) - Only for unmapped medicines */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Manual Product Mapping
            <span className="text-sm font-normal text-gray-500 block">
              Only for medicines that need manual mapping
            </span>
          </h2>

          {prescriptionDetails.filter(detail => !detail.mapped_product).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-green-700 font-medium">All medicines mapped automatically!</p>
              <p className="text-sm text-gray-500">OCR successfully matched all medicines with products</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {prescriptionDetails.filter(detail => !detail.mapped_product).map((detail) => (
                <li
                  key={detail.id}
                  className="flex justify-between items-center py-3 border border-orange-200 rounded-lg px-3 bg-orange-50"
                >
                  <div>
                    <p className="text-gray-800 font-medium">
                      {detail.ai_extracted_medicine_name || 'Unknown Medicine'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {detail.ai_extracted_dosage || 'No dosage'}
                    </p>
                    <p className="text-xs text-orange-600">⚠️ Needs manual mapping</p>
                  </div>
                  <button
                    onClick={() => openProductModal(detail.id)}
                    className="px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                  >
                    Map Product
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* OCR Results Display Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-medium text-gray-700 mb-4">OCR Processing Results</h2>
        <OCRResultsDisplay
          prescription={prescription}
          prescriptionDetails={prescriptionDetails}
        />
      </div>

      {/* AI Extracted Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-medium text-gray-700 mb-4">AI Extracted Information</h2>

        {/* Patient Information Box */}
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Patient Information</h3>
          <div className="text-gray-700 text-sm">
            <p><strong>User:</strong> {prescription?.user?.first_name} {prescription?.user?.last_name}</p>
            <p><strong>Upload Date:</strong> {prescription?.upload_date ? new Date(prescription.upload_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> {prescription?.verification_status}</p>
            {prescription?.order && (
              <p><strong>Order ID:</strong> {prescription.order}</p>
            )}
          </div>
        </div>

        {/* Extracted Medicines Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Confidence</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prescriptionDetails.map((detail) => (
                <tr key={detail.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {detail.verified_medicine_name || detail.ai_extracted_medicine_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {detail.verified_dosage || detail.ai_extracted_dosage || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {detail.verified_quantity || detail.ai_extracted_quantity || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                    {detail.verified_instructions || detail.ai_extracted_instructions || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {detail.ai_confidence_score ? (
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${detail.ai_confidence_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs font-medium">{Math.round(detail.ai_confidence_score * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${detail.mapping_status === 'Mapped' ? 'bg-green-100 text-green-800' :
                        detail.mapping_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {detail.mapping_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleSuggestSubstitute(detail.id)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Substitute
                    </button>
                    <button
                      onClick={() => openProductModal(detail.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleAddMissingItem}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium
                       transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Add Missing Item
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-medium text-gray-700 mb-4">Pharmacist Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     min-h-[100px] text-sm text-gray-700"
          placeholder="Add any relevant notes here..."
        />
      </div>

      {/* Action Buttons at the bottom */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReject}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
        >
          Reject
        </button>
        <button
          onClick={handleClarify}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        >
          Clarify
        </button>
        <button
          onClick={handleVerify}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md shadow-md
                     transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Verify
        </button>
      </div>

      {/* Product Mapping Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Map Product</h3>
              <p className="text-sm text-gray-600 mb-4">
                Products filtered based on OCR extracted medicines. Search to find more.
              </p>

              {/* Search input for products */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Product list */}
              <div className="max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-md mb-2 cursor-pointer hover:bg-gray-50 ${selectedProduct?.id === product.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                      }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      {product.generic_name?.name} - {product.strength} - {product.form}
                    </div>
                    <div className="text-sm text-gray-500">
                      Manufacturer: {product.manufacturer} | Price: ₹{product.price}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedProduct && currentDetailId) {
                      handleMapProduct(currentDetailId, selectedProduct.id);
                      setSelectedProduct(null);
                      setSearchTerm('');
                    }
                  }}
                  disabled={!selectedProduct}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Map Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionReview;
