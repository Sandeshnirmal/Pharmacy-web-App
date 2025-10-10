import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from '../api/axiosInstance';
import { orderAPI } from "../api/apiService"; // Assuming orderAPI might have invoice related endpoints
import logoImg from "../assets/full_logo.png";

const PharmacyLogo = () => (
    <img
        src={logoImg}
        alt="Pharmacy Logo"
        className="w-12 h-12 object-contain"
        style={{ display: "block" }}
    />
);

const InvoiceTemplate = ({ invoice, order, user }) => {
  const handlePrint = () => {
    // This is a simplified print function. In a real app, you'''d want to be more careful
    // about what is printed. Here we are printing the whole modal content.
    const printContents = document.getElementById("invoice-content").innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // to restore event listeners
  };

  const displayFormatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-red-500">
          No invoice data available.
        </p>
      </div>
    );
  }

  const isPaid = invoice.financial?.balance_due === 0;

  return (
    <div className="bg-gray-100 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg relative">
        {isPaid && (
          <div className="absolute top-8 right-8 transform rotate-12 print:hidden">
            <div className="border-4 border-green-500 text-green-500 rounded-lg px-4 py-2 text-4xl font-black uppercase tracking-wider">
              Paid
            </div>
          </div>
        )}

        <div className="p-8 md:p-12" id="invoice-content">
          <header className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-6 sm:mb-0">
              <PharmacyLogo />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{invoice.vendor?.name || "Infixmart"}</h1>
                <p className="text-gray-500 text-sm">{invoice.vendor?.address || "123 Health St, Wellness City, 12345"}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-extrabold text-gray-700 uppercase tracking-wider">
                Invoice
              </h2>
              <div className="mt-2 text-gray-700">
                <span className="text-sm font-semibold text-gray-600">
                  Invoice #{" "}
                </span>
                <span className="font-mono">
                  {invoice.invoice_number}
                </span>
              </div>
            </div>
          </header>

          <section className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
              <p className="font-bold text-gray-800">
                {user.full_name}
              </p>
              <p className="text-gray-600 text-sm">
                {order.address_full}
              </p>
              <p className="text-gray-600 text-sm">
                {user.email}
              </p>
              <p className="text-gray-600 text-sm">
                {order.user_phone || "N/A"}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="font-semibold text-gray-700">
                  Invoice Date:
                </span>
                <span className="text-gray-800">
                  {displayFormatDate(invoice.invoice_date)}
                </span>
                <span className="font-semibold text-gray-700">
                  Payment Date:
                </span>
                <span className="text-gray-800">
                  {displayFormatDate(invoice.payment_date)}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-sm font-semibold text-gray-600">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center w-24">Qty</th>
                    <th className="p-3 text-right w-32">Unit Price</th>
                    <th className="p-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || order.items)?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">
                          {item.name || item.product_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">
                        ₹{parseFloat(item.price || item.unit_price_at_order || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        ₹{parseFloat(item.total_price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              {invoice.payment_details && 
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Payment Summary:
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium text-gray-700">
                      Payment Method:
                    </span>{" "}
                    {invoice.payment_details.payment_method}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">
                      Transaction ID:
                    </span>{" "}
                    {invoice.payment_details.transaction_id}
                  </p>
                </div>
              </div>
              }
              {invoice.terms_and_conditions &&
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Terms & Conditions:
                </h3>
                <p className="text-sm text-gray-600">
                  {invoice.terms_and_conditions}
                </p>
              </div>
              }
            </div>
            <div className="flex flex-col items-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-800">
                  ₹{parseFloat(invoice.financial?.subtotal || order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-800">
                    ₹{parseFloat(invoice.financial?.tax_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Discount:</span>
                  <span className="font-medium text-red-500">
                    - ₹{parseFloat(invoice.financial?.discount_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-lg font-bold text-gray-800">
                    Total Amount:
                  </span>
                  <span className="text-lg font-bold text-gray-800">
                    ₹{parseFloat(invoice.financial?.total_price || order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                {isPaid && (
                  <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-600">
                      Amount Paid:
                    </span>
                    <span className="font-medium text-green-600">
                      - ₹{parseFloat(invoice.financial?.amount_paid || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-4 bg-green-100 rounded-b-lg px-4 mt-2">
                    <span className="text-lg font-bold text-gray-800">
                      Balance Due:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{parseFloat(invoice.financial?.balance_due || 0).toFixed(2)}
                    </span>
                  </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <footer className="mt-12 border-t pt-8">
            <div className="flex justify-between items-end">
              <div className="text-left text-sm text-gray-500">
                <p>Thank you for your business.</p>
                <p>This is a computer-generated invoice.</p>
              </div>
              <div className="text-right w-48">
                <div className="h-12 border-b border-gray-400"></div>
                <p className="text-sm font-semibold text-gray-700 pt-2">
                  Authorised Signature
                </p>
              </div>
            </div>
          </footer>
        </div>

        <div className="p-6 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("id") || "12345"; // Default for demo

  // State management
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState("");
  const [invoiceData, setInvoiceData] = useState(null); // New state for invoice data
  const [showInvoiceModal, setShowInvoiceModal] = useState(false); // New state for invoice modal

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleViewInvoice = async () => {
    try {
      // Explicitly request JSON for viewing in React component
      const response = await axiosInstance.get(`/order/invoices/${orderId}/summary/`);
      setInvoiceData(response.data.invoice); // Corrected to response.data.invoice
      console.log(response.data);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error("Error viewing invoice:", err);
      setError("Failed to view invoice summary");
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      // We use axiosInstance directly to ensure correct headers and response type
      const response = await axiosInstance.get(
        `/order/invoices/${orderId}/download/`, // Endpoint for PDF download
        {
          responseType: 'blob', // Crucial for handling binary file data
        }
      );

      // Create a Blob URL and trigger the download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;

      // Try to get filename from content-disposition header, fallback to a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoice_order_${orderId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Clean up the Blob URL
      window.URL.revokeObjectURL(url);
      link.remove();

    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError("Failed to download invoice. The file may not be available.");
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderRes = await axiosInstance.get(
        `/order/orders/${orderId}/`
      );

      setOrder(orderRes.data);
      setOrderItems(orderRes.data.items || []);
    } catch (err) {
      setError("Failed to fetch order details");
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await axiosInstance.patch(`/order/orders/${orderId}/update_status/`, { // Corrected endpoint
        order_status: newStatus,
      });
      fetchOrderDetails(); // Refresh data
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const openImagePopup = (src) => {
    setPopupImageSrc(src);
    setIsImagePopupOpen(true);
  };

  const closeImagePopup = () => {
    setIsImagePopupOpen(false);
    setPopupImageSrc("");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      Processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Processing",
      },
      Shipped: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Shipped",
      },
      Delivered: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Delivered",
      },
      Cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error || "Order not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <button
            onClick={() => navigate("/Orders")}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Order #{order.id}
          </h1>
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.order_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {getStatusBadge(order.order_status)}
          <button
            onClick={handleViewInvoice}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            View Invoice
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Download Invoice
          </button>
        </div>
      </header>

      <main className="space-y-8">
        {/* Prescription Information */}
        {order.is_prescription_order && order.prescription_image_base64 && (
          <section className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Prescription Viewer
              </h2>
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                style={{ height: "calc(100vh - 16rem)" }}
              >
                <div className="md:col-span-1 space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-600">Patient Name</p>
                    <p className="text-gray-900">
                      {order.user_name}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Doctor's Name</p>
                    <p className="text-gray-900">Dr. Emily Carter</p>{" "}
                    {/* Placeholder */}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Date Issued</p>
                    <p className="text-gray-900">
                      {new Date(
                        order.order_date
                      ).toLocaleDateString()} {/* Using order_date as a fallback */}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">
                      Verification Status
                    </p>
                    <p className="text-gray-900">
                      {getStatusBadge(
                        order.prescription_status === "verified"
                          ? "Delivered" // Map 'verified' to 'Delivered' for badge display
                          : "Pending"
                      )}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2 bg-gray-100 rounded-lg p-2 flex items-center justify-center">
                  <img
                    src={`data:image/jpeg;base64,${order.prescription_image_base64}`}
                    alt="Prescription"
                    className="max-w-full max-h-full object-contain rounded-md cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() =>
                      openImagePopup(`data:image/jpeg;base64,${order.prescription_image_base64}`)
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/800x1100/f0f0f0/ff0000?text=Image+Not+Found";
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Medicine Details Table */}
            <section className="bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Medicine Details
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 rounded-t-lg">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          S.No.
                        </th>
                        <th scope="col" className="px-4 py-3">
                          HSN Code
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Drug / Generic Name
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Company
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Batch No.
                        </th>
                        <th scope="col" className="px-4 py-3 text-center">
                          Quantity
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Rate
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4">
                            {item.product?.hsn_code || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.product?.generic_name?.name || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {item.product?.manufacturer || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            {item.batch_number || "N/A"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right">
                            ₹{parseFloat(item.unit_price_at_order).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-gray-900">
                            ₹{parseFloat(item.total_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Order Total */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        Total:
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Test Details Section */}
            <section className="bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Test Details
                </h2>
                <p className="text-gray-600">
                  No diagnostic tests associated with this order.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Update Status
              </h2>
              <div className="flex flex-col space-y-2">
                {(order.order_status === "Pending" ||
                  order.order_status === "payment_completed" ||
                  order.order_status === "prescription_uploaded" ||
                  order.order_status === "verified") && (
                  <button
                    onClick={() => handleStatusUpdate("Processing")}
                    disabled={statusUpdating}
                    className="btn-primary bg-blue-500"
                  >
                    Mark Processing
                  </button>
                )}
                {order.order_status === "Processing" && (
                  <button
                    onClick={() => handleStatusUpdate("Shipped")}
                    disabled={statusUpdating}
                    className="btn-primary bg-purple-500"
                  >
                    Mark Shipped
                  </button>
                )}
                {order.order_status === "Shipped" && (
                  <button
                    onClick={() => handleStatusUpdate("Delivered")}
                    disabled={statusUpdating}
                    className="btn-primary bg-green-500"
                  >
                    Mark Delivered
                  </button>
                )}
                {order.order_status !== "Delivered" &&
                  order.order_status !== "Cancelled" && (
                    <button
                      onClick={() => handleStatusUpdate("Cancelled")}
                      disabled={statusUpdating}
                      className="btn-primary bg-red-500"
                    >
                      Cancel Order
                    </button>
                  )}
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Customer Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-600">Name</p>
                  <p className="text-gray-900">
                    {order.user_name}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Email</p>
                  <p className="text-gray-900 break-words">
                    {order.user_email}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">Phone</p>
                  <p className="text-gray-900">
                    {order.user_phone || "N/A"}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Delivery Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-600">Address</p>
                  <p className="text-gray-900">
                    {order.address_full || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">
                    Expected Delivery
                  </p>
                  <p className="text-gray-900">
                    {order.expected_delivery_date
                      ? new Date(
                          order.expected_delivery_date
                        ).toLocaleDateString()
                      : "TBD"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Fullscreen Image Popup */}
      {isImagePopupOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
          onClick={closeImagePopup}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={popupImageSrc}
              alt="Prescription Fullscreen"
              className="max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={closeImagePopup}
              className="absolute top-0 right-0 -m-3 bg-white rounded-full p-2 text-gray-800 hover:bg-gray-200 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Close image viewer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 print:bg-white print:block">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative print:shadow-none print:max-h-full print:overflow-visible">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-3 right-3 bg-gray-200 rounded-full p-2 text-gray-600 hover:bg-gray-300 transition-colors print:hidden"
              aria-label="Close invoice"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <InvoiceTemplate invoice={invoiceData} order={order} user={{ email: order.user_email, full_name: order.user_name }} />
          </div>
        </div>
      )}

      <style>{`
        .btn-primary {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 600;
            transition: all 0.2s;
            opacity: 1;
        }
        .btn-primary:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        @media print {
          body > *:not(.print-container) {
            display: none;
          }
          .print-container {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetails;