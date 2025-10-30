import { lazy } from 'react';

// Eager load critical components
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// Lazy load other components for better performance
const MedicinesListPage = lazy(() => import('../pages/MedicinesListPage'));
const GenericsTable = lazy(() => import('../pages/GenericsTable'));
const InventoryManagement = lazy(() => import('../pages/InventoryManagement'));
const PurchaseBillInventoryUpload = lazy(() => import('../pages/PurchaseBillInventoryUpload.jsx'));
const PurchaseBillReturnPage = lazy(() => import('../pages/PurchaseBillReturnPage'));
const PurchaseBillEditPage = lazy(() => import('../pages/PurchaseBillEditPage')); // New: Purchase Bill Edit Page
const PurchaseReturnListPage = lazy(() => import('../pages/PurchaseReturnListPage'));
const SalesBillPage = lazy(() => import('../pages/salesbillpage.jsx'))
const SalesReturnPage = lazy(() => import("../pages/Salesbillreturn.jsx"))
const PurchaseBillPage = lazy(() => import('../pages/PurchaseBillPage.jsx')); // New: Purchase Bill Page

// Prescription Management - Lazy loaded
const PrescriptionUploadsTable = lazy(() => import('../pages/PrescriptionUploadsTable'));
const PrescriptionReview = lazy(() => import('../pages/PrescriptionReview'));
const PendingPrescriptionsTable = lazy(() => import('../pages/PendingPrescriptionsTable'));
const RateMaster = lazy(() => import('../pages/RateMaster'));
const DiscountMaster = lazy(() => import('../pages/DiscountMaster'));

// Offline Sales Management - Lazy loaded
const OfflineSalesBilling = lazy(() => import('../pages/offline_sales/OfflineSalesBilling'));
const BillReturn = lazy(() => import('../pages/offline_sales/BillReturn'));
const Invoice = lazy(() => import('../pages/Invoice.jsx')); // Import the Invoice component

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
    path: "/login",
    element: Login,
    public: true,
    title: "Login",
  },

  // Protected routes (require authentication)
  {
    path: "/dashboard",
    element: Dashboard,
    title: "Dashboard",
    icon: "LayoutDashboard",
  },
  {
    path: "/medicines",
    element: MedicinesListPage,
    title: "Medicines",
    icon: "Pill",
    lazy: true,
  },
  {
    path: "/generics",
    element: GenericsTable,
    title: "Generic Names",
    icon: "FileText",
    lazy: true,
  },
  {
    path: "/inventory",
    element: InventoryManagement,
    title: "Inventory",
    icon: "Package",
    lazy: true,
  },
  {
    path: "/purchase-bill/inventory-upload",
    element: PurchaseBillInventoryUpload,
    title: "Purchase Bill Inventory Upload",
    icon: "Upload", // Placeholder icon
    lazy: true,
  },
  {
    path: "/purchase-bill/edit/:poId",
    element: PurchaseBillEditPage,
    title: "Edit Purchase Bill",
    hidden: true, // Don't show in navigation
    lazy: true,
  },
  {
    path: "/purchase-bill-return/:poId",
    element: PurchaseBillReturnPage,
    title: "Process Purchase Bill Return",
    hidden: true, // Don't show in navigation
    lazy: true,
  },
  {
    path: "/purchase-returns",
    element: PurchaseReturnListPage,
    title: "Purchase Returns List",
    icon: "List", // Placeholder icon
    lazy: true,
  },
  {
    path: "/purchase-billing",
    element: PurchaseBillPage,
    title: "Purchase Bills",
    icon: "FileText", // Placeholder icon, can be changed
    lazy: true,
  },
  {
    path: "/sale-billing",
    element: SalesBillPage,
    tittle: "sales table",
    lazy: true,
  },
  {
    path: "/sale-return-billing",
    element: SalesReturnPage,
    tittle: "sales return table",
    lazy: true,
  },
  {
    path: "/invoice/:billId", // New route for sales invoice
    element: Invoice,
    title: "Sales Invoice",
    hidden: true, // Don't show in navigation
    lazy: true,
  },
  {
    path: "/prescriptions",
    element: PrescriptionUploadsTable,
    title: "Prescriptions",
    icon: "FileImage",
    lazy: true,
  },
  {
    path: "/pending-prescriptions",
    element: PendingPrescriptionsTable,
    title: "Pending Prescriptions",
    icon: "Clock",
    lazy: true,
  },
  {
    path: "/prescription-review/:prescriptionId",
    element: PrescriptionReview,
    title: "Prescription Review",
    hidden: true, // Don't show in navigation
    lazy: true,
  },
  {
    path: "/orders",
    element: OrdersTable,
    title: "Orders",
    icon: "ShoppingCart",
    lazy: true,
  },
  {
    path: "/orders/:orderId",
    element: OrderDetails,
    title: "Order Details",
    hidden: true,
    lazy: true,
  },
  {
    path: "/users",
    element: UserManagement,
    title: "Users",
    icon: "Users",
    lazy: true,
  },
  {
    path: "/customers",
    element: CustomerManagement,
    title: "Customers",
    icon: "UserCheck",
    lazy: true,
  },
  {
    path: "/reports",
    element: ReportsAnalytics,
    title: "Reports & Analytics",
    icon: "BarChart3",
    lazy: true,
  },
  {
    path: "/tpc-courier-management",
    element: TPCCourierManagementPage,
    title: "TPC Courier Management",
    icon: "Truck", // Using a truck icon for courier
    lazy: true,
  },
  {
    path: "/rate-master",
    element: RateMaster,
    title: "Rate Master",
    icon: "DollarSign", // Placeholder icon
    lazy: true,
  },
  {
    path: "/discount-master",
    element: DiscountMaster,
    title: "Discount Master",
    icon: "Percent", // Placeholder icon
    lazy: true,
  },
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
