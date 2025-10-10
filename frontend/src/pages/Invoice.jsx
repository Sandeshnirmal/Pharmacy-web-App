import React, { useState, useMemo, useEffect } from "react";
import logoImg from "../assets/full_logo.png";

// --- SVG Icons (for a clean, dependency-free UI) ---
const PharmacyLogo = () => (
    <img
        src={logoImg}
        alt="Pharmacy Logo"
        className="w-12 h-12 object-contain"
        style={{ display: "block" }}
    />
);

// --- Mock API Data for a Paid Purchase Invoice ---
const mockApiData = {
  vendor: {
    name: "Global Pharma Distributors",
    address: "456 Industrial Ave, Mumbai, Maharashtra, 400001",
    email: "sales@globalpharma.com",
    phone: "+91 22 5555 1234",
  },
  invoice: {
    invoice_number: "GPD-2025-00123",
    invoice_date: "2025-10-08T06:53:52.551Z",
    payment_date: "2025-10-08T07:15:00.000Z",
    buyer: {
      name: "Infixmart",
      address: {
        line1: "No. 123, Arcot Road",
        line2: "Vellore, Tamil Nadu, 632004",
      },
      email: "purchases@infixmart.com",
      phone: "+91 416 123 4567",
    },
  },
  items: [
    {
      name: "Paracetamol 500mg",
      description: "Box of 200 units",
      quantity: 20,
      price: 500.0,
      total_price: 10000.0,
    },
    {
      name: "Antiseptic Liquid",
      description: "Case of 50 units (500ml)",
      quantity: 5,
      price: 4500.0,
      total_price: 22500.0,
    },
  ],
  financial: {
    subtotal: 32500.0,
    tax_amount: 1625.0,
    discount_amount: 1000.0,
    total_price: 33125.0,
    amount_paid: 33125.0,
    balance_due: 0.0,
  },
  payment_details: {
    payment_method: "Online Transfer",
    transaction_id: "TRF-SBI-987654321",
    account_name: "Global Pharma Distributors",
    account_number: "987654321098",
    bank: "HDFC Bank, Mumbai Corporate Branch",
  },
  terms_and_conditions:
    "This is a record of your payment. Thank you for your business. Goods once sold will not be taken back.",
};

const Invoice = () => {
  // --- State Management ---
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);

  // --- Data Fetching Effect ---
  useEffect(() => {
    // Simulate fetching data from an API
    const fetchInvoiceData = () => {
      setIsLoading(true);
      // In a real app, you would make a network request here
      // e.g., fetch('/api/purchase-order/details/some-id')
      new Promise((resolve) => setTimeout(() => resolve(mockApiData), 1000))
        .then((data) => {
          setInvoiceData(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch invoice data:", error);
          setIsLoading(false);
          // Handle error state in UI
        });
    };

    fetchInvoiceData();
  }, []); // Empty dependency array means this runs once on mount

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

  if (!invoiceData) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-red-500">
          Error: Could not load invoice data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg relative">
        {/* --- Paid Stamp --- */}
        <div className="absolute top-8 right-8 transform rotate-12">
          <div className="border-4 border-green-500 text-green-500 rounded-lg px-4 py-2 text-4xl font-black uppercase tracking-wider">
            Paid
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
                <p className="text-gray-500 text-sm">Purchase Department</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-extrabold text-gray-700 uppercase tracking-wider">
                Paid Invoice
              </h2>
              <div className="mt-2 text-gray-700">
                <span className="text-sm font-semibold text-gray-600">
                  Invoice #{" "}
                </span>
                <span className="font-mono">
                  {invoiceData.invoice.invoice_number}
                </span>
              </div>
            </div>
          </header>

          {/* --- Customer and Dates --- */}
          <section className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">From Vendor:</h3>
              <p className="font-bold text-gray-800">
                {invoiceData.vendor.name}
              </p>
              <p className="text-gray-600 text-sm">
                {invoiceData.vendor.address}
              </p>
              <p className="text-gray-600 text-sm">
                {invoiceData.vendor.email}
              </p>
              <p className="text-gray-600 text-sm">
                {invoiceData.vendor.phone}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="font-semibold text-gray-700">
                  Invoice Date:
                </span>
                <span className="text-gray-800">
                  {displayFormatDate(invoiceData.invoice.invoice_date)}
                </span>
                <span className="font-semibold text-gray-700">
                  Payment Date:
                </span>
                <span className="text-gray-800">
                  {displayFormatDate(invoiceData.invoice.payment_date)}
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
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center w-24">Qty</th>
                    <th className="p-3 text-right w-32">Unit Price</th>
                    <th className="p-3 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                      </td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        ₹{item.total_price.toFixed(2)}
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
                  Payment Summary:
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium text-gray-700">
                      Payment Method:
                    </span>{" "}
                    {invoiceData.payment_details.payment_method}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">
                      Transaction ID:
                    </span>{" "}
                    {invoiceData.payment_details.transaction_id}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Vendor Terms:
                </h3>
                <p className="text-sm text-gray-600">
                  {invoiceData.terms_and_conditions}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-800">
                    ₹{invoiceData.financial.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-800">
                    ₹{invoiceData.financial.tax_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Discount:</span>
                  <span className="font-medium text-red-500">
                    - ₹{invoiceData.financial.discount_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-lg font-bold text-gray-800">
                    Total Amount:
                  </span>
                  <span className="text-lg font-bold text-gray-800">
                    ₹{invoiceData.financial.total_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">
                    Amount Paid:
                  </span>
                  <span className="font-medium text-green-600">
                    - ₹{invoiceData.financial.amount_paid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-4 bg-green-100 rounded-b-lg px-4 mt-2">
                  <span className="text-lg font-bold text-gray-800">
                    Balance Due:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{invoiceData.financial.balance_due.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* --- Footer --- */}
          <footer className="mt-12 border-t pt-8">
            <div className="flex justify-between items-end">
              <div className="text-left text-sm text-gray-500">
                <p>Thank you for your timely payment.</p>
                <p>This is a computer-generated receipt.</p>
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
