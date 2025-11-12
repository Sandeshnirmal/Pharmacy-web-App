import React, { memo, useState, useEffect, useRef } from "react"; // Import memo, useState, useEffect, useRef
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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    addNotification(`${product.name} added to cart!`, 'success');
  };

  const [imageSrc, setImageSrc] = useState('');
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(product.image);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '0px 0px 100px 0px', // Load when 100px from viewport
        }
      );
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [product.image]);

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border border-gray-200"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div
        className={`flex justify-center items-center h-64 bg-gray-50 p-4`}
      >
        <img
          ref={imgRef}
          src={imageSrc || 'placeholder.png'} // Use a placeholder or a low-res image
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy" // Native lazy loading as a fallback/enhancement
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg text-gray-800 mb-2 truncate">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 flex-grow">
          {product.description}
        </p>
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline space-x-2">
            <p className="font-bold text-2xl text-green-600">
              {product.online_selling_price && !isNaN(parseFloat(product.online_selling_price))
                ? `₹${parseFloat(product.online_selling_price).toFixed(2)}`
                : "N/A"}
            </p>
            {product.online_discount_percentage > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {product.online_mrp_price && !isNaN(parseFloat(product.online_mrp_price))
                  ? `₹${parseFloat(product.online_mrp_price).toFixed(2)}`
                  : ""}
              </span>
            )}
          </div>
          {product.online_discount_percentage > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
              {parseFloat(product.online_discount_percentage).toFixed(0)}% OFF
            </span>
          )}
        </div>
        <button
          className="mt-auto w-full bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
});
