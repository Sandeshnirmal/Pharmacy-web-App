import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlusCircle, Search } from "lucide-react";

// --- Mock API Service ---
// In a real application, this would be in its own apiService.js file.
const mockSuppliers = [
  { id: 1, name: "Supplier A" },
  { id: 2, name: "Supplier B" },
  { id: 3, name: "Supplier C" },
];

const mockPurchaseOrders = [
  {
    id: 101,
    supplier: 1,
    supplier_name: "Supplier A",
    order_date: "2025-10-15",
    total_amount: "150.00",
    status: "COMPLETED",
    items: [
      {
        id: 1,
        product: 1,
        product_name: "Product A",
        quantity: 10,
        unit_price: 10.0,
      },
      {
        id: 2,
        product: 2,
        product_name: "Product B",
        quantity: 5,
        unit_price: 10.0,
      },
    ],
  },
  {
    id: 102,
    supplier: 2,
    supplier_name: "Supplier B",
    order_date: "2025-10-16",
    total_amount: "200.50",
    status: "COMPLETED",
    items: [
      {
        id: 3,
        product: 3,
        product_name: "Product C",
        quantity: 20,
        unit_price: 5.0,
      },
      {
        id: 4,
        product: 4,
        product_name: "Product D",
        quantity: 1,
        unit_price: 100.5,
      },
    ],
  },
  {
    id: 103,
    supplier: 1,
    supplier_name: "Supplier A",
    order_date: "2025-10-17",
    total_amount: "300.00",
    status: "COMPLETED",
    items: [
      {
        id: 5,
        product: 5,
        product_name: "Product E",
        quantity: 30,
        unit_price: 10.0,
      },
    ],
  },
];

let mockPurchaseReturns = [
  {
    id: 1,
    purchase_order_id: 101,
    supplier_name: "Supplier A",
    return_date: "2025-10-18",
    total_amount: "50.00",
    reason: "Damaged Goods",
    status: "PROCESSED",
    items: [
      {
        product_id: 2,
        quantity: 5,
        unit_price: 10.0,
        product_name: "Product B",
      },
    ],
  },
  {
    id: 2,
    purchase_order_id: 102,
    supplier_name: "Supplier B",
    return_date: "2025-10-19",
    total_amount: "100.50",
    reason: "Wrong Item Shipped",
    status: "PENDING",
    items: [
      {
        product_id: 4,
        quantity: 1,
        unit_price: 100.5,
        product_name: "Product D",
      },
    ],
  },
];

const inventoryAPI = {
  getPurchaseReturns: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: mockPurchaseReturns }), 500)
    ),
  getPurchaseOrder: (id) =>
    new Promise((resolve) => {
      const order = mockPurchaseOrders.find(
        (po) => String(po.id) === String(id)
      );
      setTimeout(() => resolve({ data: order }), 500);
    }),
  returnPurchaseOrderItems: (id, items) =>
    new Promise((resolve) => {
      const newReturn = {
        id: Math.max(...mockPurchaseReturns.map((pr) => pr.id)) + 1,
        purchase_order_id: id,
        ...items,
      };
      mockPurchaseReturns.push(newReturn);
      setTimeout(
        () => resolve({ data: { message: "Return successful" } }),
        500
      );
    }),
  updatePurchaseReturn: (id, data) =>
    new Promise((resolve) => {
      let updatedReturn;
      mockPurchaseReturns = mockPurchaseReturns.map((pr) => {
        if (pr.id === id) {
          updatedReturn = { ...pr, ...data };
          return updatedReturn;
        }
        return pr;
      });
      setTimeout(() => resolve({ data: updatedReturn }), 500);
    }),
  getPurchaseOrders: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: mockPurchaseOrders }), 500)
    ),
};
// --- End Mock API Service ---

