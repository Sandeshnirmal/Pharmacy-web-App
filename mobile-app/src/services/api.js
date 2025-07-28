// API Service Configuration for Pharmacy Mobile App
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8001', // Django backend URL (updated port)
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management
const TokenManager = {
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  },

  async clearTokens() {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await TokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_CONFIG.BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await TokenManager.setTokens(access, refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await TokenManager.clearTokens();
        // Navigate to login screen (implement navigation logic)
        Alert.alert('Session Expired', 'Please login again');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Service Class
class ApiService {
  // Authentication APIs
  async login(email, password) {
    try {
      const response = await apiClient.post('/user/login/', {
        email,
        password,
      });

      const { access, refresh, user } = response.data;
      await TokenManager.setTokens(access, refresh);

      // Store user data
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed',
      };
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.post('/user/register/', userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  }

  async logout() {
    try {
      await TokenManager.clearTokens();
      await AsyncStorage.removeItem('user_data');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Logout failed',
      };
    }
  }

  // Get current user data
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Prescription APIs
  async uploadPrescription(imageUri) {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'prescription.jpg',
      });

      const response = await apiClient.post('/prescription/mobile/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Upload failed',
      };
    }
  }

  async getPrescriptionStatus(prescriptionId) {
    try {
      const response = await apiClient.get(`/prescription/mobile/status/${prescriptionId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get status',
      };
    }
  }

  async getMedicineSuggestions(prescriptionId) {
    try {
      const response = await apiClient.get(`/prescription/mobile/suggestions/${prescriptionId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get suggestions',
      };
    }
  }

  async createPrescriptionOrder(orderData) {
    try {
      const response = await apiClient.post('/prescription/mobile/create-order/', orderData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Order creation failed',
      };
    }
  }

  // Product APIs
  async getProducts(params = {}) {
    try {
      const response = await apiClient.get('/product/products/', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get products',
      };
    }
  }

  async searchProducts(query) {
    try {
      const response = await apiClient.get('/product/products/', {
        params: { search: query },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Search failed',
      };
    }
  }

  // Order APIs
  async getOrders() {
    try {
      const response = await apiClient.get('/orders/orders/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get orders',
      };
    }
  }

  async getOrderDetails(orderId) {
    try {
      const response = await apiClient.get(`/orders/orders/${orderId}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get order details',
      };
    }
  }

  // User Profile APIs
  async getUserProfile() {
    try {
      const response = await apiClient.get('/user/profile/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get profile',
      };
    }
  }

  async updateUserProfile(profileData) {
    try {
      const response = await apiClient.put('/user/profile/', profileData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed',
      };
    }
  }
}

// Export singleton instance
export default new ApiService();
