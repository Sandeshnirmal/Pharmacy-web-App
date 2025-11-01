import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShoppingBag,
  Book,
  CreditCard,
  LogOut,
  ChevronRight,
  FileText, // Added for prescription history icon
} from "lucide-react";
import { authAPI, userAPI, orderAPI, addressAPI } from "../api/apiService";
import { useAuth } from '../context/AuthContext';
import SidebarLink from '../components/profile/SidebarLink';
import PersonalInfoContent from '../components/profile/PersonalInfoContent';
import OrderHistoryContent from '../components/profile/OrderHistoryContent';
import AddressBookContent from '../components/profile/AddressBookContent';
import PrescriptionHistoryContent from '../components/profile/PrescriptionHistoryContent'; // Import new component

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  const { user: authUser, logout } = useAuth(); // Renamed user to authUser to avoid conflict
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [error, setError] = useState(null);

  // Use authUser from context for initial check
  useEffect(() => {
    if (!authUser) {
      setError("User not authenticated.");
      logout();
      navigate('/login');
      return;
    }
    const fetchUserData = async () => {
      try {
        setLoadingUser(true);
        const response = await authAPI.getCurrentUser();
        if (response.data) {
          const fetchedUser = {
            id: response.data.id,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            email: response.data.email,
            phone_number: response.data.phone_number,
          };
          setUser(fetchedUser);
        } else {
          setError("Failed to fetch user data.");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile. Please log in again.");
        logout();
        navigate('/login');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [authUser, logout, navigate]); // Added authUser to dependency array

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchOrderData = async () => {
      try {
        setLoadingOrders(true);
        const response = await orderAPI.getOrders();
        if (response.data && Array.isArray(response.data.results)) {
          setOrders(response.data.results);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchAddressData = async () => {
      try {
        setLoadingAddresses(true);
        const response = await addressAPI.getAddresses(user.id);
        if (response.data && Array.isArray(response.data)) {
          setAddresses(response.data);
        } else {
          setAddresses([]);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
        setAddresses([]);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchOrderData();
    fetchAddressData();
  }, [user]);

  const handleUserUpdate = (updatedData) => {
    setUser((prevUser) => ({ ...prevUser, ...updatedData }));
  };

  const handleAddAddress = async (newAddress) => {
    if (!user || !user.id) return;
    try {
      const response = await addressAPI.addAddress(newAddress); // userId is handled by backend
      setAddresses((prev) => [...prev, response.data]);
      return { success: true };
    } catch (error) {
      console.error("Failed to add address:", error);
      return { success: false, error: "Failed to add address" };
    }
  };

  const handleUpdateAddress = async (addressId, updatedAddress) => {
    if (!user || !user.id) return;
    try {
      const response = await addressAPI.updateAddress(addressId, updatedAddress);
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === addressId ? response.data : addr))
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to update address:", error);
      return { success: false, error: "Failed to update address" };
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!user || !user.id) return;
    try {
      await addressAPI.deleteAddress(addressId);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete address:", error);
      return { success: false, error: "Failed to delete address" };
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    if (loadingUser) {
      return <p className="text-center text-gray-600">Loading personal information...</p>;
    }
    if (error) {
      return <p className="text-center text-red-600">{error}</p>;
    }
    if (!user) {
      return <p className="text-center text-gray-600">No user data available. Please log in.</p>;
    }

    switch (activeTab) {
      case "info":
        return <PersonalInfoContent user={user} onUpdateUser={handleUserUpdate} />;
      case "orders":
        if (loadingOrders) {
          return <p className="text-center text-gray-600">Loading order history...</p>;
        }
        return <OrderHistoryContent orders={orders} />;
      case "address":
        if (loadingAddresses) {
          return <p className="text-center text-gray-600">Loading address book...</p>;
        }
        return (
          <AddressBookContent
            addresses={addresses}
            onAddAddress={handleAddAddress}
            onUpdateAddress={handleUpdateAddress}
            onDeleteAddress={handleDeleteAddress}
          />
        );
      case "prescriptions":
        return <PrescriptionHistoryContent />; // New component for prescription history
      case "payment":
        return (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Payment Methods (Placeholder)
          </h2>
        );
      default:
        return <PersonalInfoContent user={user} onUpdateUser={handleUserUpdate} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-gray-600 mb-8">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            className="hover:text-green-600 transition-colors"
          >
            Home
          </a>
          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          <span className="font-medium text-gray-800">My Account</span>
        </nav>

        {/* Main layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-2 border border-gray-100">
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
                icon={FileText} // Using FileText icon for prescriptions
                label="Prescription History"
                isActive={activeTab === "prescriptions"}
                onClick={() => setActiveTab("prescriptions")}
              />
              <SidebarLink
                icon={CreditCard}
                label="Payment Methods"
                isActive={activeTab === "payment"}
                onClick={() => setActiveTab("payment")}
              />
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
