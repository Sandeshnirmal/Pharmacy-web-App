import React, { useState, useEffect } from 'react';
import { apiUtils, productAPI, discountAPI } from '../api/apiService';

const DiscountAddEditModal = ({ show, onClose, onSaveSuccess, initialData, products, categories }) => {
    const [formData, setFormData] = useState({
        name: "",
        percentage: "",
        description: "",
        target_type: "product",
        target_id: null,
        start_date: "",
        end_date: "",
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedDiscountType, setSelectedDiscountType] = useState("product");
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [categorySearchTerm, setCategorySearchTerm] = useState("");
    const [productSearchResults, setProductSearchResults] = useState([]);
    const [categorySearchResults, setCategorySearchResults] = useState([]);
    const [selectedProductName, setSelectedProductName] = useState("");
    const [selectedCategoryName, setSelectedCategoryName] = useState("");

    useEffect(() => {
        if (show) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    percentage: initialData.percentage || "",
                    description: initialData.description || "",
                    target_type: initialData.target_type || "product",
                    target_id: initialData.target_id || null,
                    start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
                    end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
                    is_active: initialData.is_active !== undefined ? initialData.is_active : true,
                });
                setSelectedDiscountType(initialData.target_type || "product");
                // Set initial search terms/selected names for editing
                if (initialData.target_type === "product" && initialData.product) {
                    setSelectedProductName(products.find(p => p.id === initialData.product)?.name || "");
                } else {
                    setSelectedProductName("");
                }
                if (initialData.target_type === "category" && initialData.category) {
                    setSelectedCategoryName(categories.find(c => c.id === initialData.category)?.name || "");
                } else {
                    setSelectedCategoryName("");
                }
            } else {
                // Reset form for new entry
                setFormData({
                    name: "",
                    percentage: "",
                    description: "",
                    target_type: "product",
                    target_id: null,
                    start_date: "",
                    end_date: "",
                    is_active: true,
                });
                setSelectedDiscountType("product");
                setSelectedProductName("");
                setSelectedCategoryName("");
            }
            setProductSearchTerm("");
            setCategorySearchTerm("");
            setProductSearchResults([]);
            setCategorySearchResults([]);
            setError('');
        }
    }, [show, initialData, products, categories]); // Added products, categories to dependencies

    // Debounce product search
    useEffect(() => {
        if (selectedDiscountType === "product" && productSearchTerm) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const response = await productAPI.getProducts(1, 10, { search: productSearchTerm });
                    setProductSearchResults(response.data.results || response.data || []);
                } catch (err) {
                    console.error("Error searching products:", err);
                    setProductSearchResults([]);
                }
            }, 500); // 500ms debounce
            return () => clearTimeout(delayDebounceFn);
        } else {
            setProductSearchResults([]);
        }
    }, [productSearchTerm, selectedDiscountType]);

    // Filter categories locally (assuming categories list is small)
    useEffect(() => {
        if (selectedDiscountType === "category" && categorySearchTerm) {
            const filtered = categories.filter(cat =>
                cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
            );
            setCategorySearchResults(filtered);
        } else {
            setCategorySearchResults([]);
        }
    }, [categorySearchTerm, selectedDiscountType, categories]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleTargetTypeChange = (type) => {
        setSelectedDiscountType(type);
        setFormData(prev => ({
            ...prev,
            target_type: type,
            target_id: null, // Reset target_id when type changes
        }));
        setSelectedProductName("");
        setSelectedCategoryName("");
        setProductSearchTerm("");
        setCategorySearchTerm("");
        setProductSearchResults([]);
        setCategorySearchResults([]);
    };

    const handleProductSearchChange = (e) => {
        setProductSearchTerm(e.target.value);
        setFormData(prev => ({ ...prev, target_id: null })); // Clear selected product when searching
        setSelectedProductName("");
    };

    const handleCategorySearchChange = (e) => {
        setCategorySearchTerm(e.target.value);
        setFormData(prev => ({ ...prev, target_id: null })); // Clear selected category when searching
        setSelectedCategoryName("");
    };

    const handleProductSelect = (product) => {
        setFormData(prev => ({ ...prev, target_id: product.id }));
        setSelectedProductName(product.name);
        setProductSearchTerm(""); // Clear search term after selection
        setProductSearchResults([]); // Clear results
    };

    const handleCategorySelect = (category) => {
        setFormData(prev => ({ ...prev, target_id: category.id }));
        setSelectedCategoryName(category.name);
        setCategorySearchTerm(""); // Clear search term after selection
        setCategorySearchResults([]); // Clear results
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const payload = {
            ...formData,
            percentage: parseFloat(formData.percentage),
            target_id: formData.target_id ? parseInt(formData.target_id) : null,
        };

        try {
            if (initialData) {
                await discountAPI.updateDiscount(initialData.id, payload);
            } else {
                await discountAPI.createDiscount(payload);
            }
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving discount:', err.response?.data || err);
            setError('Failed to save discount. ' + (err.response?.data?.detail || err.message || 'Please check your inputs.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full m-4">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {initialData ? 'Edit Discount' : 'Add New Discount'}
                </h2>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <label className="block text-sm font-medium text-gray-700">Discount Type:</label>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="productDiscountModal"
                                name="discountTypeModal"
                                value="product"
                                checked={selectedDiscountType === "product"}
                                onChange={() => handleTargetTypeChange("product")}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="productDiscountModal" className="ml-2 block text-sm text-gray-900">
                                Product-wise Discount
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="categoryDiscountModal"
                                name="discountTypeModal"
                                value="category"
                                checked={selectedDiscountType === "category"}
                                onChange={() => handleTargetTypeChange("category")}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="categoryDiscountModal" className="ml-2 block text-sm text-gray-900">
                                Category-wise Discount
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Discount Name</label>
                            <input
                                type="text"
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Percentage (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                                name="percentage"
                                value={formData.percentage}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* Is Active Checkbox */}
                        <div className="md:col-span-2 flex items-center">
                            <input
                                type="checkbox"
                                id="is_active_modal"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_active_modal" className="ml-2 block text-sm font-medium text-gray-700">Is Active</label>
                        </div>

                        {selectedDiscountType === "product" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Search Product</label>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={selectedProductName || productSearchTerm}
                                    onChange={handleProductSearchChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                {productSearchResults.length > 0 && productSearchTerm && (
                                    <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-60 overflow-y-auto rounded-md shadow-lg mt-1">
                                        {productSearchResults.map((product) => (
                                            <li
                                                key={product.id}
                                                onClick={() => handleProductSelect(product)}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                            >
                                                {product.name} ({product.strength})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {formData.target_id && selectedProductName && !productSearchTerm && (
                                    <p className="mt-1 text-sm text-gray-600">Selected: {selectedProductName}</p>
                                )}
                                {!formData.target_id && !productSearchTerm && (
                                    <p className="mt-1 text-sm text-red-500">Please select a product.</p>
                                )}
                            </div>
                        )}

                        {selectedDiscountType === "category" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Search Category</label>
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={selectedCategoryName || categorySearchTerm}
                                    onChange={handleCategorySearchChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                {categorySearchResults.length > 0 && categorySearchTerm && (
                                    <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-60 overflow-y-auto rounded-md shadow-lg mt-1">
                                        {categorySearchResults.map((category) => (
                                            <li
                                                key={category.id}
                                                onClick={() => handleCategorySelect(category)}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                            >
                                                {category.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {formData.target_id && selectedCategoryName && !categorySearchTerm && (
                                    <p className="mt-1 text-sm text-gray-600">Selected: {selectedCategoryName}</p>
                                )}
                                {!formData.target_id && !categorySearchTerm && (
                                    <p className="mt-1 text-sm text-red-500">Please select a category.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !formData.target_id}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Discount'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DiscountAddEditModal;
