import { lazy } from 'react';

// Eager load critical components
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// Lazy load other components for better performance
const MedicinesListPage = lazy(() => import('../pages/MedicinesListPage'));
const GenericsTable = lazy(() => import('../pages/GenericsTable'));
const InventoryManagement = lazy(() => import('../pages/InventoryManagement'));
const PurchaseBillInventoryUpload = lazy(() => import('../pages/PurchaseBillInventoryUpload.jsx'));
// const PurchaseBillReturn = lazy(() => import('../pages/PurchaseBillReturn'));

// Prescription Management - Lazy loaded
const PrescriptionUploadsTable = lazy(() => import('../pages/PrescriptionUploadsTable'));
const PrescriptionReview = lazy(() => import('../pages/PrescriptionReview'));
const PendingPrescriptionsTable = lazy(() => import('../pages/PendingPrescriptionsTable'));
const RateMaster = lazy(() => import('../pages/RateMaster'));
const DiscountMaster = lazy(() => import('../pages/DiscountMaster'));

// Order Management - Lazy loaded
const OrderDetails = lazy(() => import('../pages/OrderDetails'));
const OrdersTable = lazy(() => import('../pages/OrdersTable'));

// User Management - Lazy loaded
const UserManagement = lazy(() => import('../pages/UserManagement'));
const CustomerManagement = lazy(() => import('../pages/CustomerManagement'));

// Courier Management - Lazy loaded
const TPCCourierManagementPage = lazy(() => import('../pages/TPCCourierManagementPage'));

// Reports - Lazy loaded
const ReportsAnalytics = lazy(() => import('../pages/ReportsAnalytics'));

// Route configuration
export const routes = [
  // Public routes
  {
    path: '/login',
    element: Login,
    public: true,
    title: 'Login'
  },

  // Protected routes (require authentication)
  {
    path: '/dashboard',
    element: Dashboard,
    title: 'Dashboard',
    icon: 'LayoutDashboard'
  },
  {
    path: '/medicines',
    element: MedicinesListPage,
    title: 'Medicines',
    icon: 'Pill',
    lazy: true
  },
  {
    path: '/generics',
    element: GenericsTable,
    title: 'Generic Names',
    icon: 'FileText',
    lazy: true
  },
  {
    path: '/inventory',
    element: InventoryManagement,
    title: 'Inventory',
    icon: 'Package',
    lazy: true
  },
  {
    path: '/purchase-bill/inventory-upload',
    element: PurchaseBillInventoryUpload,
    title: 'Purchase Bill Inventory Upload',
    icon: 'Upload', // Placeholder icon
    lazy: true
  },
  // {
  //   path: '/purchase-bill/return',
  //   element: PurchaseBillReturn,
  //   title: 'Purchase Bill Return',
  //   icon: 'RotateCcw', // Placeholder icon
  //   lazy: true
  // },
  {
    path: '/prescriptions',
    element: PrescriptionUploadsTable,
    title: 'Prescriptions',
    icon: 'FileImage',
    lazy: true
  },
  {
    path: '/pending-prescriptions',
    element: PendingPrescriptionsTable,
    title: 'Pending Prescriptions',
    icon: 'Clock',
    lazy: true
  },
  {
    path: '/prescription-review/:prescriptionId',
    element: PrescriptionReview,
    title: 'Prescription Review',
    hidden: true, // Don't show in navigation
    lazy: true
  },
  {
    path: '/orders',
    element: OrdersTable,
    title: 'Orders',
    icon: 'ShoppingCart',
    lazy: true
  },
  {
    path: '/orders/:orderId',
    element: OrderDetails,
    title: 'Order Details',
    hidden: true,
    lazy: true
  },
  {
    path: '/users',
    element: UserManagement,
    title: 'Users',
    icon: 'Users',
    lazy: true
  },
  {
    path: '/customers',
    element: CustomerManagement,
    title: 'Customers',
    icon: 'UserCheck',
    lazy: true
  },
  {
    path: '/reports',
    element: ReportsAnalytics,
    title: 'Reports & Analytics',
    icon: 'BarChart3',
    lazy: true
  },
  {
    path: '/tpc-courier-management',
    element: TPCCourierManagementPage,
    title: 'TPC Courier Management',
    icon: 'Truck', // Using a truck icon for courier
    lazy: true
  },
  {
    path: '/rate-master',
    element: RateMaster,
    title: 'Rate Master',
    icon: 'DollarSign', // Placeholder icon
    lazy: true
  },
  {
    path: '/discount-master',
    element: DiscountMaster,
    title: 'Discount Master',
    icon: 'Percent', // Placeholder icon
    lazy: true
  }
];

// Get navigation routes (exclude hidden routes)
export const getNavigationRoutes = () => {
  return routes.filter(route => !route.public && !route.hidden);
};

// Get public routes
export const getPublicRoutes = () => {
  return routes.filter(route => route.public);
};

// Get protected routes
export const getProtectedRoutes = () => {
  return routes.filter(route => !route.public);
};

export default routes;
