// Enhanced Authentication Context for Intelligent Pharmacy Management System
// Role-based authentication with comprehensive user management

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Verify token and get user data
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Authenticate user
      await authAPI.login(credentials);
      
      // Get user data
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return {
        success: true,
        user: userData,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Login failed',
        errors: error.response?.data
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  // Role-based permission checks
  const hasPermission = (resource, action) => {
    if (!user || !user.user_role_details) return false;
    
    const permissions = user.user_role_details.permissions;
    return permissions[resource]?.[action] || false;
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Permission helpers for common actions
  const canVerifyPrescriptions = () => hasPermission('prescriptions', 'verify');
  const canManageUsers = () => hasPermission('users', 'manage_roles');
  const canManageInventory = () => hasPermission('products', 'manage_inventory');
  const canViewReports = () => hasPermission('reports', 'view');
  const canProcessOrders = () => hasPermission('orders', 'process');

  // Role-based dashboard access
  const getDashboardType = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return 'admin';
      case 'pharmacist':
        return 'pharmacist';
      case 'verifier':
        return 'verifier';
      case 'staff':
        return 'staff';
      case 'customer':
        return 'customer';
      default:
        return 'basic';
    }
  };

  // Get user display information
  const getUserDisplayInfo = () => {
    if (!user) return null;
    
    return {
      name: user.full_name || `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role_display || user.role,
      avatar: user.profile_image || user.profile_picture_url,
      isVerified: user.verification_status === 'verified',
      licenseNumber: user.license_number,
      permissions: user.user_role_details?.permissions || {}
    };
  };

  // Check if user needs verification
  const needsVerification = () => {
    if (!user) return false;
    return ['doctor', 'pharmacist', 'verifier'].includes(user.role) && 
           user.verification_status === 'pending';
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        roles: ['admin', 'pharmacist', 'verifier', 'staff']
      }
    ];

    const roleBasedItems = [
      {
        label: 'User Management',
        path: '/users',
        icon: 'people',
        roles: ['admin'],
        permission: { resource: 'users', action: 'view' }
      },
      {
        label: 'Prescription Verification',
        path: '/prescriptions',
        icon: 'assignment',
        roles: ['admin', 'pharmacist', 'verifier'],
        permission: { resource: 'prescriptions', action: 'verify' }
      },
      {
        label: 'Product Management',
        path: '/products',
        icon: 'inventory',
        roles: ['admin', 'pharmacist'],
        permission: { resource: 'products', action: 'view' }
      },
      {
        label: 'Inventory',
        path: '/inventory',
        icon: 'warehouse',
        roles: ['admin', 'pharmacist', 'staff'],
        permission: { resource: 'products', action: 'manage_inventory' }
      },
      {
        label: 'Orders',
        path: '/orders',
        icon: 'shopping_cart',
        roles: ['admin', 'pharmacist', 'staff'],
        permission: { resource: 'orders', action: 'view' }
      },
      {
        label: 'Analytics',
        path: '/analytics',
        icon: 'analytics',
        roles: ['admin', 'pharmacist'],
        permission: { resource: 'reports', action: 'view' }
      }
    ];

    return [...baseItems, ...roleBasedItems].filter(item => {
      // Check role access
      if (item.roles && !item.roles.includes(user.role)) {
        return false;
      }
      
      // Check permission access
      if (item.permission) {
        return hasPermission(item.permission.resource, item.permission.action);
      }
      
      return true;
    });
  };

  const contextValue = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    updateUser,
    
    // Permission checks
    hasPermission,
    hasRole,
    hasAnyRole,
    canVerifyPrescriptions,
    canManageUsers,
    canManageInventory,
    canViewReports,
    canProcessOrders,
    
    // Utility functions
    getDashboardType,
    getUserDisplayInfo,
    needsVerification,
    getNavigationItems,
    
    // Role constants for easy access
    roles: {
      ADMIN: 'admin',
      PHARMACIST: 'pharmacist',
      VERIFIER: 'verifier',
      STAFF: 'staff',
      CUSTOMER: 'customer'
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
