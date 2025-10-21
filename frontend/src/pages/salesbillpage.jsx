import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, Search, Printer } from "lucide-react";

import { productAPI, inventoryAPI, salesBillAPI, offlineCustomerAPI } from '../../api/apiService'; // Adjust path as needed

// --- SalesBillForm Component (Updated Layout) ---
const SalesBillForm = ({ onFormClose, initialData }) => {
  const [formData, setFormData] = useState({
    customer: "",
    bill_date: new Date().toISOString().split("T")[0],
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
  const [gst, setGst] = useState(18); // Default GST percentage

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersResponse, productsResponse] = await Promise.all([
          offlineCustomerAPI.getCustomers(), // Use offlineCustomerAPI for customers
          productAPI.getProducts(),
        ]);
        setCustomers(customersResponse.data.results || customersResponse.data);
        setProducts(Array.isArray(productsResponse.data.results) ? productsResponse.data.results : Array.isArray(productsResponse.data) ? productsResponse.data : []);
      } catch (err) {
        setError("Failed to fetch initial data (customers, products).");
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
        bill_date: initialData.bill_date,
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
      if (selectedCustomer) {
        setCustomerDetails({
          address: selectedCustomer.address,
          mobile: selectedCustomer.mobile,
        });
      } else {
        setCustomerDetails({ address: "", mobile: "" });
      }
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
        newItems[index]["unit_price"] = selectedProduct.current_selling_price; // Use current_selling_price
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
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const grossAmount = useMemo(() => {
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return total + quantity * price;
    }, 0);
  }, [items]);

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
        await inventoryAPI.updateSalesBill(initialData.id, payload);
      } else {
        await inventoryAPI.createSalesBill(payload);
      }
      onFormClose();
    } catch (err) {
      setError("Failed to save the sales bill. Please check your inputs.");
      console.error("Submission error:", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center p-8">Loading form...</p>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b">
          <h1 className="text-3xl font-bold text-gray-800">Sales Bill</h1>
          <div className="text-right">
            <p className="text-gray-600">
              Bill No:{" "}
              <span className="font-semibold text-gray-800">
                {initialData ? initialData.id : "New Bill"}
              </span>
            </p>
            <input
              type="date"
              name="bill_date"
              value={formData.bill_date}
              onChange={handleFormChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Customer Details */}
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

        {/* Items Table */}
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
                  <td className="px-2 py-2">
                    <select
                      name="product"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, e)}
                      required
                      className="w-full p-1 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      name="packing"
                      value={item.packing}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      name="hsn_code"
                      value={item.hsn_code}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      name="batch_no"
                      value={item.batch_no}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      name="expire_date"
                      value={item.expire_date}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-full p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-2 py-2">
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
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      name="unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, e)}
                      className="w-20 p-1 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-2 py-2">
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
                  <td className="px-2 py-2 text-center">
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

        {/* Footer Section */}
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

        {/* Action Buttons */}
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
            {submitting ? "Saving..." : "Save Bill"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Page Component ---
const SalesBillPage = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [currentBill, setCurrentBill] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10; // Define page size

    const fetchSalesBills = useCallback(async () => {
        try {
            setLoading(true);
            const response = await salesBillAPI.getSalesBills(currentPage, pageSize, { search: searchTerm });
            setBills(Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : []);
            setTotalPages(Math.ceil(response.data.count / pageSize));
        } catch (err) {
            setError("Failed to fetch sales bills.");
            console.error("Error fetching sales bills:", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        if (!showForm) {
            fetchSalesBills();
        }
    }, [showForm, fetchSalesBills]);

    const handleAddNewClick = () => {
        setCurrentBill(null);
        setShowForm(true);
    };

    const handleEditClick = (bill) => {
        setCurrentBill(bill);
        setShowForm(true);
    };

    const handleDeleteClick = async (id) => {
        const isConfirmed = window.confirm(
            "Are you sure you want to delete this bill?"
        );
        if (isConfirmed) {
            try {
                await salesBillAPI.deleteSalesBill(id);
                fetchSalesBills();
            } catch (err) {
                setError("Failed to delete sales bill.");
                console.error("Error deleting bill:", err);
            }
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setCurrentBill(null);
    };

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // No need for client-side filtering if backend handles search
    // const filteredBills = bills.filter(
    //     (bill) =>
    //         bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         String(bill.id).includes(searchTerm)
    // );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {showForm ? (
                <SalesBillForm
                    onFormClose={handleFormClose}
                    initialData={currentBill}
                />
            ) : (
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Sales Bills</h1>
                        <button
                            onClick={handleAddNewClick}
                            className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
                        >
                            <PlusCircle className="mr-2" size={20} />
                            Create New Bill
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
                                placeholder="Search by customer name or bill ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {loading && (
                        <p className="text-center text-gray-600">Loading bills...</p>
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
                                            Bill ID
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
                                    {bills.length > 0 ? (
                                        bills.map((bill) => (
                                            <tr key={bill.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 text-gray-800">#{bill.id}</td>
                                                <td className="py-3 px-4 text-gray-800">
                                                    {bill.customer_name}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {new Date(bill.bill_date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-gray-800 font-medium">
                                                    ${parseFloat(bill.total_amount).toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                            bill.status === "PAID"
                                                                ? "bg-green-100 text-green-800"
                                                                : bill.status === "PENDING"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {bill.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleEditClick(bill)}
                                                        className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(bill.id)}
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
                                                No sales bills found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-4 space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`px-4 py-2 border rounded-md ${
                                                currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SalesBillPage;
