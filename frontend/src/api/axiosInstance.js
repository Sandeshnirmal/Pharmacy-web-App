import axios from 'axios';

// Base config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/', // Use environment variable or default
  timeout: 10000, // Increased timeout for better reliability
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token if expired
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const res = await axios.post(`${axiosInstance.defaults.baseURL}api/token/refresh/`, { // Use baseURL from instance
          refresh: refreshToken,
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        // Store new access token
        localStorage.setItem('access_token', res.data.access);
        axiosInstance.defaults.headers['Authorization'] = `Bearer ${res.data.access}`;
        originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (err) {
        // If refresh fails, log out user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login'; // redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
