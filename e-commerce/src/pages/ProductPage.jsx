import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Import useParams, useNavigate, Link
import { productAPI } from "../api/apiService.js"; // Import productAPI
import {
  Star,
  ChevronRight,
  Plus,
  Minus,
  User,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { useCart } from "../context/CartContext.jsx"; // Import useCart
import { useNotification } from "../context/NotificationContext.jsx"; // Import useNotification
// import TopSellerCard from './ProductCard.jsx'; // No longer imported

// --- Reusable Star Rating Component ---
const RenderStars = ({ rating }) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        } fill-current`}
      />
    );
  }
  return <div className="flex">{stars}</div>;
};

// --- Product Page Components ---

function Breadcrumbs({ product }) { // Removed onNavigateHome
  return (
    <nav className="flex items-center text-sm text-gray-600">
      <Link to="/" className="hover:text-green-500"> {/* Use Link to navigate home */}
        Home
      </Link>
      <ChevronRight className="h-4 w-4 mx-1" />
      <span className="hover:text-green-500"> {/* Changed to span as it's not a direct link */}
        Shop
      </span>
      <ChevronRight className="h-4 w-4 mx-1" />
      <span className="hover:text-green-500"> {/* Changed to span as it's not a direct link */}
        {product.category}
      </span>
      <ChevronRight className="h-4 w-4 mx-1" />
      <span className="font-medium text-gray-800">{product.name}</span>
    </nav>
  );
}

function ProductGallery({ images }) {
  const [activeImage, setActiveImage] = useState(images[0]);

  // Reset active image when the product's images change
  useEffect(() => {
    setActiveImage(images[0]);
  }, [images]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden flex items-center justify-center h-96">
        <img
          src={activeImage}
          alt="Main product"
          className="max-h-full max-w-full object-contain p-4"
        />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {images.map((img, index) => (
          <div
            key={index}
            className={`bg-gray-50 rounded-md flex items-center justify-center p-2 cursor-pointer transition-all ${
              activeImage === img
                ? "ring-2 ring-green-500"
                : "hover:ring-2 ring-gray-200"
            }`}
            onClick={() => setActiveImage(img)}
          >
            <img
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className="h-20 w-20 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductInfo({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
  };

  return (
    <div className="flex flex-col space-y-5">
      <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full self-start">
        {product.category}
      </span>
      <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
      {product.generic_name_display && (
        <p className="text-lg text-gray-600">
          Generic Name: <span className="font-semibold">{product.generic_name_display}</span>
        </p>
      )}
      <div className="flex items-baseline space-x-3">
        <p className="text-4xl font-extrabold text-gray-900">{product.price}</p>
        {product.discount_percentage > 0 && (
          <>
            <span className="text-2xl text-gray-500 line-through">{product.mrp_price}</span>
            <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
              {product.discount_percentage}% OFF
            </span>
          </>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center space-x-3">
        <span className="font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-full">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2 text-gray-600 hover:text-black transition-colors"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="px-5 text-lg font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="p-2 text-gray-600 hover:text-black transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="flex-1 bg-green-400 text-black font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md hover:-translate-y-0.5"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
        <button className="flex-1 bg-gray-800 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:bg-black hover:shadow-md hover:-translate-y-0.5">
          Buy Now
        </button>
      </div>
    </div>
  );
}

/**
 * Updated ReviewCard to match the new design
 */
function ReviewCard({ review }) {
  return (
    <div className="py-6 border-b border-gray-200">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
          <User className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{review.name}</h4>
          <p className="text-sm text-gray-500">{review.date}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <RenderStars rating={review.rating} />
        <span className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          Verified Purchase
        </span>
      </div>

      <h5 className="font-bold text-lg text-gray-900 mb-2">{review.title}</h5>
      <p className="text-gray-700">{review.quote}</p>
    </div>
  );
}

/**
 * Updated ProductTabs to include new review summary
 */
function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState("description");

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`py-3 px-5 font-medium transition-all ${
        activeTab === id
          ? "border-b-2 border-green-500 text-green-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );

  // Calculate average rating
  const avgRating =
    product.reviews.length > 0
      ? (
          product.reviews.reduce((acc, r) => acc + r.rating, 0) /
          product.reviews.length
        ).toFixed(1)
      : 0;

  return (
    <div className="mt-16">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-6">
          <TabButton id="description" label="Description" />
          <TabButton id="usage" label="Usage & Dosage" />
          <TabButton id="ingredients" label="Ingredients" />
          {product.composition_summary && product.composition_summary.length > 0 && (
            <TabButton id="compositions" label="Compositions" />
          )}
          <TabButton
            id="reviews"
            label={`Reviews (${product.reviews.length})`}
          />
        </nav>
      </div>
      <div className="py-8">
        {activeTab === "description" && (
          <div className="prose max-w-none">
            <p>{product.fullDescription}</p>
          </div>
        )}
        {activeTab === "usage" && (
          <div className="prose max-w-none">
            <p>{product.usage}</p>
          </div>
        )}
        {activeTab === "ingredients" && product.ingredients && (
          <div className="prose max-w-none">
            <ul className="list-disc pl-5">
              {product.ingredients.split(", ").map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === "ingredients" && !product.ingredients && (
          <div className="prose max-w-none">
            <p>No ingredients information available.</p>
          </div>
        )}
        {activeTab === "compositions" && product.composition_summary && product.composition_summary.length > 0 && (
          <div className="prose max-w-none">
            <ul className="list-disc pl-5">
              {product.composition_summary.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === "reviews" && (
          <div>
            {/* Review Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Customer Reviews
                </h3>
                <div className="flex items-center gap-2">
                  <RenderStars rating={avgRating} />
                  <span className="text-lg font-semibold text-gray-800">
                    {avgRating} out of 5
                  </span>
                  <span className="text-gray-600">
                    ({product.reviews.length} reviews)
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-48">
                  <select className="w-full appearance-none border border-gray-300 rounded-full py-2 px-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option>Sort by: Newest</option>
                    <option>Sort by: Highest Rating</option>
                    <option>Sort by: Lowest Rating</option>
                  </select>
                  <ChevronDown className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button className="w-full md:w-auto bg-green-400 text-black font-semibold py-2 px-5 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md">
                  Write a review
                </button>
              </div>
            </div>

            {/* Review List */}
            {product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RelatedProducts({
  topSellers,
  currentProductId,
  TopSellerCard,
}) {
  // Receive TopSellerCard as a prop
  // Show other top sellers, excluding the current product
  const related = topSellers
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4);

  return (
    <section className="bg-gray-50 -mx-4 -mb-8 px-4 py-16">
      <div className="max-w-screen-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          You Might Also Like
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((product) => (
            <TopSellerCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPage({ TopSellerCard }) { // Only accept TopSellerCard
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate(); // Initialize navigate for potential redirects
  const [product, setProduct] = useState(null);
  const [topSellers, setTopSellers] = useState([]); // State for related products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        const productResponse = await productAPI.getProduct(id);
        const fetchedProduct = {
          id: productResponse.data.id,
          category: productResponse.data.category_name,
          name: productResponse.data.name,
          description: productResponse.data.description,
          price: parseFloat(productResponse.data.current_batch.online_selling_price), // Store price as number
          mrp_price: `₹${parseFloat(productResponse.data.current_batch.online_mrp_price).toFixed(2)}`,
          discount_percentage: parseFloat(productResponse.data.current_batch.online_discount_percentage),
          images: productResponse.data.images && productResponse.data.images.length > 0 ? productResponse.data.images.map(img => img.image_url) : ["https://via.placeholder.com/400x300?text=No+Image"],
          fullDescription: productResponse.data.description,
          usage: productResponse.data.usage_instructions,
          ingredients: productResponse.data.ingredients,
          generic_name_display: productResponse.data.generic_name_display,
          composition_summary: productResponse.data.composition_summary,
          reviews: [], // Assuming reviews are not directly in product API for now
        };
        setProduct(fetchedProduct);

        // Fetch top sellers for related products
        const productsResponse = await productAPI.getProducts(1, 8);
        const products = productsResponse.data.map(p => ({
          id: p.id,
          category: p.category_name,
          name: p.name,
          description: p.description,
          price: parseFloat(p.current_batch.online_selling_price), // Store price as number
          mrp_price: `₹${parseFloat(p.current_batch.online_mrp_price).toFixed(2)}`,
          discount_percentage: parseFloat(p.current_batch.online_discount_percentage),
          images: p.images && p.images.length > 0 ? [p.images[0].image_url] : ["https://via.placeholder.com/300x200?text=No+Image+Available"],
          fullDescription: p.description,
          usage: p.usage_instructions,
          ingredients: p.ingredients,
          reviews: [],
        }));
        setTopSellers(products);

        window.scrollTo(0, 0); // Scroll to top after fetching
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductAndRelated();
    }
  }, [id]); // Re-fetch when ID changes

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-8 text-center">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-8 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-8 text-center">
        <p>Product not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <Breadcrumbs product={product} />
      <div className="grid md:grid-cols-2 gap-12 mt-6">
        <ProductGallery images={product.images} />
        <ProductInfo product={product} />
      </div>
      <ProductTabs product={product} />
      <RelatedProducts
        topSellers={topSellers}
        currentProductId={product.id}
        TopSellerCard={TopSellerCard} // Pass the component down
      />
    </div>
  );
}

export default ProductPage;
