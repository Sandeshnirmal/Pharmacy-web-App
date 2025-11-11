import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance';

// --- Icon Components (Inline SVGs) ---

const UserIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const StoreIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M18 12v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2" />
    <path d="M4 12h16" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const ScaleIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
    <path d="M6 12l6-6 6 6" />
    <path d="M12 22V12" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 17h4V5H2v12h3" />
    <path d="M22 17h-2V5h2v12z" />
    <path d="M4 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0z" />
    <path d="M18 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0z" />
    <path d="M14 5h-4" />
  </svg>
);

const SaveIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const ArrowLeftIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ViewIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// --- Reusable Components ---

// Form input field component
const InputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

// Toggle switch component
const ToggleSwitch = ({ id, label, enabled, setEnabled }) => (
  <div className="flex items-center justify-between">
    <label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </label>
    <button
      id={id}
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={`${
        enabled ? "bg-blue-600" : "bg-gray-200"
      } relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`${
          enabled ? "translate-x-6" : "translate-x-1"
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
      />
    </button>
  </div>
);

// Save button component
const SaveButton = ({ children = "Save Changes" }) => (
  <button
    type="submit"
    className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    <SaveIcon className="w-4 h-4 mr-2" />
    {children}
  </button>
);

// Button for the main settings menu
const SettingsMenuButton = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-white rounded-lg shadow-md p-5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <div className="flex items-center">
      {icon &&
        React.cloneElement(icon, { className: "w-5 h-5 mr-3 text-gray-500" })}
      <span className="text-lg font-semibold text-gray-800">{title}</span>
    </div>
    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
  </button>
);

// Wrapper for individual settings pages (adds Back button, title, and card)
const SettingsPageWrapper = ({ title, icon, children, navigate }) => (
  <div>
    <button
      onClick={() => navigate("main")}
      className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
    >
      <ArrowLeftIcon className="w-4 h-4 mr-1" />
      Back to Settings
    </button>
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {icon &&
            React.cloneElement(icon, {
              className: "w-5 h-5 mr-3 text-gray-500",
            })}
          {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  </div>
);

// --- Settings Page Content ---

const ProfileSettingsForm = () => {
  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@example.com");

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <InputField
        label="Full Name"
        id="fullName"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <InputField
        label="Email Address"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <InputField
        label="New Password"
        id="newPassword"
        type="password"
        placeholder="Leave blank to keep current password"
      />
      <div className="text-right">
        <SaveButton />
      </div>
    </form>
  );
};

const StoreDetailsForm = ({ initialData, onSave, onCancel }) => {
  const [companyDetails, setCompanyDetails] = useState(initialData || {
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    phone_number: "",
    email: "",
    gstin: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCompanyDetails((prevDetails) => ({
      ...prevDetails,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(companyDetails);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {initialData ? "Edit Store Details" : "Add New Store"}
        </h3>
      </div>
      <form className="p-5 space-y-4" onSubmit={handleSubmit}>
        <InputField
          label="Company Name"
          id="name"
          value={companyDetails.name}
          onChange={handleChange}
        />
        <InputField
          label="Address Line 1"
          id="address_line1"
          value={companyDetails.address_line1}
          onChange={handleChange}
        />
        <InputField
          label="Address Line 2"
          id="address_line2"
          value={companyDetails.address_line2 || ''}
          onChange={handleChange}
        />
        <InputField
          label="City"
          id="city"
          value={companyDetails.city}
          onChange={handleChange}
        />
        <InputField
          label="State"
          id="state"
          value={companyDetails.state}
          onChange={handleChange}
        />
        <InputField
          label="Postal Code"
          id="postal_code"
          value={companyDetails.postal_code}
          onChange={handleChange}
        />
        <InputField
          label="Country"
          id="country"
          value={companyDetails.country}
          onChange={handleChange}
        />
        <InputField
          label="Phone Number"
          id="phone_number"
          value={companyDetails.phone_number}
          onChange={handleChange}
        />
        <InputField
          label="Email"
          id="email"
          type="email"
          value={companyDetails.email}
          onChange={handleChange}
        />
        <InputField
          label="GSTIN"
          id="gstin"
          value={companyDetails.gstin}
          onChange={handleChange}
        />
        <InputField
          label="Bank Name"
          id="bank_name"
          value={companyDetails.bank_name || ''}
          onChange={handleChange}
        />
        <InputField
          label="Bank Account Number"
          id="bank_account_number"
          value={companyDetails.bank_account_number || ''}
          onChange={handleChange}
        />
        <InputField
          label="Bank IFSC Code"
          id="bank_ifsc_code"
          value={companyDetails.bank_ifsc_code || ''}
          onChange={handleChange}
        />
        <div className="text-right flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <SaveButton>{initialData ? "Save Changes" : "Save Store"}</SaveButton>
        </div>
      </form>
    </div>
  );
};

const StoreDetailsList = ({ stores, onAddClick, onViewClick, onEditClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-center">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
        <StoreIcon className="w-5 h-5 mr-3 text-gray-500" />
        Store Details
      </h3>
      <button
        onClick={onAddClick}
        className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Add New Store
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              GSTIN
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stores.length === 0 && (
            <tr>
              <td
                colSpan="4"
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No stores found.
              </td>
            </tr>
          )}
          {stores.map((store) => (
            <tr key={store.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {store.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {store.email || store.phone_number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {store.gstin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  onClick={() => onViewClick(store)}
                  className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                >
                  <ViewIcon className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => onEditClick(store)}
                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                >
                  <EditIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StoreDetails = ({ store, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {store.name}
        </h3>
        <button
          onClick={onClose}
          className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mt-3 sm:mt-0"
        >
          Back to List
        </button>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Address</span>
          <span className="text-md text-gray-900 whitespace-pre-line">
            {`${store.address_line1}${store.address_line2 ? `\n${store.address_line2}` : ''}\n${store.city}, ${store.state} ${store.postal_code}\n${store.country}`}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Email</span>
          <span className="text-md text-gray-900">
            {store.email || "N/A"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Phone</span>
          <span className="text-md text-gray-900">
            {store.phone_number || "N/A"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">GSTIN</span>
          <span className="text-md text-gray-900">{store.gstin || "N/A"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Bank Name</span>
          <span className="text-md text-gray-900">{store.bank_name || "N/A"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Bank Account Number</span>
          <span className="text-md text-gray-900">{store.bank_account_number || "N/A"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Bank IFSC Code</span>
          <span className="text-md text-gray-900">{store.bank_ifsc_code || "N/A"}</span>
        </div>
      </div>
    </div>
  );
};

const StoreSettingsPage = ({ navigate }) => {
  const [view, setView] = useState("list"); // 'list', 'add', 'view', 'edit'
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/company-details/');
      setStores(response.data);
    } catch (err) {
      setError("Failed to fetch store details.");
      console.error("Error fetching store details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (storeData) => {
    try {
      if (storeData.id) {
        await axiosInstance.patch(`/api/company-details/${storeData.id}/`, storeData);
      } else {
        await axiosInstance.post('/api/company-details/', storeData);
      }
      fetchStores(); // Refresh the list
      setView("list");
    } catch (err) {
      setError("Failed to save store details.");
      console.error("Error saving store details:", err);
    }
  };

  const showViewPage = (store) => {
    setSelectedStore(store);
    setView("view");
  };

  const showEditPage = (store) => {
    setSelectedStore(store);
    setView("edit");
  };

  const showAddPage = () => {
    setSelectedStore(null);
    setView("add");
  };

  return (
    <div>
      <button
        onClick={() => navigate("main")}
        className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Settings
      </button>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {view === "list" && (
            <StoreDetailsList
              stores={stores}
              onAddClick={showAddPage}
              onViewClick={showViewPage}
              onEditClick={showEditPage}
            />
          )}

          {view === "add" && (
            <StoreDetailsForm
              onSave={handleSave}
              onCancel={() => setView("list")}
            />
          )}

          {view === "edit" && selectedStore && (
            <StoreDetailsForm
              initialData={selectedStore}
              onSave={handleSave}
              onCancel={() => setView("list")}
            />
          )}

          {view === "view" && selectedStore && (
            <StoreDetails
              store={selectedStore}
              onClose={() => setView("list")}
            />
          )}
        </>
      )}
    </div>
  );
};


const NotificationSettingsContent = () => {
  const [newOrders, setNewOrders] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-3">
        <ToggleSwitch
          id="newOrders"
          label="Email on new orders"
          enabled={newOrders}
          setEnabled={setNewOrders}
        />
        <ToggleSwitch
          id="lowStock"
          label="Email for low stock warnings"
          enabled={lowStock}
          setEnabled={setLowStock}
        />
        <ToggleSwitch
          id="promotions"
          label="Email for marketing & promotions"
          enabled={promotions}
          setEnabled={setPromotions}
        />
      </div>
      <div className="text-right pt-2">
        <SaveButton>Save Preferences</SaveButton>
      </div>
    </form>
  );
};


// --- NEW SUPPLIER COMPONENTS ---

const SupplierList = ({ suppliers, onAddClick, onViewClick, onEditClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-center">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
        <TruckIcon className="w-5 h-5 mr-3 text-gray-500" />
        Suppliers
      </h3>
      <button
        onClick={onAddClick}
        className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Add New Supplier
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              GST #
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.isArray(suppliers) && suppliers.length === 0 && (
            <tr>
              <td
                colSpan="4"
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No suppliers found.
              </td>
            </tr>
          )}
          {Array.isArray(suppliers) && suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {supplier.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {supplier.email || supplier.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {supplier.gst_number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  onClick={() => onViewClick(supplier)}
                  className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                >
                  <ViewIcon className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => onEditClick(supplier)}
                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                >
                  <EditIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AddSupplierForm = ({ onSave, onCancel }) => {
  const [supplierData, setSupplierData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    gst_number: "",
    is_active: true,
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSupplierData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ['name', 'contact_person', 'email', 'phone', 'address'];
    const missingFields = requiredFields.filter(field => !supplierData[field]);

    if (missingFields.length > 0) {
      alert(`Please fill out the following required fields: ${missingFields.map(field => field.replace('_', ' ')).join(', ')}`);
      return;
    }
    onSave(supplierData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          Add New Supplier
        </h3>
      </div>
      <form className="p-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Supplier Name*"
            id="name"
            value={supplierData.name}
            onChange={handleChange}
            placeholder="e.g., Acme Widgets"
          />
          <InputField
            label="Contact Person*"
            id="contact_person"
            value={supplierData.contact_person}
            onChange={handleChange}
            placeholder="e.g., John Doe"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Contact Email*"
            id="email"
            type="email"
            value={supplierData.email}
            onChange={handleChange}
            placeholder="e.g., contact@acme.com"
          />
          <InputField
            label="Contact Phone*"
            id="phone"
            type="tel"
            value={supplierData.phone}
            onChange={handleChange}
            placeholder="e.g., (123) 456-7890"
          />
        </div>
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address*
          </label>
          <textarea
            id="address"
            rows="3"
            value={supplierData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Industrial Rd, Suite 500..."
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
                label="GST Number"
                id="gst_number"
                value={supplierData.gst_number}
                onChange={handleChange}
                placeholder="e.g., GSTIN12345"
            />
            <ToggleSwitch
                id="is_active"
                label="Is Active"
                enabled={supplierData.is_active}
                setEnabled={(value) => setSupplierData((prev) => ({ ...prev, is_active: value }))}
            />
        </div>
        <div className="text-right flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <SaveButton>Save Supplier</SaveButton>
        </div>
      </form>
    </div>
  );
};

const EditSupplierForm = ({ supplier, onSave, onCancel }) => {
  const [supplierData, setSupplierData] = useState(supplier);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSupplierData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ['name', 'contact_person', 'email', 'phone', 'address'];
    const missingFields = requiredFields.filter(field => !supplierData[field]);

    if (missingFields.length > 0) {
      alert(`Please fill out the following required fields: ${missingFields.map(field => field.replace('_', ' ')).join(', ')}`);
      return;
    }
    onSave(supplierData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          Edit Supplier: {supplier.name}
        </h3>
      </div>
      <form className="p-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Supplier Name*"
            id="name"
            value={supplierData.name}
            onChange={handleChange}
            placeholder="e.g., Acme Widgets"
          />
          <InputField
            label="Contact Person*"
            id="contact_person"
            value={supplierData.contact_person}
            onChange={handleChange}
            placeholder="e.g., John Doe"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Contact Email*"
            id="email"
            type="email"
            value={supplierData.email}
            onChange={handleChange}
            placeholder="e.g., contact@acme.com"
          />
          <InputField
            label="Contact Phone*"
            id="phone"
            type="tel"
            value={supplierData.phone}
            onChange={handleChange}
            placeholder="e.g., (123) 456-7890"
          />
        </div>
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address*
          </label>
          <textarea
            id="address"
            rows="3"
            value={supplierData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Industrial Rd, Suite 500..."
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
                label="GST Number"
                id="gst_number"
                value={supplierData.gst_number}
                onChange={handleChange}
                placeholder="e.g., GSTIN12345"
            />
            <ToggleSwitch
                id="is_active"
                label="Is Active"
                enabled={supplierData.is_active}
                setEnabled={(value) => setSupplierData((prev) => ({ ...prev, is_active: value }))}
            />
        </div>
        <div className="text-right flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <SaveButton>Save Changes</SaveButton>
        </div>
      </form>
    </div>
  );
};

const SupplierDetails = ({ supplier, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          {supplier.name}
        </h3>
        <button
          onClick={onClose}
          className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mt-3 sm:mt-0"
        >
          Back to List
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Contact Person</span>
          <span className="text-md text-gray-900">
            {supplier.contact_person || "N/A"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Email</span>
          <span className="text-md text-gray-900">
            {supplier.email || "N/A"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Phone</span>
          <span className="text-md text-gray-900">
            {supplier.phone || "N/A"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">GST Number</span>
          <span className="text-md text-gray-900">{supplier.gst_number || "N/A"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Address</span>
          <span className="text-md text-gray-900 whitespace-pre-line">
            {supplier.address || "N/A"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Status</span>
          <span className="text-md text-gray-900">
            {supplier.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
};

const SuppliersPage = ({ navigate }) => {
  const [view, setView] = useState("list"); // 'list', 'add', 'view', 'edit'
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/api/inventory/suppliers/');
      setSuppliers(response.data.results || []);
    } catch (err) {
      setError("Failed to fetch suppliers. Please try again later.");
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (supplierData) => {
    try {
      if (supplierData.id) {
        // Update existing supplier
        await axiosInstance.patch(`/api/inventory/suppliers/${supplierData.id}/`, supplierData);
      } else {
        // Create new supplier
        await axiosInstance.post('/api/inventory/suppliers/', supplierData);
      }
      fetchSuppliers(); // Refresh the list
      setView("list");
    } catch (err) {
      console.error("Error saving supplier:", err);
      const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : "An unexpected error occurred.";
      alert(`Failed to save supplier: ${errorMessage}`);
    }
  };

  const showViewPage = (supplier) => {
    setSelectedSupplier(supplier);
    setView("view");
  };

  const showEditPage = (supplier) => {
    setSelectedSupplier(supplier);
    setView("edit");
  };

  const showAddPage = () => {
    setSelectedSupplier(null);
    setView("add");
  };

  return (
    <div>
      <button
        onClick={() => navigate("main")}
        className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Settings
      </button>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {loading ? (
        <div>Loading suppliers...</div>
      ) : (
        <>
          {view === "list" && (
            <SupplierList
              suppliers={suppliers}
              onAddClick={showAddPage}
              onViewClick={showViewPage}
              onEditClick={showEditPage}
            />
          )}

          {view === "add" && (
            <AddSupplierForm
              onSave={handleSaveSupplier}
              onCancel={() => setView("list")}
            />
          )}

          {view === "edit" && selectedSupplier && (
            <EditSupplierForm
              supplier={selectedSupplier}
              onSave={handleSaveSupplier}
              onCancel={() => setView("list")}
            />
          )}

          {view === "view" && selectedSupplier && (
            <SupplierDetails
              supplier={selectedSupplier}
              onClose={() => setView("list")}
            />
          )}
        </>
      )}
    </div>
  );
};

// --- Settings Menu Component ---
const SettingsMenu = ({ navigate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
      <SettingsMenuButton
        title="Profile"
        icon={<UserIcon />}
        onClick={() => navigate("profile")}
      />
      <SettingsMenuButton
        title="Store Details"
        icon={<StoreIcon />}
        onClick={() => navigate("store")}
      />
      <SettingsMenuButton
        title="Notifications"
        icon={<BellIcon />}
        onClick={() => navigate("notifications")}
      />
      <SettingsMenuButton
        title="Suppliers"
        icon={<TruckIcon />}
        onClick={() => navigate("suppliers")}
      />
    </div>
  );
};

// --- Main App Component ---

// This component now handles navigation between the settings menu and the individual pages.
export default function App() {
  const [currentPage, setCurrentPage] = useState("main");

  const renderPage = () => {
    switch (currentPage) {
      case "profile":
        return (
          <SettingsPageWrapper
            title="Profile"
            icon={<UserIcon />}
            navigate={setCurrentPage}
          >
            <ProfileSettingsForm />
          </SettingsPageWrapper>
        );
      case "store":
        return (
          <StoreSettingsPage navigate={setCurrentPage} />
        );
      case "notifications":
        return (
          <SettingsPageWrapper
            title="Notifications"
            icon={<BellIcon />}
            navigate={setCurrentPage}
          >
            <NotificationSettingsContent />
          </SettingsPageWrapper>
        );
      case "suppliers":
        return (
          // This now renders the new self-contained SuppliersPage
          <SuppliersPage navigate={setCurrentPage} />
        );
      case "main":
      default:
        return <SettingsMenu navigate={setCurrentPage} />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            {currentPage === "main"
              ? "Manage your store and account settings."
              : "Update your settings below."}
          </p>
        </div>

        {/* Content Area */}
        {renderPage()}
      </div>
    </div>
  );
}
