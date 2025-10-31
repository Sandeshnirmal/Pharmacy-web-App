import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/apiService'; // Assuming authAPI is available

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Add user state
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          await fetchUser(); // Fetch user data if token is valid
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token validation failed:", error);
          authAPI.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authAPI.login(credentials);
      if (response.access) {
        setIsAuthenticated(true);
        await fetchUser(); // Fetch user after successful login
        return { success: true };
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: error.response?.data?.detail || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null); // Clear user data on logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
