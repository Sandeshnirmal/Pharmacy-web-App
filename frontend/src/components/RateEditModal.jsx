import React, { useState, useEffect } from 'react';
import { productAPI } from '../api/apiService'; // Adjust path as needed

const RateEditModal = ({ show, onClose, onSaveSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        product: '',
        batch_number: '',
        manufacturing_date: '',
        expiry_date: '',
        quantity: 0,
        current_quantity: 0,
        cost_price: 0,
        online_mrp_price: 0,
        online_discount_percentage: 0,
        offline_mrp_price: 0,
        offline_discount_percentage: 0,
        is_primary: false,
        mfg_license_number: '',
    });
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productAPI.getProducts();
                setProducts(Array.isArray(response.data.results) ? response.data.results : []);
            } catch (err) {
                console.error('Error fetching products for modal:', err);
                setError('Failed to load products.');
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (show && initialData) {
            setFormData({
                product: initialData.product,
                batch_number: initialData.batch_number || '',
                manufacturing_date: initialData.manufacturing_date ? new Date(initialData.manufacturing_date).toISOString().split('T')[0] : '',
                expiry_date: initialData.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '',
                quantity: initialData.quantity || 0,
                current_quantity: initialData.current_quantity || 0,
                cost_price: initialData.cost_price || 0,
                online_mrp_price: initialData.online_mrp_price || 0,
                online_discount_percentage: initialData.online_discount_percentage || 0,
                offline_mrp_price: initialData.offline_mrp_price || 0,
                offline_discount_percentage: initialData.offline_discount_percentage || 0,
                is_primary: initialData.is_primary || false,
                mfg_license_number: initialData.mfg_license_number || '',
            });
        } else if (show && !initialData) {
            // Reset form for new entry, pre-filling product if available from initialData prop
            setFormData({
                product: initialData?.product || '', // Pre-fill product if available
                batch_number: '',
                manufacturing_date: '',
                expiry_date: '',
                quantity: 0,
                current_quantity: 0,
                cost_price: 0,
                online_mrp_price: 0,
                online_discount_percentage: 0,
                offline_mrp_price: 0,
                offline_discount_percentage: 0,
                is_primary: false,
                mfg_license_number: '',
            });
        }
    }, [show, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const payload = {
            ...formData,
            product: parseInt(formData.product), // Ensure product ID is integer
            // Backend calculates selling prices, so no need to send them
            selling_price: undefined,
            online_selling_price: undefined,
            offline_selling_price: undefined,
            mrp_price: undefined, // Remove generic MRP from payload
            discount_percentage: undefined, // Remove generic discount from payload
        };

        try {
            if (initialData) {
                await productAPI.updateBatch(initialData.id, payload);
            } else {
                await productAPI.addBatch(payload);
            }
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving batch:', err.response?.data || err);
            setError('Failed to save batch. ' + (err.response?.data?.detail || err.message || 'Please check your inputs.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full m-4">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {initialData ? 'Edit Batch Rates' : 'Add New Batch Rates'}
                </h2>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Selection */}
                    <div>
                        <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product <span className="text-red-500">*</span></label>
                        <select
                            id="product"
                            name="product"
                            value={formData.product}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            required
                            disabled={!!initialData} // Disable product selection when editing
                        >
                            <option value="">Select Product</option>
                            {loadingProducts ? (
                                <option>Loading products...</option>
                            ) : (
                                products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Batch Number */}
                    <div>
                        <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700">Batch Number <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="batch_number"
                            name="batch_number"
                            value={formData.batch_number}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>

                    {/* Manufacturing Date */}
                    <div>
                        <label htmlFor="manufacturing_date" className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
                        <input
                            type="date"
                            id="manufacturing_date"
                            name="manufacturing_date"
                            value={formData.manufacturing_date}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">Expiry Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="expiry_date"
                            name="expiry_date"
                            value={formData.expiry_date}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>

                    {/* Quantity */}
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            required
                        />
                    </div>

                    {/* Current Quantity (can be same as quantity on add, editable on edit) */}
                    <div>
                        <label htmlFor="current_quantity" className="block text-sm font-medium text-gray-700">Current Quantity <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            id="current_quantity"
                            name="current_quantity"
                            value={formData.current_quantity}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            required
                        />
                    </div>

                    {/* Cost Price */}
                    <div>
                        <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">Cost Price <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            id="cost_price"
                            name="cost_price"
                            value={formData.cost_price}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Online MRP Price */}
                    <div>
                        <label htmlFor="online_mrp_price" className="block text-sm font-medium text-gray-700">Online MRP Price <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            id="online_mrp_price"
                            name="online_mrp_price"
                            value={formData.online_mrp_price}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Online Discount Percentage */}
                    <div>
                        <label htmlFor="online_discount_percentage" className="block text-sm font-medium text-gray-700">Online Discount (%)</label>
                        <input
                            type="number"
                            id="online_discount_percentage"
                            name="online_discount_percentage"
                            value={formData.online_discount_percentage}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            max="100"
                            step="0.01"
                        />
                    </div>

                    {/* Offline MRP Price */}
                    <div>
                        <label htmlFor="offline_mrp_price" className="block text-sm font-medium text-gray-700">Offline MRP Price <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            id="offline_mrp_price"
                            name="offline_mrp_price"
                            value={formData.offline_mrp_price}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Offline Discount Percentage */}
                    <div>
                        <label htmlFor="offline_discount_percentage" className="block text-sm font-medium text-gray-700">Offline Discount (%)</label>
                        <input
                            type="number"
                            id="offline_discount_percentage"
                            name="offline_discount_percentage"
                            value={formData.offline_discount_percentage}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            min="0"
                            max="100"
                            step="0.01"
                        />
                    </div>

                    {/* Is Primary */}
                    <div className="md:col-span-2 flex items-center">
                        <input
                            type="checkbox"
                            id="is_primary"
                            name="is_primary"
                            checked={formData.is_primary}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_primary" className="ml-2 block text-sm font-medium text-gray-700">Is Primary Batch</label>
                    </div>

                    {/* Manufacturing License Number */}
                    <div className="md:col-span-2">
                        <label htmlFor="mfg_license_number" className="block text-sm font-medium text-gray-700">Manufacturing License Number</label>
                        <input
                            type="text"
                            id="mfg_license_number"
                            name="mfg_license_number"
                            value={formData.mfg_license_number}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-2 flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || loadingProducts}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Rates'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RateEditModal;
