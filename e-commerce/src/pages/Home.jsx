import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// Make sure you have lucide-react installed: npm install lucide-react
import {
  Search,
  ShoppingCart,
  User,
  Facebook,
  Twitter,
  Instagram,
  LeafyGreen,
  Truck,
  ShieldCheck,
  Star,
} from "lucide-react";

// Import the new components
// import TopSellerCard from './ProductCard.jsx'; // No longer imported
import ProductPage from "./ProductPage.jsx";

// --- Mock Data ---
const healthConcerns = [
  {
    name: "Cold & Flu",
    description: "Relief from common ailments",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAG3TBLNdHJn8g_mjSsU_KeFskgS8XuJooavxUJEnm3JzeAAY4vU6aWODOiHNHMWWglrSJ0A0YY1Y7cC_VOhClWiKjP0kubAzhdDqH7tPZVByIHj000sMuaTgGozrih3uuCoA_6eDAulUs4-J3CNazbWXzZLv0yjCb633e-6JjDy6_2lBuetm52X1KwTQIJQa-FN1H7v7uTmlUahMkdBfEK29y9eaVeLV67_q0Z1wbDUKhdZAI5X5QM6V-qX37TBF97w9s8m4L4L_2n", // Example image
  },
  {
    name: "Vitamins",
    description: "Boost your daily wellness",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAI8SOMmFPQsh0SLXrfCyY82sWWTkEZ6-XdqL6xtmsBbaBztx9tHiO92VBHIKOjYx-7XdlJtUM16BHsA28HeK0E2mQnVHKQoJw2EwTpI2TVvoh5h5ywdfFoMMVGmrGhM3y00k7ZBT1L-ougx61Y0AcMToKbVDM7-Mz4ZN2aemRhPoVLTLKI0849XFEeKeIbmhKpQ27OoFP9cmsQmOcYa-oFTs00SLfq8_Eb3fZTwfV880xQahPBwTuBCmRUgK5YH12V6nVey8Ihzz-b", // Example image
  },
  {
    name: "Skin Care",
    description: "Nourish and protect your skin",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtWjQtqvW4VwTh-n1AltLLfXxnrZnM-kcKD_9odqNjn8X3J-yFNn9SezxPSi_nasBYWQeGoBFFDSAoQD1NptQ5mxXnRo_baB6q1xjNX697YTm2tNMMZazeB_V69G5xItIXjbzDvJfiw7O5ABNd77RmWA56_1ZjMrLqwqtcV2CcjBbEPu3oJku9f_mR5C8H5QCXIo251r6hrSN9CvRo5EEAY0nc6wX15YghIDqQBJrCyPFdm_wFUBoJaoiPdIuHpZb0r5cAFG7p8_Kq", // Example image
  },
  {
    name: "Pain Relief",
    description: "Manage pain effectively",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBP05JW9ijOvRMQcLlTUKW3DdML_vVJOQDknn51XyArUNF7U_6dlVKNzb3xG7hAJo5SkhBNhtHorG4BuPBwkAfl0ALE8NQ87Pl90k3C_dN6HTXwmkUKA0hbaQNy4atHSz4K5wO8jpsi7y8dHvTmL-B722whFZN9w4vmrtuYVt-dD4V4sVT5VlOavhnNnwNpX_PiW1M8KUnFZrzsT0vLWn-5gTlh484JWBw7HaXEBXBQZm_bE_56n5A-FF5w6ZEL1nRtKDJds_t8wutV", // Example image
  },
];

