import axios from 'axios';
import React, { useState, useEffect } from 'react';

const StoreSaleManagement = () => {
    const [sales, setSales] = useState([]);
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [newSale, setNewSale] = useState({ store: '', product: '', quantity_sold: 0, sale_price: 0 });
    const [editingSale, setEditingSale] = useState(null);

    useEffect(() => {
        fetchSales();
        fetchStores();
        fetchProducts();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await axios.get('/api/store-sales/');
            setSales(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get('/api/stores/');
            setStores(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products/'); // Assuming a product API endpoint
            setProducts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingSale) {
            setEditingSale({ ...editingSale, [name]: value });
        } else {
            setNewSale({ ...newSale, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSale) {
                await axios.put(`/api/store-sales/${editingSale.id}/`, editingSale);
                setEditingSale(null);
            } else {
                await axios.post('/api/store-sales/', newSale);
                setNewSale({ store: '', product: '', quantity_sold: 0, sale_price: 0 });
            }
            fetchSales();
        } catch (error) {
            console.error('Error saving sale:', error);
        }
    };

    const handleEdit = (sale) => {
        setEditingSale({ ...sale });
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/store-sales/${id}/`);
            fetchSales();
        } catch (error) {
            console.error('Error deleting sale:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Store Sale Management</h1>

            <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded shadow-sm">
                <h2 className="text-xl font-semibold mb-4">{editingSale ? 'Edit Sale' : 'Add New Sale'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Store:</label>
                        <select
                            name="store"
                            value={editingSale ? editingSale.store : newSale.store}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        >
                            <option value="">Select Store</option>
                            {stores.map((store) => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Product:</label>
                        <select
                            name="product"
                            value={editingSale ? editingSale.product : newSale.product}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Quantity Sold:</label>
                        <input
                            type="number"
                            name="quantity_sold"
                            value={editingSale ? editingSale.quantity_sold : newSale.quantity_sold}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Sale Price:</label>
                        <input
                            type="number"
                            name="sale_price"
                            value={editingSale ? editingSale.sale_price : newSale.sale_price}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            step="0.01"
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    {editingSale ? 'Update Sale' : 'Add Sale'}
                </button>
                {editingSale && (
                    <button
                        type="button"
                        onClick={() => setEditingSale(null)}
                        className="mt-4 ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Cancel
                    </button>
                )}
            </form>

            <h2 className="text-xl font-semibold mb-4">Existing Sales</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded shadow-sm">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Store</th>
                            <th className="py-2 px-4 border-b">Product</th>
                            <th className="py-2 px-4 border-b">Quantity Sold</th>
                            <th className="py-2 px-4 border-b">Sale Price</th>
                            <th className="py-2 px-4 border-b">Sale Date</th>
                            <th className="py-2 px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => (
                            <tr key={sale.id}>
                                <td className="py-2 px-4 border-b">{sale.store_name}</td>
                                <td className="py-2 px-4 border-b">{sale.product_name}</td>
                                <td className="py-2 px-4 border-b">{sale.quantity_sold}</td>
                                <td className="py-2 px-4 border-b">{sale.sale_price}</td>
                                <td className="py-2 px-4 border-b">{new Date(sale.sale_date).toLocaleString()}</td>
                                <td className="py-2 px-4 border-b">
                                    <button
                                        onClick={() => handleEdit(sale)}
                                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sale.id)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StoreSaleManagement;
