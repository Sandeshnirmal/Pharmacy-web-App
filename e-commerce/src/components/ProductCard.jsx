import React, { memo } from "react"; // Import memo
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

/**
 * A card component for the "Top Sellers" section on the Home page.
 * Uses online_selling_price and online_mrp_price directly from the product object.
 */
export const ProductCard = memo(({ product }) => { // Wrap in memo
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const specificBgColor = "bg-gray-50";

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    addNotification(`${product.name} added to cart!`, 'success');
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div
        className={`flex justify-center items-center h-75 ${specificBgColor}`}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="max-h-full max-w-full object-fill p-4"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex items-baseline space-x-2 mb-4">
          <p className="font-bold text-xl text-gray-900">
            {product.online_selling_price && !isNaN(parseFloat(product.online_selling_price))
              ? `₹${parseFloat(product.online_selling_price).toFixed(2)}`
              : "N/A"}
          </p>
          {product.online_discount_percentage > 0 && (
            <>
              <span className="text-sm text-gray-500 line-through">
                {product.online_mrp_price && !isNaN(parseFloat(product.online_mrp_price))
                  ? `₹${parseFloat(product.online_mrp_price).toFixed(2)}`
                  : ""}
              </span>
              <span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">
                {parseFloat(product.online_discount_percentage).toFixed(0)}% OFF
              </span>
            </>
          )}
        </div>
        <button
          className="mt-auto w-full bg-green-400 text-black font-semibold py-2 px-4 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md hover:-translate-y-0.5"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}); // Close memo wrapper
