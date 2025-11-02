import React, { useState } from 'react';
import { salesBillAPI, apiUtils } from '../../api/apiService'; // Adjust path as needed

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
            const response = await salesBillAPI.generateInvoice(saleId); // Use the API service
            // Assuming generateInvoice returns a PDF blob
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            setInvoiceData(fileURL); // Store the URL to the PDF
        } catch (err) {
            const errorInfo = apiUtils.handleError(err);
            setError(errorInfo.message || 'Failed to fetch invoice.');
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
                        <h2 className="text-xl font-bold mb-4 text-center">Invoice Preview</h2>
                        <iframe src={invoiceData} width="100%" height="600px" title="Invoice Preview" className="mb-4 border rounded"></iframe>
                        <div className="flex justify-end">
                            <a
                                href={invoiceData}
                                download={`invoice_${saleId}.pdf`}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Download Invoice
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceViewer;
