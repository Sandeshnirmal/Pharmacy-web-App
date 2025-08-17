// Comprehensive API Service for Intelligent Pharmacy Management System
// Integrated with enhanced backend APIs on port 8000

import axiosInstance from './axiosInstance';

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  // Mobile app authentication (Token-based)
  login: async (credentials) => {
    const response = await axiosInstance.post('/api/auth/login/', credentials);
    const { token, access } = response.data;
    
    // Store token for mobile app compatibility
    localStorage.setItem('access_token', token || access);
    localStorage.setItem('refresh_token', token || access); // For compatibility
    
    return response.data;
  },

  // JWT authentication for web dashboard
  loginJWT: async (credentials) => {
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

  getCurrentUser: () => axiosInstance.get('/api/auth/user/'),

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return axiosInstance.post('/api/token/refresh/', { refresh: refreshToken });
  },
};

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

export const userAPI = {
  // User management
  getUsers: (params = {}) => axiosInstance.get('/api/users/', { params }),
  getUser: (id) => axiosInstance.get(`/api/users/${id}/`),
  createUser: (userData) => axiosInstance.post('/api/users/', userData),
  updateUser: (id, userData) => axiosInstance.patch(`/api/users/${id}/`, userData),
  deleteUser: (id) => axiosInstance.delete(`/api/users/${id}/`),
  
  // User status management
  toggleUserActive: (id) => axiosInstance.post(`/api/users/${id}/toggle_active/`),
  
  // Role management
  getRoleStatistics: () => axiosInstance.get('/api/users/role_statistics/'),
  getUsersByRole: (role, params = {}) => axiosInstance.get(`/api/users/?role=${role}`, { params }),
  
  // User activity and analytics
  getUserActivity: (params = {}) => axiosInstance.get('/api/users/activity/', { params }),
  getUserStats: (params = {}) => axiosInstance.get('/api/users/stats/', { params }),
  
  // Profile management
  updateProfile: (id, profileData) => axiosInstance.patch(`/api/users/${id}/profile/`, profileData),
  changePassword: (id, passwordData) => axiosInstance.post(`/api/users/${id}/change_password/`, passwordData),
  
  // Authentication and permissions
  checkPermissions: (id) => axiosInstance.get(`/api/users/${id}/permissions/`),
  assignRole: (id, roleData) => axiosInstance.post(`/api/users/${id}/assign_role/`, roleData),
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
  getEnhancedProducts: (params = {}) => axiosInstance.get('/api/products/enhanced-products/', { params }),
  getEnhancedProduct: (id) => axiosInstance.get(`/api/products/enhanced-products/${id}/`),
  createEnhancedProduct: (productData) => axiosInstance.post('/api/products/enhanced-products/', productData),
  updateEnhancedProduct: (id, productData) => axiosInstance.patch(`/api/products/enhanced-products/${id}/`, productData),
  deleteEnhancedProduct: (id) => axiosInstance.delete(`/api/products/enhanced-products/${id}/`),
  
  // Product search and filtering
  searchProducts: (query, params = {}) => axiosInstance.get(`/api/products/enhanced-products/search/?q=${query}`, { params }),
  getProductsByCategory: (categoryId, params = {}) => axiosInstance.get(`/api/products/enhanced-products/?category=${categoryId}`, { params }),
  getProductsByComposition: (compositionId, params = {}) => axiosInstance.get(`/api/products/enhanced-products/?composition=${compositionId}`, { params }),
  
  // Product compositions
  getCompositions: () => axiosInstance.get('/api/products/compositions/'),
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
  updateStock: (productId, stockData) => 
    axiosInstance.post(`/api/products/enhanced-products/${productId}/update_stock/`, stockData),
  getLowStockAlert: () => axiosInstance.get('/api/products/enhanced-products/low_stock_alert/'),
  getInventorySummary: () => axiosInstance.get('/api/products/enhanced-products/inventory_summary/'),
  
  // Legacy endpoints for backward compatibility
  getLegacyProducts: (params = {}) => axiosInstance.get('/api/products/legacy/products/', { params }),
  getCategories: () => axiosInstance.get('/api/products/legacy/categories/'),
  getGenericNames: () => axiosInstance.get('/api/products/legacy/generic-names/'),
  
  // Batch management
  getBatches: (params = {}) => axiosInstance.get('/api/products/legacy/batches/', { params }),
  getBatch: (id) => axiosInstance.get(`/api/products/legacy/batches/${id}/`),
  createBatch: (batchData) => axiosInstance.post('/api/products/legacy/batches/', batchData),
  updateBatch: (id, batchData) => axiosInstance.patch(`/api/products/legacy/batches/${id}/`, batchData),
  deleteBatch: (id) => axiosInstance.delete(`/api/products/legacy/batches/${id}/`),
  
  // Category management
  createCategory: (categoryData) => axiosInstance.post('/api/products/legacy/categories/', categoryData),
  updateCategory: (id, categoryData) => axiosInstance.patch(`/api/products/legacy/categories/${id}/`, categoryData),
  deleteCategory: (id) => axiosInstance.delete(`/api/products/legacy/categories/${id}/`),
};

