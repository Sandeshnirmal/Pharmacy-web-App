// Comprehensive API Service for Intelligent Pharmacy Management System
// Integrated with enhanced backend APIs on port 8000

import axiosInstance from './axiosInstance';

// Simple in-memory cache for API responses
const apiCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const getCachedData = (key) => {
  const cachedItem = apiCache[key];
  if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_DURATION)) {
    return cachedItem.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  apiCache[key] = {
    data,
    timestamp: Date.now(),
  };
};

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/api/token/', credentials);
    const { access, refresh } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return { success: true, access, refresh, data: response.data }; // Return consistent success format
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/api/users/auth-me/');
      return { success: true, data: response.data, status: response.status }; // Return consistent success format
    } catch (error) {
      console.error("authAPI.getCurrentUser error:", error.response || error); // Log the full error
      return { success: false, error: error.response?.data?.detail || "Failed to fetch current user", status: error.response?.status };
    }
  },

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
  getUsers: async (params = {}) => {
    const cacheKey = `users-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/enhanced-users/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getUser: (id) => axiosInstance.get(`/api/users/enhanced-users/${id}/`),
  createUser: (userData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('users-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/users/enhanced-users/', userData);
  },
  updateUser: (id, userData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('users-') || key === `user-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/users/enhanced-users/${id}/`, userData);
  },
  deleteUser: (id) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('users-') || key === `user-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/users/enhanced-users/${id}/`);
  },
  
  // User role management
  getRoles: async () => {
    const cacheKey = 'roles';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/roles/');
    setCachedData(cacheKey, response);
    return response;
  },
  getRole: (id) => axiosInstance.get(`/api/users/roles/${id}/`),
  createRole: (roleData) => {
    delete apiCache['roles'];
    return axiosInstance.post('/api/users/roles/', roleData);
  },
  updateRole: (id, roleData) => {
    delete apiCache['roles'];
    return axiosInstance.patch(`/api/users/roles/${id}/`, roleData);
  },
  deleteRole: (id) => {
    delete apiCache['roles'];
    return axiosInstance.delete(`/api/users/roles/${id}/`);
  },
  
  // User actions
  changePassword: (id, passwordData) => axiosInstance.post(`/api/users/enhanced-users/${id}/change_password/`, passwordData),
  verifyUser: (id, verificationData) => axiosInstance.post(`/api/users/enhanced-users/${id}/verify_user/`, verificationData),
  toggleUserStatus: (id) => axiosInstance.post(`/api/users/enhanced-users/${id}/toggle_status/`),
  
  // Statistics
  getRoleStatistics: async () => {
    const cacheKey = 'roleStatistics';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/enhanced-users/role_statistics/');
    setCachedData(cacheKey, response);
    return response;
  },
};

// ============================================================================
// ADDRESS MANAGEMENT API (Placeholder)
// ============================================================================

// ============================================================================
// ADDRESS MANAGEMENT API (Simulated)
// ============================================================================

export const addressAPI = {
  getAddresses: async (userId) => {
    const cacheKey = `addresses-${userId}`; // Cache per user
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/addresses/');
    setCachedData(cacheKey, response);
    return response;
  },
  addAddress: (addressData) => {
    // Invalidate all address caches for the user
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('addresses-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/users/addresses/', addressData);
  },
  updateAddress: (addressId, addressData) => {
    // Invalidate all address caches for the user
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('addresses-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/users/addresses/${addressId}/`, addressData);
  },
  deleteAddress: (addressId) => {
    // Invalidate all address caches for the user
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('addresses-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/users/addresses/${addressId}/`);
  },
  // Removed checkPincodeServiceability from addressAPI as it's in courierAPI
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardAPI = {
  getAdminDashboard: async () => {
    const cacheKey = 'adminDashboard';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/enhanced-dashboard/admin_dashboard/');
    setCachedData(cacheKey, response);
    return response;
  },
  getPharmacistDashboard: async () => {
    const cacheKey = 'pharmacistDashboard';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/enhanced-dashboard/pharmacist_dashboard/');
    setCachedData(cacheKey, response);
    return response;
  },
  getVerifierDashboard: async () => {
    const cacheKey = 'verifierDashboard';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/enhanced-dashboard/verifier_dashboard/');
    setCachedData(cacheKey, response);
    return response;
  },
};

// ============================================================================
// PRODUCT MANAGEMENT API
// ============================================================================

export const productAPI = {
  // Enhanced product management
  getProducts: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `products-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await axiosInstance.get('/api/products/enhanced-products/', { params: { ...params, page, page_size: pageSize } });
    setCachedData(cacheKey, response);
    return response;
  },
  getProduct: async (id) => {
    const cacheKey = `product-${id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get(`/api/products/enhanced-products/${id}/`);
    setCachedData(cacheKey, response);
    return response;
  },
  createProduct: (productData) => {
    // Invalidate cache for product lists when creating a new product
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/products/enhanced-products/', productData);
  },
  updateProduct: (id, productData) => {
    // Invalidate cache for product lists and specific product when updating
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/products/enhanced-products/${id}/`, productData);
  },
  deleteProduct: (id) => {
    // Invalidate cache for product lists and specific product when deleting
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/products/enhanced-products/${id}/`);
  },
  
  // Composition management
  getCompositions: async (params = {}) => {
    const cacheKey = `compositions-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/products/compositions/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getComposition: (id) => axiosInstance.get(`/api/products/compositions/${id}/`),
  createComposition: (compositionData) => {
    // Invalidate cache for compositions when creating
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('compositions-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/products/compositions/', compositionData);
  },
  updateComposition: (id, compositionData) => {
    // Invalidate cache for compositions when updating
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('compositions-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/products/compositions/${id}/`, compositionData);
  },
  deleteComposition: (id) => {
    // Invalidate cache for compositions when deleting
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('compositions-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/products/compositions/${id}/`);
  },
  
  // Product-composition relationships
  addCompositions: (productId, compositionsData) => {
    // Invalidate product cache when modifying compositions
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${productId}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/api/products/enhanced-products/${productId}/add_compositions/`, compositionsData);
  },
  removeComposition: (productId, compositionData) => {
    // Invalidate product cache when modifying compositions
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${productId}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/products/enhanced-products/${productId}/remove_composition/`, { data: compositionData });
  },
  
  // Inventory management
  // Batch management using legacy/batches endpoint
  addBatch: (batchData) => {
    // Invalidate product cache when adding a batch
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${batchData.product}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/products/legacy/batches/', batchData);
  },
  updateBatch: (batchId, batchData) => {
    // Invalidate product cache when updating a batch
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${batchData.product}`) { // Assuming batchData contains product ID
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/products/legacy/batches/${batchId}/`, batchData);
  },
  getBatches: (productId, params = {}) => axiosInstance.get(`/api/products/legacy/batches/`, { params: { ...params, product: productId } }),
  deleteBatch: (batchId) => {
    // Invalidate product cache when deleting a batch
    // This would require knowing the product ID associated with the batch, which is not directly available here.
    // A more robust solution would be to have the backend return the product ID on batch deletion,
    // or to clear all product-related caches. For simplicity, we'll clear all product caches.
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/products/legacy/batches/${batchId}/`);
  },
  
  // Original updateStock (if still needed for other purposes, otherwise remove)
  updateStock: (productId, stockData) => {
    // Invalidate product cache when updating stock
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('products-') || key === `product-${productId}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/api/products/enhanced-products/${productId}/update_stock/`, stockData);
  },

  getLowStockAlert: async () => {
    const cacheKey = 'lowStockAlert';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/products/enhanced-products/low_stock_alert/');
    setCachedData(cacheKey, response);
    return response;
  },
  getInventorySummary: async () => {
    const cacheKey = 'inventorySummary';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/products/enhanced-products/inventory_summary/');
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Legacy endpoints for backward compatibility
  getLegacyProducts: (params = {}) => axiosInstance.get('/api/products/legacy/products/', { params }),
  getCategories: async () => {
    const cacheKey = 'categories';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/products/legacy/categories/');
    setCachedData(cacheKey, response);
    return response;
  },
  getGenericNames: async () => {
    const cacheKey = 'genericNames';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/products/legacy/generic-names/');
    setCachedData(cacheKey, response);
    return response;
  },
  getUser: async (id) => {
    const cacheKey = `user-${id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get(`/api/users/enhanced-users/${id}/`);
    setCachedData(cacheKey, response);
    return response;
  },
  createUser: (userData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('genericNames')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/products/legacy/generic-names/', userData);
  },
};

