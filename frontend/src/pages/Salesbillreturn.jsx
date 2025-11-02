import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, Search, Printer } from "lucide-react";

// --- Mock API Service ---
// In a real application, this would be in its own apiService.js file.
const mockSalesReturns = [
  {
    id: 1,
    customer: 1,
    customer_name: "John Doe",
    return_date: "2025-10-20",
    total_amount: "75.00",
    status: "COMPLETED",
    items: [
      {
        product: 1,
        packing: "10x1",
        quantity: 1,
        unit_price: 75.0,
        hsn_code: "1234",
        unit: "pcs",
        batch_no: "B123",
        expire_date: "2026-10-17",
      },
    ],
  },
];
const mockCustomers = [
  { id: 1, name: "John Doe", address: "123 Main St", mobile: "555-1234" },
  { id: 2, name: "Jane Smith", address: "456 Oak Ave", mobile: "555-5678" },
];
const mockProducts = [
  { id: 1, name: "Product A", sale_price: 75.0, hsn_code: "1234" },
  { id: 2, name: "Product B", sale_price: 64.1, hsn_code: "5678" },
];

const inventoryAPI = {
  getSalesReturns: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: mockSalesReturns }), 500)
    ),
  deleteSalesReturn: (id) =>
    new Promise((resolve) => setTimeout(() => resolve(), 500)),
  createSalesReturn: (data) =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: { id: Math.random(), ...data } }), 500)
    ),
  updateSalesReturn: (id, data) =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: { id, ...data } }), 500)
    ),
  getCustomers: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: mockCustomers }), 500)
    ),
};
const productAPI = {
  getProducts: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: mockProducts }), 500)
    ),
};
// --- End Mock API Service ---

