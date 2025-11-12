import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { productAPI } from "../api/apiService.js"; // Import productAPI
import {
  User,
  LeafyGreen,
  Truck,
  ShieldCheck,
  Star,
} from "lucide-react";
import ProductPage from "./ProductPage.jsx"; // Keep import for TopSellerCard prop
import { ProductCard } from "../components/ProductCard.jsx"; // Import ProductCard
import { useCart } from "../context/CartContext.jsx"; // Import useCart
import { useNotification } from "../context/NotificationContext.jsx"; // Import useNotification
import logo from "../assets/hero-e.webp";
// --- Reusable Components ---

/**
 * A card component for the "Top Sellers" and "Related Products" sections
 */
export function TopSellerCard({ product }) { // Export TopSellerCard
  const navigate = useNavigate(); // Initialize useNavigate
  const { addToCart } = useCart(); // Use useCart hook
  const { addNotification } = useNotification(); // Use useNotification hook
  // Simplified background color logic for dynamic products
  const specificBgColor = "bg-gray-50";

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent card click from firing
    addToCart(product); // Pass the full product object
    addNotification(`${product.name} added to cart!`, 'success');
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)} // Use navigate for product click
    >
      <div
        className={`flex justify-center items-center h-75 ${specificBgColor}`}
      >
        <img
          src={product.image} // Use product.image directly
          alt={product.name}
          className="max-h-full max-w-full object-fill p-4"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <p className="font-bold text-xl text-gray-900 mb-4">
          {product.price && !isNaN(product.price)
            ? `₹${product.price.toFixed(2)}`
            : "N/A"}
        </p>
        <button
          className="mt-auto w-full bg-green-400 text-black font-semibold py-2 px-4 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md hover:-translate-y-0.5"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function HealthConcernCard({ concern }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/shop?category=${concern.id}`); // Use concern.id instead of concern.name
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={handleClick}
    >
      {/* <img
        src={concern.image}
        alt={concern.name}
        className="w-full h-80 object-cover"
      /> */}
      <div className="p-4 bg-blue-300">
        <h3 className="font-bold text-lg text-gray-700 mb-1">
          {concern.name}
        </h3>
        <p className="text-gray-700 text-sm">{concern.description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, description }) {
  return (
    <div className="text-center p-6 bg-white rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex justify-center mb-4">
        <Icon className="h-10 w-10 text-green-400" />
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < rating ? "text-green-400" : "text-gray-300"
          } fill-current`}
        />
      );
    }
    return <div className="flex justify-center md:justify-start">{stars}</div>;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm text-center md:text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-center md:justify-start mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
          <User className="h-6 w-6 text-gray-500" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {testimonial.name}
          </h3>
          {renderStars(testimonial.rating)}
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed">"{testimonial.quote}"</p>
    </div>
  );
}