const topSellers = [
  {
    id: 1,
    category: "Pain Relief",
    name: "Ibuprofen 200mg",
    description: "50 Coated Caplets",
    price: "$8.49",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnMXVAKOwFMSAz8-MGMCxBL7ylq7frdgIx-GKEY5exlBkG8EsTIin8KlCQa6FX1SLJddLgl9zxceNVab7WnL348CXomKKYEHuXybduTBjAJBh3mgbJRNzQsSllLzba11Hz8YdLSFEsiaSFUsAoH_oHoNn2FDShMXBp-fulNCmQPzB1D32xQYZhAhBdljgu8FXHdvr_e9O4ZJX2_xVvut5L-Dmuit4vDO86RHO0N2MvzVO9Kc19whmjk1tanpdDnp8stWwGcdjv4uBx",
    ],
    fullDescription:
      "Ibuprofen 200mg provides effective relief from pain and fever. These coated caplets are easy to swallow and tough on pain, helping you get back to your day.",
    usage:
      "Adults and children 12 years and over: take 1 caplet every 4 to 6 hours while symptoms persist. If pain or fever does not respond to 1 caplet, 2 caplets may be used. Do not exceed 6 caplets in 24 hours, unless directed by a doctor.",
    ingredients:
      "Active Ingredient (in each caplet): Ibuprofen 200mg (NSAID). Inactive Ingredients: colloidal silicon dioxide, corn starch, croscarmellose sodium, hypromellose, iron oxide red, iron oxide yellow, microcrystalline cellulose, polyethylene glycol, polysorbate 80, stearic acid, titanium dioxide.",
    reviews: [
      {
        id: 1,
        name: "Jane D.",
        rating: 5,
        title: "Works fast!",
        quote:
          "Works fast on my headaches without any stomach upset. My go-to for pain relief.",
        date: "October 28, 2025",
      },
      {
        id: 2,
        name: "John S.",
        rating: 4,
        title: "Good value",
        quote: "Good value and effective. The caplets are easy to swallow.",
        date: "October 25, 2025",
      },
    ],
  },
  {
    id: 2,
    category: "Vitamins",
    name: "Daily Multivitamin",
    description: "90 Tablets",
    price: "$19.99",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBwh3XJJBuNAigqPL27QJe4umyljjKwPPT2R7Uk5r--R0XwB-MWUECAcgbTSnKxWFXTs_YNNJe576105R0W7R3kwpxahuEDsNvbQxhq38g-qoz5nGS-OIumZ3yttQMHfDxEmVlRNnjyCLN7UfepLYOtyaOaj2uRxBx9ZdlDDYrTHw8VqjnTAoq6tNUxghkITS90e9yUgeSwiCGrMwn0iu1kmLOjdZb0ecjNe0NootkakNzAP7itJp17jlYX2nMelcTAqzn0B6zDb2ZD",
    ],
    fullDescription:
      "A complete multivitamin with key nutrients to support energy, immunity, metabolism, and overall health. Contains 90 tablets for a 3-month supply.",
    usage:
      "Adults: Take one (1) tablet daily with food. Not formulated for use in children.",
    ingredients:
      "Vitamin A, Vitamin C, Vitamin D3, Vitamin E, Vitamin K, Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Biotin, Pantothenic Acid, Calcium, Iron, Phosphorus, Iodine, Magnesium, Zinc, Selenium, Copper, Manganese, Chromium, Molybdenum, Chloride, Potassium.",
    reviews: [
      {
        id: 1,
        name: "Sarah J.",
        rating: 5,
        title: "Feel more energetic",
        quote:
          "I feel more energetic since starting these. Great all-in-one vitamin.",
        date: "October 22, 2025",
      },
    ],
  },
  {
    id: 3,
    category: "Skin Care",
    name: "Vitamin C Serum",
    description: "1 fl oz / 30 ml",
    price: "$24.50",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCmfMSGZMAvhD4ZuwWedkF4Iccaku3zvwkuC5yGJTp-6fun13tvKm2QWFP_6PdiCC2qFpPUdgC6yJEIYjuaUYmfY0AbtV69CTM9C4cJvsc6V0-MT4-1S2jWb_phRr2mldKnWBtAqycgyos2qxQeQvaINy6SshEfaiR7ny_qa8DWdMuIlFC_zF8lGYSJ6zwDBbwhMYxbOT7dniTZiqeF9bE5JXSqNbpZTS3sWwKmqTGckmOgEBpLMAoJz3ml8ZXAU1NsHDmpttpWp8GR",
    ],
    fullDescription:
      "Brightening and anti-aging serum with Vitamin C, Hyaluronic Acid, and Vitamin E. Helps fade dark spots and improve skin texture for a radiant glow.",
    usage:
      "Apply 3-5 drops to clean, dry skin on face, neck, and décolleté. Use daily in the morning. Follow with moisturizer and sunscreen.",
    ingredients:
      "Water, Ethoxydiglycol, L-Ascorbic Acid, Propylene Glycol, Glycerin, Laureth-23, Tocopherol, Ferulic Acid, Panthenol, Triethanolamine, Sodium Hyaluronate, Phenoxyethanol.",
    reviews: [
      {
        id: 1,
        name: "Mike R.",
        rating: 5,
        title: "Skin has never looked better",
        quote:
          "My skin has never looked better. It feels smoother and looks brighter.",
        date: "October 20, 2025",
      },
      {
        id: 2,
        name: "Chloe T.",
        rating: 4,
        title: "Good serum for the price",
        quote:
          "Good serum for the price. A little sticky at first but absorbs well.",
        date: "October 18, 2025",
      },
    ],
  },
  {
    id: 4,
    category: "Allergy",
    name: "Allergy Relief",
    description: "24 Hour Non-Drowsy",
    price: "$14.99",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD95qIQthGsIpzDNKIVO-3TE4EL0zf4M8T_EKGxRCKdBJMxvw66IHEMCLHERIKJxIlawOkOil6X6NQcW-oo2TQ9U983OzmX7GR2sQUIe9-0T9OgGEXyK5KHZzCbp0auUUo2MRT56Y0H2MzpowAV79dTXMJGz5U2AGk5GXs-yWuvRajWmG128EqfP1ltXnJOl53Kg8Svx9C4tTaPZoBsUm2TgBBDZuS1yhUf1oP0apyLhhwC6aKn_svXKIg0IOpvOpd07q_orrQWdrpG",
    ],
    fullDescription:
      "Provides 24-hour relief from indoor and outdoor allergy symptoms, including sneezing, runny nose, itchy/watery eyes, and itchy throat or nose. Non-drowsy formula.",
    usage:
      "Adults and children 6 years and over: one 10 mg tablet once daily; do not take more than one 10 mg tablet in 24 hours.",
    ingredients:
      "Active Ingredient: Loratadine 10 mg. Inactive Ingredients: corn starch, lactose monohydrate, magnesium stearate.",
    reviews: [
      {
        id: 1,
        name: "Ben K.",
        rating: 5,
        title: "Works all day",
        quote: "Works all day long! I can finally enjoy spring.",
        date: "October 15, 2025",
      },
    ],
  },
];

