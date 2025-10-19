import React, { useState } from 'react';
import axios from 'axios';

const InvoiceViewer = () => {
    const [saleId, setSaleId] = useState('');
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchInvoice = async () => {
        if (!saleId) return;
        setLoading(true);
        setError('');
        setInvoiceData(null);
        try {
            const response = await axios.get(`/api/offline-sales/${saleId}/generate-invoice/`, {
                headers: {
                    Authorization: `Token YOUR_AUTH_TOKEN`, // Replace with actual token
                },
            });
            setInvoiceData(response.data);
        } catch (err) {
            setError('Failed to fetch invoice. ' + (err.response?.data?.detail || err.message));
            console.error('Error fetching invoice:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Invoice Viewer</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

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
                        onClick={fetchInvoice}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Fetching Invoice...' : 'Fetch Invoice'}
                    </button>
                </div>

                {invoiceData && (
                    <div className="invoice-preview p-6 border rounded bg-gray-50">
                        <h2 className="text-xl font-bold mb-4 text-center">Invoice for Sale #{invoiceData.sale_id}</h2>
                        <div className="mb-4">
                            <p><strong>Customer Name:</strong> {invoiceData.customer_name || 'Guest'}</p>
                            <p><strong>Customer Phone:</strong> {invoiceData.customer_phone || 'N/A'}</p>
                            <p><strong>Sale Date:</strong> {new Date(invoiceData.sale_date).toLocaleString()}</p>
                            <p><strong>Payment Method:</strong> {invoiceData.payment_method}</p>
                        </div>

                        <h3 className="text-lg font-bold mb-2">Items:</h3>
                        <table className="min-w-full bg-white mb-4">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b">Product</th>
                                    <th className="py-2 px-4 border-b">Batch</th>
                                    <th className="py-2 px-4 border-b">Quantity</th>
                                    <th className="py-2 px-4 border-b">Price/Unit</th>
                                    <th className="py-2 px-4 border-b">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-2 px-4 border-b">{item.product_name}</td>
                                        <td className="py-2 px-4 border-b">{item.batch_number || 'N/A'}</td>
                                        <td className="py-2 px-4 border-b">{item.quantity}</td>
                                        <td className="py-2 px-4 border-b">₹{parseFloat(item.price_per_unit).toFixed(2)}</td>
                                        <td className="py-2 px-4 border-b">₹{parseFloat(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="text-right text-lg font-bold mb-4">
                            <p>Total Amount: ₹{parseFloat(invoiceData.total_amount).toFixed(2)}</p>
                            <p>Paid Amount: ₹{parseFloat(invoiceData.paid_amount).toFixed(2)}</p>
                            <p>Change Amount: ₹{parseFloat(invoiceData.change_amount).toFixed(2)}</p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Print Invoice
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceViewer;
