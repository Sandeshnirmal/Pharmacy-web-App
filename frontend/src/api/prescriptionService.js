
// Enhanced Prescription Service - Streamlined API for prescription management
import axiosInstance from './axiosInstance';

export const prescriptionService = {
  // Get all prescriptions with filtering and pagination
  getPrescriptions: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/prescription/enhanced-prescriptions/', { params });
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count || (Array.isArray(response.data) ? response.data.length : 0),
        next: response.data.next,
        previous: response.data.previous
      };
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch prescriptions',
        data: []
      };
    }
  },

  // Get single prescription with details
  getPrescription: async (id) => {
    try {
      const response = await axiosInstance.get(`/prescription/enhanced-prescriptions/${id}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch prescription'
      };
    }
  },

  // Get prescription medicines
  getPrescriptionMedicines: async (prescriptionId) => {
    try {
      const response = await axiosInstance.get('/prescription/medicines/', {
        params: { prescription: prescriptionId }
      });
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : response.data.results || []
      };
    } catch (error) {
      console.error('Error fetching prescription medicines:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch medicines',
        data: []
      };
    }
  },

  // Search products for medicine mapping
  searchProducts: async (searchTerm = '', params = {}) => {
    try {
      const searchParams = {
        search: searchTerm,
        is_active: true,
        page_size: 50,
        ...params
      };
      // Corrected URL: changed '/api/product/' to '/api/products/'
      const response = await axiosInstance.get('/api/products/enhanced-products/', { params: searchParams });
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : response.data.results || []
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to search products',
        data: []
      };
    }
  },

  // Verify prescription (approve, reject, need clarification)
  verifyPrescription: async (id, action, data = {}) => {
    try {
      const payload = {
        action,
        notes: data.pharmacist_notes || data.clarification_notes || data.notes || '',
        rejection_reason: data.rejection_reason || '',
        ...data
      };
      const response = await axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/verify/`, payload);
      return {
        success: true,
        data: response.data,
        message: response.data.message || `Prescription ${action} successfully`
      };
    } catch (error) {
      console.error('Error verifying prescription:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to verify prescription'
      };
    }
  },

  // Update mapped product for a specific prescription medicine detail
  updateMedicineSelection: async (prescriptionDetailId, newProductId) => {
    try {
      const response = await axiosInstance.post('/prescription/mobile/update-medicine-selection/', {
        prescription_medicine_id: prescriptionDetailId,
        new_product_id: newProductId
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Medicine selection updated successfully'
      };
    } catch (error) {
      console.error('Error updating medicine selection:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to update medicine selection'
      };
    }
  },

  // Remap medicine to different product
  remapMedicine: async (medicineId, productId, comment = '') => {
    try {
      const response = await axiosInstance.post(`/prescription/medicines/${medicineId}/remap_medicine/`, {
        product_id: productId,
        comment: comment || 'Medicine remapped via prescription review'
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Medicine remapped successfully'
      };
    } catch (error) {
      console.error('Error remapping medicine:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to remap medicine'
      };
    }
  },

  // Add medicine to prescription
  addMedicine: async (prescriptionId, medicineData) => {
    try {
      const payload = {
        prescription_id: prescriptionId,
        product_id: medicineData.productId,
        dosage: medicineData.dosage || '',
        frequency: medicineData.frequency || '',
        duration: medicineData.duration || '',
        quantity: medicineData.quantity || '1',
        instructions: medicineData.instructions || ''
      };
      const response = await axiosInstance.post('/prescription/medicines/add_medicine_to_prescription/', payload);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Medicine added successfully'
      };
    } catch (error) {
      console.error('Error adding medicine:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to add medicine'
      };
    }
  },

  // Verify individual medicine
  verifyMedicine: async (medicineId, productId, comment = '') => {
    try {
      const response = await axiosInstance.post(`/prescription/medicines/${medicineId}/verify_medicine/`, {
        verified_medicine_id: productId,
        pharmacist_comment: comment || 'Medicine verified'
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Medicine verified successfully'
      };
    } catch (error) {
      console.error('Error verifying medicine:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to verify medicine'
      };
    }
  },

  // Create order from verified prescription
  createOrder: async (prescriptionId, orderData = {}) => {
    try {
      const payload = {
        payment_method: orderData.paymentMethod || 'COD',
        address_id: orderData.addressId || null,
        notes: orderData.notes || '',
        ...orderData
      };
      const response = await axiosInstance.post(`/prescription/enhanced-prescriptions/${prescriptionId}/create_order/`, payload);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Order created successfully'
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to create order'
      };
    }
  },

  // Get prescription statistics
  getStats: async () => {
    try {
      const response = await axiosInstance.get('/prescription/prescriptions/stats/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching prescription stats:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch statistics',
        data: {}
      };
    }
  },

  // Get prescription analytics
  getAnalytics: async () => {
    try {
      const response = await axiosInstance.get('/prescription/enhanced-prescriptions/analytics/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching prescription analytics:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch analytics',
        data: {}
      };
    }
  }
};

// Utility functions for prescription management
export const prescriptionUtils = {
  // Get status color for UI display
  getStatusColor: (status) => {
    const statusColors = {
      'uploaded': 'bg-blue-100 text-blue-800',
      'ai_processing': 'bg-purple-100 text-purple-800',
      'ai_mapped': 'bg-indigo-100 text-indigo-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'need_clarification': 'bg-orange-100 text-orange-800',
      'rejected': 'bg-red-100 text-red-800',
      'dispensed': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  // Get status display name
  getStatusDisplayName: (status) => {
    const statusNames = {
      'uploaded': 'Uploaded',
      'ai_processing': 'AI Processing',
      'ai_mapped': 'AI Mapped',
      'pending_verification': 'Pending Review',
      'verified': 'Verified',
      'need_clarification': 'Need Clarification',
      'rejected': 'Rejected',
      'dispensed': 'Dispensed'
    };
    return statusNames[status] || status?.replace('_', ' ').toUpperCase() || 'Unknown';
  },

  // Check if prescription can be edited
  canEdit: (status) => {
    return !['dispensed', 'rejected'].includes(status);
  },

  // Check if prescription can create order
  canCreateOrder: (prescription, medicines = []) => {
    if (prescription?.status !== 'verified') return false;
    if (medicines.length === 0) return false;
    return medicines.every(med => med.verification_status === 'verified');
  },

  // Format prescription number for display
  formatPrescriptionNumber: (number) => {
    return number ? `RX-${number}` : 'N/A';
  },

  // Calculate prescription completion percentage
  getCompletionPercentage: (medicines = []) => {
    if (medicines.length === 0) return 0;
    const verifiedCount = medicines.filter(med => med.verification_status === 'verified').length;
    return Math.round((verifiedCount / medicines.length) * 100);
  }
};

export default prescriptionService;
