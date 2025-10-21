import React, { useState, useEffect } from 'react';
import { productAPI, salesBillAPI } from '../../api/apiService'; // Adjust path as needed

const OfflineSalesBilling = () => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paidAmount, setPaidAmount] = useState(0);
    const [items, setItems] = useState([{ productId: '', batchId: '', quantity: 1, pricePerUnit: 0 }]);
    const [products, setProducts] = useState([]);
    const [batches, setBatches] = useState({}); // {productId: [batches]}
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productAPI.getProducts();
                setProducts(Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setError('Failed to fetch products.');
                console.error('Error fetching products:', err);
            }
        };
        fetchProducts();
    }, []);

    const fetchBatches = async (productId) => {
        try {
            const response = await productAPI.getBatches(productId);
            setBatches(prev => ({ ...prev, [productId]: Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : [] }));
        } catch (err) {
            setError('Failed to fetch batches.');
            console.error('Error fetching batches:', err);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'productId' && value) {
            fetchBatches(value);
            newItems[index]['batchId'] = ''; // Reset batch when product changes
            const selectedProduct = products.find(p => p.id === parseInt(value));
            if (selectedProduct) {
                newItems[index]['pricePerUnit'] = selectedProduct.current_selling_price;
            }
        }

        if (field === 'quantity' || field === 'pricePerUnit') {
            newItems[index]['subtotal'] = newItems[index]['quantity'] * newItems[index]['pricePerUnit'];
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { productId: '', batchId: '', quantity: 1, pricePerUnit: 0 }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const calculateTotalAmount = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const saleData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            payment_method: paymentMethod,
            paid_amount: paidAmount,
            items: items.map(item => ({
                product: item.productId,
                batch: item.batchId,
                quantity: item.quantity,
                price_per_unit: item.pricePerUnit,
            })),
        };

        try {
            const response = await salesBillAPI.createSalesBill(saleData);
            setSuccess(`Sale created successfully! Sale ID: ${response.data.id}`);
            // Reset form
            setCustomerName('');
            setCustomerPhone('');
            setPaymentMethod('Cash');
            setPaidAmount(0);
            setItems([{ productId: '', batchId: '', quantity: 1, pricePerUnit: 0 }]);
        } catch (err) {
            setError('Failed to create sale. ' + (err.response?.data?.detail || err.message));
            console.error('Error creating sale:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = calculateTotalAmount();
    const changeAmount = paidAmount - totalAmount;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Offline Sales Billing</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{success}</div>}

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerName">
                        Customer Name
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="customerName"
                        type="text"
                        placeholder="Customer Name (Optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerPhone">
                        Customer Phone
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="customerPhone"
                        type="text"
                        placeholder="Customer Phone (Optional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                </div>

                <h2 className="text-xl font-bold mb-3">Items</h2>
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Product</label>
                            <select
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={item.productId}
                                onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                required
                            >
                                <option value="">Select Product</option>
                                {Array.isArray(products) && products.map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Batch</label>
                            <select
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={item.batchId}
                                onChange={(e) => handleItemChange(index, 'batchId', e.target.value)}
                                required
                                disabled={!item.productId || !Array.isArray(batches[item.productId]) || batches[item.productId].length === 0}
                            >
                                <option value="">Select Batch</option>
                                {Array.isArray(batches[item.productId]) && batches[item.productId].map(batch => (
                                    <option key={batch.id} value={batch.id}>{batch.batch_number} (Qty: {batch.current_quantity})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Price/Unit</label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number"
                                value={item.pricePerUnit}
                                onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value))}
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addItem}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
                >
                    Add Item
                </button>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Total Amount</label>
                    <p className="text-lg font-semibold">₹{totalAmount.toFixed(2)}</p>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
                        Payment Method
                    </label>
                    <select
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                    >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paidAmount">
                        Paid Amount
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="paidAmount"
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value))}
                        step="0.01"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Change Amount</label>
                    <p className="text-lg font-semibold">₹{changeAmount.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Process Sale'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OfflineSalesBilling;
