import React, { useState, useEffect } from 'react';

const ProductSearchPopup = ({ products, onSelectProduct, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredProducts(
                products.filter(product =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const handleProductClick = (product) => {
        onSelectProduct(product);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-bold mb-4">Search Products</h3>
                <input
                    type="text"
                    placeholder="Search by product name or SKU..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="max-h-80 overflow-y-auto mb-4">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className="p-2 border-b cursor-pointer hover:bg-gray-100"
                                onClick={() => handleProductClick(product)}
                            >
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-gray-600">SKU: {product.sku} | Price: ₹{product.current_selling_price}</p>
                            </div>
                        ))
                    ) : (
                        <p>No products found.</p>
                    )}
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductSearchPopup;
