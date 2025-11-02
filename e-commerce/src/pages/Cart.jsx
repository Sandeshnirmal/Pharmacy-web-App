import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Minus, X } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// --- Reusable Components ---

/**
 * The breadcrumbs component
 */
function Breadcrumbs({ steps, onNavigateHome }) {
  return (
    <nav className="flex items-center text-sm text-gray-600 mb-8">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigateHome();
        }}
        className="hover:text-green-500"
      >
        Home
      </a>
      <ChevronRight className="h-4 w-4 mx-1" />
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="hover:text-green-500"
      >
        Shop
      </a>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 mx-1" />
          {index === steps.length - 1 ? (
            <span className="font-medium text-gray-800">{step.name}</span>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                step.onClick();
              }}
              className="hover:text-green-500"
            >
              {step.name}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/**
 * The list of items in the cart
 */
function CartItem({ item, onUpdateQuantity, onRemoveItem }) {
  const product = item.product; // Access the nested product object
  const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : "https://via.placeholder.com/300x200?text=No+Image+Available";
  const price = parseFloat(product.current_batch?.online_selling_price || 0); // Parse to float

  return (
    <div className="flex items-start gap-4 py-6 border-b border-gray-200">
      <div className="flex-shrink-0 bg-gray-50 rounded-lg p-2">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-24 h-24 object-contain"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between h-24">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.description}</p>
        </div>
        <button
          onClick={() => onRemoveItem(product.id)}
          className="text-sm text-red-600 hover:text-red-800 font-medium self-start"
        >
          Remove
        </button>
      </div>
      <div className="flex flex-col items-end justify-between h-24">
        <p className="text-lg font-bold text-gray-900">₹{(price * item.quantity).toFixed(2)}</p>
        {/* Quantity Selector */}
        <div className="flex items-center border border-gray-300 rounded-full">
          <button
            onClick={() => onUpdateQuantity(product.id, item.quantity - 1)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(product.id, item.quantity + 1)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The order summary component
 * Used in both Cart and Checkout
 */
function OrderSummary({
  subtotal,
  onCheckoutClick,
}) {
  const shipping = subtotal > 0 ? 5.0 : 0.0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-28">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

      {/* Totals */}
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Shipping (est.)</span>
          <span className="font-medium">₹{shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Tax (est.)</span>
          <span className="font-medium">₹{tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Buttons (for cart screen) */}
      <div className="mt-8 space-y-4">
        <button
          onClick={onCheckoutClick}
          className="w-full bg-green-400 text-black font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md"
        >
          Proceed to Checkout
        </button>
        <button className="w-full text-center text-green-600 font-semibold hover:text-green-800">
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// --- Main Page Component ---
function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, calculateSubtotal } = useCart();
  const subtotal = calculateSubtotal();

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <Breadcrumbs steps={[{ name: "Shopping Bag" }]} onNavigateHome={() => navigate('/')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Your Shopping Bag
            </h1>
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                />
              ))
            ) : (
              <p>Your cart is empty.</p>
            )}
          </div>
          {/* Order Summary */}
          <div className="col-span-1">
            <OrderSummary
              subtotal={subtotal}
              onCheckoutClick={handleCheckoutClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