// --- SalesReturnForm Component ---
function SalesReturnForm({ onFormClose, initialData }) {
  const [formData, setFormData] = useState({
    customer: "",
    return_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [customerDetails, setCustomerDetails] = useState({
    address: "",
    mobile: "",
  });
  const [items, setItems] = useState([
    {
      product: "",
      packing: "",
      hsn_code: "",
      quantity: 1,
      unit: "pcs",
      unit_price: 0,
      batch_no: "",
      expire_date: "",
    },
  ]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersResponse, productsResponse] = await Promise.all([
          inventoryAPI.getCustomers(),
          productAPI.getProducts(),
        ]);
        setCustomers(customersResponse.data.results || customersResponse.data);
        setProducts(productsResponse.data.results || productsResponse.data);
      } catch (err) {
        setError("Failed to fetch initial data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        customer: initialData.customer,
        return_date: initialData.return_date,
        notes: initialData.notes || "",
      });
      setItems(
        initialData.items || [
          {
            product: "",
            packing: "",
            hsn_code: "",
            quantity: 1,
            unit: "pcs",
            unit_price: 0,
            batch_no: "",
            expire_date: "",
          },
        ]
      );
    }
  }, [initialData]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "customer") {
      const selectedCustomer = customers.find(
        (c) => String(c.id) === String(value)
      );
      setCustomerDetails(
        selectedCustomer
          ? {
              address: selectedCustomer.address,
              mobile: selectedCustomer.mobile,
            }
          : { address: "", mobile: "" }
      );
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;

    if (name === "product") {
      const selectedProduct = products.find(
        (p) => String(p.id) === String(value)
      );
      if (selectedProduct) {
        newItems[index]["unit_price"] = selectedProduct.sale_price;
        newItems[index]["hsn_code"] = selectedProduct.hsn_code;
      }
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product: "",
        packing: "",
        hsn_code: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        batch_no: "",
        expire_date: "",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const grossAmount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0),
        0
      ),
    [items]
  );
  const taxableAmount = useMemo(
    () => grossAmount - discount,
    [grossAmount, discount]
  );
  const gstAmount = useMemo(
    () => (taxableAmount * gst) / 100,
    [taxableAmount, gst]
  );
  const netAmount = useMemo(
    () => taxableAmount + gstAmount,
    [taxableAmount, gstAmount]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      ...formData,
      customer: parseInt(formData.customer),
      total_amount: netAmount.toFixed(2),
      items: items.map((item) => ({ ...item })),
      discount: parseFloat(discount),
      gst_percentage: parseFloat(gst),
    };
    try {
      if (initialData) {
        await inventoryAPI.updateSalesReturn(initialData.id, payload);
      } else {
        await inventoryAPI.createSalesReturn(payload);
      }
      onFormClose();
    } catch (err) {
      setError("Failed to save the sales return.");
      console.error("Submission error:", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center p-8">Loading form...</p>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center pb-4 mb-6 border-b">
          <h1 className="text-3xl font-bold text-gray-800">
            Sales Return Bill
          </h1>
          <div className="text-right">
            <p className="text-gray-600">
              Return No:{" "}
              <span className="font-semibold text-gray-800">
                {initialData ? initialData.id : "New Return"}
              </span>
            </p>
            <input
              type="date"
              name="return_date"
              value={formData.return_date}
              onChange={handleFormChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <select
              name="customer"
              value={formData.customer}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              value={customerDetails.address}
              readOnly
              placeholder="Customer address"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile No
            </label>
            <input
              type="text"
              value={customerDetails.mobile}
              readOnly
              placeholder="Customer mobile"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sl. No
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Product Name
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packing
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HSN Code
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch No
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expire Date
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-2 py-2">{index + 1}</td>
                  <td>
                    <select
                      name="product"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, e)}
                      required
                      className="w-full p-1 border border-gray-300 rounded-md"
                    >
                      <option value="">Select</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="packing"
                      value={item.packing}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="hsn_code"
                      value={item.hsn_code}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="batch_no"
                      value={item.batch_no}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      name="expire_date"
                      value={item.expire_date}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      min="1"
                      required
                      className="w-20 p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-20 p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="unit_price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, e)}
                      min="0"
                      step="0.01"
                      required
                      className="w-24 p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-2 py-2 font-medium text-gray-800">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 font-bold"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Add New Row
        </button>

        <div className="flex flex-col md:flex-row justify-between mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes / Terms
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="4"
              className="mt-1 block w-full md:w-96 p-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>
          <div className="w-full md:w-80 mt-6 md:mt-0">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Gross Amount:</span>
              <span className="font-medium text-gray-800">
                ${grossAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <label htmlFor="discount" className="text-gray-600">
                Discount:
              </label>
              <input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 p-1 border rounded-md text-right font-medium text-gray-800"
              />
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Taxable Amount:</span>
              <span className="font-medium text-gray-800">
                ${taxableAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <label htmlFor="gst" className="text-gray-600">
                GST (%):
              </label>
              <input
                id="gst"
                type="number"
                value={gst}
                onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
                className="w-24 p-1 border rounded-md text-right font-medium text-gray-800"
              />
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">GST Amount:</span>
              <span className="font-medium text-gray-800">
                ${gstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 rounded-md px-2 mt-2">
              <span className="text-lg font-bold text-gray-800">
                Net Amount:
              </span>
              <span className="text-lg font-bold text-gray-900">
                ${netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end items-center mt-8 pt-6 border-t space-x-3">
          <button
            type="button"
            onClick={onFormClose}
            className="bg-gray-200 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600"
          >
            <Printer className="mr-2" size={18} /> Print
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {submitting ? "Saving..." : "Save Return"}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Main Page Component ---
export default function SalesReturnPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentReturn, setCurrentReturn] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSalesReturns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getSalesReturns();
      setReturns(response.data.results || response.data);
    } catch (err) {
      setError("Failed to fetch sales returns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showForm) fetchSalesReturns();
  }, [showForm, fetchSalesReturns]);

  const handleAddNewClick = () => {
    setCurrentReturn(null);
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    setCurrentReturn(item);
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this sales return?")) {
      try {
        await inventoryAPI.deleteSalesReturn(id);
        fetchSalesReturns();
      } catch (err) {
        setError("Failed to delete sales return.");
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setCurrentReturn(null);
  };

  const filteredReturns = returns.filter(
    (item) =>
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id).includes(searchTerm)
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showForm ? (
        <SalesReturnForm
          onFormClose={handleFormClose}
          initialData={currentReturn}
        />
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Sales Returns</h1>
            <button
              onClick={handleAddNewClick}
              className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
            >
              <PlusCircle className="mr-2" size={20} />
              Create New Return
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by customer name or return ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loading && (
            <p className="text-center text-gray-600">Loading returns...</p>
          )}
          {error && (
            <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Return ID
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Customer
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.length > 0 ? (
                    filteredReturns.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">#{item.id}</td>
                        <td className="py-3 px-4 text-gray-800">
                          {item.customer_name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(item.return_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-800 font-medium">
                          ${parseFloat(item.total_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              item.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-6 px-4 text-center text-gray-500"
                      >
                        No sales returns found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
