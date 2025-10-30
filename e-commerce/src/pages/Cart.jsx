import React, { useState } from "react";
import {
  ChevronRight,
  Plus,
  Minus,
  X,
  CreditCard,
  Lock,
  CheckCircle,
} from "lucide-react";

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
  return (
    <div className="flex items-start gap-4 py-6 border-b border-gray-200">
      <div className="flex-shrink-0 bg-gray-50 rounded-lg p-2">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-24 h-24 object-contain"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between h-24">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-sm text-red-600 hover:text-red-800 font-medium self-start"
        >
          Remove
        </button>
      </div>
      <div className="flex flex-col items-end justify-between h-24">
        <p className="text-lg font-bold text-gray-900">{item.price}</p>
        {/* Quantity Selector */}
        <div className="flex items-center border border-gray-300 rounded-full">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
  showItems = false,
  items = [],
  isCheckout = false,
  onCheckoutClick,
}) {
  const shipping = subtotal > 0 ? 5.0 : 0.0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-28">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

      {/* List of items (for checkout screen) */}
      {showItems && (
        <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-16 h-16 object-contain bg-gray-50 rounded-md p-1"
                />
                <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-800">
                  {item.name}
                </h4>
                <p className="text-sm text-gray-600">{item.price}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                $
                {(
                  parseFloat(item.price.replace("$", "")) * item.quantity
                ).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Shipping (est.)</span>
          <span className="font-medium">${shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Tax (est.)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Buttons (for cart screen) */}
      {!isCheckout && (
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
      )}
    </div>
  );
}

/**
 * Checkout Step 1: Shipping Form
 */
function ShippingForm({ onNextStep }) {
  return (
    <form className="space-y-6">
      <div className="flex flex-col">
        <label
          htmlFor="email"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="sarah.j@example.com"
          className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 pt-2">
        Shipping Address
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>
      <div className="flex flex-col">
        <label
          htmlFor="address"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="city"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="state"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            State
          </label>
          <input
            type="text"
            id="state"
            name="state"
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="zip"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            ZIP Code
          </label>
          <input
            type="text"
            id="zip"
            name="zip"
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>
      <div className="flex flex-col">
        <label
          htmlFor="phone"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
      <div className="text-right pt-4">
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            onNextStep();
          }}
          className="bg-green-400 text-black font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md"
        >
          Continue to Payment
        </button>
      </div>
    </form>
  );
}

/**
 * Checkout Step 2: Payment Form (Placeholder)
 */
function PaymentForm({ onNextStep, onPrevStep }) {
  return (
    <form className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 pt-2">
        Payment Details
      </h3>
      <div className="flex flex-col">
        <label
          htmlFor="cardName"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Name on Card
        </label>
        <input
          type="text"
          id="cardName"
          name="cardName"
          className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
      <div className="flex flex-col">
        <label
          htmlFor="cardNumber"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            className="w-full border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <CreditCard className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="expiry"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Expiry Date (MM/YY)
          </label>
          <input
            type="text"
            id="expiry"
            name="expiry"
            placeholder="MM/YY"
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="cvc"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            CVC
          </label>
          <div className="relative">
            <input
              type="text"
              id="cvc"
              name="cvc"
              className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <Lock className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={onPrevStep}
          className="text-green-600 font-semibold hover:text-green-800"
        >
          &larr; Back to Shipping
        </button>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            onNextStep();
          }}
          className="bg-green-400 text-black font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md"
        >
          Continue to Review
        </button>
      </div>
    </form>
  );
}

/**
 * Checkout Step 3: Review Order (Placeholder)
 */
function ReviewOrder({ onPrevStep }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 pt-2 mb-4">
        Review Your Order
      </h3>
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-gray-800 mb-2">Shipping Address:</h4>
          <div className="text-gray-700">
            <p>Sarah J.</p>
            <p>123 Wellness Ln.</p>
            <p>Anytown, ST 12345</p>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-gray-800 mb-2">Payment Method:</h4>
          <p className="text-gray-700">Visa ending in 1234</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-8">
        <button
          type="button"
          onClick={onPrevStep}
          className="text-green-600 font-semibold hover:text-green-800"
        >
          &larr; Back to Payment
        </button>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            alert("Order placed! (Demo)");
          }}
          className="bg-green-500 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:bg-green-600 hover:shadow-md"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

/**
 * The Checkout Stepper component
 */
function CheckoutStepper({ currentStep }) {
  const steps = ["Shipping", "Payment", "Review"];

  return (
    <nav className="flex items-center justify-between mb-8">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={stepNum}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  isActive
                    ? "bg-green-500 text-white"
                    : isCompleted
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : stepNum}
              </div>
              <p
                className={`mt-2 text-sm font-semibold ${
                  isActive || isCompleted ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {label}
              </p>
            </div>
            {stepNum < steps.length && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// --- Main Page Component ---
function CartPage({ cartItems: initialCartItems = [], onNavigateHome }) {
  const [step, setStep] = useState("cart"); // 'cart', 'shipping'
  const [checkoutStep, setCheckoutStep] = useState(1); // 1, 2, 3
  const [cartItems, setCartItems] = useState(
    // Add default quantity to items
    initialCartItems.map((item) => ({ ...item, quantity: 1 }))
  );

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return; // Don't allow less than 1
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = parseFloat(item.price.replace("$", ""));
      return acc + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const renderBreadcrumbs = () => {
    const steps = [{ name: "Shopping Bag", onClick: () => setStep("cart") }];
    if (step !== "cart") {
      steps.push({ name: "Checkout" });
    }
    return <Breadcrumbs steps={steps} onNavigateHome={onNavigateHome} />;
  };

  const renderContent = () => {
    if (step === "cart") {
      return (
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
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
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
              onCheckoutClick={() => setStep("shipping")}
            />
          </div>
        </div>
      );
    }

    if (step === "shipping") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Checkout Steps */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
            <CheckoutStepper currentStep={checkoutStep} />
            {checkoutStep === 1 && (
              <ShippingForm onNextStep={() => setCheckoutStep(2)} />
            )}
            {checkoutStep === 2 && (
              <PaymentForm
                onNextStep={() => setCheckoutStep(3)}
                onPrevStep={() => setCheckoutStep(1)}
              />
            )}
            {checkoutStep === 3 && (
              <ReviewOrder onPrevStep={() => setCheckoutStep(2)} />
            )}
          </div>
          {/* Order Summary */}
          <div className="col-span-1">
            <OrderSummary
              subtotal={subtotal}
              isCheckout={true}
              showItems={true}
              items={cartItems}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        {renderBreadcrumbs()}
        {renderContent()}
      </div>
    </div>
  );
}

export default CartPage;
