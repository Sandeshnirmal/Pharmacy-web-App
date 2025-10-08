import React, { useState, useMemo } from "react";
import logoImg from "../assets/full_logo.png";

// --- SVG Icons (for a clean, dependency-free UI) ---
const PharmacyLogo = () => (
    <img
        src={logoImg}
        alt="Pharmacy Logo"
        className="w-20 h-17 object-contain"
        style={{ display: "block" }}
    />
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-red-500 hover:text-red-700 cursor-pointer"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const Invoice = () => {
  // --- State Management ---
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-0001`
  );
  const [issuedDate, setIssuedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");

  const [billTo, setBillTo] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      description: "Paracetamol 500mg Tablets (1 strip)",
      quantity: 2,
      price: 35.0,
    },
    {
      id: 2,
      description: "Vitamin C 1000mg Chewable (30 tabs)",
      quantity: 1,
      price: 150.5,
    },
  ]);

  const [notes, setNotes] = useState(
    "Please ensure all medicines are stored as per the instructions. Thank you for your purchase!"
  );
  const [taxRate, setTaxRate] = useState(5); // Example: 5% GST
  const [discount, setDiscount] = useState(0);

  // --- Handlers for Dynamic Form ---
  const handleAddItem = () => {
    const newItem = {
      id: items.length + 1,
      description: "",
      quantity: 1,
      price: 0.0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (idToRemove) => {
    setItems(items.filter((item) => item.id !== idToRemove));
  };

  const handleItemChange = (id, field, value) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Ensure quantity and price are numbers for calculation
        if (field === "quantity" || field === "price") {
          newItem[field] = parseFloat(value) || 0;
        }
        return newItem;
      }
      return item;
    });
    setItems(newItems);
  };

  const handleBillToChange = (e) => {
    const { name, value } = e.target;
    setBillTo((prev) => ({ ...prev, [name]: value }));
  };

  // --- Calculations using useMemo for efficiency ---
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return subtotal * (taxRate / 100);
  }, [subtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount - discount;
  }, [subtotal, taxAmount, discount]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg">
        {/* --- Invoice Body --- */}
        <div className="p-8 md:p-12" id="invoice-content">
          {/* --- Header --- */}
          <header className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-6 sm:mb-0">
              <PharmacyLogo />
              <div>
                <h1 className="text-2xl font-bold text-green-500">
                  InfixMart
                </h1>
                <p className="text-gray-500">
                  123 Health St, Wellness City, 54321
                </p>
                <p className="text-gray-500">
                  contact@mediquick.com | +91 98765 43210
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl font-extrabold text-emerald-500 uppercase tracking-wider">
                Invoice
              </h2>
              <div className="mt-2">
                <label
                  htmlFor="invoiceNumber"
                  className="text-sm font-semibold text-gray-600"
                >
                  Invoice #
                </label>
                <input
                  id="invoiceNumber"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full sm:w-auto p-1 border rounded-md text-gray-700 text-left sm:text-right"
                />
              </div>
            </div>
          </header>

          {/* --- Customer and Dates --- */}
          <section className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
              <input
                name="name"
                value={billTo.name}
                onChange={handleBillToChange}
                placeholder="Customer Name"
                className="w-full p-2 mb-2 border rounded-md"
              />
              <textarea
                name="address"
                value={billTo.address}
                onChange={handleBillToChange}
                placeholder="Customer Address"
                className="w-full p-2 mb-2 border rounded-md"
                rows="2"
              ></textarea>
              <input
                name="email"
                type="email"
                value={billTo.email}
                onChange={handleBillToChange}
                placeholder="customer@example.com"
                className="w-full p-2 mb-2 border rounded-md"
              />
              <input
                name="phone"
                type="tel"
                value={billTo.phone}
                onChange={handleBillToChange}
                placeholder="+91 12345 67890"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="text-left md:text-right">
              <div className="grid grid-cols-2 gap-4">
                <label
                  htmlFor="issuedDate"
                  className="font-semibold text-gray-700"
                >
                  Issued Date:
                </label>
                <input
                  id="issuedDate"
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="p-2 border rounded-md"
                />
                <label
                  htmlFor="dueDate"
                  className="font-semibold text-gray-700"
                >
                  Due Date:
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="p-2 border rounded-md"
                />
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
                    <th className="p-3 text-right w-32">Price</th>
                    <th className="p-3 text-right w-32">Total</th>
                    <th className="p-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full p-1 border rounded-md"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full p-1 border rounded-md text-center"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.price.toFixed(2)}
                          onChange={(e) =>
                            handleItemChange(item.id, "price", e.target.value)
                          }
                          className="w-full p-1 border rounded-md text-right"
                        />
                      </td>
                      <td className="p-3 text-right font-medium text-gray-800">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove Item"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleAddItem}
              className="mt-4 flex items-center justify-center text-emerald-600 font-semibold py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
            >
              <PlusIcon />
              Add Item
            </button>
          </section>

          {/* --- Summary & Totals --- */}
          <section className="mt-8 grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Notes:</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows="3"
              ></textarea>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-800">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">
                      Tax (%):
                    </span>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) =>
                        setTaxRate(parseFloat(e.target.value) || 0)
                      }
                      className="w-20 p-1 border rounded-md text-right"
                    />
                  </div>
                  <span className="font-medium text-gray-800">
                    ₹{taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">
                      Discount (₹):
                    </span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                      className="w-20 p-1 border rounded-md text-right"
                    />
                  </div>
                  <span className="font-medium text-red-500">
                    - ₹{discount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-4 bg-gray-100 rounded-b-lg px-4 mt-2">
                  <span className="text-lg font-bold text-gray-800">
                    Grand Total:
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* --- Footer --- */}
          <footer className="mt-12 text-center text-gray-500 border-t pt-6">
            <p>Thank you for your business!</p>
            <p className="text-sm">MediQuick Pharmacy | www.mediquick.com</p>
          </footer>
        </div>

        {/* --- Action Buttons (outside printable area) --- */}
        <div className="p-6 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3 print:hidden">
          <button className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            Send Invoice
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Print / Download PDF
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
            box-shadow: none; 
            margin: 0;
            padding: 2rem;
            max-width: 100%;
            border: 1px solid #e5e7eb;
          }
          input, textarea {
            border: 1px solid transparent !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            padding: 4px;
          }
          input:focus, textarea:focus {
             outline: none;
          }
          table, tr, td, th { page-break-inside: avoid !important; }
          .shadow-2xl { box-shadow: none !important; }
        `}
      </style>
    </div>
  );
};

export default Invoice;
