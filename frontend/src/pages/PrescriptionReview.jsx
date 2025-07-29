// PrescriptionReview.jsx - Enhanced with order creation from verified prescriptions only
import { useState, useEffect, useCallback } from 'react'; // Added useCallback for memoization
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Search
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import OCRReprocessButton from '../components/OCRReprocessButton';
import OCRResultsDisplay from '../components/OCRResultsDisplay';
import PrescriptionStatusBadge from '../components/prescription/PrescriptionStatusBadge';
import { CircularConfidenceIndicator } from '../components/prescription/ConfidenceIndicator'; // Only import CircularConfidenceIndicator
import PrescriptionWorkflowVisualization from '../components/prescription/PrescriptionWorkflowVisualization';
import EnhancedMedicineForm from '../components/EnhancedMedicineForm';


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
  const [showProductMappingModal, setShowProductMappingModal] = useState(false); // Renamed for clarity
  const [currentDetailId, setCurrentDetailId] = useState(null);
  const [showMedicineFormModal, setShowMedicineFormModal] = useState(false); // Renamed for clarity
  const [editingMedicine, setEditingMedicine] = useState(null);

  const handleClose = () => {
    navigate('/prescriptions');
  };

  // No explicit usage of handleUpdate, can be removed if not needed for parent component refresh logic outside this component
  // const handleUpdate = () => {
  //   console.log('Prescription updated');
  // };

  // Fetch prescription data
  const fetchPrescriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const [prescriptionRes, detailsRes] = await Promise.all([
        axiosInstance.get(`prescription/enhanced-prescriptions/${prescriptionId}/`),
        axiosInstance.get(`prescription/medicines/?prescription=${prescriptionId}`)
      ]);

      setPrescription(prescriptionRes.data);
      const details = detailsRes.data.results || detailsRes.data;
      setPrescriptionDetails(details);
      setNotes(prescriptionRes.data.pharmacist_notes || '');
    } catch (err) {
      console.error('Error fetching prescription:', err);
      setError('Failed to fetch prescription data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [prescriptionId]);

  // Fetch products after prescription details are loaded
  const fetchProducts = useCallback(async () => {
    try {
      const medicineNames = prescriptionDetails
        .map(detail => detail.ai_extracted_medicine_name)
        .filter(name => name && name.trim() !== '');

      let productResponse;
      if (medicineNames.length > 0) {
        // Assuming the backend can handle comma-separated search terms or multiple `search` params
        // For robustness, consider if your backend requires a different format or multiple API calls for each medicine
        const searchTermParam = encodeURIComponent(medicineNames.join(' ')); // Join with space for broader search or adjust based on API
        productResponse = await axiosInstance.get(`product/enhanced-products/?search=${searchTermParam}`);
      } else {
        // If no specific medicine names, fetch a general limited set of products
        productResponse = await axiosInstance.get('product/enhanced-products/?limit=20');
      }
      setProducts(productResponse.data.results || productResponse.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      // Fallback to limited products if initial search fails
      try {
        const fallbackResponse = await axiosInstance.get('product/enhanced-products/?limit=20');
        setProducts(fallbackResponse.data.results || fallbackResponse.data);
      } catch (fallbackErr) {
        console.error('Fallback product fetch also failed:', fallbackErr);
        setError('Failed to load products. Please try again later.');
      }
    }
  }, [prescriptionDetails]); // Dependency on prescriptionDetails

  // Initial data fetch
  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionData();
    }
  }, [prescriptionId, fetchPrescriptionData]); // Added fetchPrescriptionData to dependencies

  // Fetch products when prescriptionDetails are updated
  useEffect(() => {
    fetchProducts();
  }, [prescriptionDetails, fetchProducts]); // Added fetchProducts to dependencies

  // Handler functions with API integration
  const handleMapProduct = async (detailId, productId) => {
    try {
      await axiosInstance.patch(`prescription/prescription-details/${detailId}/`, {
        mapped_product: productId,
        mapping_status: 'Mapped'
      });
      await fetchPrescriptionData(); // Refresh data to reflect mapping
      setShowProductMappingModal(false);
      setSelectedProduct(null); // Clear selected product after mapping
      setSearchTerm(''); // Clear search term after mapping
    } catch (err) {
      console.error('Error mapping product:', err);
      setError('Failed to map product. Please try again.');
    }
  };

  const openProductModal = (detailId) => {
    setCurrentDetailId(detailId);
    setShowProductMappingModal(true);
  };

  const handleAddMissingItem = () => {
    setEditingMedicine(null); // Ensure no medicine is being edited (it's a new add)
    setShowMedicineFormModal(true);
  };

  const handleEditMedicine = (medicineDetail) => {
    setEditingMedicine(medicineDetail);
    setShowMedicineFormModal(true);
  };

  const handleSaveMedicine = async (medicineData) => {
    try {
      if (editingMedicine) {
        // Update existing medicine detail
        await axiosInstance.patch(`prescription/prescription-details/${editingMedicine.id}/`, medicineData);
      } else {
        // Add new medicine detail to the prescription
        await axiosInstance.post(`prescription/prescription-details/`, {
          ...medicineData,
          prescription: prescriptionId, // Associate with current prescription
          mapping_status: 'Pending', // New items typically need mapping
          ai_confidence_score: 0, // Manual additions have no AI confidence
        });
      }
      setShowMedicineFormModal(false);
      setEditingMedicine(null);
      await fetchPrescriptionData(); // Refresh data
    } catch (err) {
      console.error('Error saving medicine:', err);
      setError('Failed to save medicine. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowMedicineFormModal(false);
    setEditingMedicine(null);
  };

  const handleSuggestSubstitute = (detailId) => {
    // This would typically open a modal or navigate to a substitute selection page
    console.log('Suggest substitute for detail:', detailId);
    setError('Substitute functionality not yet implemented.'); // Example feedback
  };

  const handleReject = async () => {
    try {
      await axiosInstance.patch(`prescription/prescriptions/${prescriptionId}/`, {
        verification_status: 'Rejected',
        rejection_reason: notes || 'Prescription rejected during review'
      });
      navigate('/prescriptions');
    } catch (err) {
      console.error('Error rejecting prescription:', err);
      setError('Failed to reject prescription. Please try again.');
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
      setError('Failed to request clarification. Please try again.');
    }
  };

  const handleVerify = async () => {
    // Check if all prescription details are mapped before verifying
    const unmappedItems = prescriptionDetails.filter(d => !d.mapped_product);
    if (unmappedItems.length > 0) {
      setError('All prescription items must be mapped to products before verification.');
      return;
    }

    try {
      // 1. Update prescription status to 'Verified'
      await axiosInstance.post(`prescription/enhanced-prescriptions/${prescriptionId}/verify/`, {
        action: 'verified',
        notes: notes
      });

      // 2. Create the order based on the verified prescription details
      // This assumes an API endpoint for creating orders from a prescription ID
      const orderCreationPayload = {
        prescription: prescriptionId,
        // Potentially include other order details like delivery address, payment method etc.
        // For simplicity, we'll just send the prescription ID.
      };
      const orderResponse = await axiosInstance.post(`order/orders/create_from_prescription/`, orderCreationPayload);
      console.log('Order created successfully:', orderResponse.data);

      navigate('/prescriptions'); // Navigate back to prescriptions list or to order details
    } catch (err) {
      console.error('Error verifying prescription or creating order:', err);
      setError(`Failed to verify prescription or create order. Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleOCRReprocessComplete = (ocrResult) => {
    fetchPrescriptionData(); // Refresh prescription data after OCR reprocessing
    setError(null); // Clear any previous errors if reprocessing was successful
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/prescriptions')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span>Back to Prescriptions</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Prescription Review #{prescription?.id}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <PrescriptionStatusBadge
                    status={prescription?.verification_status}
                    size="sm"
                  />
                  <span className="text-sm text-gray-500">
                    Uploaded {prescription?.upload_date ? new Date(prescription.upload_date).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Workflow Visualization */}
        <PrescriptionWorkflowVisualization
          currentStatus={prescription?.verification_status}
          hasOrder={!!prescription?.order}
          isDelivered={false}
        />

        {/* Enhanced OCR Results Summary */}
        {prescription && prescriptionDetails.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CircularConfidenceIndicator
                      confidence={prescription.ai_confidence_score || 0}
                      size={48}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      AI Extraction Results
                    </h2>
                    <p className="text-sm text-gray-600">
                      {prescriptionDetails.length} medicines detected with {Math.round((prescription.ai_confidence_score || 0) * 100)}% average confidence
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {prescriptionDetails.filter(d => d.mapped_product).length}
                    </div>
                    <div className="text-xs text-gray-500">Mapped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {prescriptionDetails.filter(d => !d.mapped_product).length}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prescriptionDetails.map((detail, index) => (
                  <div
                    key={detail.id}
                    className={`
                      rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-md
                      ${detail.mapped_product
                        ? 'border-green-200 bg-green-50'
                        : 'border-orange-200 bg-orange-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Medicine {index + 1}
                      </span>
                      {/* Using inline ConfidenceIndicator, ensure it's imported or defined */}
                      {/* <ConfidenceIndicator
                        confidence={detail.ai_confidence_score || 0}
                        size="sm"
                        showIcon={false}
                      /> */}
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round((detail.ai_confidence_score || 0) * 100)}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {detail.ai_extracted_medicine_name || 'Unknown Medicine'}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {detail.ai_extracted_dosage || 'No dosage specified'}
                        </p>
                      </div>

                      {detail.ai_extracted_instructions && (
                        <p className="text-xs text-gray-500 bg-white bg-opacity-50 p-2 rounded">
                          {detail.ai_extracted_instructions}
                        </p>
                      )}

                      {detail.mapped_product ? (
                        <div className="flex items-center space-x-2 pt-2 border-t border-green-200">
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            Mapped to product
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                          <div className="flex items-center space-x-2">
                            <AlertCircle size={14} className="text-orange-600" />
                            <span className="text-xs text-orange-700 font-medium">
                              Needs mapping
                            </span>
                          </div>
                          <button
                            onClick={() => openProductModal(detail.id)}
                            className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                          >
                            Map
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                      className="text-green-600 hover:text-green-900 mr-2"
                    >
                      Map
                    </button>
                    <button
                      onClick={() => handleEditMedicine(detail)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Edit
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

        {/* Enhanced Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Review Actions</h3>
              <p className="text-sm text-gray-600">
                Choose an action to complete the prescription review
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleReject}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <XCircle size={18} />
                <span>Reject</span>
              </button>

              <button
                onClick={handleClarify}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <AlertCircle size={18} />
                <span>Request Clarification</span>
              </button>

              <button
                onClick={handleVerify}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <CheckCircle size={18} />
                <span>Verify & Approve</span>
              </button>
            </div>
          </div>

          {/* Action Descriptions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Reject Prescription</h4>
              <p className="text-sm text-red-700">
                Mark prescription as rejected if medicines cannot be identified or prescription is invalid.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Request Clarification</h4>
              <p className="text-sm text-blue-700">
                Ask customer for additional information or clearer prescription image.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Verify & Approve</h4>
              <p className="text-sm text-green-700">
                Approve prescription for order creation. All medicines should be properly mapped.
              </p>
            </div>
          </div>
        </div>

        {/* Product Mapping Modal */}
        {showProductMappingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
             role="dialog" aria-modal="true" aria-labelledby="product-map-modal-title">
          <div className="relative p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] flex flex-col">
            <div className="mt-3 flex-grow flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-2" id="product-map-modal-title">Map Product</h3>
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
                  aria-label="Search products"
                />
              </div>

              {/* Product list */}
              <div className="flex-grow overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar for better UX */}
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-md mb-2 cursor-pointer hover:bg-gray-50 ${selectedProduct?.id === product.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                        }`}
                      onClick={() => setSelectedProduct(product)}
                      role="option"
                      aria-selected={selectedProduct?.id === product.id}
                      tabIndex="0" // Make selectable by keyboard
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.generic_name?.name} - {product.strength} - {product.form}
                      </div>
                      <div className="text-sm text-gray-500">
                        Manufacturer: {product.manufacturer} | Price: ₹{product.price}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">No products found for your search.</div>
                )}
              </div>

              {/* Modal actions */}
              <div className="flex justify-end space-x-3 mt-6 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowProductMappingModal(false);
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

      {/* Enhanced Medicine Form Modal */}
      {showMedicineFormModal && (
        <EnhancedMedicineForm
          medicine={editingMedicine}
          onSave={handleSaveMedicine}
          onCancel={handleCancelForm}
          isEdit={!!editingMedicine}
        />
      )}
      </div>
    </div>
  );
};

export default PrescriptionReview;