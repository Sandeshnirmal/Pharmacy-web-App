import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx'; // Keep Home as direct import
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { TopSellerCard } from './pages/Home.jsx'; // Import TopSellerCard
import { useAuth, AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import Notification from './components/Notification.jsx';
import AboutUsPage from './pages/About.jsx';

// Lazy-loaded components
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const RegisterScreen = lazy(() => import('./pages/RegisterScreen.jsx'));
const LoginScreen = lazy(() => import('./pages/LoginScreen.jsx'));
const CartPage = lazy(() => import('./pages/Cart.jsx'));
const CheckoutScreen = lazy(() => import('./pages/CheckoutScreen.jsx'));
const OrderConfirmationScreen = lazy(() => import('./pages/OrderConfirmationScreen.jsx'));
const Invoice = lazy(() => import('./pages/Invoice.jsx'));
const PrescriptionDetailScreen = lazy(() => import('./pages/PrescriptionDetailScreen.jsx'));
const PrescriptionHistoryPage = lazy(() => import('./pages/PrescriptionHistoryPage.jsx'));
const About = lazy(() => import('./pages/About.jsx'));

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
  const location = useLocation();
  const showNavbarAndFooter = !['/login', '/register'].includes(location.pathname);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading application...</div>;
  }

  return (
    <>
      {showNavbarAndFooter && <Navbar isAuthenticated={isAuthenticated} />}
      <main>
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading page...</div>}>
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
            <Route path="/about" element={<AboutUsPage />} />
          </Routes>
        </Suspense>
      </main>
      {showNavbarAndFooter && <Footer />}
      <Notification />
    </>
  );
}

export default App;
