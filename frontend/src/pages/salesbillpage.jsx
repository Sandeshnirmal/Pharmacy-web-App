import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { PlusCircle, Search, Printer, RotateCcw, XCircle } from "lucide-react"; // Added RotateCcw and XCircle icons
import ModalSearchSelect from '../components/ModalSearchSelect'; // Import the new modal component
import BillReturnPage from './offline_sales/BillReturnPage'; // Import the new BillReturnPage component

import { productAPI, salesBillAPI, offlineCustomerAPI, apiUtils } from '../api/apiService'; // Adjust path as needed
import { inventoryAPI } from '../api/apiService'; // Keep inventoryAPI for other uses if any, or remove if not needed.

// --- SalesBillForm Component (Updated Layout) ---
const SalesBillForm = ({ onFormClose, initialData, onBillCreated }) => { // Add onBillCreated prop
  const navigate = useNavigate(); // Initialize useNavigate
  const [formData, setFormData] = useState({
    bill_date: initialData?.bill_date || new Date().toISOString().split("T")[0],
    notes: initialData?.notes || "",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null); // Stores the full customer object
  const [customerPhoneNumberInput, setCustomerPhoneNumberInput] = useState(initialData?.customer_mobile || ""); // For new customer input or display, renamed from customerMobileInput
  const [customerNameInput, setCustomerNameInput] = useState(initialData?.customer_name || "");
  const [customerAddressInput, setCustomerAddressInput] = useState(initialData?.customer_address || "");
  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false); // State for customer search modal
  const [customerSearchTerm, setCustomerSearchTerm] = useState(""); // State for customer search term

  const [items, setItems] = useState([
    {
      product: undefined, // Will store product object, use undefined instead of null for controlled components
      batch: undefined, // Will store batch object, use undefined instead of null for controlled components
      packing: "",
      hsn_code: "",
      quantity: 1,
      unit: "pcs",
      unit_price: 0,
      batch_no: "",
      expire_date: "",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18); // Default GST percentage
  const [payMethod, setPayMethod] = useState(initialData?.payment_method || "Cash"); // New state for pay method, initialized from backend's 'payment_method'
  const [paidAmount, setPaidAmount] = useState(parseFloat(initialData?.paid_amount) || 0); // New state for paid amount

  // Effect to handle initial data loading and set loading to false
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      if (initialData) {
        setFormData((prev) => ({
          ...prev,
          bill_date: initialData.bill_date || new Date().toISOString().split("T")[0],
          notes: initialData.notes || "",
        }));

      if (initialData.customer) {
        const customerData = {
          id: initialData.customer,
          name: initialData.customer_name || "",
          address: initialData.customer_address || "",
          phone_number: initialData.customer_mobile || "", // Use phone_number
        };
        setSelectedCustomer(customerData);
        setCustomerPhoneNumberInput(customerData.phone_number); // Use phone_number
        setCustomerNameInput(customerData.name);
        setCustomerAddressInput(customerData.address);
      } else {
        setSelectedCustomer(null);
        setCustomerPhoneNumberInput("");
        setCustomerNameInput("");
        setCustomerAddressInput("");
      }
      setPaidAmount(parseFloat(initialData?.paid_amount) || 0); // Initialize paidAmount

        // For existing bills, we need to fetch full product/batch details for items
        // This might involve multiple API calls, so handle carefully
        const fetchedItems = await Promise.all(
          initialData.items?.map(async (item) => {
            let productObj = { id: item.product, name: item.product_name }; // Default with minimal info
            let batchObj = null;

            try {
              // Fetch full product details if needed (e.g., for current_selling_price)
              const productResponse = await productAPI.getProduct(item.product); // Corrected method name
              productObj = productResponse.data;
            } catch (prodErr) {
              console.error(`Error fetching product ${item.product}:`, prodErr);
            }

            if (item.batch) {
              try {
                const batchesResponse = await productAPI.getBatches(item.product, { batch_no: item.batch_no });
                batchObj = Array.isArray(batchesResponse.data.results) ? batchesResponse.data.results[0] : null;
              } catch (batchErr) {
                console.error(`Error fetching batch ${item.batch} for product ${item.product}:`, batchErr);
              }
            }

            return {
              ...item,
              product: productObj,
              batch: batchObj,
              packing: item.packing || productObj?.packing || "",
              hsn_code: item.hsn_code || productObj?.hsn_code || "",
              quantity: parseFloat(item.quantity) || 1,
              unit: item.unit || "pcs",
              unit_price: parseFloat(item.price_per_unit || item.unit_price) || 0, // Use price_per_unit from API if available
              batch_no: item.batch_no || batchObj?.batch_no || "",
              expire_date: item.expire_date || batchObj?.expire_date || "",
            };
          }) || []
        );
        setItems(fetchedItems.length > 0 ? fetchedItems : [{
          product: undefined,
          batch: undefined,
          packing: "",
          hsn_code: "",
          quantity: 1,
          unit: "pcs",
          unit_price: 0,
          batch_no: "",
          expire_date: "",
        }]);
      } else {
        // For new bills, ensure items array is initialized with one empty item
        setItems([
          {
            product: undefined,
            batch: undefined,
            packing: "",
            hsn_code: "",
            quantity: 1,
            unit: "pcs",
            unit_price: 0,
            batch_no: "",
            expire_date: "",
          },
        ]);
      }
      setLoading(false);
    };

    initializeForm();
  }, [initialData]); // Depend on initialData to re-run when editing a different bill

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const searchCustomers = useCallback(async (searchTerm) => {
    if (searchTerm.length > 0) {
      try {
        const response = await offlineCustomerAPI.getCustomers({ search: searchTerm });
        // Map 'phone_number' from backend to 'mobile' for ModalSearchSelect displayField if needed,
        // or adjust ModalSearchSelect to use 'phone_number' directly.
        // For now, assuming ModalSearchSelect can handle 'phone_number' as displayField.
        return Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error("Error searching customers:", err);
        return [];
      }
    }
    return [];
  }, []);

  const searchProducts = useCallback(async (searchTerm) => {
    if (searchTerm.length > 0) {
      try {
        const response = await productAPI.getProducts(1, 20, { search: searchTerm });
        const products = Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [];

        // Process products to find the best batch's offline_selling_price for display
        const productsWithDisplayPrice = products.map(product => {
          let displayPrice = 0;
          let selectedBatch = undefined;

          // Use the current_batch provided by the backend
          if (product.current_batch) {
            selectedBatch = product.current_batch;
            displayPrice = parseFloat(selectedBatch.offline_selling_price) || 0;
          }
          return { ...product, display_price: displayPrice, current_batch: selectedBatch };
        });

        return productsWithDisplayPrice;
      } catch (err) {
        console.error("Error searching products:", err);
        return [];
      }
    }
    return [];
  }, []);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    if (customer) {
      setCustomerPhoneNumberInput(customer.phone_number); // Use phone_number
      setCustomerNameInput(customer.name);
      setCustomerAddressInput(customer.address);
    } else {
      setCustomerPhoneNumberInput("");
      setCustomerNameInput("");
      setCustomerAddressInput("");
    }
  };

  const handleCustomerNameChange = (e) => {
    setCustomerNameInput(e.target.value);
    // If customer name is manually typed, clear selectedCustomer
    if (selectedCustomer && selectedCustomer.name !== e.target.value) {
      setSelectedCustomer(null);
    }
  };

  const handleCustomerAddressChange = (e) => {
    setCustomerAddressInput(e.target.value);
  };

  const handleProductSelect = async (index, product) => {
    const newItems = [...items];
    if (product) {
      let selectedBatch = product.current_batch; // Use the current_batch from the product object
      let unitPrice = selectedBatch ? parseFloat(selectedBatch.offline_selling_price) || 0 : 0;

      newItems[index] = {
        ...newItems[index],
        product: product,
        packing: product.packing || "",
        hsn_code: product.hsn_code || "",
        quantity: 1, // Reset quantity to 1 when a new product is selected
        unit_price: unitPrice, // Use unitPrice derived from selected batch's offline_selling_price
        batch: selectedBatch,
        batch_no: selectedBatch?.batch_no || "",
        expire_date: selectedBatch?.expiry_date || "",
      };
    } else {
      // Clear product and related fields
      newItems[index] = {
        ...newItems[index],
        product: undefined,
        packing: "",
        hsn_code: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        batch: undefined,
        batch_no: "",
        expire_date: "",
      };
    }
    setItems(newItems);
  };

  const searchBatches = useCallback(async (index, searchTerm) => {
    const productId = items[index].product?.id;
    if (!productId) {
      return []; // No product selected, no batches to show
    }
    try {
      // Fetch all batches for the product if searchTerm is empty, otherwise filter by searchTerm
      const params = searchTerm.length > 0 ? { search: searchTerm } : {};
      const response = await productAPI.getBatches(productId, params);
      return Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      console.error("Error searching batches:", err);
      return [];
    }
  }, [items]); // Depend on items to get the current product ID

  const handleBatchSelect = (index, batch) => {
    const newItems = [...items];
    if (batch) {
      newItems[index] = {
        ...newItems[index],
        batch: batch,
        batch_no: batch.batch_no || "",
        expire_date: batch.expiry_date || "", // Use expiry_date from batch
        unit_price: parseFloat(batch.offline_selling_price) || 0, // Use offline_selling_price from the selected batch
      };
    } else {
      // Clear batch and related fields, but keep product info
      newItems[index] = {
        ...newItems[index],
        batch: undefined,
        batch_no: "",
        expire_date: "",
        unit_price: 0, // Reset to 0 if no batch is selected
      };
    }
    setItems(newItems);
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    if (name === "quantity" || name === "unit_price") {
      newItems[index][name] = parseFloat(value) || 0; // Ensure numbers are stored as numbers
    } else {
      newItems[index][name] = value;
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product: undefined,
        batch: undefined,
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

  const changeAmount = useMemo(
    () => paidAmount - netAmount,
    [paidAmount, netAmount]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let customerId = null;

    try {
      if (selectedCustomer) {
        customerId = selectedCustomer.id;
      } else {
        // If no existing customer is selected, create a new one
        if (!customerNameInput || !customerPhoneNumberInput) { // Use customerPhoneNumberInput
          throw new Error("Customer Name and Phone Number are required for new customers."); // Update error message
        }
        const newCustomerPayload = {
          name: customerNameInput,
          phone_number: customerPhoneNumberInput, // Send as phone_number
          address: customerAddressInput,
        };
        console.log("New Customer Payload:", newCustomerPayload); // Add this line for debugging
        const newCustomerResponse = await offlineCustomerAPI.findOrCreateCustomer(newCustomerPayload);
        customerId = newCustomerResponse.data.id;
      }

      const payload = {
        ...formData,
        customer: customerId,
        total_amount: netAmount.toFixed(2),
        paid_amount: paidAmount.toFixed(2), // Include paid amount
        change_amount: changeAmount.toFixed(2), // Include change amount
        payment_method: payMethod, // Include pay method in the payload, renamed to match backend
        items: items.map((item) => ({
          product: item.product?.id, // Send product ID
          batch: item.batch?.id, // Send batch ID
          packing: item.packing,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: item.unit_price, // Send unit_price as price_per_unit
          batch_no: item.batch_no,
          expire_date: item.expire_date,
        })),
        discount: parseFloat(discount),
        gst_percentage: parseFloat(gst),
      };

      let response;
      if (initialData) {
        response = await salesBillAPI.updateSalesBill(initialData.id, payload);
      } else {
        response = await salesBillAPI.createSalesBill(payload);
      }

      if (response.data && response.data.id) {
        onBillCreated(response.data.id); // Call the new prop with the created bill ID
      } else {
        onFormClose(); // Fallback if no ID is returned (shouldn't happen for create)
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message || "Failed to save the sales bill. Please check your inputs and ensure a customer is selected or new customer details are complete.");
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
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Customer Phone Number <span className="text-red-500">*</span> {/* Updated label */}
            </label>
            <div className="flex mt-1">
              <input
                type="text"
                name="customerPhoneNumberInput" // Updated name
                value={customerPhoneNumberInput} // Updated value
                onChange={(e) => {
                  setCustomerPhoneNumberInput(e.target.value); // Updated setter
                  setSelectedCustomer(null); // Clear selected customer if phone number is manually typed
                }}
                placeholder="Enter customer phone number" // Updated placeholder
                required
                className="flex-grow p-2 border border-gray-300 rounded-l-md shadow-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setCustomerSearchTerm(customerPhoneNumberInput); // Initialize search with current input
                  setShowCustomerSearchModal(true);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customerNameInput"
              value={customerNameInput}
              onChange={handleCustomerNameChange}
              placeholder="Enter customer name"
              required
              readOnly={!!selectedCustomer} // Make readOnly if a customer is selected
              className={`mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm ${selectedCustomer ? 'bg-gray-100' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="customerAddressInput"
              value={customerAddressInput}
              onChange={handleCustomerAddressChange}
              placeholder="Customer address"
              readOnly={!!selectedCustomer} // Make readOnly if a customer is selected
              className={`mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm ${selectedCustomer ? 'bg-gray-100' : ''}`}
            />
          </div>
        </div>

        {/* Customer Search Modal */}
        {showCustomerSearchModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Search Existing Customer</h2>
              <ModalSearchSelect
                label="Search Customer"
                placeholder="Search by phone number, name, or address" // Updated placeholder
                selectedValue={null} // No pre-selected value in the search modal itself
                onSelect={(customer) => {
                  handleSelectCustomer(customer);
                  setShowCustomerSearchModal(false);
                }}
                onSearch={searchCustomers}
                displayField="phone_number" // Display phone_number in the search input
                valueField="id"
                autoFocus={true}
                className="w-full mb-6"
                columns={[
                  { header: 'Phone Number', field: 'phone_number' }, // Updated header and field
                  { header: 'Name', field: 'name' },
                  { header: 'Address', field: 'address' },
                ]}
                initialSearchTerm={customerSearchTerm} // Pass initial search term
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCustomerSearchModal(false)}
                  className="bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
                    <ModalSearchSelect
                      label="Product Name"
                      placeholder="Select Product"
                      selectedValue={item.product}
                      onSelect={(product) => handleProductSelect(index, product)}
                      onSearch={searchProducts}
                      displayField="name"
                      valueField="id"
                      required
                      className="w-full"
                      columns={[
                        { header: 'Product Name', field: 'name' },
                        { header: 'Packing', field: 'packing' },
                        { header: 'HSN Code', field: 'hsn_code' },
                        { header: 'Price', field: 'display_price' }, // Display the calculated display_price
                      ]}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      name="packing"
                      value={item.packing || ""}
                      onChange={(e) => handleItemChange(index, e)}
                      readOnly
                      className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      name="hsn_code"
                      value={item.hsn_code || ""}
                      onChange={(e) => handleItemChange(index, e)}
                      readOnly
                      className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <ModalSearchSelect
                      key={`${item.product?.id}-${item.batch?.id || 'no-batch'}`}
                      label="Batch No"
                      placeholder="Select Batch"
                      selectedValue={item.batch}
                      onSelect={(batch) => handleBatchSelect(index, batch)}
                      onSearch={(searchTerm) => searchBatches(index, searchTerm)}
                      displayField="batch_no"
                      valueField="id"
                      required
                      className="w-full"
                      readOnly={!item.product} // Batch search only enabled if product is selected
                      columns={[
                        { header: 'Batch No', field: 'batch_number' },
                        { header: 'Expire Date', field: 'expiry_date' },
                        { header: 'Selling Price', field: 'offline_selling_price' },
                        { header: 'Stock', field: 'current_quantity' },
                      ]}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      name="expire_date"
                      value={item.expire_date || ""}
                      onChange={(e) => handleItemChange(index, e)}
                      readOnly
                      className="w-full p-1 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity || 0}
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
                      value={item.unit || ""}
                      onChange={(e) => handleItemChange(index, e)}
                      readOnly
                      className="w-20 p-1 border border-gray-300 rounded-md bg-gray-100"
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
                    ₹{(item.quantity * item.unit_price).toFixed(2)}
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
                ₹{grossAmount.toFixed(2)}
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
                ₹{taxableAmount.toFixed(2)}
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
                ₹{gstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 rounded-md px-2 mt-2">
              <span className="text-lg font-bold text-gray-800">
                Net Amount:
              </span>
              <span className="text-lg font-bold text-gray-900">
                ₹{netAmount.toFixed(2)}
              </span>
            </div>
            {/* Paid Amount Input */}
            <div className="flex justify-between items-center py-2 mt-4">
              <label htmlFor="paidAmount" className="text-lg font-bold text-gray-800">
                Paid Amount:
              </label>
              <input
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-40 p-2 border border-gray-300 rounded-md shadow-sm text-right"
              />
            </div>
            {/* Change Amount Display */}
            <div className="flex justify-between py-2">
              <span className="text-lg font-bold text-gray-800">
                Change Amount:
              </span>
              <span className="text-lg font-bold text-gray-900">
                ₹{changeAmount.toFixed(2)}
              </span>
            </div>
            {/* Pay Method Dropdown */}
            <div className="flex justify-between items-center py-2 mt-4">
              <label htmlFor="payMethod" className="text-lg font-bold text-gray-800">
                Pay Method:
              </label>
              <select
                id="payMethod"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-40 p-2 border border-gray-300 rounded-md shadow-sm text-right"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Credit">Credit</option>
              </select>
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
    const navigate = useNavigate(); // Initialize useNavigate for the main component
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showReturnForm, setShowReturnForm] = useState(false); // New state for return form
    const [showCancelModal, setShowCancelModal] = useState(false); // State for cancellation modal
    const [billToCancel, setBillToCancel] = useState(null); // Stores the bill ID to be cancelled
    const [cancellationReason, setCancellationReason] = useState(""); // State for cancellation reason
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
            const errorInfo = apiUtils.handleError(err);
            setError(errorInfo.message || "Failed to fetch sales bills.");
            console.error("Error fetching sales bills:", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        // Fetch bills when form is closed or return form is closed
        if (!showForm && !showReturnForm) {
            fetchSalesBills();
        }
    }, [showForm, showReturnForm, fetchSalesBills]);

    const handleAddNewClick = () => {
        setCurrentBill(null);
        setShowForm(true);
        setShowReturnForm(false); // Ensure return form is closed
    };

    const handleEditClick = (bill) => {
        setCurrentBill({
            ...bill,
            customer_mobile: bill.customer_mobile || "", // Keep for initialData mapping if backend still sends this
            customer_name: bill.customer_name || "",
            customer_address: bill.customer_address || "",
            bill_date: bill.bill_date || new Date().toISOString().split("T")[0],
            notes: bill.notes || "",
            items: bill.items?.map(item => ({
                ...item,
                product: item.product || undefined, // Ensure product is ID or undefined
                packing: item.packing || "",
                hsn_code: item.hsn_code || "",
                quantity: parseFloat(item.quantity) || 1,
                unit: item.unit || "pcs",
                unit_price: parseFloat(item.unit_price) || 0,
                batch_no: item.batch_no || "",
                expire_date: item.expire_date || "",
            })) || [],
        });
        setShowForm(true);
        setShowReturnForm(false); // Ensure return form is closed
    };

    const handleInitiateReturnClick = (billId) => {
        setCurrentBill({ id: billId }); // Only need the ID for the return page
        setShowReturnForm(true);
        setShowForm(false); // Ensure sales bill form is closed
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
                const errorInfo = apiUtils.handleError(err);
                setError(errorInfo.message || "Failed to delete sales bill.");
                console.error("Error deleting bill:", err);
            }
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setCurrentBill(null);
    };

    const handleBillCreated = (billId) => {
        setShowForm(false); // Close the form
        setCurrentBill(null); // Clear current bill
        navigate(`/invoice/${billId}`); // Navigate to the invoice page
    };

    const handleReturnFormComplete = () => {
        setShowReturnForm(false);
        setCurrentBill(null); // Clear current bill after return
        fetchSalesBills(); // Refresh the list of sales bills
    };

    const handleCancelBillClick = (billId) => {
        setBillToCancel(billId);
        setCancellationReason(""); // Clear any previous reason
        setShowCancelModal(true);
    };

    const confirmCancelBill = async () => {
        if (!cancellationReason.trim()) {
            alert("Cancellation reason cannot be empty.");
            return;
        }

        if (billToCancel) {
            try {
                setLoading(true);
                await salesBillAPI.cancelSalesBill(billToCancel, cancellationReason);
                alert(`Sales Bill #${billToCancel} has been successfully cancelled.`);
                setShowCancelModal(false);
                setBillToCancel(null);
                setCancellationReason("");
                fetchSalesBills(); // Refresh the list
            } catch (err) {
                const errorInfo = apiUtils.handleError(err);
                setError(errorInfo.message || "Failed to cancel sales bill.");
                console.error("Error cancelling bill:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setBillToCancel(null);
        setCancellationReason("");
    };

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {showForm ? (
                <SalesBillForm
                    onFormClose={handleFormClose}
                    initialData={currentBill}
                    onBillCreated={handleBillCreated} // Pass the new handler
                />
            ) : showReturnForm ? (
                <BillReturnPage
                    onReturnComplete={handleReturnFormComplete}
                    initialSaleId={currentBill?.id}
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
                                                    ₹{parseFloat(bill.total_amount).toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                            bill.status === "CANCELLED"
                                                                ? "bg-red-100 text-red-800"
                                                                : bill.status === "RETURNED"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : bill.status === "PARTIALLY_RETURNED"
                                                                        ? "bg-orange-100 text-orange-800"
                                                                        : bill.status === "PAID"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-yellow-100 text-yellow-800" // PENDING
                                                        }`}
                                                    >
                                                        {bill.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => navigate(`/invoice/${bill.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
                                                    >
                                                        View Invoice
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(bill)}
                                                        className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleInitiateReturnClick(bill.id)}
                                                        className="text-orange-600 hover:text-orange-800 mr-4 font-medium flex items-center"
                                                        disabled={bill.status === "CANCELLED" || bill.status === "RETURNED"} // Disable if already cancelled or fully returned
                                                    >
                                                        <RotateCcw size={16} className="mr-1" /> Return Items
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelBillClick(bill.id)}
                                                        className="text-red-600 hover:text-red-800 mr-4 font-medium flex items-center"
                                                        disabled={bill.status === "CANCELLED" || bill.status === "RETURNED"} // Disable if already cancelled or fully returned
                                                    >
                                                        <XCircle size={16} className="mr-1" /> Cancel Bill
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(bill.id)}
                                                        className="text-gray-600 hover:text-gray-800 font-medium"
                                                        disabled={bill.status !== "PENDING"} // Only allow delete if pending
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

            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Cancel Sales Bill #{billToCancel}</h2>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to cancel this sales bill? This action will reverse all stock movements for this bill.
                            Please provide a reason for cancellation.
                        </p>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows="4"
                            placeholder="Enter reason for cancellation..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            required
                        ></textarea>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={closeCancelModal}
                                className="bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 transition duration-300"
                            >
                                Close
                            </button>
                            <button
                                onClick={confirmCancelBill}
                                className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 transition duration-300"
                                disabled={!cancellationReason.trim()}
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesBillPage;
