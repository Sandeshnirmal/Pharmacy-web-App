import React, { useState, useEffect, useRef } from 'react';
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
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: new Date().toISOString().split("T")[0],
    status: "PENDING", // Default status
    notes: "",
  });

  const [items, setItems] = useState([]); // Items for the purchase order
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" }); // For success/error messages

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [suppliersResponse, productsResponse] = await Promise.all([
          inventoryAPI.getSuppliers(),
          productAPI.getProducts(),
        ]);
        setSuppliers(suppliersResponse.data.results || suppliersResponse.data);
        setProducts(productsResponse.data.results || productsResponse.data);
      } catch (err) {
        setError("Failed to fetch initial data (suppliers, products).");
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
        order_date: initialData.order_date,
        invoice_date: initialData.invoice_date || "",
        status: initialData.status,
        notes: initialData.notes || "",
      });
      // Map initialData.items to the local items state
      const initialItems = initialData.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        product_details: products.find((p) => p.id === item.product) || null, // Find product details
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
        order_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: new Date().toISOString().split("T")[0],
        status: "PENDING",
        notes: "",
      });
      setItems([]);
    }
  }, [initialData, products]); // Depend on initialData and products to ensure product details are available

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;

    // If product is selected, try to find its details
    if (name === "product" && value) {
      const selectedProduct = products.find((p) => p.id === parseInt(value));
      if (selectedProduct) {
        newItems[index].product_details = selectedProduct; // Store full product details
        newItems[index].unit_price = selectedProduct.price; // Set rate from product price
        newItems[index].mrp = selectedProduct.mrp; // Set MRP from product
        newItems[index].packing = selectedProduct.packing; // Set packing from product
      }
    }

    // Recalculate amount if quantity or rate changes
    if (name === "quantity" || name === "unit_price") {
      const qty = parseFloat(newItems[index].quantity || 0);
      const rate = parseFloat(newItems[index].unit_price || 0);
      newItems[index].amount = (qty * rate).toFixed(2);
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
        packing: 0,
        batch_number: "", // Renamed to match backend model
        expiry_date: "", // Renamed to match backend model
        free: 0, // Not directly mapped to backend, can be used for notes
        tax: 5,
        disc: 0, // Not directly mapped to backend, can be used for notes
        amount: "0.00",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotals = () => {
    let goodsValue = 0;
    let totalDiscount = 0; // Assuming disc is a percentage on rate
    items.forEach((item) => {
      const qty = parseFloat(item.quantity || 0);
      const mrp = parseFloat(item.mrp || 0);
      const rate = parseFloat(item.unit_price || 0);
      const disc = parseFloat(item.disc || 0);
      const packing = parseFloat(item.packing || 0);
      const itemAmount = qty * mrp + packing;
      const itemDiscount = itemAmount * (disc / 100);
      goodsValue += itemAmount;
      totalDiscount += itemDiscount;
    });
    const billValue = goodsValue - totalDiscount;
    return { goodsValue, totalDiscount, billValue };
  };

  const { goodsValue, totalDiscount, billValue } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFormMessage({ type: "", text: "" });

    // Validate form data
    if (!formData.supplier || !formData.order_date || items.length === 0) {
      setError("Please fill in all required fields and add at least one item.");
      setSubmitting(false);
      return;
    }

    const itemsPayload = items.map((item) => ({
      product: parseInt(item.product),
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      batch_number: item.batch_number, // Include batch number
      expiry_date: item.expiry_date, // Include expiry date
      // Add other fields if needed by the backend, e.g., notes for free/disc
    }));

    const payload = {
      supplier: parseInt(formData.supplier),
      order_date: formData.order_date,
      expected_delivery_date: formData.expected_delivery_date,
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
        order_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: new Date().toISOString().split("T")[0],
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

  
  // ALTERNATIVE: Two-Step Frontend-Only Fix
  // If you CANNOT change the backend, you would use this logic instead.
  const handleSubmitAlternative = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Step 1: Create the main purchase order WITHOUT items
    const orderPayload = { ...order, total_amount: 0 }; // temp amount
    try {
        const orderResponse = await inventoryAPI.createPurchaseOrder(orderPayload);
        const newOrderId = orderResponse.data.id;

        // Step 2: Create each item, now with the new purchase_order ID
        for (const item of items) {
            const itemPayload = {
                ...item,
                purchase_order: newOrderId, // Link the item to the order
            };
            // This assumes you have an endpoint for creating items
            await inventoryAPI.createPurchaseOrderItem(itemPayload); 
        }

        // (Optional) Step 3: Update the PO with the final calculated total_amount
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        await inventoryAPI.updatePurchaseOrder(newOrderId, { total_amount });

        onFormClose();

    } catch (err) {
        console.error("Failed in two-step process:", err);
        setError("An error occurred during the multi-step save.");
    } finally {
        setLoading(false);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                htmlFor="order_date"
                className="block text-sm font-medium text-gray-700"
              >
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="order_date"
                name="order_date"
                value={formData.invoice_date}
                onChange={handleFormChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="expected_delivery_date"
                className="block text-sm font-medium text-gray-700"
              >
                order Date
              </label>
              <input
                type="date"
                id="order_date"
                name="order_date"
                value={formData.order_date}
                onChange={handleFormChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
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
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan="11"
                      className="py-4 px-3 text-center text-gray-500"
                    >
                      No items added. Click "Add Item" to start.
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <select
                        name="product"
                        value={item.product}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full p-1 border border-gray-200 rounded-md"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="text"
                        name="packing"
                        value={
                          item.packing || item.product_details?.packing || ""
                        }
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
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-900 text-lg"
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
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Add Item
          </button>

          {/* Summary and Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Discount Info */}
            <div className="border p-4 rounded-md bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-2">
                Discount Info
              </h3>
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">
                  Total Item Disc. :
                </span>
                <span className="text-sm font-medium">
                  ₹ {totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Item Disc. 1 :</span>
                <span className="text-sm font-medium">₹ 0.00</span>{" "}
                {/* Placeholder for now */}
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Item Disc. 2 :</span>
                <span className="text-sm font-medium">₹ 0.00</span>{" "}
                {/* Placeholder for now */}
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Scheme Disc. % :</span>
                <span className="text-sm font-medium">0</span>{" "}
                {/* Placeholder for now */}
              </div>
            </div>

            {/* Tax Info & Bill Disc */}
            <div className="space-y-4">
              {/* <div className="border p-4 rounded-md bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-2">Tax Info</h3> */}
              {/* Tax info content here */}
              {/* <p className="text-sm text-gray-600">
                  No tax details available.
                </p> 
              </div>*/}
              <div className="border p-4 rounded-md bg-gray-50">
                <label
                  htmlFor="billDisc"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bill Disc.
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="number"
                    id="billDisc"
                    name="billDisc"
                    className="block w-24 p-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="0.00"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Goods Value & Invoice Value */}
            <div className="space-y-4">
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
                  Total Disc.:
                </span>
                <span className="text-lg font-bold text-gray-800">
                  ₹ {totalDiscount.toFixed(2)}
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "F18 / End"}
            </button>
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
              Esc / Close
            </button>
            {/* <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Close
            </button> */}
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