// ============================================================================
// PRESCRIPTION MANAGEMENT API
// ============================================================================

export const prescriptionAPI = {
  // Enhanced prescription management
  getPrescriptions: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `prescriptions-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/enhanced-prescriptions/', { params: { ...params, page, page_size: pageSize } });
    setCachedData(cacheKey, response);
    return response;
  },
  getPrescription: (id) => axiosInstance.get(`/prescription/enhanced-prescriptions/${id}/`),
  createPrescription: (prescriptionData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptions-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/prescription/enhanced-prescriptions/', prescriptionData);
  },
  updatePrescription: (id, prescriptionData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptions-') || key === `prescription-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/prescription/enhanced-prescriptions/${id}/`, prescriptionData);
  },
  
  // Prescription verification workflow
  verifyPrescription: (id, verificationData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptions-') || key === `prescription-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/verify_prescription/`, verificationData);
  },
  getVerificationQueue: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `verificationQueue-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/enhanced-prescriptions/verification_queue/', { params: { ...params, page, page_size: pageSize } });
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Prescription medicines
  getPrescriptionMedicines: async (params = {}) => {
    const cacheKey = `prescriptionMedicines-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/medicines/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getPrescriptionMedicine: (id) => axiosInstance.get(`/prescription/medicines/${id}/`),
  verifyMedicine: (id, verificationData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptionMedicines-') || key === `prescriptionMedicine-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/prescription/medicines/${id}/verify_medicine/`, verificationData);
  },
  bulkVerifyMedicines: (verificationData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptionMedicines-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/prescription/medicines/bulk_verify/', verificationData);
  },
  getSuggestedAlternatives: (id) => axiosInstance.post(`/prescription/medicines/${id}/suggest_alternatives/`),
  
  // Workflow and audit logs
  getWorkflowHistory: async (prescriptionId) => {
    const cacheKey = `workflowHistory-${prescriptionId}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get(`/prescription/enhanced-prescriptions/${prescriptionId}/workflow_history/`);
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Analytics
  getAnalytics: async () => {
    const cacheKey = 'prescriptionAnalytics';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/enhanced-prescriptions/analytics/');
    setCachedData(cacheKey, response);
    return response;
  },

  // Verify prescription (only verified prescriptions can create orders)
  verifyPrescription: (id, data) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptions-') || key === `prescription-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/verify_prescription/`, data);
  },

  // Create order from verified prescription only
  createOrderFromPrescription: (id, data) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-') || key.startsWith('prescriptions-') || key === `prescription-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/prescription/enhanced-prescriptions/${id}/create_order/`, data);
  },

  // Get prescription medicines
  getPrescriptionMedicines: async (params) => {
    const cacheKey = `prescriptionMedicines-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/medicines/', { params });
    setCachedData(cacheKey, response);
    return response;
  },

  // Remap medicine to different product
  remapMedicine: (medicineId, data) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptionMedicines-') || key === `prescriptionMedicine-${medicineId}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/prescription/medicines/${medicineId}/remap_medicine/`, data);
  },

  // Add medicine to prescription
  addMedicineToPrescrip: (data) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptions-') || key.startsWith('prescriptionMedicines-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/prescription/medicines/add_medicine_to_prescription/', data);
  },

  // Verify individual medicine
  verifyMedicine: (medicineId, data) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptionMedicines-') || key === `prescriptionMedicine-${medicineId}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/prescription/medicines/${medicineId}/verify_medicine/`, data);
  },
  
  // Legacy mobile API endpoints
  uploadPrescription: (formData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('prescriptions-')) {
        delete apiCache[key];
      }
    });
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
  getPrescriptionById: async (id) => { // Make it async to wrap response
    const cacheKey = `prescription-${id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    try {
      const response = await axiosInstance.get(`/prescription/mobile/detail/${id}/`);
      setCachedData(cacheKey, response);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to fetch prescription details", status: error.response?.status };
    }
  },
  createPrescriptionOrder: (orderData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-') || key.startsWith('prescriptions-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/prescription/mobile/create-order/', orderData);
  },
};

