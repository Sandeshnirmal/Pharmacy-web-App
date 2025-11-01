import React, { useState } from 'react'; // Import useState
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Search, ShoppingCart, User } from "lucide-react";

function Navbar({ isAuthenticated }) {
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`); // Navigate to shop page with search query
      setSearchTerm(''); // Clear search term after submission
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <nav className="bg-white shadow-sm py-3 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/assets/full_logo.png" alt="PharmaCare Logo" className="h-8 w-8" />
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
          <Link
            to="/shop"
            className="hover:text-green-500 transition-colors duration-200"
          >
            Shop
          </Link>
          {/* <Link
            to="/categories"
            className="hover:text-green-500 transition-colors duration-200"
          >
            Shop by Category
          </Link> */}
          {/* n */}
          <Link
            to="/profile/prescription-history"
            className="hover:text-green-500 transition-colors duration-200"
          >
            Prescriptions History
          </Link>
          <Link
            to="/about"
            className="hover:text-green-500 transition-colors duration-200"
          >
            About Us
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for medications..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border rounded-full text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </form>
          </div>
          <Link
            to="/cart"
            aria-label="Cart"
            className="text-gray-600 hover:text-green-500 transition-all duration-200 hover:scale-110"
          >
            <ShoppingCart className="h-6 w-6" />
          </Link>
          {isAuthenticated ? (
            <Link
              to="/profile"
              aria-label="User Account"
              className="text-gray-600 hover:text-green-500 transition-all duration-200 hover:scale-110"
            >
              <User className="h-6 w-6" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-600 hover:text-green-500 transition-colors duration-200 text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-500 text-white py-1.5 px-4 rounded-full text-sm font-medium hover:bg-green-600 transition-colors duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
