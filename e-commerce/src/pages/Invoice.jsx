import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import logoImg from "../assets/full_logo.png";
import { salesBillAPI, apiUtils } from '../api/apiService'; // Import salesBillAPI and apiUtils

// --- SVG Icons (for a clean, dependency-free UI) ---
const PharmacyLogo = () => (
    <img
        src={logoImg}
        alt="Pharmacy Logo"
        className="w-12 h-12 object-contain"
        style={{ display: "block" }}
    />
);

const Invoice = () => {
  const { billId } = useParams(); // Get billId from URL parameters
  const [isLoading, setIsLoading] = useState(true);
  const [billData, setBillData] = useState(null); // Renamed to billData

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        setIsLoading(true);
        const response = await salesBillAPI.getSalesBill(billId); // Fetch sales bill data
        setBillData(response.data);
      } catch (err) {
        const errorInfo = apiUtils.handleError(err);
        console.error("Failed to fetch sales bill data:", err);
        // Handle error state in UI
      } finally {
        setIsLoading(false);
      }
    };

    if (billId) {
      fetchBillDetails();
    }
  }, [billId]); // Depend on billId to re-fetch if it changes

  const handlePrint = () => {
    window.print();
  };

  // Helper for formatting dates nicely for display
  const displayFormatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-emerald-500"
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
          <span className="text-xl font-semibold text-gray-600">
            Loading Invoice...
          </span>
        </div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-red-500">
          Error: Could not load sales bill data.
        </p>
      </div>
    );
  }

  // Calculate financial details for sales bill
  const grossAmount = billData.items.reduce((total, item) => total + (parseFloat(item.quantity) * parseFloat(item.price_per_unit)), 0);
  const discountAmount = parseFloat(billData.discount) || 0;
  const taxableAmount = grossAmount - discountAmount;
  const gstPercentage = parseFloat(billData.gst_percentage) || 0;
  const gstAmount = (taxableAmount * gstPercentage) / 100;
  const netAmount = taxableAmount + gstAmount;
  const paidAmount = parseFloat(billData.paid_amount) || 0;
  const changeAmount = parseFloat(billData.change_amount) || 0;
  const balanceDue = netAmount - paidAmount; // For sales, balance due is net - paid

  // Determine status for the stamp
  let statusText = "PENDING";
  let statusColor = "yellow-500";
  if (billData.status === "PAID") {
    statusText = "PAID";
    statusColor = "green-500";
  } else if (billData.status === "CANCELLED") {
    statusText = "CANCELLED";
    statusColor = "red-500";
  } else if (billData.status === "RETURNED" || billData.status === "PARTIALLY_RETURNED") {
    statusText = "RETURNED"; // Or PARTIALLY RETURNED
    statusColor = "purple-500";
  }


  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg relative">
        {/* --- Status Stamp --- */}
        <div className="absolute top-8 right-8 transform rotate-12">
          <div className={`border-4 border-${statusColor} text-${statusColor} rounded-lg px-4 py-2 text-4xl font-black uppercase tracking-wider`}>
            {statusText}
          </div>
        </div>

        {/* --- Invoice Body --- */}
        <div className="p-8 md:p-12" id="invoice-content">
          {/* --- Header --- */}
          <header className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-6 sm:mb-0">
              <PharmacyLogo />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Infixmart</h1>
                <p className="text-gray-500 text-sm">Sales Department</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-extrabold text-gray-700 uppercase tracking-wider">
                Sales Bill
              </h2>
              <div className="mt-2 text-gray-700">
                <span className="text-sm font-semibold text-gray-600">
                  Bill #{" "}
                </span>
                <span className="font-mono">
                  {billData.id}
                </span>
              </div>
            </div>
          </header>

          {/* --- Customer and Dates --- */}
          <section className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">To Customer:</h3>
              <p className="font-bold text-gray-800">
                {billData.customer_name}
              </p>
              <p className="text-gray-600 text-sm">
                {billData.customer_address}
              </p>
              <p className="text-gray-600 text-sm">
                {billData.customer_mobile}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="font-semibold text-gray-700">
                  Bill Date:
                </span>
                <span className="text-gray-800">
                  {displayFormatDate(billData.bill_date)}
                </span>
                <span className="font-semibold text-gray-700">
                  Payment Method:
                </span>
                <span className="text-gray-800">
                  {billData.payment_method}
                </span>
              </div>
            </div>
          </section>

          {/* --- Items Table --- */}
          <section className="mt-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-sm font-semibold text-gray-600">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center w-24">Batch No</th>
                    <th className="p-3 text-center w-24">Qty</th>
                    <th className="p-3 text-right w-32">Price/Unit</th>
                    <th className="p-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Packing: {item.packing}, HSN: {item.hsn_code}
                        </p>
                      </td>
                      <td className="p-3 text-center">{item.batch_no}</td>
                      <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right">
                        ₹{parseFloat(item.price_per_unit).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        ₹{(parseFloat(item.quantity) * parseFloat(item.price_per_unit)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* --- Summary & Totals --- */}
          <section className="mt-8 grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Notes:
                </h3>
                <p className="text-sm text-gray-600">
                  {billData.notes || "No notes provided."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">Gross Amount:</span>
                  <span className="font-medium text-gray-800">
                    ₹{grossAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Discount:</span>
                  <span className="font-medium text-red-500">
                    - ₹{discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">Taxable Amount:</span>
                  <span className="font-medium text-gray-800">
                    ₹{taxableAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">GST ({gstPercentage}%):</span>
                  <span className="font-medium text-gray-800">
                    ₹{gstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-lg font-bold text-gray-800">
                    Net Amount:
                  </span>
                  <span className="text-lg font-bold text-gray-800">
                    ₹{netAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">
                    Amount Paid:
                  </span>
                  <span className="font-medium text-green-600">
                    ₹{paidAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-4 bg-green-100 rounded-b-lg px-4 mt-2">
                  <span className="text-lg font-bold text-gray-800">
                    Change Amount:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{changeAmount.toFixed(2)}
                  </span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between py-4 bg-red-100 rounded-b-lg px-4 mt-2">
                    <span className="text-lg font-bold text-gray-800">
                      Balance Due:
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      ₹{balanceDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* --- Footer --- */}
          <footer className="mt-12 border-t pt-8">
            <div className="flex justify-between items-end">
              <div className="text-left text-sm text-gray-500">
                <p>Thank you for your business.</p>
                <p>This is a computer-generated bill.</p>
              </div>
              <div className="text-right w-48">
                <div className="h-12 border-b border-gray-400"></div>
                <p className="text-sm font-semibold text-gray-700 pt-2">
                  Authorised Signature (Infixmart)
                </p>
              </div>
            </div>
          </footer>
        </div>

        {/* --- Action Buttons (outside printable area) --- */}
        <div className="p-6 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3 print:hidden">
          <button className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            Download Receipt
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Print Receipt
          </button>
        </div>
      </div>

      {/* --- Print-specific styles --- */}
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0; }
          body { background-color: #fff; }
          .print\\:hidden { display: none; }
          #invoice-content { 
            box-shadow: none !important; 
            margin: 0;
            padding: 2rem;
            max-width: 100%;
            border: 1px solid #e5e7eb;
          }
          table, tr, td, th { page-break-inside: avoid !important; }
        `}
      </style>
    </div>
  );
};

export default Invoice;
