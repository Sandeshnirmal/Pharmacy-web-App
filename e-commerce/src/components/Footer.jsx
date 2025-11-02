import React, { memo } from 'react';
import logo from '../assets/full_logo.png';

const Footer = memo(() => {
  return (
    <footer className="bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Full logo" className='w-[10vw] h-auto min-w-50'/>
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
          © {new Date().getFullYear()} InfixMart. All rights reserved.
        </div>
      </div>
    </footer>
  );
});

export default Footer;
