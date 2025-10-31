import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductPage from './pages/ProductPage.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Profile from './pages/Profile.jsx';
import RegisterScreen from './pages/RegisterScreen.jsx';
import LoginScreen from './pages/LoginScreen.jsx';
import CartPage from './pages/Cart.jsx'; // Import CartPage
import CheckoutScreen from './pages/CheckoutScreen.jsx'; // Import CheckoutScreen
import OrderConfirmationScreen from './pages/OrderConfirmationScreen.jsx'; // Import OrderConfirmationScreen
import { TopSellerCard } from './pages/Home.jsx'; // Import TopSellerCard
import { useAuth } from './context/AuthContext.jsx'; // Import useAuth
import { CartProvider } from './context/CartContext.jsx'; // Import CartProvider
import { NotificationProvider } from './context/NotificationContext.jsx'; // Import NotificationProvider
import Notification from './components/Notification.jsx'; // Import Notification component

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading application...</div>;
  }

  return (
    <NotificationProvider>
      <CartProvider>
        <Navbar isAuthenticated={isAuthenticated} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductPage TopSellerCard={TopSellerCard} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationScreen />} />
          </Routes>
        </main>
        <Footer />
        <Notification />
      </CartProvider>
    </NotificationProvider>
  );
}

export default App;
