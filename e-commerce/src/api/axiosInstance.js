import axios from 'axios';

// In-memory cache for GET requests
const cache = {};
const cacheTimers = {};
const CACHE_TTL = 60 * 15000; // 1 minute in milliseconds for frontend cache

// Function to generate a unique cache key for a request
const generateCacheKey = (config) => {
  return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`;
};

// Function to clear the entire cache
export const clearEcommerceCache = () => {
  for (const key in cacheTimers) {
    clearTimeout(cacheTimers[key]);
  }
  Object.keys(cache).forEach(key => delete cache[key]);
  Object.keys(cacheTimers).forEach(key => delete cacheTimers[key]);
  // console.log("E-commerce frontend cache cleared."); // Removed debug print
};

// Base config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/', // Use environment variable
  timeout: 10000, // Increased timeout for better reliability
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token and handle caching
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure method is always defined and lowercase for consistency
    if (config && !config.method) {
      config.method = 'get'; // Default to 'get' if not specified, or infer based on other properties
    }
    if (config && config.method) {
      config.method = config.method.toLowerCase();
    }

    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Caching logic for GET requests
    if (config.method === 'get' && config.cache !== false) { // Allow opting out of cache
      const cacheKey = generateCacheKey(config);
      const cachedResponse = cache[cacheKey];

      if (cachedResponse && Date.now() < cachedResponse.expiry) {
        // console.log(`Serving from cache: ${cacheKey}`); // Removed debug print
        config._cached = true; // Mark this request as cached
        config.cachedResponse = cachedResponse.data; // Attach the cached response
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token if expired and handle caching
axiosInstance.interceptors.response.use(
  (response) => {
    // Ensure method is always defined and lowercase for consistency, even for cached responses
    if (response.config && !response.config.method) {
      response.config.method = 'get'; // Default to 'get' if not specified
    }
    if (response.config && response.config.method) {
      response.config.method = response.config.method.toLowerCase();
    }

    // If the request was served from cache, return the cached response directly
    if (response.config._cached) {
      return response.config.cachedResponse;
    }

    // Caching logic for successful GET responses
    if (response.config.method === 'get' && response.config.cache !== false) {
      const cacheKey = generateCacheKey(response.config);
      const expiry = Date.now() + CACHE_TTL;
      cache[cacheKey] = { data: response, expiry };
      cacheTimers[cacheKey] = setTimeout(() => {
        delete cache[cacheKey];
        delete cacheTimers[cacheKey];
        // console.log(`Cache expired for: ${cacheKey}`); // Removed debug print
      }, CACHE_TTL);
      // console.log(`Cached response for: ${cacheKey}`); // Removed debug print
    }

    // Invalidate cache on POST, PUT, DELETE requests
    if (['post', 'put', 'delete', 'patch'].includes(response.config.method)) {
      clearEcommerceCache();
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/'}api/token/refresh/`, {
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