// ============================================================================
// INVENTORY MANAGEMENT API
// ============================================================================

export const inventoryAPI = {
  getPurchaseOrders: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `purchaseOrders-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/inventory/purchase-orders/', { params: { ...params, page, page_size: pageSize } });
    setCachedData(cacheKey, response);
    return response;
  },
  createPurchaseOrder: (orderData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('purchaseOrders-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/inventory/purchase-orders/', orderData);
  },
  getPurchaseOrder: (id) => axiosInstance.get(`/api/inventory/purchase-orders/${id}/`),
  updatePurchaseOrder: (id, orderData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('purchaseOrders-') || key === `purchaseOrder-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/inventory/purchase-orders/${id}/`, orderData);
  },
  deletePurchaseOrder: (id) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('purchaseOrders-') || key === `purchaseOrder-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/inventory/purchase-orders/${id}/`);
  },
  returnPurchaseOrderItems: (id, items) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('purchaseOrders-') || key === `purchaseOrder-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/api/inventory/purchase-orders/${id}/return_items/`, items);
  },
  getSuppliers: async (params = {}) => {
    const cacheKey = `suppliers-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/inventory/suppliers/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getPurchaseReturns: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `purchaseReturns-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/inventory/purchase-returns/', { params: { ...params, page, page_size: pageSize } });
    setCachedData(cacheKey, response);
    return response;
  },
};

// ============================================================================
// COURIER MANAGEMENT API (TPC Specific)
// ============================================================================

export const courierAPI = {
  // Get the single TPC courier partner details
  getTPCCourierPartner: async () => {
    const cacheKey = 'tpcPartner';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/tpc-partner/');
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Update the single TPC courier partner details
  updateTPCCourierPartner: (partnerData) => {
    delete apiCache['tpcPartner'];
    return axiosInstance.patch('/api/courier/tpc-partner/', partnerData);
  },

  // TPC specific actions
  checkPincodeService: async (pincode) => {
    const cacheKey = `pincodeService-${pincode}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/shipments/check_pincode_serviceability/', { params: { pincode } });
    setCachedData(cacheKey, response);
    return response;
  },
  searchAreaName: async (areaName) => {
    const cacheKey = `areaName-${areaName}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/tpc-partner/search_area_name/', { params: { area_name: areaName } });
    setCachedData(cacheKey, response);
    return response;
  },
  requestConsignmentNotes: (qty) => axiosInstance.post('/api/courier/tpc-partner/request_consignment_notes/', { qty }),
  getConsignmentNoteStock: async () => {
    const cacheKey = 'consignmentNoteStock';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/tpc-partner/get_consignment_note_stock/');
    setCachedData(cacheKey, response);
    return response;
  },
  getConsignmentNoteStockDetails: async () => {
    const cacheKey = 'consignmentNoteStockDetails';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/tpc-partner/get_consignment_note_stock_details/');
    setCachedData(cacheKey, response);
    return response;
  },
  checkDuplicateRefNo: async (refNo) => {
    const cacheKey = `duplicateRefNo-${refNo}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/tpc-partner/check_duplicate_ref_no/', { params: { ref_no: refNo } });
    setCachedData(cacheKey, response);
    return response;
  },
  getTrackingWebpageUrl: (shipmentId) => axiosInstance.get(`/api/courier/shipments/${shipmentId}/get_tracking_webpage_url/`),
  printConsignmentNote: (shipmentId, singleCopy = false) => axiosInstance.get(`/api/courier/shipments/${shipmentId}/print_consignment_note/`, { params: { single_copy: singleCopy } }),

  // Shipment related actions (these operate on individual shipments, not the partner itself)
  createShipment: (shipmentData) => axiosInstance.post('/api/courier/shipments/create_shipment/', shipmentData),
  schedulePickup: (shipmentId, pickupData) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/schedule_pickup/`, pickupData),
  cancelShipment: (shipmentId) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/cancel_shipment/`),
  trackShipment: async (trackingNumber, newVersion = false, withContact = false) => {
    const cacheKey = `trackShipment-${trackingNumber}-${newVersion}-${withContact}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/courier/shipments/track/', { params: { tracking_number: trackingNumber, new_version: newVersion, with_contact: withContact } });
    setCachedData(cacheKey, response);
    return response;
  },
  createCodBooking: (codData) => axiosInstance.post('/api/courier/shipments/create_cod_booking/', codData),
  addPickupAddonDetails: (shipmentId, addonData) => axiosInstance.post(`/api/courier/shipments/${shipmentId}/add_pickup_addon_details/`, addonData),
};

// ============================================================================
// ORDERS API
// ============================================================================

export const orderAPI = {
  getOrders: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `orders-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axiosInstance.get('/order/orders/', { params: { ...params, page, page_size: pageSize } });
      setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error("Error fetching orders from API:", error);
      throw error; // Re-throw to be caught by the component
    }
  },
  getOrder: (id) => axiosInstance.get(`/order/orders/${id}/`),
  createOrder: (orderData) => {
    // Invalidate cache for order lists when creating a new order
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/order/orders/', orderData);
  },
  updateOrder: (id, orderData) => {
    // Invalidate cache for order lists and specific order when updating
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-') || key === `order-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/order/orders/${id}/`, orderData);
  },
  deleteOrder: (id) => {
    // Invalidate cache for order lists and specific order when deleting
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-') || key === `order-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/order/orders/${id}/`);
  },
  
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
  createPendingOrder: (orderData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/order/pending/', orderData);
  },
  finalizeOrderAfterPayment: (orderData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/order/enhanced/create-paid-order/', orderData);
  },

  cancelOrder: async (orderId, reason) => {
    // Invalidate cache for order lists and specific order when cancelling
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('orders-') || key === `order-${orderId}`) {
        delete apiCache[key];
      }
    });
    try {
      const response = await axiosInstance.post(`/order/orders/${orderId}/cancel/`, { reason });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error.response || error);
      return { success: false, error: error.response?.data?.error || "Failed to cancel order", status: error.response?.status };
    }
  },
};

