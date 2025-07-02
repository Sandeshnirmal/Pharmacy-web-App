import React, { useState, useRef, useEffect } from "react";
// Import Link and useLocation from react-router-dom for navigation
import { Link, useLocation } from "react-router-dom";

// Sidebar Item Component - Handles individual links and dropdown parents
// This component now uses react-router-dom's Link and useLocation for active state management
const SidebarItem = ({ label, to, children }) => {
  const [isOpenByClick, setIsOpenByClick] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDropdown = !!children;
  const location = useLocation(); // Use useLocation to get current path
  const timeoutRef = useRef(null);

  const shouldDropdownBeOpen = isOpenByClick || (isHovered && !isOpenByClick);

  const handleClick = (e) => {
    if (isDropdown) {
      e.preventDefault(); // Prevent default Link behavior for dropdown parent
      setIsOpenByClick(prev => !prev);
      setIsHovered(false);
    }
  };

  const handleMouseEnter = () => {
    if (isDropdown) {
      clearTimeout(timeoutRef.current);
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDropdown) {
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 200);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Determine active state based on current location.pathname
  // The 'to' prop for SidebarItem should match the actual route path
  const isActive = location.pathname === to || (isDropdown && React.Children.toArray(children).some(child =>
    child && child.props && location.pathname.startsWith(child.props.to || to || '___no_base_path___')
  ));

  // Use Link for navigation, button for dropdown parents
  const Tag = isDropdown ? 'button' : Link;



  return (
    <div
      className="w-full relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Tag
        to={isDropdown ? '#' : to}
        onClick={handleClick}
        className={`flex items-center justify-between w-full px-3 py-2 rounded cursor-pointer transition-colors
          ${isActive ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-100"}
          ${isDropdown ? 'focus:outline-none' : ''}
        `}
        aria-expanded={isDropdown ? shouldDropdownBeOpen : undefined}
      >
        <span>{label}</span>
      </Tag>

      {isDropdown && shouldDropdownBeOpen && (
        <div className="ml-4 pl-4 pt-2 space-y-2 border-l border-gray-700">
          {React.Children.map(children, child =>
            // No need to cloneElement for passing currentPage/onPageChange if children use useLocation
            React.cloneElement(child)
          )}
        </div>
      )}
    </div>
  );
};

// Full Sidebar Component - Now uses useLocation internally for active state
const SidebarNavbar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold mb-8 text-gray-900">Admin Panel</h2>
        <nav className="space-y-2">
          <SidebarItem
            label="Dashboard"
            to="/Dashboard"
          />
          <SidebarItem
            label="Medicines"
            to="/Medicines"
          />
          <SidebarItem
            label="Generic Mappings"
            to="/Generics"
          />
          <SidebarItem
            label="Inventory Management"
            to="/Inventory"
          />
          <SidebarItem
            label="Prescriptions"
            to="/Prescription"
          />
          <SidebarItem
            label="Pending Reviews"
            to="/Pending_Prescriptions"
          />
          <SidebarItem
            label="Orders"
            to="/Orders"
          />
          <SidebarItem
            label="Customers"
            to="/Customers"
          />
          <SidebarItem
            label="User Management"
            to="/Users"
          />
          <SidebarItem
            label="Reports & Analytics"
            to="/Reports"
          />
        </nav>
      </div>
      <img className="pt-3" src="/src/assets/full_logo.png" alt="logo" />
    </aside>
  );
};

// Removed SidebarWrapper component as it's no longer needed here.
// The main application's App.jsx should provide the single <Router> context.
export default SidebarNavbar; // Export SidebarNavbar directly
