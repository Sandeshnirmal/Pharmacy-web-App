// Comprehensive API Service for Intelligent Pharmacy Management System
// Integrated with enhanced backend APIs on port 8000

import axiosInstance from './axiosInstance';

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/api/token/', credentials);
    const { access, refresh } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: () => axiosInstance.get('/api/users/auth-me/'),

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return axiosInstance.post('/api/token/refresh/', { refresh: refreshToken });
  },
};

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

export const userAPI = {
  // Enhanced user management
  getUsers: (params = {}) => axiosInstance.get('/api/users/enhanced-users/', { params }),
  getUser: (id) => axiosInstance.get(`/api/users/enhanced-users/${id}/`),
  createUser: (userData) => axiosInstance.post('/api/users/enhanced-users/', userData),
  updateUser: (id, userData) => axiosInstance.patch(`/api/users/enhanced-users/${id}/`, userData),
  deleteUser: (id) => axiosInstance.delete(`/api/users/enhanced-users/${id}/`),
  
  // User role management
  getRoles: () => axiosInstance.get('/api/users/roles/'),
  getRole: (id) => axiosInstance.get(`/api/users/roles/${id}/`),
  createRole: (roleData) => axiosInstance.post('/api/users/roles/', roleData),
  updateRole: (id, roleData) => axiosInstance.patch(`/api/users/roles/${id}/`, roleData),
  deleteRole: (id) => axiosInstance.delete(`/api/users/roles/${id}/`),
  
  // User actions
  changePassword: (id, passwordData) => axiosInstance.post(`/api/users/enhanced-users/${id}/change_password/`, passwordData),
  verifyUser: (id, verificationData) => axiosInstance.post(`/api/users/enhanced-users/${id}/verify_user/`, verificationData),
  toggleUserStatus: (id) => axiosInstance.post(`/api/users/enhanced-users/${id}/toggle_status/`),
  
  // Statistics
  getRoleStatistics: () => axiosInstance.get('/api/users/enhanced-users/role_statistics/'),
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardAPI = {
  getAdminDashboard: () => axiosInstance.get('/api/users/enhanced-dashboard/admin_dashboard/'),
  getPharmacistDashboard: () => axiosInstance.get('/api/users/enhanced-dashboard/pharmacist_dashboard/'),
  getVerifierDashboard: () => axiosInstance.get('/api/users/enhanced-dashboard/verifier_dashboard/'),
};

// ============================================================================
// PRODUCT MANAGEMENT API
// ============================================================================

export const productAPI = {
  // Enhanced product management
  getProducts: (page = 1, pageSize = 10, params = {}) => 
    axiosInstance.get('/api/products/enhanced-products/', { params: { ...params, page, page_size: pageSize } }),
  getProduct: (id) => axiosInstance.get(`/api/products/enhanced-products/${id}/`),
  createProduct: (productData) => axiosInstance.post('/api/products/enhanced-products/', productData),
  updateProduct: (id, productData) => axiosInstance.patch(`/api/products/enhanced-products/${id}/`, productData),
  deleteProduct: (id) => axiosInstance.delete(`/api/products/enhanced-products/${id}/`),
  
  // Composition management
  getCompositions: (params = {}) => axiosInstance.get('/api/products/compositions/', { params }),
  getComposition: (id) => axiosInstance.get(`/api/products/compositions/${id}/`),
  createComposition: (compositionData) => axiosInstance.post('/api/products/compositions/', compositionData),
  updateComposition: (id, compositionData) => axiosInstance.patch(`/api/products/compositions/${id}/`, compositionData),
  deleteComposition: (id) => axiosInstance.delete(`/api/products/compositions/${id}/`),
  
  // Product-composition relationships
  addCompositions: (productId, compositionsData) => 
    axiosInstance.post(`/api/products/enhanced-products/${productId}/add_compositions/`, compositionsData),
  removeComposition: (productId, compositionData) => 
    axiosInstance.delete(`/api/products/enhanced-products/${productId}/remove_composition/`, { data: compositionData }),
  
  // Inventory management
  // Batch management using legacy/batches endpoint
  addBatch: (batchData) =>
    axiosInstance.post('/api/products/legacy/batches/', batchData),
  updateBatch: (batchId, batchData) =>
    axiosInstance.patch(`/api/products/legacy/batches/${batchId}/`, batchData),
  
  // Original updateStock (if still needed for other purposes, otherwise remove)
  // For now, keeping it as it might be used elsewhere, but batch creation/update will use new functions.
  updateStock: (productId, stockData) => 
    axiosInstance.post(`/api/products/enhanced-products/${productId}/update_stock/`, stockData),

  getLowStockAlert: () => axiosInstance.get('/api/products/enhanced-products/low_stock_alert/'),
  getInventorySummary: () => axiosInstance.get('/api/products/enhanced-products/inventory_summary/'),
  
  // Legacy endpoints for backward compatibility
  getLegacyProducts: (params = {}) => axiosInstance.get('/api/products/legacy/products/', { params }),
  getCategories: () => axiosInstance.get('/api/products/legacy/categories/'),
  getGenericNames: () => axiosInstance.get('/api/products/legacy/generic-names/'),
};

// ============================================================================
// PRESCRIPTION MANAGEMENT API
// ============================================================================

export const prescriptionAPI = {
  // Enhanced prescription management
  getPrescriptions: (page = 1, pageSize = 10, params = {}) => 
    axiosInstance.get('/prescription/enhanced-prescriptions/', { params: { ...params, page, page_size: pageSize } }),
  getPrescription: (id) => axiosInstance.get(`/prescription/enhanced-prescriptions/${id}/`),
  createPrescription: (prescriptionData) => axiosInstance.post('/prescription/enhanced-prescriptions/', prescriptionData),
  updatePrescription: (id, prescriptionData) => axiosInstance.patch(`/prescription/enhanced-prescriptions/${id}/`, prescriptionData),
  
  // Prescription verification workflow
  verifyPrescription: (id, verificationData) => 
    axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/verify_prescription/`, verificationData),
  getVerificationQueue: (page = 1, pageSize = 10, params = {}) => 
    axiosInstance.get('/prescription/enhanced-prescriptions/verification_queue/', { params: { ...params, page, page_size: pageSize } }),
  
  // Prescription medicines
  getPrescriptionMedicines: (params = {}) => axiosInstance.get('/prescription/medicines/', { params }),
  getPrescriptionMedicine: (id) => axiosInstance.get(`/prescription/medicines/${id}/`),
  verifyMedicine: (id, verificationData) => 
    axiosInstance.post(`/prescription/medicines/${id}/verify_medicine/`, verificationData),
  bulkVerifyMedicines: (verificationData) => 
    axiosInstance.post('/prescription/medicines/bulk_verify/', verificationData),
  getSuggestedAlternatives: (id) => 
    axiosInstance.post(`/prescription/medicines/${id}/suggest_alternatives/`),
  
  // Workflow and audit logs
  getWorkflowHistory: (prescriptionId) => 
    axiosInstance.get(`/prescription/enhanced-prescriptions/${prescriptionId}/workflow_history/`),
  
  // Analytics
  getAnalytics: () => axiosInstance.get('/prescription/enhanced-prescriptions/analytics/'),

  // Verify prescription (only verified prescriptions can create orders)
  verifyPrescription: (id, data) => axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/verify_prescription/`, data),

  // Create order from verified prescription only
  createOrderFromPrescription: (id, data) => axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/create_order/`, data),

  // Get prescription medicines
  getPrescriptionMedicines: (params) => axiosInstance.get('/prescription/medicines/', { params }),

  // Remap medicine to different product
  remapMedicine: (medicineId, data) => axiosInstance.post(`/prescription/medicines/${medicineId}/remap_medicine/`, data),

  // Add medicine to prescription
  addMedicineToPrescrip: (data) => axiosInstance.post('/prescription/medicines/add_medicine_to_prescription/', data),

  // Verify individual medicine
  verifyMedicine: (medicineId, data) => axiosInstance.post(`/prescription/medicines/${medicineId}/verify_medicine/`, data),
  
  // Legacy mobile API endpoints
  uploadPrescription: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return axiosInstance.post('/prescription/mobile/upload/', formData, config);
  },
  getPrescriptionStatus: (id) => axiosInstance.get(`/prescription/mobile/status/${id}/`),
  getMedicineSuggestions: (id) => axiosInstance.get(`/prescription/mobile/suggestions/${id}/`),
  getPrescriptionProducts: (id) => axiosInstance.get(`/prescription/mobile/products/${id}/`),
  getPrescriptionById: (id) => axiosInstance.get(`/prescription/mobile/id/${id}/`),
  createPrescriptionOrder: (orderData) => axiosInstance.post('/prescription/mobile/create-order/', orderData),
};

// ============================================================================
// COURIER MANAGEMENT API (TPC Specific)
// ============================================================================

export const courierAPI = {
  // Get the single TPC courier partner details
  getTPCCourierPartner: () => axiosInstance.get('/api/courier/tpc-partner/'),
  
  // Update the single TPC courier partner details
  updateTPCCourierPartner: (partnerData) => axiosInstance.patch('/api/courier/tpc-partner/', partnerData),

  // TPC specific actions
  checkPincodeService: (pincode) => axiosInstance.get('/api/courier/tpc-partner/check_pincode_service/', { params: { pincode } }),
  searchAreaName: (areaName) => axiosInstance.get('/api/courier/tpc-partner/search_area_name/', { params: { area_name: areaName } }),
  requestConsignmentNotes: (qty) => axiosInstance.post('/api/courier/tpc-partner/request_consignment_notes/', { qty }),
  getConsignmentNoteStock: () => axiosInstance.get('/api/courier/tpc-partner/get_consignment_note_stock/'),
  getConsignmentNoteStockDetails: () => axiosInstance.get('/api/courier/tpc-partner/get_consignment_note_stock_details/'),
  checkDuplicateRefNo: (refNo) => axiosInstance.get('/api/courier/tpc-partner/check_duplicate_ref_no/', { params: { ref_no: refNo } }),
  getTrackingWebpageUrl: (shipmentId) => axiosInstance.get(`/api/courier/shipments/${shipmentId}/get_tracking_webpage_url/`),
  printConsignmentNote: (shipmentId, singleCopy = false) => axiosInstance.get(`/api/courier/shipments/${shipmentId}/print_consignment_note/`, { params: { single_copy: singleCopy } }),

  // Shipment related actions (these operate on individual shipments, not the partner itself)
  createShipment: (shipmentData) => axiosInstance.post('/api/courier/shipments/create_shipment/', shipmentData),
  schedulePickup: (shipmentId, pickupData) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/schedule_pickup/`, pickupData),
  cancelShipment: (shipmentId) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/cancel_shipment/`),
  trackShipment: (trackingNumber, newVersion = false, withContact = false) => 
    axiosInstance.get('/api/courier/shipments/track/', { params: { tracking_number: trackingNumber, new_version: newVersion, with_contact: withContact } }),
  createCodBooking: (codData) => axiosInstance.post('/api/courier/shipments/create_cod_booking/', codData),
  addPickupAddonDetails: (shipmentId, addonData) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/add_pickup_addon_details/`, addonData),
};