// ============================================================================
// PRESCRIPTION MANAGEMENT API
// ============================================================================

export const prescriptionAPI = {
  // Enhanced prescription management (Fixed endpoints)
  getPrescriptions: (params = {}) => axiosInstance.get('/api/prescriptions/enhanced-prescriptions/', { params }),
  getPrescription: (id) => axiosInstance.get(`/api/prescriptions/enhanced-prescriptions/${id}/`),
  createPrescription: (prescriptionData) => axiosInstance.post('/api/prescriptions/enhanced-prescriptions/', prescriptionData),
  updatePrescription: (id, prescriptionData) => axiosInstance.patch(`/api/prescriptions/enhanced-prescriptions/${id}/`, prescriptionData),
  
  // Prescription verification workflow
  verifyPrescription: (id, verificationData) =>
    axiosInstance.post(`/api/prescriptions/enhanced-prescriptions/${id}/verify_prescription/`, verificationData),
  getVerificationQueue: (params = {}) =>
    axiosInstance.get('/api/prescriptions/enhanced-prescriptions/verification_queue/', { params }),

  // Prescription medicines
  getPrescriptionMedicines: (params = {}) => axiosInstance.get('/api/prescriptions/medicines/', { params }),
  getPrescriptionMedicine: (id) => axiosInstance.get(`/api/prescriptions/medicines/${id}/`),
  verifyMedicine: (id, verificationData) =>
    axiosInstance.post(`/api/prescriptions/medicines/${id}/verify_medicine/`, verificationData),
  bulkVerifyMedicines: (verificationData) =>
    axiosInstance.post('/api/prescriptions/medicines/bulk_verify/', verificationData),
  getSuggestedAlternatives: (id) =>
    axiosInstance.post(`/api/prescriptions/medicines/${id}/suggest_alternatives/`),
  
  // Prescription details management
  updatePrescriptionDetail: (id, detailData) =>
    axiosInstance.patch(`/api/prescriptions/prescription-details/${id}/`, detailData),
  createPrescriptionDetail: (detailData) =>
    axiosInstance.post('/api/prescriptions/prescription-details/', detailData),
  
  // Order confirmation
  confirmPrescriptionOrder: (orderId) =>
    axiosInstance.post(`/api/order/confirm-prescription/${orderId}/`),
  
  // Workflow and audit logs
  getWorkflowHistory: (prescriptionId) =>
    axiosInstance.get(`/api/prescriptions/enhanced-prescriptions/${prescriptionId}/workflow_history/`),

  // Analytics
  getAnalytics: () => axiosInstance.get('/api/prescriptions/enhanced-prescriptions/analytics/'),

  // Prescription Scanner (New enhanced features)
  scanPrescription: (prescriptionText) =>
    axiosInstance.post('/api/prescriptions/scanner/scan_prescription/', { prescription_text: prescriptionText }),
  searchMedicines: (query, type = 'name') =>
    axiosInstance.get(`/api/prescriptions/scanner/search_medicines/?q=${query}&type=${type}`),
  getScanHistory: () => axiosInstance.get('/api/prescriptions/scanner/scan_history/'),

  // Composition-based prescription processing
  processCompositionBasedPrescription: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return axiosInstance.post('/api/prescriptions/enhanced-prescriptions/process_composition_based_prescription/', formData, config);
  },

  // OCR reprocessing
  reprocessOCR: (prescriptionId) => 
    axiosInstance.post(`/api/prescriptions/admin/reprocess-ocr/${prescriptionId}/`),

  // Verify prescription (only verified prescriptions can create orders)
  verifyPrescription: (id, data) => axiosInstance.post(`/api/prescriptions/enhanced-prescriptions/${id}/verify_prescription/`, data),

  // Create order from verified prescription only
  createOrderFromPrescription: (id, data) => axiosInstance.post(`/api/prescriptions/enhanced-prescriptions/${id}/create_order/`, data),

  // Get prescription medicines
  getPrescriptionMedicines: (params) => axiosInstance.get('/api/prescriptions/medicines/', { params }),

  // Remap medicine to different product
  remapMedicine: (medicineId, data) => axiosInstance.post(`/api/prescriptions/medicines/${medicineId}/remap_medicine/`, data),

  // Add medicine to prescription
  addMedicineToPrescrip: (data) => axiosInstance.post('/api/prescriptions/medicines/add_medicine_to_prescription/', data),

  // Verify individual medicine
  verifyMedicine: (medicineId, data) => axiosInstance.post(`/api/prescriptions/medicines/${medicineId}/verify_medicine/`, data),
  
  // Legacy mobile API endpoints
  uploadPrescription: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return axiosInstance.post('/api/prescriptions/mobile/upload/', formData, config);
  },
  getPrescriptionStatus: (id) => axiosInstance.get(`/api/prescriptions/mobile/status/${id}/`),
  getMedicineSuggestions: (id) => axiosInstance.get(`/api/prescriptions/mobile/suggestions/${id}/`),
  getPrescriptionProducts: (id) => axiosInstance.get(`/api/prescriptions/mobile/products/${id}/`),
  createPrescriptionOrder: (orderData) => axiosInstance.post('/api/prescriptions/mobile/create-order/', orderData),
};

