import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import DashboardMainContent from './pages/Dasboard.jsx'
import Medicine from './pages/MedicinesListPage.jsx';
import GenericsTable from './pages/GenericsTable.jsx';
import PrescriptionUploadsTable from './pages/PrescriptionUploadsTable.jsx';
import PrescriptionReview from './pages/PrescriptionReview.jsx';
import OrdersTable from './pages/OrdersTable.jsx'; 
import OrderDetails from './pages/OrderDetails.jsx'; 
import DeliveryListTable from './pages/DeliveryListScreen.jsx'; // Import the DeliveryListScreen
import CustomersTable from './pages/CustomersTable.jsx'; // Import CustomersTable if needed
import InventoryManagement from './pages/InventoryManagement.jsx'; // Import InventoryManagement if needed
import AddInventoryItemPage from './pages/AddInventoryItemPage.jsx'; // Import AddInventoryItemPage if needed
import SettingsPage from './pages/SettingsPage.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          
          <Route path="/Dashboard" element={<DashboardMainContent />} />
          <Route path="/Medicines" element={<Medicine />} />
          <Route path="/Generics" element={<GenericsTable />} />
          <Route path="/Prescription" element={<PrescriptionUploadsTable />} />
          <Route path="/Prescription_Review" element={<PrescriptionReview />} />
          <Route path="/Orders" element={<OrdersTable />} />
          <Route path="/Orders/OrderDetails" element={<OrderDetails />} />
          <Route path="/delivery-tracking" element={<DeliveryListTable />} /> {/* Delivery Tracking Page */}
          <Route path="/customers" element={<CustomersTable />} /> {/* Customers Table Page */}
          <Route path="/inventory" element={<InventoryManagement />} /> {/* Inventory Management Page */}
          <Route path="/inventory/add" element={<AddInventoryItemPage />} /> {/* Add Inventory Item Page */}
          <Route path="/settings" element={<SettingsPage />} /> {/* Settings Page */}
          
        {/* Add more routes as needed */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App