// ============================================================================
// PAYMENT API
// ============================================================================

export const paymentAPI = {
  createRazorpayPaymentOrder: (paymentData) => axiosInstance.post('/payment/create/', paymentData),
  verifyRazorpayPayment: (verificationData) => axiosInstance.post('/payment/verify/', verificationData),
};

// ============================================================================
// DISCOUNT MANAGEMENT API
// ============================================================================

export const discountAPI = {
  getDiscounts: async (params = {}) => {
    const cacheKey = `discounts-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/discounts/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getDiscount: (id) => axiosInstance.get(`/api/discounts/${id}/`),
  createDiscount: (discountData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('discounts-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/discounts/', discountData);
  },
  updateDiscount: (id, discountData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('discounts-') || key === `discount-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/discounts/${id}/`, discountData);
  },
  deleteDiscount: (id) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('discounts-') || key === `discount-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/discounts/${id}/`);
  },
};

// ============================================================================
// OFFLINE SALES API
// ============================================================================

export const salesBillAPI = {
  getSalesBills: async (page = 1, pageSize = 10, params = {}) => {
    const cacheKey = `salesBills-${page}-${pageSize}-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/offline-sales/offline-sales/', { params: { ...params, page, page_size: pageSize } });
    setCachedData(cacheKey, response);
    return response;
  },
  getSalesBill: (id) => axiosInstance.get(`/api/offline-sales/offline-sales/${id}/`),
  createSalesBill: (billData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('salesBills-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/offline-sales/offline-sales/', billData);
  },
  updateSalesBill: (id, billData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('salesBills-') || key === `salesBill-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.patch(`/api/offline-sales/offline-sales/${id}/`, billData);
  },
  deleteSalesBill: (id) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('salesBills-') || key === `salesBill-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.delete(`/api/offline-sales/offline-sales/${id}/`);
  },
  generateInvoice: (id) => axiosInstance.get(`/api/offline-sales/offline-sales/${id}/generate-invoice/`),
  createBillReturn: (returnData) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('salesBills-')) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post('/api/offline-sales/bill-returns/', returnData);
  },
  cancelSalesBill: (id, cancellationReason) => {
    Object.keys(apiCache).forEach(key => {
      if (key.startsWith('salesBills-') || key === `salesBill-${id}`) {
        delete apiCache[key];
      }
    });
    return axiosInstance.post(`/api/offline-sales/offline-sales/${id}/cancel-bill/`, { cancellation_reason: cancellationReason });
  },
};

