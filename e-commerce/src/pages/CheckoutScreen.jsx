import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiService, { courierAPI } from '../api/apiService'; // Import courierAPI
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CheckoutScreen = () => {
  const { cartItems, clearCart, calculateSubtotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Construct a cart object to match the expected structure in CheckoutScreen
  const cart = {
    items: cartItems,
    subtotal: calculateSubtotal(),
    total: calculateSubtotal(), // Assuming total is initially subtotal, adjust if discounts/shipping are applied later
    couponDiscount: 0, // Placeholder, as not provided by useCart
    finalShipping: 0, // Placeholder
    taxAmount: 0, // Placeholder
    hasRxItems: false, // Placeholder
  };

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'RAZORPAY'
  const [notes, setNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isPincodeServiceable, setIsPincodeServiceable] = useState(false);
  const [pincodeServiceabilityMessage, setPincodeServiceabilityMessage] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  const paymentMethods = [
    
    { id: 'RAZORPAY', name: 'UPI / Online Payment', description: 'Pay using UPI apps or other online methods' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAddresses();
    loadRazorpayScript();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedAddressIndex !== -1 && addresses.length > 0) {
      checkPincodeServiceability(addresses[selectedAddressIndex].pincode);
    }
  }, [selectedAddressIndex, addresses]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully');
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay SDK:', error);
      toast.error('Failed to load payment gateway. Please try again.');
    };
    document.body.appendChild(script);
  };

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      console.log('Fetching addresses from /api/users/addresses/');
      const response = await apiService.get('/api/users/addresses/');
      console.log('Addresses API response:', response);
      if (response.status >= 200 && response.status < 300 && response.data) {
        setAddresses(response.data);
        const defaultAddressIndex = response.data.findIndex(addr => addr.is_default);
        setSelectedAddressIndex(defaultAddressIndex !== -1 ? defaultAddressIndex : 0);
        if (response.data.length === 0) {
          toast.info('No addresses found. Please add one.');
        }
      } else {
        console.error('Failed to load addresses:', response.status, response.data);
        toast.error(`Failed to load addresses: ${response.statusText || 'Unknown error'}`);
        setAddresses([]);
        setSelectedAddressIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Error fetching addresses: ' + error.message);
      setAddresses([]);
      setSelectedAddressIndex(-1);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const checkPincodeServiceability = async (pincode) => {
    setIsCheckingPincode(true);
    setPincodeServiceabilityMessage(`Checking serviceability for ${pincode}...`);
    try {
      console.log(`Checking pincode serviceability for ${pincode} using courierAPI.checkPincodeService`);
      const response = await courierAPI.checkPincodeService(pincode); // Use courierAPI
      console.log('Pincode serviceability API response:', response);
      if (response.status >= 200 && response.status < 300 && response.data.is_serviceable) {
        setIsPincodeServiceable(true);
        setPincodeServiceabilityMessage(`Serviceable in ${response.data.city}, ${response.data.state}`);
      } else {
        setIsPincodeServiceable(false);
        setPincodeServiceabilityMessage(response.data.error || 'Not serviceable in this area.');
        toast.error(response.data.error || 'Not serviceable in this area.');
      }
    } catch (error) {
      console.error('Error checking pincode serviceability:', error);
      setIsPincodeServiceable(false);
      setPincodeServiceabilityMessage('Error checking serviceability: ' + error.message);
      toast.error('Error checking pincode serviceability: ' + error.message);
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const handlePaymentSuccess = async (response, orderId) => { // Modified to accept orderId
    console.log('Razorpay Payment Success Response:', response); // Added log
    console.log('Backend Order ID passed to handlePaymentSuccess:', orderId); // Modified log
    toast.success('Payment successful! Verifying order...');
    if (!orderId) { // Use orderId parameter
      toast.error('Error: Backend Order ID not found after payment.');
      setIsPlacingOrder(false);
      return;
    }

    try {
      // Step 1: Verify payment with the backend
      const verificationPayload = {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      };
      console.log('Sending payment verification request to backend with payload:', verificationPayload); // Added log
      const verificationResponse = await apiService.post('/payment/verify/', verificationPayload);
      console.log('Backend Payment Verification Response:', verificationResponse); // Added log

      if (!(verificationResponse.status >= 200 && verificationResponse.status < 300)) {
        toast.error(verificationResponse.data?.error || 'Payment verification failed.');
        setIsPlacingOrder(false);
        return;
      }

      toast.success('Payment verified successfully!');

      // Step 2: Finalize the order after successful payment verification
      await finalizeOrderAfterPayment({
        orderId: orderId, // Use orderId parameter
        paymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      });

    } catch (error) {
      console.error('Error during payment verification or finalization:', error);
      toast.error('Error during payment verification or finalization: ' + error.message);
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentError = (error) => {
    toast.error(`Payment failed: ${error.description} (Code: ${error.code})`);
    setIsPlacingOrder(false);
  };

  const handlePaymentExternalWallet = (response) => {
    toast.info(`External wallet selected: ${response.wallet_name}. Please complete payment there.`);
    setIsPlacingOrder(false);
  };

  const initiateRazorpayPayment = async (orderId, amount) => {
    console.log('Entering initiateRazorpayPayment function.'); // Add this log
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded. Please refresh the page.');
      setIsPlacingOrder(false);
      return;
    }

    try {
      console.log('Creating Razorpay order with backend:', { amount: Math.round(amount * 100), currency: 'INR', order_id: orderId });
      const razorpayOrderResponse = await apiService.post('/payment/create/', {
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        order_id: orderId, // Our backend order ID
      });
      console.log('Razorpay order creation response from backend:', razorpayOrderResponse);
      console.log('Razorpay order creation response data:', razorpayOrderResponse.data); // Add this log

      if (!(razorpayOrderResponse.status >= 200 && razorpayOrderResponse.status < 300)) {
        toast.error(razorpayOrderResponse.data?.error || 'Failed to create Razorpay order.');
        setIsPlacingOrder(false);
        return;
      }

      const razorpayOrderId = razorpayOrderResponse.data.razorpay_order_id; // Corrected: use .razorpay_order_id
      const razorpayKeyId = razorpayOrderResponse.data.key_id; // Get key_id from backend response

      const options = {
        key: razorpayKeyId, // Key ID from backend response
        amount: razorpayOrderResponse.data.amount, // Amount from backend response (in paise)
        currency: razorpayOrderResponse.data.currency,
        name: 'infxMart',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId, // Razorpay's order ID
        handler: (response) => handlePaymentSuccess(response, orderId), // Pass orderId directly
        prefill: {
          name: user ? `${user.firstName} ${user.lastName}` : '',
          email: user ? user.email : '',
          contact: user ? user.phoneNumber : '',
        },
        theme: {
          color: '#009688', // Teal color
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled by user.');
            setIsPlacingOrder(false);
          },
        },
      };
      console.log('Razorpay options object:', options); // Log options before creating rzp instance

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', handlePaymentError);
      rzp.on('payment.external.wallet', handlePaymentExternalWallet);
      console.log('Attempting to open Razorpay modal with options:', options); // Add this log
      rzp.open();

    } catch (error) {
      console.error('Error initiating Razorpay payment:', error); // More specific error log
      toast.error('Error initiating Razorpay payment: ' + error.message);
      setIsPlacingOrder(false);
    }
  };

  const placeOrder = async () => {
    if (isPlacingOrder) return;

    setIsPlacingOrder(true);

    try {
      console.log('Current payment method:', paymentMethod); // Add console log
      if (cart.items.length === 0) {
        toast.error('Your cart is empty.');
        setIsPlacingOrder(false);
        return;
      }

      if (addresses.length === 0 || selectedAddressIndex === -1) {
        toast.error('Please add a delivery address.');
        setIsPlacingOrder(false);
        return;
      }

      if (!isPincodeServiceable) {
        toast.error(pincodeServiceabilityMessage || 'Selected address is not serviceable.');
        setIsPlacingOrder(false);
        return;
      }

      const selectedAddress = addresses[selectedAddressIndex];

      // Step 1: Create a pending order on the backend
      const pendingOrderResponse = await apiService.post('/api/order/pending/', {
        items: cart.items.map(item => ({
          product_id: item.product.id, // Corrected
          quantity: item.quantity,
          price: item.product.current_batch.online_selling_price, // Corrected
          mrp: item.product.current_batch.mrp, // Corrected
          name: item.product.name, // Corrected
          manufacturer: item.product.manufacturer, // Corrected
        })),
        delivery_address: {
          id: selectedAddress.id,
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address_line_1: selectedAddress.address_line_1,
          address_line_2: selectedAddress.address_line_2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        payment_method: paymentMethod,
        total_amount: cart.total,
        notes: notes.trim(),
        is_prescription_order: cart.hasRxItems, // Assuming cart has this property
      });

      // Removed the incorrect if (!pendingOrderResponse.success) check

      if (!(pendingOrderResponse.status >= 200 && pendingOrderResponse.status < 300)) { // Corrected check
        toast.error(pendingOrderResponse.data?.message || 'Failed to create pending order.');
        setIsPlacingOrder(false);
        return;
      }

      const backendOrderId = pendingOrderResponse.data.order_id; // Access order_id from data
      toast.info(pendingOrderResponse.data?.message || 'Pending order created.');

      console.log('Deciding payment flow. Current paymentMethod:', paymentMethod);
      if (paymentMethod === 'COD') {
        console.log('Payment method is COD. Finalizing order.');
        await finalizeOrderAfterPayment({
          orderId: backendOrderId,
          paymentId: 'COD',
          razorpayOrderId: 'COD',
          razorpaySignature: 'COD',
        });
      } else if (paymentMethod === 'RAZORPAY') {
        console.log('Payment method is RAZORPAY. Initiating Razorpay payment.');
        console.log('About to call initiateRazorpayPayment...'); // Add this log
        await initiateRazorpayPayment(backendOrderId, cart.total);
      } else {
        console.log('Payment method is not supported:', paymentMethod);
        toast.error('Selected payment method is not supported.');
        setIsPlacingOrder(false);
      }
    } catch (error) {
      console.error('Error in placeOrder function:', error);
      toast.error('Error placing order: ' + error.message);
      setIsPlacingOrder(false);
    }
  };

  const finalizeOrderAfterPayment = async ({ orderId, paymentId, razorpayOrderId, razorpaySignature }) => {
    try {
      const selectedAddress = addresses[selectedAddressIndex];

      const finalizationResponse = await apiService.post('/api/order/enhanced/create-paid-order/', {
        order_id: orderId,
        items: cart.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.current_batch.online_selling_price,
          mrp: item.product.current_batch.mrp,
          name: item.product.name,
          manufacturer: item.product.manufacturer,
        })),
        delivery_address: {
          id: selectedAddress.id,
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address_line_1: selectedAddress.address_line_1,
          address_line_2: selectedAddress.address_line_2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        payment_method: paymentMethod === 'COD' ? 'COD' : 'RAZORPAY',
        total_amount: cart.total,
        payment_data: {
          method: paymentMethod === 'COD' ? 'COD' : 'RAZORPAY',
          payment_id: paymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          amount: cart.total,
        },
        is_prescription_order: cart.hasRxItems,
      });

      if (!(finalizationResponse.status >= 200 && finalizationResponse.status < 300)) { // Corrected check
        toast.error(finalizationResponse.data?.message || 'Failed to finalize order.');
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${finalizationResponse.data.order_id}`); // Access order_id from data
      }
    } catch (error) {
      toast.error('Error finalizing order: ' + error.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleAddAddress = () => {
    navigate('/profile/address-book', { state: { fromCheckout: true } });
  };

  if (!isAuthenticated) {
    return <div className="container mx-auto p-4">Please log in to proceed to checkout.</div>;
  }

  if (isLoadingAddresses) {
    return <div className="container mx-auto p-4 text-center">Loading addresses...</div>;
  }

  if (cart.items.length === 0) {
    return <div className="container mx-auto p-4 text-center">Your cart is empty. Please add items to proceed.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Checkout</h1>

      {/* Order Summary */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Order Summary
        </h2>
        <p className="text-gray-600 mb-4">
          {cart.items.length} items in your cart
        </p>
        <ul className="space-y-2">
          {cart.items.slice(0, 3).map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center text-gray-700"
            >
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
          {cart.items.length > 3 && (
            <li className="text-gray-500 italic">
              ... and {cart.items.length - 3} more items
            </li>
          )}
        </ul>
      </section>

      {/* Delivery Address */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            Delivery Address
          </h2>
          <button
            onClick={handleAddAddress}
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            Add New
          </button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-gray-500">No addresses found. Please add one.</p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address, index) => (
              <div
                key={address.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedAddressIndex === index
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedAddressIndex(index)}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryAddress"
                    className="form-radio h-4 w-4 text-teal-600"
                    checked={selectedAddressIndex === index}
                    onChange={() => setSelectedAddressIndex(index)}
                  />
                  <span className="ml-3 text-gray-800 font-medium">
                    {address.address_line_1}
                    {address.is_default && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-bold">
                        Default
                      </span>
                    )}
                  </span>
                </label>
                <p className="text-gray-600 ml-7">
                  {address.address_line_2 && `${address.address_line_2}, `}
                  {address.city}, {address.state} - {address.pincode}
                </p>
                {selectedAddressIndex === index && isCheckingPincode && (
                  <p className="text-teal-600 ml-7 mt-2 flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-teal-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {pincodeServiceabilityMessage}
                  </p>
                )}
                {selectedAddressIndex === index &&
                  !isCheckingPincode &&
                  pincodeServiceabilityMessage && (
                    <p
                      className={`ml-7 mt-2 flex items-center ${
                        isPincodeServiceable ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <svg
                        className={`h-4 w-4 mr-2 ${
                          isPincodeServiceable
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {isPincodeServiceable ? (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                      {pincodeServiceabilityMessage}
                    </p>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment Method */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Payment Method
        </h2>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer ${
                paymentMethod === method.id
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-300"
              }`}
              onClick={() => setPaymentMethod(method.id)}
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  className="form-radio h-4 w-4 text-teal-600"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span className="ml-3 text-gray-800 font-medium">
                  {method.name}
                </span>
              </label>
              <p className="text-gray-600 ml-7">{method.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Order Notes */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Order Notes (Optional)
        </h2>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows="3"
          placeholder="Any special instructions for delivery..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </section>

      {/* Price Summary */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Price Summary
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>₹{cart.subtotal.toFixed(2)}</span>
          </div>
          {cart.couponDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{cart.couponDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Delivery Fee</span>
            <span>₹{cart.finalShipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax</span>
            <span>₹{cart.taxAmount.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-gray-200" />
          <div className="flex justify-between text-xl font-bold text-gray-800">
            <span>Total</span>
            <span>₹{cart.total.toFixed(2)}</span>
          </div>
        </div>
        {/* Place Order Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
          <button
            onClick={placeOrder}
            disabled={
              isPlacingOrder ||
              addresses.length === 0 ||
              selectedAddressIndex === -1 ||
              !isPincodeServiceable
            }
            className={`w-full py-3 rounded-lg text-white font-bold text-lg transition duration-300 ${
              isPlacingOrder ||
              addresses.length === 0 ||
              selectedAddressIndex === -1 ||
              !isPincodeServiceable
                ? "bg-orange-500 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {isPlacingOrder ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Placing Order...
              </span>
            ) : (
              `Place Order • ₹${cart.total.toFixed(2)}`
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CheckoutScreen;
