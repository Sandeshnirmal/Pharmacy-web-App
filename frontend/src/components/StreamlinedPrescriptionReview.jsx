// Streamlined Prescription Review Component - Error-free and fully functional
import React, { useState, useEffect } from 'react';
import { prescriptionService, prescriptionUtils } from '../api/prescriptionService';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Edit3,
  ShoppingCart,
  ArrowLeft,
  Loader
} from 'lucide-react';
import CompositionBasedApprovalWorkflow from './CompositionBasedApprovalWorkflow';

const StreamlinedPrescriptionReview = ({ prescriptionId, onClose, onUpdate }) => {
  // State management
  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showRemapModal, setShowRemapModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  
  // Search and form states
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Form data for adding medicine
  const [newMedicine, setNewMedicine] = useState({
    productId: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '1',
    instructions: ''
  });

  // Load prescription data on mount
  useEffect(() => {
    if (prescriptionId) {
      loadPrescriptionData();
    }
  }, [prescriptionId]);

  // Search products when search term changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productSearch.length >= 2) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  const loadPrescriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load prescription and medicines in parallel
      const [prescriptionResult, medicinesResult] = await Promise.all([
        prescriptionService.getPrescription(prescriptionId),
        prescriptionService.getPrescriptionMedicines(prescriptionId)
      ]);

      if (prescriptionResult.success) {
        setPrescription(prescriptionResult.data);
      } else {
        setError(prescriptionResult.error);
        return;
      }

      if (medicinesResult.success) {
        setMedicines(medicinesResult.data);
      } else {
        console.warn('Failed to load medicines:', medicinesResult.error);
        setMedicines([]);
      }

    } catch (err) {
      setError('Failed to load prescription data');
      console.error('Error loading prescription:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!productSearch || productSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const result = await prescriptionService.searchProducts(productSearch.trim());

      if (result.success) {
        // Filter out products that are already in the prescription
        const existingProductIds = medicines.map(m => m.verified_medicine || m.mapped_product).filter(Boolean);
        const filteredResults = result.data.filter(product => !existingProductIds.includes(product.id));
        setSearchResults(filteredResults);
      } else {
        console.warn('Product search failed:', result.error);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleVerifyPrescription = async (action) => {
    let additionalData = {};
    
    // Get additional data based on action
    if (action === 'rejected') {
      const reason = prompt('Please provide rejection reason:');
      if (!reason) return;
      additionalData.rejection_reason = reason;
    } else if (action === 'need_clarification') {
      const clarification = prompt('Please provide clarification notes:');
      if (!clarification) return;
      additionalData.clarification_notes = clarification;
    }

    try {
      setActionLoading(true);
      const result = await prescriptionService.verifyPrescription(prescriptionId, action, additionalData);
      
      if (result.success) {
        alert(result.message);
        await loadPrescriptionData(); // Reload data
        onUpdate && onUpdate();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to verify prescription');
      console.error('Verification error:', err);
    } finally {
      setActionLoading(false);
    } 
  };

  const handleRemapMedicine = async () => {
    if (!selectedMedicine || !selectedMedicine.newProductId) {
      alert('Please select a product to remap to');
      return;
    }

    try {
      setActionLoading(true);
      const result = await prescriptionService.remapMedicine(
        selectedMedicine.id,
        selectedMedicine.newProductId,
        selectedMedicine.comment || 'Remapped via prescription review'
      );

      if (result.success) {
        alert(result.message);
        setShowRemapModal(false);
        setSelectedMedicine(null);
        await loadPrescriptionData(); // Reload data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to remap medicine');
      console.error('Remap error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.productId) {
      alert('Please select a product');
      return;
    }

    try {
      setActionLoading(true);
      const result = await prescriptionService.addMedicine(prescriptionId, newMedicine);

      if (result.success) {
        alert(result.message);
        setShowAddMedicine(false);
        setNewMedicine({
          productId: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: '1',
          instructions: ''
        });
        setProductSearch('');
        await loadPrescriptionData(); // Reload data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to add medicine');
      console.error('Add medicine error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!prescriptionUtils.canCreateOrder(prescription, medicines)) {
      alert('Cannot create order. Ensure prescription is verified and all medicines are verified.');
      return;
    }

    try {
      setActionLoading(true);
      const result = await prescriptionService.createOrder(prescriptionId, {
        paymentMethod: 'COD',
        notes: 'Order created from prescription review'
      });

      if (result.success) {
        alert(`${result.message}\nOrder ID: ${result.data.order_id}`);
        await loadPrescriptionData(); // Reload data
        onUpdate && onUpdate();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to create order');
      console.error('Create order error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openRemapModal = (medicine) => {
    setSelectedMedicine({
      ...medicine,
      newProductId: '',
      comment: ''
    });
    setShowRemapModal(true);
    setProductSearch('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="flex items-center space-x-3">
            <Loader className="animate-spin h-6 w-6 text-blue-600" />
            <span className="text-lg">Loading prescription...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Prescription</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={loadPrescriptionData}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canCreateOrder = prescriptionUtils.canCreateOrder(prescription, medicines);
  const completionPercentage = prescriptionUtils.getCompletionPercentage(medicines);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {prescriptionUtils.formatPrescriptionNumber(prescription?.prescription_number)}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  prescriptionUtils.getStatusColor(prescription?.status)
                }`}>
                  {prescriptionUtils.getStatusDisplayName(prescription?.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {completionPercentage}% Complete ({medicines.filter(m => m.verification_status === 'verified').length}/{medicines.length} medicines verified)
                </span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {prescription?.status === 'pending_verification' && (
              <>
                <button
                  onClick={() => handleVerifyPrescription('verified')}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify</span>
                </button>
                <button
                  onClick={() => handleVerifyPrescription('need_clarification')}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Clarify</span>
                </button>
                <button
                  onClick={() => handleVerifyPrescription('rejected')}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </>
            )}
            
            {canCreateOrder && (
              <button
                onClick={handleCreateOrder}
                disabled={actionLoading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Create Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Prescription Info */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Patient:</span>
              <p className="text-gray-900">{prescription?.patient_name || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Doctor:</span>
              <p className="text-gray-900">{prescription?.doctor_name || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Upload Date:</span>
              <p className="text-gray-900">
                {prescription?.upload_date ? new Date(prescription.upload_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Medicines:</span>
              <p className="text-gray-900">{medicines.length}</p>
            </div>
          </div>
        </div>

        {/* Composition-Based Workflow Info */}
        {prescription && (
          <div className="bg-blue-50 border-b px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-800">
                🧬 Composition-Based Processing Results
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-blue-700">
                  <span className="font-medium">Status:</span> {prescription?.status || 'Processing'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">OCR Extraction</span>
                </div>
                <p className="text-gray-600">
                  AI extracted medicine names, compositions, and dosages from prescription image
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Composition Matching</span>
                </div>
                <p className="text-gray-600">
                  Medicines matched based on active ingredients and salts, not brand names
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-gray-800">Manual Selection</span>
                </div>
                <p className="text-gray-600">
                  Customer manually selected medicines from suggestions - no auto-cart addition
                </p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Admin Approval Required</p>
                  <p className="text-yellow-700">
                    This prescription requires your review and approval. Customer has uploaded original prescription and manually selected medicines based on composition matching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medicines List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Medicines</h3>
              <button
                onClick={() => setShowAddMedicine(true)}
                disabled={!prescriptionUtils.canEdit(prescription?.status)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>Add Medicine</span>
              </button>
            </div>

            {medicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No medicines found in this prescription.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicines.map((medicine) => (
                  <div key={medicine.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {medicine.extracted_medicine_name || medicine.product_name || 'Unknown Medicine'}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            prescriptionUtils.getStatusColor(medicine.verification_status)
                          }`}>
                            {prescriptionUtils.getStatusDisplayName(medicine.verification_status)}
                          </span>
                          {medicine.ai_confidence_score && (
                            <span className="text-xs text-gray-500">
                              AI: {Math.round(medicine.ai_confidence_score * 100)}%
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Dosage:</span> {medicine.extracted_dosage || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Frequency:</span> {medicine.extracted_frequency || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {medicine.extracted_duration || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {medicine.quantity_prescribed || 'N/A'}
                          </div>
                        </div>

                        {/* Composition Information */}
                        {medicine.extracted_composition && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                            <div className="text-sm">
                              <span className="font-medium text-blue-800">Composition:</span>
                              <span className="text-blue-700 ml-2">{medicine.extracted_composition}</span>
                            </div>
                          </div>
                        )}

                        {(medicine.product_name || medicine.verified_medicine) && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-green-900">
                                  Mapped to: {medicine.product_name || medicine.verified_medicine?.name || 'Unknown Product'}
                                </p>
                                <div className="text-sm text-green-700 space-y-1">
                                  <p>
                                    <span className="font-medium">Price:</span> ₹{medicine.product_price || medicine.verified_medicine?.price || 'N/A'}
                                    {medicine.product_strength && (
                                      <span className="ml-3"><span className="font-medium">Strength:</span> {medicine.product_strength}</span>
                                    )}
                                  </p>
                                  {medicine.product_form && (
                                    <p><span className="font-medium">Form:</span> {medicine.product_form}</p>
                                  )}
                                  {medicine.pharmacist_comment && (
                                    <p><span className="font-medium">Note:</span> {medicine.pharmacist_comment}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openRemapModal(medicine)}
                          disabled={!prescriptionUtils.canEdit(prescription?.status)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Remap to different medicine"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Remap</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composition-Based Approval Workflow */}
          {prescription && (
            <div className="mt-6">
              <CompositionBasedApprovalWorkflow
                prescription={prescription}
                medicines={medicines}
                onApprove={handleVerifyPrescription}
                onReject={handleVerifyPrescription}
                onRequestClarification={handleVerifyPrescription}
              />
            </div>
          )}
        </div>

        {/* Add Medicine Modal */}
        {showAddMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Add Medicine to Prescription</h3>
                
                {/* Product Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Product
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Type to search medicines..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searchLoading && (
                    <div className="mt-2 p-2 text-center text-gray-500">
                      <Loader className="animate-spin h-4 w-4 inline mr-2" />
                      Searching...
                    </div>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setNewMedicine(prev => ({ ...prev, productId: product.id }));
                            setProductSearch(product.name);
                            setSearchResults([]);
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Manufacturer:</span> {product.manufacturer}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Form:</span> {product.form} •
                                <span className="font-medium ml-1">Strength:</span> {product.strength}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <div className="font-semibold text-green-600">₹{product.price}</div>
                              <div className="text-xs text-gray-500">MRP: ₹{product.mrp}</div>
                              <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                product.stock_status === 'in_stock'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {productSearch.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <div className="mt-2 p-3 text-center text-gray-500 border border-gray-200 rounded-lg">
                      No medicines found for "{productSearch}"
                    </div>
                  )}
                </div>

                {/* Medicine Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 500mg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newMedicine.quantity}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, quantity: e.target.value }))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={newMedicine.frequency}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder="e.g., Twice daily"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={newMedicine.duration}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 7 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={newMedicine.instructions}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Additional instructions..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddMedicine(false);
                      setNewMedicine({
                        productId: '',
                        dosage: '',
                        frequency: '',
                        duration: '',
                        quantity: '1',
                        instructions: ''
                      });
                      setProductSearch('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMedicine}
                    disabled={!newMedicine.productId || actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Adding...' : 'Add Medicine'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remap Medicine Modal */}
        {showRemapModal && selectedMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Remap Medicine: {selectedMedicine.extracted_medicine_name}
                </h3>

                {/* Current Medicine Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current Mapping:</h4>
                  <div className="text-sm text-gray-700">
                    <p><span className="font-medium">Product:</span> {selectedMedicine.product_name || 'Not mapped'}</p>
                    <p><span className="font-medium">Price:</span> ₹{selectedMedicine.product_price || 'N/A'}</p>
                    <p><span className="font-medium">Dosage:</span> {selectedMedicine.extracted_dosage || 'N/A'}</p>
                    <p><span className="font-medium">Frequency:</span> {selectedMedicine.extracted_frequency || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Product Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search New Product
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Type to search medicines..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searchLoading && (
                    <div className="mt-2 p-2 text-center text-gray-500">
                      <Loader className="animate-spin h-4 w-4 inline mr-2" />
                      Searching...
                    </div>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSelectedMedicine(prev => ({ ...prev, newProductId: product.id }));
                            setProductSearch(product.name);
                            setSearchResults([]);
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Manufacturer:</span> {product.manufacturer}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Form:</span> {product.form} •
                                <span className="font-medium ml-1">Strength:</span> {product.strength}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <div className="font-semibold text-green-600">₹{product.price}</div>
                              <div className="text-xs text-gray-500">MRP: ₹{product.mrp}</div>
                              <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                product.stock_status === 'in_stock'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {productSearch.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <div className="mt-2 p-3 text-center text-gray-500 border border-gray-200 rounded-lg">
                      No medicines found for "{productSearch}"
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    value={selectedMedicine.comment}
                    onChange={(e) => setSelectedMedicine(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Reason for remapping..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRemapModal(false);
                      setSelectedMedicine(null);
                      setProductSearch('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemapMedicine}
                    disabled={!selectedMedicine.newProductId || actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Remapping...' : 'Remap Medicine'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamlinedPrescriptionReview;
