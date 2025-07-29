// Enhanced Prescription Review Component
// Supports medicine remapping, adding medicines, and order creation from verified prescriptions only

import React, { useState, useEffect } from 'react';
import { prescriptionAPI, productAPI, apiUtils } from '../api/apiService';

const EnhancedPrescriptionReview = ({ prescriptionId, onClose, onUpdate }) => {
  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showRemapModal, setShowRemapModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form states for adding medicine
  const [newMedicine, setNewMedicine] = useState({
    product_id: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '1',
    instructions: ''
  });

  // Form states for remapping
  const [remapData, setRemapData] = useState({
    product_id: '',
    comment: ''
  });

  useEffect(() => {
    if (prescriptionId) {
      loadPrescriptionData();
      loadAvailableProducts();
    }
  }, [prescriptionId]);

  const loadPrescriptionData = async () => {
    try {
      setLoading(true);
      const [prescriptionRes, medicinesRes] = await Promise.allSettled([
        prescriptionAPI.getPrescription(prescriptionId),
        prescriptionAPI.getPrescriptionMedicines({ prescription: prescriptionId })
      ]);

      if (prescriptionRes.status === 'fulfilled') {
        setPrescription(prescriptionRes.value.data);
      }

      if (medicinesRes.status === 'fulfilled') {
        setMedicines(Array.isArray(medicinesRes.value.data) ? medicinesRes.value.data : medicinesRes.value.data.results || []);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const response = await productAPI.getProducts({ is_active: true });
      setAvailableProducts(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleVerifyPrescription = async (action, data = {}) => {
    try {
      const response = await prescriptionAPI.verifyPrescription(prescriptionId, {
        action,
        ...data
      });

      if (response.data.success) {
        setPrescription(prev => ({ ...prev, status: action }));
        onUpdate && onUpdate();
        alert(response.data.message);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Error: ${errorInfo.message}`);
    }
  };

  const handleRemapMedicine = async () => {
    if (!selectedMedicine || !remapData.product_id) {
      alert('Please select a product to remap to');
      return;
    }

    try {
      const response = await prescriptionAPI.remapMedicine(selectedMedicine.id, remapData);
      
      if (response.data.success) {
        // Update the medicine in the list
        setMedicines(prev => prev.map(med => 
          med.id === selectedMedicine.id 
            ? { ...med, verified_medicine: response.data.new_product, verification_status: 'verified' }
            : med
        ));
        
        setShowRemapModal(false);
        setSelectedMedicine(null);
        setRemapData({ product_id: '', comment: '' });
        alert(response.data.message);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Error remapping medicine: ${errorInfo.message}`);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.product_id) {
      alert('Please select a product');
      return;
    }

    try {
      const response = await prescriptionAPI.addMedicineToPrescrip({
        prescription_id: prescriptionId,
        ...newMedicine
      });

      if (response.data.success) {
        // Add the new medicine to the list
        setMedicines(prev => [...prev, response.data.medicine]);
        setShowAddMedicine(false);
        setNewMedicine({
          product_id: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: '1',
          instructions: ''
        });
        alert(response.data.message);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Error adding medicine: ${errorInfo.message}`);
    }
  };

  const handleCreateOrder = async () => {
    if (prescription?.status !== 'verified') {
      alert('Only verified prescriptions can be converted to orders');
      return;
    }

    // Check if all medicines are verified
    const unverifiedMedicines = medicines.filter(med => med.verification_status !== 'verified');
    if (unverifiedMedicines.length > 0) {
      alert(`Please verify all medicines before creating order. ${unverifiedMedicines.length} medicines are still unverified.`);
      return;
    }

    try {
      const response = await prescriptionAPI.createOrderFromPrescription(prescriptionId, {
        payment_method: 'COD',
        address_id: null // You might want to add address selection
      });

      if (response.data.success) {
        alert(`Order created successfully! Order ID: ${response.data.order_id}`);
        setPrescription(prev => ({ ...prev, status: 'dispensed' }));
        onUpdate && onUpdate();
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Error creating order: ${errorInfo.message}`);
    }
  };

  const canCreateOrder = prescription?.status === 'verified' && 
                        medicines.every(med => med.verification_status === 'verified');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prescription Review</h2>
            <p className="text-sm text-gray-600">
              {prescription?.prescription_number} - Status: 
              <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                prescription?.status === 'verified' ? 'bg-green-100 text-green-800' :
                prescription?.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                prescription?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {prescription?.status?.replace('_', ' ').toUpperCase()}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Prescription Info */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700">Patient</h4>
              <p>{prescription?.patient_name || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Doctor</h4>
              <p>{prescription?.doctor_name || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Upload Date</h4>
              <p>{new Date(prescription?.upload_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Medicines List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Medicines</h3>
            <button
              onClick={() => setShowAddMedicine(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={prescription?.status === 'dispensed'}
            >
              Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((medicine) => (
              <div key={medicine.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{medicine.extracted_medicine_name}</h4>
                    <p className="text-sm text-gray-600">
                      {medicine.extracted_dosage} - {medicine.extracted_frequency} - {medicine.extracted_duration}
                    </p>
                    {medicine.verified_medicine && (
                      <p className="text-sm text-green-600 mt-1">
                        Mapped to: {medicine.verified_medicine.name} (₹{medicine.verified_medicine.price})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      medicine.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                      medicine.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {medicine.verification_status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMedicine(medicine);
                        setShowRemapModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={prescription?.status === 'dispensed'}
                    >
                      Remap
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between">
          <div className="space-x-2">
            {prescription?.status === 'pending_verification' && (
              <>
                <button
                  onClick={() => handleVerifyPrescription('verified')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Verify Prescription
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Please provide clarification notes:');
                    if (reason) {
                      handleVerifyPrescription('need_clarification', { clarification_notes: reason });
                    }
                  }}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                  Need Clarification
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Please provide rejection reason:');
                    if (reason) {
                      handleVerifyPrescription('rejected', { rejection_reason: reason });
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}
          </div>
          
          <div className="space-x-2">
            {canCreateOrder && (
              <button
                onClick={handleCreateOrder}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
              >
                Create Order
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Add Medicine Modal */}
        {showAddMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Medicine to Prescription</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    value={newMedicine.product_id}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, product_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₹{product.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newMedicine.quantity}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={newMedicine.frequency}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={newMedicine.duration}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={newMedicine.instructions}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Additional instructions"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowAddMedicine(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedicine}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Medicine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remap Medicine Modal */}
        {showRemapModal && selectedMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Remap Medicine: {selectedMedicine.extracted_medicine_name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Product</label>
                  <select
                    value={remapData.product_id}
                    onChange={(e) => setRemapData(prev => ({ ...prev, product_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₹{product.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    value={remapData.comment}
                    onChange={(e) => setRemapData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Reason for remapping"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowRemapModal(false);
                    setSelectedMedicine(null);
                    setRemapData({ product_id: '', comment: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemapMedicine}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Remap Medicine
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPrescriptionReview;