// --- PurchaseReturnCreateForm Component ---
const PurchaseReturnCreateForm = ({ onFormClose, initialData }) => {
  const isEditMode = !!initialData?.return_date; // It's an existing return if it has a return_date

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("Damaged Goods");
  const [notes, setNotes] = useState("");
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [supplierName, setSupplierName] = useState("");

  useEffect(() => {
    if (isEditMode) {
      // Editing an existing return
      setTitle(`Edit Return for PO #${initialData.purchase_order_id}`);
      setSupplierName(initialData.supplier_name);
      setReturnDate(initialData.return_date);
      setReason(initialData.reason);
      setNotes(initialData.notes || "");
      // For editing, we list the items that were returned.
      const returnedItems = initialData.items.map((item) => ({
        id: item.product_id, // Use product_id for key
        product_name: item.product_name,
        is_returning: true, // They are already returned
        return_quantity: item.quantity,
        unit_price: item.unit_price,
        quantity: item.quantity, // Original returned qty
      }));
      setItemsToReturn(returnedItems);
    } else if (initialData) {
      // Creating a new return from a PO
      setTitle(`Create Return for PO #${initialData.id}`);
      setSupplierName(initialData.supplier_name);
      const itemsWithReturnState = initialData.items.map((item) => ({
        ...item,
        return_quantity: 0,
        is_returning: false,
      }));
      setItemsToReturn(itemsWithReturnState);
    }
  }, [initialData, isEditMode]);

  const handleItemChange = (itemId, field, value) => {
    setItemsToReturn((prevItems) =>
      prevItems.map((item) => {
        const idKey = isEditMode ? "id" : "id";
        if (item[idKey] === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "return_quantity") {
            updatedItem.return_quantity = Math.min(
              Math.max(0, parseInt(value) || 0),
              item.quantity
            );
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const totalReturnAmount = useMemo(() => {
    return itemsToReturn.reduce((total, item) => {
      if (item.is_returning) {
        return total + item.return_quantity * item.unit_price;
      }
      return total;
    }, 0);
  }, [itemsToReturn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const returnedItemsPayload = itemsToReturn
      .filter((item) => item.is_returning && item.return_quantity > 0)
      .map((item) => ({
        product_id: isEditMode ? item.id : item.product,
        product_name: item.product_name,
        quantity: item.return_quantity,
        unit_price: item.unit_price,
      }));

    const returnPayload = {
      return_date: returnDate,
      reason: reason,
      notes: notes,
      supplier_name: supplierName,
      total_amount: totalReturnAmount.toFixed(2),
      items: returnedItemsPayload,
    };

    if (returnPayload.items.length === 0) {
      setError(
        "Please select at least one item to return with a quantity greater than zero."
      );
      setSubmitting(false);
      return;
    }

    try {
      if (isEditMode) {
        await inventoryAPI.updatePurchaseReturn(initialData.id, returnPayload);
      } else {
        await inventoryAPI.returnPurchaseOrderItems(
          initialData.id,
          returnPayload
        );
      }
      onFormClose();
    } catch (err) {
      setError(
        `Failed to ${isEditMode ? "update" : "submit"} purchase return.`
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialData)
    return (
      <div className="text-center p-8">
        Select a Purchase Order to create a return.
      </div>
    );

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier
            </label>
            <input
              type="text"
              readOnly
              value={supplierName}
              className="mt-1 block w-full p-2 bg-gray-100 border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="returnDate"
              className="block text-sm font-medium text-gray-700"
            >
              Return Date
            </label>
            <input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
              className="mt-1 block w-full p-2 border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700"
            >
              Reason for Return
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="mt-1 block w-full p-2 border-gray-300 rounded-md"
            >
              <option>Damaged Goods</option>
              <option>Wrong Item Shipped</option>
              <option>Overstock</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Items to Return</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Return?</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Max Qty</th>
                  <th className="px-4 py-2 text-left">Return Qty</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {itemsToReturn.map((item) => (
                  <tr key={isEditMode ? item.id : item.id}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={item.is_returning}
                        onChange={(e) =>
                          handleItemChange(
                            isEditMode ? item.id : item.id,
                            "is_returning",
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.return_quantity}
                        onChange={(e) =>
                          handleItemChange(
                            isEditMode ? item.id : item.id,
                            "return_quantity",
                            e.target.value
                          )
                        }
                        className="w-20 p-1 border rounded"
                        disabled={!item.is_returning}
                      />
                    </td>
                    <td className="px-4 py-2">₹{item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      ₹{(item.return_quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="mt-1 block w-full md:w-96 p-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              Total Return Amount: ₹{totalReturnAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onFormClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-indigo-300"
          >
            {submitting
              ? "Submitting..."
              : isEditMode
              ? "Update Return"
              : "Submit Return"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main PurchaseBillReturn Component ---
const PurchaseBillReturn = () => {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [dataForForm, setDataForForm] = useState(null); // Can be a PO or a Return
  const [poForReturn, setPoForReturn] = useState("");

  const fetchPurchaseReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [returnsResponse, poResponse] = await Promise.all([
        inventoryAPI.getPurchaseReturns(),
        inventoryAPI.getPurchaseOrders(),
      ]);
      setPurchaseReturns(returnsResponse.data);
      setAllPurchaseOrders(poResponse.data);
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showForm) fetchPurchaseReturns();
  }, [showForm, fetchPurchaseReturns]);

  const handleCreateNewClick = async () => {
    if (!poForReturn) {
      alert("Please select a Purchase Order to create a return.");
      return;
    }
    const selectedPO = allPurchaseOrders.find(
      (po) => String(po.id) === String(poForReturn)
    );
    setDataForForm(selectedPO);
    setShowForm(true);
  };

  const handleEditClick = (purchaseReturn) => {
    setDataForForm(purchaseReturn);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setDataForForm(null);
    setPoForReturn("");
  };

  const filteredReturns = purchaseReturns.filter(
    (pr) =>
      pr.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(pr.purchase_order_id).includes(searchTerm)
  );

  if (showForm) {
    return (
      <PurchaseReturnCreateForm
        onFormClose={handleFormClose}
        initialData={dataForForm}
      />
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Purchase Bill Returns
          </h1>
          <div className="flex items-center gap-2">
            <select
              value={poForReturn}
              onChange={(e) => setPoForReturn(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select PO to Return</option>
              {allPurchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  PO #{po.id} - {po.supplier_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateNewClick}
              className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-indigo-700"
            >
              <PlusCircle className="mr-2" size={20} />
              Create New Return
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by supplier or PO ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Return ID</th>
                  <th className="py-3 px-4 text-left">PO ID</th>
                  <th className="py-3 px-4 text-left">Supplier</th>
                  <th className="py-3 px-4 text-left">Return Date</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Reason</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length > 0 ? (
                  filteredReturns.map((pr) => (
                    <tr key={pr.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">#{pr.id}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/purchase-bill/inventory-upload?poId=${pr.purchase_order_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          #{pr.purchase_order_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{pr.supplier_name}</td>
                      <td className="py-3 px-4">{pr.return_date}</td>
                      <td className="py-3 px-4">
                        ₹{parseFloat(pr.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">{pr.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            pr.status === "PROCESSED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditClick(pr)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No purchase returns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseBillReturn;