function TimerBox({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-3 w-16 h-16">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

// --- Page Section Components ---



function Hero() {
  return (
    <header className="relative bg-gradient-to-br from-green-50 to-cyan-100 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 items-center gap-12 py-20 md:py-32">
        <div className="relative z-10 space-y-8 text-center md:text-left">
          <div className="space-y-4">
            <span className="inline-block bg-green-200 text-green-800 text-sm font-semibold px-4 py-1 rounded-full">
              Your Trusted Online Pharmacy
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tighter leading-tight">
              Your Need,
              <br />
              <span className="text-green-500">Delivered Fast.</span>
            </h1>
          </div>
          <p className="text-lg text-gray-700 max-w-md mx-auto md:mx-0">
            Experience the future of pharmacy. Get your medications, vitamins,
            and health essentials delivered to your doorstep, hassle-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              to="/shop"
              className="inline-block bg-green-500 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg transform transition-all duration-300 hover:bg-green-600 hover:scale-105 hover:shadow-xl"
            >
              Shop Now
            </Link>
            <Link
              to="/about"
              className="inline-block bg-gray-200 text-gray-800 font-bold py-4 px-10 rounded-full text-lg shadow-md transform transition-all duration-300 hover:bg-gray-300 hover:scale-105 hover:shadow-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
        <div className="relative h-80 md:h-auto">
          <div className="absolute -top-16 -right-16 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-16 -left-16 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="relative z-10">
            <img
              src={logo}
              alt="A pharmacist handing a prescription to a customer"
              className="w-full h-full object-cover rounded-3xl shadow-2xl transform transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function ShopByHealthConcern({ healthConcerns }) {
  return (
    <section className="py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          Shop by Health Concern
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {healthConcerns.map((concern) => (
            <HealthConcernCard key={concern.name} concern={concern} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DealOfTheDay({ product, onProductClick }) {
  const initialTime = 8 * 3600 + 26 * 60 + 42;
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (num) => num.toString().padStart(2, "0");

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          Deal of the Day
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center">
          <div className="flex justify-center items-center bg-orange-50 rounded-lg p-8">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-80 object-contain"
            />
          </div>
          <div className="flex flex-col space-y-5">
            <h3 className="text-4xl font-bold text-gray-900">{product.name}</h3>
            <p className="text-gray-600 text-lg">
              {product.fullDescription.substring(0, 100)}...
            </p>
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl font-extrabold text-green-500">
                {product.online_selling_price && !isNaN(parseFloat(product.online_selling_price))
                  ? `₹${parseFloat(product.online_selling_price).toFixed(2)}`
                  : "N/A"}
              </span>
              <span className="text-2xl text-gray-500 line-through">
                {product.online_mrp_price && !isNaN(parseFloat(product.online_mrp_price))
                  ? `₹${parseFloat(product.online_mrp_price).toFixed(2)}`
                  : "N/A"}
              </span>
              {product.online_discount_percentage && parseFloat(product.online_discount_percentage) > 0 && (
                <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                  {parseFloat(product.online_discount_percentage).toFixed(0)}% OFF
                </span>
              )}
            </div>
            <div>
              <p className="text-gray-700 font-semibold mb-3">Offer ends in:</p>
              <div className="flex space-x-3">
                <TimerBox value={pad(hours)} label="Hours" />
                <TimerBox value={pad(minutes)} label="Mins" />
                <TimerBox value={pad(seconds)} label="Secs" />
              </div>
            </div>
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </section>
  );
}

function AddToCartButton({ product }) {
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const handleAddToCart = () => {
    addToCart(product); // Pass the full product object
    addNotification(`${product.name} added to cart!`, 'success');
  };
  return (
    <button
      className="w-full bg-green-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5"
      onClick={handleAddToCart}
    >
      Claim Deal Now
    </button>
  );
}

function TopSellers({ topSellers }) {
  return (
    <section className="bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          Top Sellers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedBrands({ featuredBrands }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          Featured Brands
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-5">
          {featuredBrands.map((brand) => (
            <div
              key={brand.name}
              className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center h-28 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="max-h-16 w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <BenefitCard
            icon={LeafyGreen}
            title="Licensed Pharmacists"
            description="Expert advice you can trust for all your health questions."
          />
          <BenefitCard
            icon={Truck}
            title="Fast & Discreet Delivery"
            description="Your health essentials delivered right to your door, securely."
          />
          <BenefitCard
            icon={ShieldCheck}
            title="Secure Payments"
            description="Your privacy and security are our top priority."
          />
        </div>
      </div>
    </section>
  );
}

function CustomerTestimonials({ testimonials }) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real stories from our valued customers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}


// --- Homepage Component ---
function HomePage({ healthConcerns, topSellers, dealOfTheDayProduct, loading, error, testimonials, featuredBrands }) {
  if (loading) {
    return <div className="text-center py-16">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  return (
    <>
      <Hero />
      <ShopByHealthConcern healthConcerns={healthConcerns} />
      {dealOfTheDayProduct && (
        <DealOfTheDay
          product={dealOfTheDayProduct}
        />
      )}
      <TopSellers topSellers={topSellers} />
      <FeaturedBrands featuredBrands={featuredBrands} />
      <BenefitsSection />
      <CustomerTestimonials testimonials={testimonials} />
    </>
  );
}

// --- Product Page Components Removed ---
// All product page components (Breadcrumbs, ProductGallery, etc.)
// have been moved to src/ProductPage.jsx

/**
 * The main Home component that fetches and displays homepage content.
 */
function Home() {
  const [healthConcerns, setHealthConcerns] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [dealOfTheDayProduct, setDealOfTheDayProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Mock Data (for now, will be replaced later if APIs are available) ---
  const testimonials = [
    {
      id: 1,
      name: "Sarah J.",
      rating: 5,
      quote:
        "PharmaCare is a lifesaver! Ordering my prescriptions is so easy and the delivery is incredibly fast. I don't know what I'd do without it.",
    },
    {
      id: 2,
      name: "Mark T.",
      rating: 5,
      quote:
        "The customer service is top-notch. I had a question about a medication and a licensed pharmacist got back to me within the hour. Highly recommend!",
    },
    {
      id: 3,
      name: "Emily R.",
      rating: 5,
      quote:
        "I love being able to shop for vitamins and skincare all in one place. The selection is great and the prices are very competitive.",
    },
  ];

  const featuredBrands = [
    {
      name: "BrandA",
      logoUrl: "https://placehold.co/200x100/f0f9ff/0c4a6e?text=Brand+A",
    },
    {
      name: "BrandB",
      logoUrl: "https://placehold.co/200x100/fef2f2/991b1b?text=Brand+B",
    },
    {
      name: "BrandC",
      logoUrl: "https://placehold.co/200x100/f7fee7/3f6212?text=Brand+C",
    },
    {
      name: "BrandD",
      logoUrl: "https://placehold.co/200x100/fffbeb/b45309?text=Brand+D",
    },
    {
      name: "BrandE",
      logoUrl: "https://placehold.co/200x100/f5f3ff/5b21b6?text=Brand+E",
    },
    {
      name: "BrandF",
      logoUrl: "https://placehold.co/200x100/fdf2f8/9d174d?text=Brand+F",
    },
  ];

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        // Fetch categories (health concerns)
        const categoriesResponse = await productAPI.getCategories();
        const formattedConcerns = categoriesResponse.data.map(cat => ({
          id: cat.id, // Include the category ID
          name: cat.name,
          description: cat.description || "Explore products in this category",
          image: cat.image || "https://via.placeholder.com/300x200?text=No+Image+Available", // Updated Placeholder
        }));
        setHealthConcerns(formattedConcerns);

        // Fetch products (top sellers)
        const productsResponse = await productAPI.getProducts(1, 8); // Fetch first 8 products
        const products = productsResponse.data
          .filter(p => p.current_batch !== null) // Filter out products with null current_batch
          .map(p => ({
            id: p.id,
            category: p.category_name,
            name: p.name,
            description: p.description,
            online_mrp_price: p.current_batch.online_mrp_price,
            online_discount_percentage: p.current_batch.online_discount_percentage,
            online_selling_price: p.current_batch.online_selling_price,
            image: p.image || "https://via.placeholder.com/300x200?text=No+Image+Available", // Directly use p.image
            fullDescription: p.description,
            usage: p.usage_instructions,
            ingredients: p.ingredients,
            reviews: [], // Assuming reviews are not directly in product API for now
          }));
        setTopSellers(products);

        // Set deal of the day (e.g., the second product fetched)
        if (products.length > 1) {
          setDealOfTheDayProduct(products[1]);
        } else if (products.length > 0) {
          setDealOfTheDayProduct(products[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products and categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, []);

  // handleProductClick and handleNavigateHome are no longer needed here
  // as ProductPage will be a separate route.

  return (
    <div className="font-sans text-gray-800">
      <main>
        <HomePage
          healthConcerns={healthConcerns}
          topSellers={topSellers}
          dealOfTheDayProduct={dealOfTheDayProduct}
          loading={loading}
          error={error}
          testimonials={testimonials}
          featuredBrands={featuredBrands}
        />
      </main>
    </div>
  );
}

export default Home;
