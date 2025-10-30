// src/components/Navbar.jsx
import React from "react";
import { Search, ShoppingCart, User } from "lucide-react"; // We'll install lucide-react later for icons

function Navbar() {
  return (
    <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img
            src="https://via.placeholder.com/30x30"
            alt="PharmaCare Logo"
            className="h-7 w-7"
          />{" "}
          {/* Replace with actual logo */}
          <span className="text-xl font-bold text-gray-900">PharmaCare</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <a href="#" className="hover:text-primary-600">
            Shop
          </a>
          <a href="#" className="hover:text-primary-600">
            Shop by Category
          </a>
          <a href="#" className="hover:text-primary-600">
            Prescriptions
          </a>
          <a href="#" className="hover:text-primary-600">
            About Us
          </a>
        </div>

        {/* Search, Cart, User Icons */}
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search for medications..."
              className="pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
          <ShoppingCart className="text-gray-600 hover:text-primary-600 cursor-pointer h-6 w-6" />
          <User className="text-gray-600 hover:text-primary-600 cursor-pointer h-6 w-6" />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
