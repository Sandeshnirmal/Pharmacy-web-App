import React, { useState, useEffect, useCallback } from 'react';
import ModalSearchSelect from '../components/ModalSearchSelect'; // Import the new modal component
import {
  inventoryAPI,
  productAPI,
  // createPurchaseOrder,
  // updatePurchaseOrder,
} from "../api/apiService";

const PurchaseOrderForm = ({ onFormClose, initialData }) => {
  // Accept initialData prop
  const [formData, setFormData] = useState({
    supplier: "", // Supplier ID
    invoice_date: new Date().toISOString().split("T")[0], // Added invoice_date
    invoice_number: "", // Added invoice_number
    status: "PENDING", // Default status
    notes: "",
  });

  const [items, setItems] = useState([]); // Items for the purchase order
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" }); // For success/error messages

  // No longer needed:
  // const [showProductSearchPopup, setShowProductSearchPopup] = useState(false);
  // const [currentProductItemIndex, setCurrentProductItemIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [suppliersResponse] = await Promise.all([
          inventoryAPI.getSuppliers(),
          // productAPI.getProducts(), // Products will be fetched on demand by ModalSearchSelect
        ]);
        setSuppliers(suppliersResponse.data.results || suppliersResponse.data);
        // setProducts(productsResponse.data.results || productsResponse.data);
      } catch (err) {
        setError("Failed to fetch initial data (suppliers).");
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        supplier: initialData.supplier,
        invoice_date: initialData.invoice_date || new Date().toISOString().split("T")[0], // Ensure invoice_date is set
        invoice_number: initialData.invoice_number || "", // Ensure invoice_number is set
        status: initialData.status,
        notes: initialData.notes || "",
      });
      // Map initialData.items to the local items state
      const initialItems = initialData.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        product_details: item.product_details || null, // Assume product_details comes with initialData or will be fetched
        mrp: item.mrp || "",
        packing: item.packing || "",
        batch_number: item.batch_number || "",
        expiry_date: item.expiry_date || "",
        free: item.free || 0,
        tax: item.tax || "5",
        disc: item.disc || 0,
        amount: (item.quantity * parseFloat(item.unit_price)).toFixed(2),
      }));
      setItems(initialItems);
    } else {
      // Reset form for new entry if initialData is cleared
      setFormData({
        supplier: "",
        invoice_date: new Date().toISOString().split("T")[0],
        invoice_number: "",
        status: "PENDING",
        notes: "",
      });
      setItems([]);
    }
  }, [initialData]); // Depend only on initialData

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;

    // Recalculate amount if quantity or rate changes
    if (name === "quantity" || name === "unit_price") {
      const qty = parseFloat(newItems[index].quantity || 0);
      const rate = parseFloat(newItems[index].unit_price || 0);
      newItems[index].amount = (qty * rate).toFixed(2);
    }

    setItems(newItems);
  };

  const searchProducts = useCallback(async (searchTerm) => {
    if (searchTerm.length > 0) {
      try {
        const response = await productAPI.getProducts({ search: searchTerm });
        return Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error("Error searching products:", err);
        return [];
      }
    }
    return [];
  }, []);

  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    if (product) {
      newItems[index].product = product.id;
      newItems[index].product_details = product;
      newItems[index].unit_price = product.current_cost_price || 0;
      newItems[index].packing = product.pack_size || "";
      newItems[index].mrp = product.mrp || 0;
      // Recalculate amount
      const qty = parseFloat(newItems[index].quantity || 0);
      const rate = parseFloat(newItems[index].unit_price || 0);
      newItems[index].amount = (qty * rate).toFixed(2);
    } else {
      // Clear product and related fields
      newItems[index] = {
        ...newItems[index],
        product: "",
        product_details: null,
        unit_price: 0,
        packing: "",
        mrp: 0,
        amount: "0.00",
      };
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product: "", // Product ID
        quantity: 0,
        unit_price: 0,
        product_details: null, // To store product object for display
        mrp: 0,
        packing: "",
        batch_number: "",
        expiry_date: "",
        free: 0,
        tax: 5,
        disc: 0,
        amount: "0.00",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotals = () => {
    let goodsValue = 0; // Sum of (quantity * unit_price)
    let totalDiscountAmount = 0; // Sum of item-level discounts
    let totalTaxAmount = 0; // Sum of item-level taxes

    items.forEach((item) => {
      const qty = parseFloat(item.quantity || 0);
      const rate = parseFloat(item.unit_price || 0);
      const disc = parseFloat(item.disc || 0); // Discount percentage
      const tax = parseFloat(item.tax || 0); // Tax percentage

      const itemBaseAmount = qty * rate;
      const itemDiscount = itemBaseAmount * (disc / 100);
      const itemTaxableAmount = itemBaseAmount - itemDiscount;
      const itemTax = itemTaxableAmount * (tax / 100);

      goodsValue += itemBaseAmount;
      totalDiscountAmount += itemDiscount;
      totalTaxAmount += itemTax;
    });

    const billValue = goodsValue - totalDiscountAmount + totalTaxAmount;
    return { goodsValue, totalDiscount: totalDiscountAmount, totalTax: totalTaxAmount, billValue };
  };

  const { goodsValue, totalDiscount, totalTax, billValue } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFormMessage({ type: "", text: "" });

    // Validate form data
    if (!formData.supplier || !formData.invoice_date || items.length === 0) {
      setError("Please fill in all required fields and add at least one item.");
      setSubmitting(false);
      return;
    }

    const itemsPayload = items.map((item) => ({
      product: item.product ? parseInt(item.product) : null, // Send product ID or null
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      tax_percentage: parseFloat(item.tax || 0), // Include tax_percentage
      batch_number: item.batch_number, // Include batch number
      expiry_date: item.expiry_date, // Include expiry date
      // Add other fields if needed by the backend, e.g., notes for free/disc
    }));

    const payload = {
      supplier: parseInt(formData.supplier),
      invoice_date: formData.invoice_date,
      invoice_number: formData.invoice_number,
      status: formData.status,
      notes: formData.notes,
      items: itemsPayload,
    };

    try {
      let response;
      if (initialData) {
        response = await inventoryAPI.updatePurchaseOrder(
          initialData.id,
          payload
        );
        setFormMessage({
          type: "success",
          text: "Purchase Bill updated successfully!",
        });
      } else {
        response = await inventoryAPI.createPurchaseOrder(payload);
        setFormMessage({
          type: "success",
          text: "Purchase Bill created successfully!",
        });
      }

      // Optionally clear form or navigate
      setFormData({
        supplier: "",
        invoice_date: new Date().toISOString().split("T")[0],
        invoice_number: "",
        status: "PENDING",
        notes: "",
      });
      setItems([]);
      if (onFormClose) onFormClose(); // Call parent's close handler
    } catch (err) {
      setError(
        `Failed to ${
          initialData ? "update" : "create"
        } purchase bill. Please check your input.`
      );
      console.error(
        `Error ${initialData ? "updating" : "creating"} purchase bill:`,
        err
      );
      setFormMessage({
        type: "error",
        text: `Failed to ${initialData ? "update" : "create"} purchase bill.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading form data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-xl font-bold text-gray-800 mb-4">
          {initialData ? "Edit Purchase Bill" : "Create Purchase Bill"}
        </h1>

        {formMessage.text && (
          <div
            className={`mb-4 p-3 rounded-md text-center ${
              formMessage.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {formMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label
                htmlFor="supplier"
                className="block text-sm font-medium text-gray-700"
              >
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleFormChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="invoice_date"
                className="block text-sm font-medium text-gray-700"
              >
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="invoice_date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleFormChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="invoice_number"
                className="block text-sm font-medium text-gray-700"
              >
                Invoice Number
              </label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleFormChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="PENDING">Pending</option>
                <option value="ORDERED">Ordered</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Product Entry Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product <span className="text-red-500">*</span>
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Packing
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    MRP
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Exp. Date
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Qty <span className="text-red-500">*</span>
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Free
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rate <span className="text-red-500">*</span>
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Disc %
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    tax
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-2 px-3"></th> {/* For remove button */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan="12"
                      className="py-4 px-3 text-center text-gray-500"
                    >
                      No items added. Click "Add Item" to start.
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <ModalSearchSelect
                        label="Product Name"
                        placeholder="Select Product"
                        selectedValue={item.product_details}
                        onSelect={(product) => handleProductSelect(index, product)}
                        onSearch={searchProducts}
                        displayField="name"
                        valueField="id"
                        required
                        className="w-full"
                        columns={[
                          { header: 'Product Name', field: 'name' },
                          { header: 'Packing', field: 'pack_size' },
                          { header: 'MRP', field: 'mrp' },
                          { header: 'Cost Price', field: 'current_cost_price' },
                        ]}
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="text"
                        name="packing"
                        value={item.packing || ""}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        placeholder="Packing"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="number"
                        name="mrp"
                        value={item.mrp}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        step="1"
                        placeholder="MRP"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="text"
                        name="batch_number"
                        value={item.batch_number}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        placeholder="Batch No."
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="date"
                        name="expiry_date"
                        value={item.expiry_date}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        min="0"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="number"
                        name="free"
                        value={item.free}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        min="0"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="number"
                        name="unit_price"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="number"
                        name="disc"
                        value={item.disc}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="number"
                        name="tax"
                        value={item.tax || 0}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md bg-gray-50"
                        readOnly
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="text"
                        name="amount"
                        value={item.amount}
                        className="w-full p-1 border border-gray-200 rounded-md bg-gray-50"
                        readOnly
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 font-bold"
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
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mt-4"
          >
            Add Item
          </button>

          {/* Summary and Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Discount Info */}
            {/* Discount Info */}
            <div className="border p-4 rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-2">
                Discount & Tax Info
              </h3>
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">
                  Total Item Discount:
                </span>
                <span className="text-sm font-medium">
                  ₹ {totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Total Tax:</span>
                <span className="text-sm font-medium">
                  ₹ {totalTax.toFixed(2)}
                </span>
              </div>
              {/* Bill Disc. input can be added here if it's a separate field */}
              <div className="mt-4">
                <label
                  htmlFor="billDisc"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bill Discount (%)
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="number"
                    id="billDisc"
                    name="billDisc"
                    className="block w-24 p-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="0.00" // This would need a state variable if it's interactive
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Goods Value & Invoice Value */}
            <div className="space-y-4 col-span-2">
              <div className="border p-4 rounded-md bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Additional Details
                </h3>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-700">
                  Goods Value:
                </span>
                <span className="text-lg font-bold text-gray-800">
                  ₹ {goodsValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-700">
                  Total Discount:
                </span>
                <span className="text-lg font-bold text-gray-800">
                  ₹ {totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-700">
                  Total Tax:
                </span>
                <span className="text-lg font-bold text-gray-800">
                  ₹ {totalTax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-700">
                  Bill Value:
                </span>
                <span className="text-lg font-bold text-gray-800">
                  ₹ {billValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-700">
                  Invoice Value:
                </span>
                <input
                  type="text"
                  className="w-32 p-2 border border-gray-300 rounded-md shadow-sm text-lg font-bold text-right bg-gray-50"
                  value={billValue.toFixed(2)}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="bg-gray-400 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-500"
              onClick={onFormClose} // Use the prop to close the form
            >
              Close
            </button>
            <button
              type="button"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Last Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
