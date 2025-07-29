// Enhanced API Service for Intelligent Pharmacy Management System
// Comprehensive API integration with role-based access and intelligent prescription workflow

import axios from 'axios';

// Base configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/api/token/', credentials);
    const { access, refresh } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: () => apiClient.get('/api/users/auth-me/'),

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return apiClient.post('/api/token/refresh/', { refresh: refreshToken });
  },
};

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

export const userAPI = {
  // Enhanced user management
  getUsers: (params = {}) => apiClient.get('/api/users/enhanced-users/', { params }),
  getUser: (id) => apiClient.get(`/api/users/enhanced-users/${id}/`),
  createUser: (userData) => apiClient.post('/api/users/enhanced-users/', userData),
  updateUser: (id, userData) => apiClient.patch(`/api/users/enhanced-users/${id}/`, userData),
  deleteUser: (id) => apiClient.delete(`/api/users/enhanced-users/${id}/`),
  
  // User role management
  getRoles: () => apiClient.get('/api/users/roles/'),
  getRole: (id) => apiClient.get(`/api/users/roles/${id}/`),
  createRole: (roleData) => apiClient.post('/api/users/roles/', roleData),
  updateRole: (id, roleData) => apiClient.patch(`/api/users/roles/${id}/`, roleData),
  deleteRole: (id) => apiClient.delete(`/api/users/roles/${id}/`),
  
  // User actions
  changePassword: (id, passwordData) => apiClient.post(`/api/users/enhanced-users/${id}/change_password/`, passwordData),
  verifyUser: (id, verificationData) => apiClient.post(`/api/users/enhanced-users/${id}/verify_user/`, verificationData),
  toggleUserStatus: (id) => apiClient.post(`/api/users/enhanced-users/${id}/toggle_status/`),
  
  // Statistics
  getRoleStatistics: () => apiClient.get('/api/users/enhanced-users/role_statistics/'),
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardAPI = {
  getAdminDashboard: () => apiClient.get('/api/users/enhanced-dashboard/admin_dashboard/'),
  getPharmacistDashboard: () => apiClient.get('/api/users/enhanced-dashboard/pharmacist_dashboard/'),
  getVerifierDashboard: () => apiClient.get('/api/users/enhanced-dashboard/verifier_dashboard/'),
};

// ============================================================================
// PRODUCT MANAGEMENT API
// ============================================================================

export const productAPI = {
  // Enhanced product management
  getProducts: (params = {}) => apiClient.get('/api/products/enhanced-products/', { params }),
  getProduct: (id) => apiClient.get(`/api/products/enhanced-products/${id}/`),
  createProduct: (productData) => apiClient.post('/api/products/enhanced-products/', productData),
  updateProduct: (id, productData) => apiClient.patch(`/api/products/enhanced-products/${id}/`, productData),
  deleteProduct: (id) => apiClient.delete(`/api/products/enhanced-products/${id}/`),
  
  // Composition management
  getCompositions: (params = {}) => apiClient.get('/api/products/compositions/', { params }),
  getComposition: (id) => apiClient.get(`/api/products/compositions/${id}/`),
  createComposition: (compositionData) => apiClient.post('/api/products/compositions/', compositionData),
  updateComposition: (id, compositionData) => apiClient.patch(`/api/products/compositions/${id}/`, compositionData),
  deleteComposition: (id) => apiClient.delete(`/api/products/compositions/${id}/`),
  
  // Product-composition relationships
  addCompositions: (productId, compositionsData) => 
    apiClient.post(`/api/products/enhanced-products/${productId}/add_compositions/`, compositionsData),
  removeComposition: (productId, compositionData) => 
    apiClient.delete(`/api/products/enhanced-products/${productId}/remove_composition/`, { data: compositionData }),
  
  // Inventory management
  updateStock: (productId, stockData) => 
    apiClient.post(`/api/products/enhanced-products/${productId}/update_stock/`, stockData),
  getLowStockAlert: () => apiClient.get('/api/products/enhanced-products/low_stock_alert/'),
  getInventorySummary: () => apiClient.get('/api/products/enhanced-products/inventory_summary/'),
  
  // Legacy endpoints for backward compatibility
  getLegacyProducts: (params = {}) => apiClient.get('/api/products/legacy/products/', { params }),
  getCategories: () => apiClient.get('/api/products/legacy/categories/'),
  getGenericNames: () => apiClient.get('/api/products/legacy/generic-names/'),
};

// ============================================================================
// PRESCRIPTION MANAGEMENT API
// ============================================================================

export const prescriptionAPI = {
  // Enhanced prescription management
  getPrescriptions: (params = {}) => apiClient.get('/api/prescriptions/enhanced-prescriptions/', { params }),
  getPrescription: (id) => apiClient.get(`/api/prescriptions/enhanced-prescriptions/${id}/`),
  createPrescription: (prescriptionData) => apiClient.post('/api/prescriptions/enhanced-prescriptions/', prescriptionData),
  updatePrescription: (id, prescriptionData) => apiClient.patch(`/api/prescriptions/enhanced-prescriptions/${id}/`, prescriptionData),
  
  // Prescription verification workflow
  verifyPrescription: (id, verificationData) => 
    apiClient.post(`/api/prescriptions/enhanced-prescriptions/${id}/verify/`, verificationData),
  getVerificationQueue: (params = {}) => 
    apiClient.get('/api/prescriptions/enhanced-prescriptions/verification_queue/', { params }),
  
  // Prescription medicines
  getPrescriptionMedicines: (params = {}) => apiClient.get('/api/prescriptions/medicines/', { params }),
  getPrescriptionMedicine: (id) => apiClient.get(`/api/prescriptions/medicines/${id}/`),
  verifyMedicine: (id, verificationData) => 
    apiClient.post(`/api/prescriptions/medicines/${id}/verify_medicine/`, verificationData),
  bulkVerifyMedicines: (verificationData) => 
    apiClient.post('/api/prescriptions/medicines/bulk_verify/', verificationData),
  getSuggestedAlternatives: (id) => 
    apiClient.post(`/api/prescriptions/medicines/${id}/suggest_alternatives/`),
  
  // Workflow and audit logs
  getWorkflowHistory: (prescriptionId) => 
    apiClient.get(`/api/prescriptions/enhanced-prescriptions/${prescriptionId}/workflow_history/`),
  getAIProcessingLogs: (prescriptionId) => 
    apiClient.get(`/api/prescriptions/enhanced-prescriptions/${prescriptionId}/ai_processing_logs/`),
  
  // Analytics
  getAnalytics: () => apiClient.get('/api/prescriptions/enhanced-prescriptions/analytics/'),
  
  // Legacy mobile API endpoints
  uploadPrescription: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return apiClient.post('/prescription/mobile/upload/', formData, config);
  },
  getPrescriptionStatus: (id) => apiClient.get(`/prescription/mobile/status/${id}/`),
  getMedicineSuggestions: (id) => apiClient.get(`/prescription/mobile/suggestions/${id}/`),
  getPrescriptionProducts: (id) => apiClient.get(`/prescription/mobile/products/${id}/`),
  createPrescriptionOrder: (orderData) => apiClient.post('/prescription/mobile/create-order/', orderData),
};

// ============================================================================
// WORKFLOW LOGS API
// ============================================================================

export const workflowAPI = {
  getPrescriptionLogs: (params = {}) => apiClient.get('/api/prescriptions/workflow-logs/', { params }),
  getAILogs: (params = {}) => apiClient.get('/api/prescriptions/ai-logs/', { params }),
  getAIPerformanceMetrics: () => apiClient.get('/api/prescriptions/ai-logs/performance_metrics/'),
};

// ============================================================================
// ORDERS API
// ============================================================================

export const orderAPI = {
  getOrders: (params = {}) => apiClient.get('/api/orders/', { params }),
  getOrder: (id) => apiClient.get(`/api/orders/${id}/`),
  createOrder: (orderData) => apiClient.post('/api/orders/', orderData),
  updateOrder: (id, orderData) => apiClient.patch(`/api/orders/${id}/`, orderData),
  deleteOrder: (id) => apiClient.delete(`/api/orders/${id}/`),
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
export default apiClient;
