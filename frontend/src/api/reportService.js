import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'; // Adjust as per your backend URL

// Helper function to get auth token (assuming it's stored in localStorage or similar)
const getAuthToken = () => {
  return localStorage.getItem('access_token'); // Or however your token is stored
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchSalesData = async (filters = {}) => {
  try {
    // Example: /api/reports/sales?start_date=...&end_date=...
    const response = await axiosInstance.get('/api/reports/sales/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    throw error;
  }
};

export const fetchOrdersData = async (filters = {}) => {
  try {
    // Example: /api/reports/orders?status=...&customer_id=...
    const response = await axiosInstance.get('/api/reports/orders/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders data:', error);
    throw error;
  }
};

export const fetchPrescriptionsData = async (filters = {}) => {
  try {
    // Example: /api/reports/prescriptions?status=...&user_id=...
    const response = await axiosInstance.get('/api/reports/prescriptions/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching prescriptions data:', error);
    throw error;
  }
};

export const fetchUsersData = async (filters = {}) => {
  try {
    // Example: /api/reports/users?registered_after=...
    const response = await axiosInstance.get('/api/reports/users/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
