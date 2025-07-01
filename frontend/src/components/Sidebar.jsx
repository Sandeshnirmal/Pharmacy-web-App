import React, { useState, useRef, useEffect } from "react";
// Import icons from lucide-react
import { Home as HomeIcon, Pill as PillIcon, Link as LinkIcon, FileText as FileTextIcon, Package as PackageIcon, Truck as TruckIcon, Users as UsersIcon, Box as BoxIcon, Tag as TagIcon, BarChart2 as BarChart2Icon, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
// Import Link and useLocation from react-router-dom for navigation
import { Link, useLocation } from "react-router-dom"; // BrowserRouter is removed from here

// Sidebar Item Component - Handles individual links and dropdown parents
// This component now uses react-router-dom's Link and useLocation for active state management
const SidebarItem = ({ icon, label, to, children }) => {
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
        to={isDropdown ? '#' : to} // Link to '#' for buttons, actual 'to' for links
        onClick={handleClick}
        className={`flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
          ${isActive ? "bg-blue-50 text-blue-700 font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
          ${isDropdown ? 'focus:outline-none focus:ring-2 focus:ring-blue-500' : ''}
        `}
        aria-expanded={isDropdown ? shouldDropdownBeOpen : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </div>
        {isDropdown && (shouldDropdownBeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
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
  const location = useLocation(); // useLocation hook is used here for active link highlighting

  return (
    <aside className="w-64 bg-white p-6 shadow-md flex flex-col justify-between rounded-xl m-4">
      <div>
        <h2 className="text-xl font-bold mb-8 text-gray-900">Admin Panel</h2>
        <nav className="space-y-4">
          <SidebarItem
            icon={<HomeIcon />}
            label="Dashboard"
            to="/Dashboard" // Path for Dashboard
          />
          <SidebarItem
            icon={<PillIcon />}
            label="Medicines"
            to="/medicines" // Path for Medicines
          />
          <SidebarItem
            icon={<LinkIcon />}
            label="Generic Mappings"
            to="/Generics"
          />
          <SidebarItem
            icon={<FileTextIcon />}
            label="Prescriptions"
            to="/Prescription"
          />
          <SidebarItem
            icon={<PackageIcon />}
            label="Orders"
            to="/Orders"
          />
          <SidebarItem
            icon={<TruckIcon />}
            label="Delivery Tracking"
            to="/delivery-tracking"
          />
          <SidebarItem
            icon={<UsersIcon />}
            label="Users & Customers"
            to="/customers"
          />
          <SidebarItem
            icon={<BoxIcon />}
            label="Inventory"
            to="/inventory"
          />
          <SidebarItem
            icon={<TagIcon />}
            label="Promotions"
            to="/promotions"
          />
          <SidebarItem
            icon={<BarChart2Icon />}
            label="Reports & Analytics"
            to="/reports-analytics"
          />
        </nav>
      </div>
      <img classname="pt-3" src="/src/assets/full_logo.png" alt="logo" />
      <div className="mt-8">
        <Link
          to="/settings" // Example path for settings
          className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
        >
          <SettingsIcon className="w-5 h-5 mr-3" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

// Removed SidebarWrapper component as it's no longer needed here.
// The main application's App.jsx should provide the single <Router> context.
export default SidebarNavbar; // Export SidebarNavbar directly