// ============================================================================
// ORDERS API
// ============================================================================

export const orderAPI = {
  getOrders: (page = 1, pageSize = 10, params = {}) => 
    axiosInstance.get('/order/orders/', { params: { ...params, page, page_size: pageSize } }),
  getOrder: (id) => axiosInstance.get(`/order/orders/${id}/`),
  createOrder: (orderData) => axiosInstance.post('/order/orders/', orderData),
  updateOrder: (id, orderData) => axiosInstance.patch(`/order/orders/${id}/`, orderData),
  deleteOrder: (id) => axiosInstance.delete(`/order/orders/${id}/`),
  
  // Invoice related endpoints
  viewInvoice: (orderId) => axiosInstance.get(`/order/orders/${orderId}/invoice/view/`, {
    responseType: 'text',
    headers: {
      'Accept': 'text/html, application/json',
    }
  }),
  downloadInvoice: (orderId) => axiosInstance.get(`/order/invoices/${orderId}/download/`, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf',
    }
  }),
};

// ============================================================================
// REPORTS & ANALYTICS API
// ============================================================================

export const reportsAPI = {
  // Prescription Reports
  getPrescriptionAnalytics: () => prescriptionAPI.getAnalytics(),
  getPrescriptionTrends: (params = {}) => axiosInstance.get('/prescription/enhanced-prescriptions/trends/', { params }),
  getVerificationMetrics: () => axiosInstance.get('/prescription/enhanced-prescriptions/verification_metrics/'),
  
  // User Reports
  getUserAnalytics: () => userAPI.getRoleStatistics(),
  getUserActivity: (params = {}) => axiosInstance.get('/api/users/activity/', { params }),
  
  // Product Reports
  getInventoryReports: () => productAPI.getInventorySummary(),
  getLowStockReports: () => productAPI.getLowStockAlert(),
  getProductPerformance: (params = {}) => axiosInstance.get('/api/products/performance/', { params }),
  
  // Order Reports
  getOrderAnalytics: (params = {}) => axiosInstance.get('/api/orders/analytics/', { params }),
  getSalesReports: (params = {}) => axiosInstance.get('/api/orders/sales_reports/', { params }),
  
  // Dashboard Reports
  getAdminReports: () => dashboardAPI.getAdminDashboard(),
  getPharmacistReports: () => dashboardAPI.getPharmacistDashboard(),
  getVerifierReports: () => dashboardAPI.getVerifierDashboard(),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const apiUtils = {
  // Handle API errors consistently
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        status,
        message: data.message || data.detail || 'An error occurred',
        errors: data.errors || data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 0,
        message: 'Network error - please check your connection',
        errors: null,
      };
    } else {
      // Something else happened
      return {
        status: 0,
        message: error.message || 'An unexpected error occurred',
        errors: null,
      };
    }
  },

  // Format API responses consistently
  formatResponse: (response) => ({
    data: response.data,
    status: response.status,
    success: response.status >= 200 && response.status < 300,
  }),

  // Build query parameters
  buildParams: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },
};

// Export default API client for custom requests
export default axiosInstance;
