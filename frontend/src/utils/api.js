// frontend/src/utils/api.js

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust if your backend URL is different

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Handle unauthorized: e.g., redirect to login page
      console.error("Authentication required. Redirecting to login...");
      // Optionally, you can dispatch an event or use a global state management to redirect
      // window.location.href = '/login'; 
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

export default apiRequest;
