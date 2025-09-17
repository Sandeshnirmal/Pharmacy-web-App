import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Core Pages
import DashboardMainContent from './pages/Dashboard.jsx'
import Medicine from './pages/MedicinesListPage.jsx';
import GenericsTable from './pages/GenericsTable.jsx';
import InventoryManagement from './pages/InventoryManagement.jsx';

// Prescription Management
import PrescriptionUploadsTable from './pages/PrescriptionUploadsTable.jsx';
import PrescriptionReview from './pages/PrescriptionReview.jsx';
import PendingPrescriptionsTable from './pages/PendingPrescriptionsTable.jsx';
// import AITestPage from './pages/AITestPage.jsx';

// Order Management
import OrderDetails from './pages/OrderDetails.jsx';
import OrdersTable from './pages/OrdersTable.jsx';

// User Management
import Login from './pages/Login.jsx';
import UserManagement from './pages/UserManagement.jsx';
import CustomerManagement from './pages/CustomerManagement.jsx';
import TPCCourierManagementPage from './pages/TPCCourierManagementPage.jsx'
// Reports
import SalesReportsAnalysisPage from "./pages/Report.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route - Outside Layout (No Sidebar) */}
        <Route path="/Login" element={<Login />} />

        {/* Protected Routes - Inside Layout (With Sidebar) */}
        <Route element={<Layout />}>
          {/* Core Pages */}
          <Route path="/" element={<DashboardMainContent />} />
          <Route path="/Dashboard" element={<DashboardMainContent />} />
          <Route path="/Medicines" element={<Medicine />} />
          <Route path="/Generics" element={<GenericsTable />} />
          <Route path="/Inventory" element={<InventoryManagement />} />

          {/* Prescription Management */}
          <Route path="/Prescription" element={<PrescriptionUploadsTable />} />
          <Route
            path="/Pending_Prescriptions"
            element={<PendingPrescriptionsTable />}
          />
          <Route
            path="/Prescription_Review/:prescriptionId"
            element={<PrescriptionReview />}
          />
          {/* <Route path="/AI_Test" element={<AITestPage />} /> */}

          {/* Order Management */}
          <Route path="/Orders" element={<OrdersTable />} />
          <Route path="/Orders/OrderDetails" element={<OrderDetails />} />

          {/* User Management */}
          <Route path="/Users" element={<UserManagement />} />
          <Route path="/Customers" element={<CustomerManagement />} />

          {/* Reports */}
          <Route path="/Reports" element={<SalesReportsAnalysisPage />} />
          <Route path="/TPCCourierManagement" element={<TPCCourierManagementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App