import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductPage from './pages/ProductPage.jsx';
import Shop from './pages/Shop.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Profile from './pages/Profile.jsx';
import RegisterScreen from './pages/RegisterScreen.jsx';
import LoginScreen from './pages/LoginScreen.jsx';
import CartPage from './pages/Cart.jsx'; // Import CartPage
import CheckoutScreen from './pages/CheckoutScreen.jsx'; // Import CheckoutScreen
import OrderConfirmationScreen from './pages/OrderConfirmationScreen.jsx'; // Import OrderConfirmationScreen
import Invoice from './pages/Invoice.jsx'; // Import Invoice
// import UploadPrescriptionScreen from './pages/UploadPrescriptionScreen.jsx'; // Import UploadPrescriptionScreen
import PrescriptionDetailScreen from './pages/PrescriptionDetailScreen.jsx'; // Import PrescriptionDetailScreen
import PrescriptionHistoryPage from './pages/PrescriptionHistoryPage.jsx'; // Import PrescriptionHistoryPage
import { TopSellerCard } from './pages/Home.jsx'; // Import TopSellerCard
import { useAuth, AuthProvider } from './context/AuthContext.jsx'; // Import useAuth and AuthProvider
import { CartProvider } from './context/CartContext.jsx'; // Import CartProvider
import { NotificationProvider } from './context/NotificationContext.jsx'; // Import NotificationProvider
import Notification from './components/Notification.jsx'; // Import Notification component

function App() {
  return (
    <NotificationProvider>
      <CartProvider>
        <AuthProvider> {/* Wrap the entire application content that needs auth context */}
          <AuthWrapper />
        </AuthProvider>
      </CartProvider>
    </NotificationProvider>
  );
}

function AuthWrapper() {
  const { isAuthenticated, loading } = useAuth(); // Now useAuth is inside AuthProvider

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading application...</div>;
  }

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductPage TopSellerCard={TopSellerCard} />} />
          {isAuthenticated ? (
            <>
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/prescription-history" element={<PrescriptionHistoryPage />} />
              {/* Redirect authenticated users from login/register */}
              <Route path="/login" element={<Navigate to="/profile" replace />} />
              <Route path="/register" element={<Navigate to="/profile" replace />} />
            </>
          ) : (
            <>
              {/* Allow unauthenticated users to access login/register */}
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              {/* Optionally, redirect unauthenticated users from profile to login */}
              <Route path="/profile" element={<Navigate to="/login" replace />} />
            </>
          )}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationScreen />} />
          <Route path="/invoice/:orderId" element={<Invoice />} />
          <Route path="/shop" element={<Shop />} />
          {/* <Route path="/upload-prescription" element={<UploadPrescriptionScreen />} /> */}
          <Route path="/my-prescriptions/:prescriptionId" element={<PrescriptionDetailScreen />} />
        </Routes>
      </main>
      <Footer />
      <Notification />
    </>
  );
}

export default App;
