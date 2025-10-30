import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";
import { salesBillAPI, apiUtils } from '../../api/apiService'; // Adjust path as needed
import ModalSearchSelect from '../../components/ModalSearchSelect'; // Assuming this component exists

const BillReturnPage = ({ onReturnComplete, initialSaleId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSale, setSelectedSale] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch initial sale if provided (e.g., from salesbillpage.jsx)
    useEffect(() => {
        if (initialSaleId) {
            const fetchInitialSale = async () => {
                setLoading(true);
                try {
                    const response = await salesBillAPI.getSalesBill(initialSaleId);
                    handleSelectSale(response.data);
                } catch (err) {
                    const errorInfo = apiUtils.handleError(err);
                    setError(errorInfo.message || "Failed to fetch initial sales bill.");
                } finally {
                    setLoading(false);
                }
            };
            fetchInitialSale();
        }
    }, [initialSaleId]);

    const searchSalesBills = useCallback(async (term) => {
        if (term.length > 0) {
            try {
                // Assuming getSalesBills can take a search term
                const response = await salesBillAPI.getSalesBills(1, 10, { search: term });
                return Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [];
            } catch (err) {
                console.error("Error searching sales bills:", err);
                return [];
            }
        }
        return [];
    }, []);

    const handleSelectSale = (sale) => {
        setSelectedSale(sale);
        console.log("Selected Sale Data:", sale); // Add this line for debugging
        // Initialize return items based on the selected sale's items
        setReturnItems(
            sale.items.map((item) => ({
                offline_sale_item: item.id,
                product_name: item.product_details?.name || "N/A",
                batch_number: item.batch_details?.batch_number || "N/A", // Ensure we are looking for 'batch_number'
                original_quantity: item.quantity,
                returned_quantity: 0, // Default to 0 returned
                price_per_unit: parseFloat(item.price_per_unit),
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
            quantity = originalQuantity; // Cannot return more than sold
        }

        newReturnItems[index].returned_quantity = quantity;
        newReturnItems[index].subtotal = quantity * newReturnItems[index].price_per_unit;
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

        if (!selectedSale) {
            setError("Please select a sales bill to process a return.");
            setSubmitting(false);
            return;
        }

        if (itemsToReturn.length === 0) {
            setError("Please specify at least one item to return with a quantity greater than zero.");
            setSubmitting(false);
            return;
        }

        const payload = {
            sale: selectedSale.id,
            reason: reason,
            notes: notes,
            returned_items: itemsToReturn.map(item => ({
                offline_sale_item: item.offline_sale_item,
                returned_quantity: item.returned_quantity,
                price_per_unit: item.price_per_unit,
            })),
        };

        try {
            await salesBillAPI.createBillReturn(payload);
            setSuccessMessage(`Return for Bill #${selectedSale.id} processed successfully! Total amount: ₹${totalReturnAmount.toFixed(2)}`);
            // Optionally clear form or navigate back
            setSelectedSale(null);
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

    if (loading) return <p className="text-center p-8">Loading sales bill...</p>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
            <div className="flex justify-between items-center pb-4 mb-6 border-b">
                <h1 className="text-3xl font-bold text-gray-800">Process Sales Bill Return</h1>
                <button
                    onClick={onReturnComplete}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    <ArrowLeft className="mr-2" size={20} /> Back to Sales Bills
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
                {/* Search Sales Bill */}
                <div className="mb-6">
                    <ModalSearchSelect
                        label="Search Sales Bill (by ID or Customer Name)"
                        placeholder="Enter Bill ID or Customer Name"
                        selectedValue={selectedSale}
                        onSelect={handleSelectSale}
                        onSearch={searchSalesBills}
                        displayField="id" // Display bill ID in the search input
                        valueField="id"
                        required
                        className="w-full"
                        columns={[
                            { header: 'Bill ID', field: 'id' },
                            { header: 'Customer Name', field: 'customer_name' },
                            { header: 'Total Amount', field: 'total_amount' },
                            { header: 'Sale Date', field: 'sale_date' },
                        ]}
                        renderOption={(option) => (
                            <div className="flex justify-between">
                                <span>Bill #{option.id} - {option.customer_name}</span>
                                <span className="text-gray-500">₹{parseFloat(option.total_amount).toFixed(2)}</span>
                            </div>
                        )}
                    />
                </div>

                {selectedSale && (
                    <>
                        <div className="bg-gray-50 p-4 rounded-md mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 mb-3">Selected Sales Bill Details</h2>
                            <p><strong>Bill ID:</strong> #{selectedSale.id}</p>
                            <p><strong>Customer:</strong> {selectedSale.customer_name} ({selectedSale.customer_phone})</p>
                            <p><strong>Bill Date:</strong> {new Date(selectedSale.sale_date).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> ₹{parseFloat(selectedSale.total_amount).toFixed(2)}</p>
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
                                            Original Qty
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price/Unit
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
                                        <tr key={item.offline_sale_item} className="border-b">
                                            <td className="px-2 py-2">{index + 1}</td>
                                            <td className="px-2 py-2">{item.product_name}</td>
                                            <td className="px-2 py-2">{item.batch_number}</td>
                                            <td className="px-2 py-2">{item.original_quantity}</td>
                                            <td className="px-2 py-2">₹{item.price_per_unit.toFixed(2)}</td>
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

export default BillReturnPage;