// ============================================================================
// CART API
// ============================================================================

export const cartAPI = {
  getCart: async () => {
    const cacheKey = 'cart';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/cart/');
    setCachedData(cacheKey, response);
    return response;
  },
  addItem: (productId, quantity = 1) => {
    // Invalidate cart cache when modifying cart
    delete apiCache['cart'];
    return axiosInstance.post('/api/cart/add_item/', { product_id: productId, quantity });
  },
  updateItem: (productId, quantity) => {
    // Invalidate cart cache when modifying cart
    delete apiCache['cart'];
    return axiosInstance.put('/api/cart/update_item/', { product_id: productId, quantity });
  },
  removeItem: (productId) => {
    // Invalidate cart cache when modifying cart
    delete apiCache['cart'];
    return axiosInstance.delete('/api/cart/remove_item/', { data: { product_id: productId } });
  },
  clearCart: () => {
    // Invalidate cart cache when clearing cart
    delete apiCache['cart'];
    return axiosInstance.post('/api/cart/clear_cart/');
  },
};

// ============================================================================
// OFFLINE CUSTOMER API
// ============================================================================

export const offlineCustomerAPI = {
  findOrCreateCustomer: (customerData) => 
    axiosInstance.post('/api/offline-sales/offline-customers/find-or-create/', customerData),
  searchCustomerByPhone: (phoneNumber) =>
    axiosInstance.get(`/api/offline-sales/offline-customers/search-by-phone/`, { params: { phone_number: phoneNumber } }),
  getCustomers: async (params = {}) => {
    const cacheKey = `offlineCustomers-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/offline-sales/offline-customers/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
};

// ============================================================================
// REPORTS & ANALYTICS API
// ============================================================================

export const reportsAPI = {
  // Prescription Reports
  getPrescriptionAnalytics: async () => {
    const cacheKey = 'prescriptionAnalytics';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await prescriptionAPI.getAnalytics();
    setCachedData(cacheKey, response);
    return response;
  },
  getPrescriptionTrends: async (params = {}) => {
    const cacheKey = `prescriptionTrends-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/enhanced-prescriptions/trends/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getVerificationMetrics: async () => {
    const cacheKey = 'verificationMetrics';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/prescription/enhanced-prescriptions/verification_metrics/');
    setCachedData(cacheKey, response);
    return response;
  },
  
  // User Reports
  getUserAnalytics: async () => {
    const cacheKey = 'userAnalytics';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await userAPI.getRoleStatistics();
    setCachedData(cacheKey, response);
    return response;
  },
  getUserActivity: async (params = {}) => {
    const cacheKey = `userActivity-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/users/activity/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Product Reports
  getInventoryReports: async () => {
    const cacheKey = 'inventoryReports';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await productAPI.getInventorySummary();
    setCachedData(cacheKey, response);
    return response;
  },
  getLowStockReports: async () => {
    const cacheKey = 'lowStockReports';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await productAPI.getLowStockAlert();
    setCachedData(cacheKey, response);
    return response;
  },
  getProductPerformance: async (params = {}) => {
    const cacheKey = `productPerformance-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/products/performance/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Order Reports
  getOrderAnalytics: async (params = {}) => {
    const cacheKey = `orderAnalytics-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/orders/analytics/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  getSalesReports: async (params = {}) => {
    const cacheKey = `salesReports-${JSON.stringify(params)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await axiosInstance.get('/api/orders/sales_reports/', { params });
    setCachedData(cacheKey, response);
    return response;
  },
  
  // Dashboard Reports
  getAdminReports: async () => {
    const cacheKey = 'adminReports';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await dashboardAPI.getAdminDashboard();
    setCachedData(cacheKey, response);
    return response;
  },
  getPharmacistReports: async () => {
    const cacheKey = 'pharmacistReports';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await dashboardAPI.getPharmacistDashboard();
    setCachedData(cacheKey, response);
    return response;
  },
  getVerifierReports: async () => {
    const cacheKey = 'verifierReports';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const response = await dashboardAPI.getVerifierDashboard();
    setCachedData(cacheKey, response);
    return response;
  },
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
