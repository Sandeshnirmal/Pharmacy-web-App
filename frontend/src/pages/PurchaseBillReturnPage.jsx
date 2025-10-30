import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";
import { inventoryAPI, apiUtils } from '../api/apiService';
import ModalSearchSelect from '../components/ModalSearchSelect';

const PurchaseBillReturnPage = ({ onReturnComplete, initialPurchaseOrderId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch initial purchase order if provided
    useEffect(() => {
        if (initialPurchaseOrderId) {
            const fetchInitialPurchaseOrder = async () => {
                setLoading(true);
                try {
                    const response = await inventoryAPI.getPurchaseOrder(initialPurchaseOrderId);
                    handleSelectPurchaseOrder(response.data);
                } catch (err) {
                    const errorInfo = apiUtils.handleError(err);
                    setError(errorInfo.message || "Failed to fetch initial purchase order.");
                } finally {
                    setLoading(false);
                }
            };
            fetchInitialPurchaseOrder();
        }
    }, [initialPurchaseOrderId]);

    const searchPurchaseOrders = useCallback(async (term) => {
        if (term.length > 0) {
            try {
                const response = await inventoryAPI.getPurchaseOrders(1, 10, { search: term });
                return Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [];
            } catch (err) {
                console.error("Error searching purchase orders:", err);
                return [];
            }
        }
        return [];
    }, []);

    const handleSelectPurchaseOrder = (order) => {
        setSelectedPurchaseOrder(order);
        console.log("Selected Purchase Order Data:", order);
        // Initialize return items based on the selected purchase order's items
        setReturnItems(
            order.items.map((item) => ({
                purchase_order_item: item.id,
                product_name: item.product_details?.name || "N/A",
                batch_number: item.batch_number || "N/A",
                original_quantity: item.quantity - item.returned_quantity, // Quantity available to return
                returned_quantity: 0, // Default to 0 returned
                unit_price: parseFloat(item.unit_price),
                subtotal: 0,
            }))
        );
        setError(null);
        setSuccessMessage(null);
    };

    const handleReturnQuantityChange = (index, value) => {
        const newReturnItems = [...returnItems];
        const originalQuantity = newReturnItems[index].original_quantity;
        let quantity = parseInt(value, 10);

        if (isNaN(quantity) || quantity < 0) {
            quantity = 0;
        }
        if (quantity > originalQuantity) {
            quantity = originalQuantity; // Cannot return more than available
        }

        newReturnItems[index].returned_quantity = quantity;
        newReturnItems[index].subtotal = quantity * newReturnItems[index].unit_price;
        setReturnItems(newReturnItems);
    };

    const totalReturnAmount = useMemo(() => {
        return returnItems.reduce((total, item) => total + item.subtotal, 0);
    }, [returnItems]);

    const itemsToReturn = useMemo(() => {
        return returnItems.filter(item => item.returned_quantity > 0);
    }, [returnItems]);

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        if (!selectedPurchaseOrder) {
            setError("Please select a purchase order to process a return.");
            setSubmitting(false);
            return;
        }

        if (itemsToReturn.length === 0) {
            setError("Please specify at least one item to return with a quantity greater than zero.");
            setSubmitting(false);
            return;
        }

        const payload = {
            purchase_order: selectedPurchaseOrder.id,
            reason: reason,
            notes: notes,
            items: itemsToReturn.map(item => {
                const product_id = selectedPurchaseOrder.items.find(poItem => poItem.id === item.purchase_order_item)?.product_details?.id;
                console.log(`Returning item: purchase_order_item=${item.purchase_order_item}, product_id=${product_id}, quantity=${item.returned_quantity}, unit_price=${item.unit_price}`);
                return {
                    purchase_order_item: item.purchase_order_item,
                    product: product_id, // Get product ID
                    quantity: item.returned_quantity,
                    unit_price: item.unit_price,
                };
            }),
        };

        try {
            console.log("Submitting return payload:", payload);
            // Use the return_items action on the PurchaseOrderViewSet
            await inventoryAPI.returnPurchaseOrderItems(selectedPurchaseOrder.id, payload);
            setSuccessMessage(`Return for Purchase Order #${selectedPurchaseOrder.id} processed successfully! Total amount: ₹${totalReturnAmount.toFixed(2)}`);
            // Optionally clear form or navigate back
            setSelectedPurchaseOrder(null);
            setReturnItems([]);
            setReason("");
            setNotes("");
            if (onReturnComplete) {
                onReturnComplete(); // Notify parent component to refresh data
            }
        } catch (err) {
            const errorInfo = apiUtils.handleError(err);
            setError(errorInfo.message || "Failed to process the return. Please check your inputs.");
            console.error("Return submission error:", err.response?.data || err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="text-center p-8">Loading purchase order...</p>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
            <div className="flex justify-between items-center pb-4 mb-6 border-b">
                <h1 className="text-3xl font-bold text-gray-800">Process Purchase Bill Return</h1>
                <button
                    onClick={onReturnComplete}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    <ArrowLeft className="mr-2" size={20} /> Back to Purchase Orders
                </button>
            </div>

            {successMessage && (
                <div className="flex items-center bg-green-100 text-green-800 p-3 rounded-md mb-4">
                    <CheckCircle className="mr-2" size={20} />
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmitReturn}>
                {/* Search Purchase Order */}
                <div className="mb-6">
                    <ModalSearchSelect
                        label="Search Purchase Order (by ID or Supplier Name)"
                        placeholder="Enter Order ID or Supplier Name"
                        selectedValue={selectedPurchaseOrder}
                        onSelect={handleSelectPurchaseOrder}
                        onSearch={searchPurchaseOrders}
                        displayField="invoice_number" // Display invoice number in the search input
                        valueField="id"
                        required
                        className="w-full"
                        columns={[
                            { header: 'Order ID', field: 'id' },
                            { header: 'Invoice No', field: 'invoice_number' },
                            { header: 'Supplier Name', field: 'supplier_name' },
                            { header: 'Total Amount', field: 'total_amount' },
                            { header: 'Order Date', field: 'order_date' },
                        ]}
                        renderOption={(option) => (
                            <div className="flex justify-between">
                                <span>PO #{option.id} - {option.supplier_name}</span>
                                <span className="text-gray-500">₹{parseFloat(option.total_amount).toFixed(2)}</span>
                            </div>
                        )}
                    />
                </div>

                {selectedPurchaseOrder && (
                    <>
                        <div className="bg-gray-50 p-4 rounded-md mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 mb-3">Selected Purchase Order Details</h2>
                            <p><strong>Order ID:</strong> #{selectedPurchaseOrder.id}</p>
                            <p><strong>Invoice No:</strong> {selectedPurchaseOrder.invoice_number || 'N/A'}</p>
                            <p><strong>Supplier:</strong> {selectedPurchaseOrder.supplier_name}</p>
                            <p><strong>Order Date:</strong> {new Date(selectedPurchaseOrder.order_date).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> ₹{parseFloat(selectedPurchaseOrder.total_amount).toFixed(2)}</p>
                            <p><strong>Status:</strong> {selectedPurchaseOrder.status}</p>
                        </div>

                        {/* Return Items Table */}
                        <div className="overflow-x-auto mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 mb-3">Items to Return</h2>
                            <table className="min-w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sl. No
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Batch No
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Purchased Qty
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Returned Qty (Prev)
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Available to Return
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Return Qty
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnItems.map((item, index) => (
                                        <tr key={item.purchase_order_item} className="border-b">
                                            <td className="px-2 py-2">{index + 1}</td>
                                            <td className="px-2 py-2">{item.product_name}</td>
                                            <td className="px-2 py-2">{item.batch_number}</td>
                                            <td className="px-2 py-2">{selectedPurchaseOrder.items.find(poItem => poItem.id === item.purchase_order_item)?.quantity}</td>
                                            <td className="px-2 py-2">{selectedPurchaseOrder.items.find(poItem => poItem.id === item.purchase_order_item)?.returned_quantity}</td>
                                            <td className="px-2 py-2 font-medium text-gray-800">{item.original_quantity}</td>
                                            <td className="px-2 py-2">₹{item.unit_price.toFixed(2)}</td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    value={item.returned_quantity}
                                                    onChange={(e) => handleReturnQuantityChange(index, e.target.value)}
                                                    min="0"
                                                    max={item.original_quantity}
                                                    className="w-24 p-1 border border-gray-300 rounded-md"
                                                />
                                            </td>
                                            <td className="px-2 py-2 font-medium text-gray-800">
                                                ₹{item.subtotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Return Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                                    Reason for Return <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows="3"
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                    Additional Notes
                                </label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="3"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                ></textarea>
                            </div>
                        </div>

                        {/* Total Return Amount */}
                        <div className="flex justify-end mt-4">
                            <div className="w-full md:w-80 bg-gray-100 p-4 rounded-md">
                                <div className="flex justify-between py-2">
                                    <span className="text-lg font-bold text-gray-800">
                                        Total Return Amount:
                                    </span>
                                    <span className="text-lg font-bold text-gray-900">
                                        ₹{totalReturnAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end items-center mt-8 pt-6 border-t space-x-3">
                            <button
                                type="button"
                                onClick={onReturnComplete}
                                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || itemsToReturn.length === 0}
                                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-red-300"
                            >
                                {submitting ? "Processing Return..." : "Process Return"}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default PurchaseBillReturnPage;