const dealOfTheDayProduct = topSellers[1]; // Use the Multivitamin as the deal

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

// --- Reusable Components ---

/**
 * A card component for the "Top Sellers" and "Related Products" sections
 * Now defined in App.jsx and passed as a prop to ProductPage.
 */
function TopSellerCard({ product, onProductClick }) {
  let specificBgColor;
  if (product.name === "Daily Multivitamin") specificBgColor = "bg-orange-50";
  else if (product.name === "Ibuprofen 200mg") specificBgColor = "bg-green-50";
  else if (product.name === "Vitamin C Serum")
    specificBgColor = "bg-orange-100";
  else if (product.name === "Allergy Relief") specificBgColor = "bg-green-50";
  else specificBgColor = "bg-gray-50"; // Default fallback

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => onProductClick(product)}
    >
      {/* <div
        className={`flex justify-center items-center h-75 ${specificBgColor}`}
      > */}
        <img
          src={product.images[0]} // Use the first image for the card
          alt={product.name}
          className="max-h-full max-w-full object-fill p-4"
        />
      {/* </div> */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <p className="font-bold text-xl text-gray-900 mb-4">{product.price}</p>
        <button
          className="mt-auto w-full bg-green-400 text-black font-semibold py-2 px-4 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md hover:-translate-y-0.5"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click from firing
            console.log("Add to cart:", product.name);
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function HealthConcernCard({ concern }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
      <img
        src={concern.image}
        alt={concern.name}
        className="w-full h-80 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {concern.name}
        </h3>
        <p className="text-gray-600 text-sm">{concern.description}</p>
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

function Navbar() {
  // This component remains unchanged
  return (
    <nav className="bg-white shadow-sm py-3 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 bg-green-400 rounded-full"></span>
          <span className="font-bold text-2xl text-gray-900">PharmaCare</span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
          <a
            href="#"
            className="hover:text-green-500 transition-colors duration-200"
          >
            Shop
          </a>
          <a
            href="#"
            className="hover:text-green-500 transition-colors duration-200"
          >
            Shop by Category
          </a>
          <a
            href="#"
            className="hover:text-green-500 transition-colors duration-200"
          >
            Prescriptions
          </a>
          <a
            href="#"
            className="hover:text-green-500 transition-colors duration-200"
          >
            About Us
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for medications..."
              className="pl-10 pr-4 py-2 border rounded-full text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <Link
            to="/cart"
            aria-label="Cart"
            className="text-gray-600 hover:text-green-500 transition-all duration-200 hover:scale-110"
          >
            <ShoppingCart className="h-6 w-6" />
          </Link>
          <Link
            to="/profile"
            aria-label="User Account"
            className="text-gray-600 hover:text-green-500 transition-all duration-200 hover:scale-110"
          >
            <User className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 grid md:grid-cols-2 items-center gap-8 py-12 md:py-24">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight">
            Your Health, <br /> Delivered.
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto md:mx-0">
            Find your medication, vitamins, and health essentials quickly and
            discreetly.
          </p>
          <button className="bg-green-400 text-black font-bold py-3 px-8 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md hover:-translate-y-0.5 text-lg">
            Shop Health Essentials
          </button>
        </div>
        <div className="relative h-64 md:h-96 w-full">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbZBMlP4Kc3Lg2flkgRV6EEoMOQWK74Vwxce1ZKiVc-1ym8BKNOaOScpts64y1KQfSBcAIs_yyP3s2mTaZvdBXUOlJndFuhhkTRVunlDqq_DcMNKSPND9-Sv02VmgZI4aLwIaeA1_ggEy5YM4lU_bvKV-AcNVl3pMvh9hnUwyWdLbEUrdkfR4JMa4Wh9JHjekiYA2dmD-hqEhsCysmCXFeaM42RE5GxcHIscDYLiKTBeGOrp4gbXfeiPgHX9-Y2fJ1aG2aP409mtIb"
            alt="Medicine bottles and dispenser"
            className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-lg"
          />
        </div>
      </div>
    </header>
  );
}

function ShopByHealthConcern() {
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
              src={product.images[0]}
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
                ${(parseFloat(product.price.replace("$", "")) * 0.6).toFixed(2)}
              </span>
              <span className="text-2xl text-gray-500 line-through">
                {product.price}
              </span>
              <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                40% OFF
              </span>
            </div>
            <div>
              <p className="text-gray-700 font-semibold mb-3">Offer ends in:</p>
              <div className="flex space-x-3">
                <TimerBox value={pad(hours)} label="Hours" />
                <TimerBox value={pad(minutes)} label="Mins" />
                <TimerBox value={pad(seconds)} label="Secs" />
              </div>
            </div>
            <button
              className="w-full bg-green-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5"
              onClick={() => onProductClick(product)}
            >
              Claim Deal Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopSellers({ onProductClick }) {
  return (
    <section className="bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          Top Sellers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellers.map((product) => (
            <TopSellerCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedBrands() {
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

function CustomerTestimonials() {
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

function Footer() {
  // This component remains unchanged
  return (
    <footer className="bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-green-400 rounded-full"></span>
              <span className="font-bold text-2xl text-gray-900">
                PharmaCare
              </span>
            </div>
            <div className="flex space-x-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:col-span-2">
            <div>
              <h4 className="font-bold mb-3 text-gray-900">Shop</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Vitamins
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Skin Care
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Food & Water
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Prescriptions
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-gray-900">About Us</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Our Story
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-gray-900">Customer Service</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-2Two"
                    href="#"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Shipping & Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-gray-900">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    className="text-sm text-gray-600 hover:text-green-500 transition-colors duration-200"
                    href="#"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PharmaCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// --- Homepage Component ---
function HomePage({ onProductClick }) {
  return (
    <>
      <Hero />
      <ShopByHealthConcern />
      <DealOfTheDay
        product={dealOfTheDayProduct}
        onProductClick={onProductClick}
      />
      <TopSellers onProductClick={onProductClick} />
      <FeaturedBrands />
      <BenefitsSection />
      <CustomerTestimonials />
    </>
  );
}

// --- Product Page Components Removed ---
// All product page components (Breadcrumbs, ProductGallery, etc.)
// have been moved to src/ProductPage.jsx

/**
 * The main App component that ties everything together
 */
function Home() {
  const [page, setPage] = useState("home"); // 'home' or 'product'
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setPage("product");
  };

  const handleNavigateHome = () => {
    setPage("home");
    setSelectedProduct(null);
  };

  return (
    <div className="font-sans text-gray-800">
      <Navbar />
      <main>
        {page === "home" && <HomePage onProductClick={handleProductClick} />}
        {page === "product" && (
          <ProductPage
            product={selectedProduct}
            onNavigateHome={handleNavigateHome}
            onProductClick={handleProductClick} // For related products
            topSellers={topSellers} // Pass sellers data for related products
            TopSellerCard={TopSellerCard} // Pass the component as a prop
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Home;
