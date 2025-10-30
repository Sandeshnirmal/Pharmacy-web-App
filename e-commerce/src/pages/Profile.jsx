import React, { useState } from "react";
import {
  User,
  ShoppingBag,
  Book,
  CreditCard,
  LogOut,
  ChevronRight,
} from "lucide-react";

// Mock data for the profile page
const mockUser = {
  firstName: "Sarah",
  lastName: "J.",
  email: "sarah.j@example.com",
  phone: "555-123-4567",
};

const mockOrders = [
  {
    id: "12345",
    date: "October 28, 2025",
    total: "$33.48",
    status: "Delivered",
    items: ["Ibuprofen 200mg", "Daily Multivitamin"],
  },
  {
    id: "12340",
    date: "October 15, 2025",
    total: "$24.50",
    status: "Delivered",
    items: ["Vitamin C Serum"],
  },
  {
    id: "12346",
    date: "October 29, 2025",
    total: "$45.00",
    status: "Processing",
    items: ["Skin Care Set", "Allergy Relief"],
  },
  {
    id: "12347",
    date: "October 30, 2025",
    total: "$19.99",
    status: "Shipped",
    items: ["Daily Multivitamin"],
  },
];

// --- Reusable Sidebar Link ---
function SidebarLink({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${
        isActive
          ? "bg-green-100 text-green-700 font-semibold"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

// --- Content for "Personal Information" ---
function PersonalInfoContent({ user }) {
  const [formData, setFormData] = useState(user);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Personal Information
      </h2>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="flex flex-col">
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          {/* Last Name */}
          <div className="flex flex-col">
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
        {/* Email */}
        <div className="flex flex-col">
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        {/* Phone */}
        <div className="flex flex-col">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Save Button */}
        <div className="text-right pt-4">
          <button
            type="submit"
            onClick={(e) => e.preventDefault()}
            className="bg-green-400 text-black font-semibold py-2 px-6 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Content for "Order History" ---
function OrderHistoryContent({ orders }) {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-700 bg-green-100";
      case "shipped":
        return "text-blue-700 bg-blue-100";
      case "processing":
        return "text-yellow-700 bg-yellow-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Placed on: {order.date}
                  </p>
                </div>
                <div className="text-left md:text-right mt-2 md:mt-0">
                  <p className="text-lg font-bold text-gray-900">
                    {order.total}
                  </p>
                  <span
                    className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  {order.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        ) : (
          <p>You have no past orders.</p>
        )}
      </div>
    </div>
  );
}

// --- Main Profile Page Component ---
function ProfilePage({ onNavigateHome }) {
  const [activeTab, setActiveTab] = useState("info");

  const renderContent = () => {
    switch (activeTab) {
      case "info":
        return <PersonalInfoContent user={mockUser} />;
      case "orders":
        return <OrderHistoryContent orders={mockOrders} />;
      case "address":
        return (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Address Book (Placeholder)
          </h2>
        );
      case "payment":
        return (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Payment Methods (Placeholder)
          </h2>
        );
      default:
        return <PersonalInfoContent user={mockUser} />;
    }
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-gray-600 mb-8">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
            className="hover:text-green-500"
          >
            Home
          </a>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-medium text-gray-800">My Account</span>
        </nav>

        {/* Main layout grid with fixed height */}
        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
          style={{ height: "85vh" }}
        >
          {/* Sidebar */}
          <div className="col-span-1 h-full">
            <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
              <div className="space-y-2">
                <SidebarLink
                  icon={User}
                  label="Personal Information"
                  isActive={activeTab === "info"}
                  onClick={() => setActiveTab("info")}
                />
                <SidebarLink
                  icon={ShoppingBag}
                  label="Order History"
                  isActive={activeTab === "orders"}
                  onClick={() => setActiveTab("orders")}
                />
                <SidebarLink
                  icon={Book}
                  label="Address Book"
                  isActive={activeTab === "address"}
                  onClick={() => setActiveTab("address")}
                />
                <SidebarLink
                  icon={CreditCard}
                  label="Payment Methods"
                  isActive={activeTab === "payment"}
                  onClick={() => setActiveTab("payment")}
                />
              </div>

              {/* Log Out Button pushed to the bottom */}
              <div className="mt-auto">
                <button
                  onClick={() => console.log("Log out")}
                  className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3 h-full">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 h-full overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