// ============================================================================
// ORDERS API
// ============================================================================

export const orderAPI = {
  // Legacy order endpoints
  getOrders: (params = {}) => axiosInstance.get('/api/order/orders/', { params }),
  getOrder: (id) => axiosInstance.get(`/api/order/orders/${id}/`),
  createOrder: (orderData) => axiosInstance.post('/api/order/orders/', orderData),
  updateOrder: (id, orderData) => axiosInstance.patch(`/api/order/orders/${id}/`, orderData),
  deleteOrder: (id) => axiosInstance.delete(`/api/order/orders/${id}/`),

  // Order items
  getOrderItems: (params = {}) => axiosInstance.get('/api/order/order-items/', { params }),
  getOrderItem: (id) => axiosInstance.get(`/api/order/order-items/${id}/`),
  createOrderItem: (itemData) => axiosInstance.post('/api/order/order-items/', itemData),
  updateOrderItem: (id, itemData) => axiosInstance.patch(`/api/order/order-items/${id}/`, itemData),
  deleteOrderItem: (id) => axiosInstance.delete(`/api/order/order-items/${id}/`),

  // Order tracking and status
  getOrderTracking: (id) => axiosInstance.get(`/api/order/tracking/${id}/`),
  getOrderStatusHistory: (id) => axiosInstance.get(`/api/order/status-history/${id}/`),
  addTrackingUpdate: (id, updateData) => axiosInstance.post(`/api/order/tracking/${id}/update/`, updateData),

  // Enhanced Order Flow - Payment First Approach
  createPaidOrder: (orderData) => axiosInstance.post('/api/order/enhanced/create-paid-order/', orderData),
  linkPrescriptionToOrder: (orderId, prescriptionData) =>
    axiosInstance.post(`/api/order/enhanced/${orderId}/link-prescription/`, prescriptionData),
  verifyPrescriptionAndConfirmOrder: (orderId, verificationData) =>
    axiosInstance.post(`/api/order/enhanced/${orderId}/verify-prescription/`, verificationData),
  getOrdersForPrescriptionReview: (params = {}) =>
    axiosInstance.get('/api/order/enhanced/prescription-review/', { params }),
  getPaidOrdersAwaitingPrescription: (params = {}) =>
    axiosInstance.get('/api/order/enhanced/awaiting-prescription/', { params }),
};

