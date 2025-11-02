import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import logo from '../assets/infxmart_words.png';

const Navbar = ({ isAuthenticated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`bg-white sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg py-3' : 'shadow-none py-4'}`}>
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-around">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="PharmaCare Logo"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-gray-800 font-semibold text-base">
          <Link to="/shop" className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
            Shop
          </Link>
          <Link to="/profile/prescription-history" className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
            Prescriptions
          </Link>
          <Link to="/about" className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
            About Us
          </Link>
        </div>

        <div className="flex items-center space-x-5">
          <div className="relative hidden md:block">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-11 pr-4 py-2.5 border border-gray-300 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              />
            </form>
          </div>

          <Link to="/cart" aria-label="Cart" className="text-gray-700 hover:text-green-500 transition-colors duration-300">
            <ShoppingCart className="h-7 w-7" />
          </Link>

          {isAuthenticated ? (
            <Link to="/profile" aria-label="User Account" className="text-gray-700 hover:text-green-500 transition-colors duration-300">
              <User className="h-7 w-7" />
            </Link>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/login" className="text-gray-700 font-semibold hover:text-green-500 transition-colors duration-300">
                Login
              </Link>
              <Link to="/register" className="bg-green-500 text-white py-2 px-5 rounded-full font-semibold hover:bg-green-600 transition-all duration-300 shadow-sm hover:shadow-md">
                Register
              </Link>
            </div>
          )}

          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-gray-700 hover:text-green-500">
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={toggleMobileMenu}>
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
              <button onClick={toggleMobileMenu} className="text-gray-600 hover:text-gray-900">
                <X className="h-8 w-8" />
              </button>
            </div>
            <div className="flex flex-col items-start space-y-8 text-xl font-semibold text-gray-800">
              <Link to="/shop" onClick={toggleMobileMenu} className="hover:text-green-500 transition-colors duration-300">Shop</Link>
              <Link to="/profile/prescription-history" onClick={toggleMobileMenu} className="hover:text-green-500 transition-colors duration-300">Prescriptions</Link>
              <Link to="/about" onClick={toggleMobileMenu} className="hover:text-green-500 transition-colors duration-300">About Us</Link>
              <div className="border-t border-gray-200 w-full pt-8 space-y-6">
                {!isAuthenticated && (
                  <>
                    <Link to="/login" onClick={toggleMobileMenu} className="block text-green-500">Login</Link>
                    <Link to="/register" onClick={toggleMobileMenu} className="block bg-green-500 text-white py-2 px-5 rounded-full text-center">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
