import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cartAPI } from '../api/apiService';
import { useAuth } from './AuthContext'; // Assuming AuthContext exists
import { useNotification } from './NotificationContext'; // Assuming NotificationContext exists

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotification();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await cartAPI.getCart();
      setCartItems(response.data.items);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError("Failed to load cart.");
      addNotification("Failed to load cart.", "error");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, addNotification]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!isAuthenticated) {
      addNotification("Please log in to add items to your cart.", "warning");
      return;
    }
    try {
      const response = await cartAPI.addItem(product.id, quantity);
      setCartItems(response.data.items);
      addNotification(`${product.name} added to cart!`, 'success');
    } catch (err) {
      console.error("Failed to add item to cart:", err);
      addNotification("Failed to add item to cart.", "error");
    }
  }, [isAuthenticated, addNotification]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (!isAuthenticated) {
      addNotification("Please log in to update your cart.", "warning");
      return;
    }
    try {
      const response = await cartAPI.updateItem(productId, newQuantity);
      setCartItems(response.data.items);
      addNotification("Cart item quantity updated.", "info");
    } catch (err) {
      console.error("Failed to update item quantity:", err);
      addNotification("Failed to update item quantity.", "error");
    }
  }, [isAuthenticated, addNotification]);

  const removeFromCart = useCallback(async (productId) => {
    if (!isAuthenticated) {
      addNotification("Please log in to modify your cart.", "warning");
      return;
    }
    try {
      const response = await cartAPI.removeItem(productId);
      setCartItems(response.data.items);
      addNotification("Item removed from cart.", "info");
    } catch (err) {
      console.error("Failed to remove item from cart:", err);
      addNotification("Failed to remove item from cart.", "error");
    }
  }, [isAuthenticated, addNotification]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      addNotification("Please log in to clear your cart.", "warning");
      return;
    }
    try {
      const response = await cartAPI.clearCart();
      setCartItems(response.data.items);
      addNotification("Cart cleared.", "info");
    } catch (err) {
      console.error("Failed to clear cart:", err);
      addNotification("Failed to clear cart.", "error");
    }
  }, [isAuthenticated, addNotification]);

  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((acc, item) => {
      // Ensure item.product and item.product.current_batch exist
      const price = item.product?.current_batch?.online_selling_price;
      if (price) {
        return acc + parseFloat(price) * item.quantity;
      }
      return acc;
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    calculateSubtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