// ============================================================================
// COURIER API (Professional courier integration)
// ============================================================================

export const courierAPI = {
  // Courier partners
  getCourierPartners: () => axiosInstance.get('/api/courier/partners/'),

  // Shipments
  getShipments: (params = {}) => axiosInstance.get('/api/courier/shipments/', { params }),
  getShipment: (id) => axiosInstance.get(`/api/courier/shipments/${id}/`),
  createShipment: (shipmentData) => axiosInstance.post('/api/courier/shipments/create_shipment/', shipmentData),
  schedulePickup: (shipmentId, pickupData) =>
    axiosInstance.post(`/api/courier/shipments/${shipmentId}/schedule_pickup/`, pickupData),
  cancelShipment: (shipmentId) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/cancel_shipment/`),

  // Tracking
  trackShipment: (trackingNumber) =>
    axiosInstance.get(`/api/courier/shipments/track/?tracking_number=${trackingNumber}`),

  // Service areas and rates
  getServiceAreas: (params = {}) => axiosInstance.get('/api/courier/service-areas/', { params }),
  getRateCards: (params = {}) => axiosInstance.get('/api/courier/rate-cards/', { params }),
};

// ============================================================================
// PAYMENT API (Razorpay Integration)
// ============================================================================

export const paymentAPI = {
  // Create payment order
  createPaymentOrder: (paymentData) => 
    axiosInstance.post('/payment/create/', paymentData),
  
  // Verify payment
  verifyPayment: (verificationData) => 
    axiosInstance.post('/payment/verify/', verificationData),
  
  // Get payment status
  getPaymentStatus: (paymentId) => 
    axiosInstance.get(`/payment/status/${paymentId}/`),
  
  // Process order payment
  processOrderPayment: (orderData) => 
    axiosInstance.post('/payment/process-order/', orderData),
};

// ============================================================================
// REPORTS & ANALYTICS API
// ============================================================================

export const reportsAPI = {
  // Prescription Reports
  getPrescriptionAnalytics: () => prescriptionAPI.getAnalytics(),
  getPrescriptionTrends: (params = {}) => axiosInstance.get('/api/prescriptions/enhanced-prescriptions/trends/', { params }),
  getVerificationMetrics: () => axiosInstance.get('/api/prescriptions/enhanced-prescriptions/verification_metrics/'),
  
  // User Reports
  getUserAnalytics: () => userAPI.getRoleStatistics(),
  getUserActivity: (params = {}) => axiosInstance.get('/api/users/activity/', { params }),
  
  // Product Reports
  getInventoryReports: () => productAPI.getInventorySummary(),
  getLowStockReports: () => productAPI.getLowStockAlert(),
  getProductPerformance: (params = {}) => axiosInstance.get('/api/products/performance/', { params }),
  
  // Order Reports
  getOrderAnalytics: (params = {}) => axiosInstance.get('/api/order/analytics/', { params }),
  getSalesReports: (params = {}) => axiosInstance.get('/api/order/sales_reports/', { params }),
  
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