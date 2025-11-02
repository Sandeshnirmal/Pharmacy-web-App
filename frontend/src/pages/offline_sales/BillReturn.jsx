import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BillReturn = () => {
    const [saleId, setSaleId] = useState('');
    const [offlineSale, setOfflineSale] = useState(null);
    const [returnedItems, setReturnedItems] = useState([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchOfflineSale = async () => {
        if (!saleId) return;
        setLoading(true);
        setError('');
        setOfflineSale(null);
        setReturnedItems([]);
        try {
            const response = await axios.get(`/api/offline-sales/${saleId}/`, {
                headers: {
                    Authorization: `Token YOUR_AUTH_TOKEN`, // Replace with actual token
                },
            });
            setOfflineSale(response.data);
            setReturnedItems(response.data.items.map(item => ({
                offline_sale_item: item.id,
                product_name: item.product_details.name,
                batch_number: item.batch_details ? item.batch_details.batch_number : 'N/A',
                original_quantity: item.quantity,
                returned_quantity: 0,
                price_per_unit: item.price_per_unit,
            })));
        } catch (err) {
            setError('Failed to fetch offline sale. ' + (err.response?.data?.detail || err.message));
            console.error('Error fetching offline sale:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnedQuantityChange = (index, value) => {
        const newReturnedItems = [...returnedItems];
        const originalQuantity = newReturnedItems[index].original_quantity;
        const quantity = parseInt(value);

        if (isNaN(quantity) || quantity < 0) {
            newReturnedItems[index].returned_quantity = 0;
        } else if (quantity > originalQuantity) {
            newReturnedItems[index].returned_quantity = originalQuantity;
            setError(`Returned quantity cannot exceed original sale quantity (${originalQuantity}).`);
        } else {
            newReturnedItems[index].returned_quantity = quantity;
            setError('');
        }
        setReturnedItems(newReturnedItems);
    };

    const calculateTotalReturnAmount = () => {
        return returnedItems.reduce((sum, item) => {
            return sum + (item.returned_quantity * item.price_per_unit);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const returnData = {
            sale: saleId,
            reason: reason,
            returned_items: returnedItems
                .filter(item => item.returned_quantity > 0)
                .map(item => ({
                    offline_sale_item: item.offline_sale_item,
                    returned_quantity: item.returned_quantity,
                    price_per_unit: item.price_per_unit,
                })),
        };

        if (returnData.returned_items.length === 0) {
            setError('Please specify at least one item to return with a quantity greater than 0.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/api/bill-returns/', returnData, {
                headers: {
                    Authorization: `Token YOUR_AUTH_TOKEN`, // Replace with actual token
                },
            });
            setSuccess(`Bill return processed successfully! Return ID: ${response.data.id}`);
            // Reset form
            setSaleId('');
            setOfflineSale(null);
            setReturnedItems([]);
            setReason('');
        } catch (err) {
            setError('Failed to process bill return. ' + (err.response?.data?.detail || err.message));
            console.error('Error processing bill return:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const totalReturnAmount = calculateTotalReturnAmount();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Bill Return</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{success}</div>}

            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="saleId">
                        Offline Sale ID
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="saleId"
                        type="text"
                        placeholder="Enter Sale ID"
                        value={saleId}
                        onChange={(e) => setSaleId(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={fetchOfflineSale}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Fetching...' : 'Fetch Sale Details'}
                    </button>
                </div>

                {offlineSale && (
                    <div className="mb-4 p-4 border rounded bg-gray-50">
                        <h2 className="text-xl font-bold mb-2">Sale Details (ID: {offlineSale.id})</h2>
                        <p><strong>Customer:</strong> {offlineSale.customer_name || 'Guest'} ({offlineSale.customer_phone || 'N/A'})</p>
                        <p><strong>Sale Date:</strong> {new Date(offlineSale.sale_date).toLocaleString()}</p>
                        <p><strong>Total Amount:</strong> ₹{parseFloat(offlineSale.total_amount).toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> {offlineSale.payment_method}</p>
                        <p><strong>Is Returned:</strong> {offlineSale.is_returned ? 'Yes' : 'No'}</p>
                    </div>
                )}

                {offlineSale && (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold mb-3">Items to Return</h2>
                        {returnedItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Product</label>
                                    <p className="py-2 px-3">{item.product_name}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Batch</label>
                                    <p className="py-2 px-3">{item.batch_number}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Original Qty</label>
                                    <p className="py-2 px-3">{item.original_quantity}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Return Qty</label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        type="number"
                                        value={item.returned_quantity}
                                        onChange={(e) => handleReturnedQuantityChange(index, e.target.value)}
                                        min="0"
                                        max={item.original_quantity}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Price/Unit</label>
                                    <p className="py-2 px-3">₹{parseFloat(item.price_per_unit).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Total Return Amount</label>
                            <p className="text-lg font-semibold">₹{totalReturnAmount.toFixed(2)}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
                                Reason for Return
                            </label>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="reason"
                                placeholder="Enter reason for return"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows="3"
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Processing Return...' : 'Process Return'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default BillReturn;
