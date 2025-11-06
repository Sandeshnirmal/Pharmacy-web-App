import React, { useState, useEffect } from "react";
import { productAPI, apiUtils } from "../api/apiService";

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

const StoreSettingsForm = () => {
  const [storeName, setStoreName] = useState("My E-Commerce Store");
  const [address, setAddress] = useState(
    "123 Market St, San Francisco, CA 94103"
  );

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <InputField
        label="Store Name"
        id="storeName"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
      />
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Store Address
        </label>
        <textarea
          id="address"
          rows="3"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
      </div>
      <div className="text-right">
        <SaveButton />
      </div>
    </form>
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

const UnitManagementPage = ({ navigate }) => {
  const [productUnits, setProductUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [newUnit, setNewUnit] = useState({
    unit_name: "",
    unit_abbreviation: "",
    base_unit_name: "",
    base_unit_abbreviation: "",
    conversion_factor: "",
  });
  const [editingUnit, setEditingUnit] = useState(null);
  const [editUnitData, setEditUnitData] = useState({
    unit_name: "",
    unit_abbreviation: "",
    base_unit_name: "",
    base_unit_abbreviation: "",
    conversion_factor: "",
  });

  useEffect(() => {
    fetchProductUnits();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchProductUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.getProductUnits();
      const data = response.data;
      if (Array.isArray(data)) {
        setProductUnits(data);
        console.log(data)
      } else if (data && Array.isArray(data.results)) {
        setProductUnits(data.results);
      } else {
        console.warn("Unexpected API response format for product units.");
        setProductUnits([]);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      console.error("Error fetching product units:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createProductUnit(newUnit);
      setSuccessMessage("Product unit added successfully!");
      setNewUnit({
        unit_name: "",
        unit_abbreviation: "",
        base_unit_name: "",
        base_unit_abbreviation: "",
        conversion_factor: "",
      });
      fetchProductUnits();
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      console.error("Error adding product unit:", err);
    }
  };

  const handleEditClick = (unit) => {
    setEditingUnit(unit);
    setEditUnitData({
      unit_name: unit.unit_name,
      unit_abbreviation: unit.unit_abbreviation,
      base_unit_name: unit.base_unit_name,
      base_unit_abbreviation: unit.base_unit_abbreviation,
      conversion_factor: unit.conversion_factor,
    });
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    try {
      await productAPI.updateProductUnit(editingUnit.id, editUnitData);
      setSuccessMessage("Product unit updated successfully!");
      setEditingUnit(null);
      setEditUnitData({
        unit_name: "",
        unit_abbreviation: "",
        base_unit_name: "",
        base_unit_abbreviation: "",
        conversion_factor: "",
      });
      fetchProductUnits();
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      console.error("Error updating product unit:", err);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this product unit? This action cannot be undone."
      )
    ) {
      try {
        await productAPI.deleteProductUnit(unitId);
        setSuccessMessage("Product unit deleted successfully!");
        fetchProductUnits();
      } catch (err) {
        const errorInfo = apiUtils.handleError(err);
        setError(errorInfo.message);
        console.error("Error deleting product unit:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("main")}
        className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Settings
      </button>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <ScaleIcon className="w-5 h-5 mr-3 text-gray-500" />
            {editingUnit ? "Edit Product Unit" : "Add New Product Unit"}
          </h3>
        </div>
        <form
          className="p-5 space-y-4"
          onSubmit={editingUnit ? handleUpdateUnit : handleAddUnit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Unit Name"
              id="unitName"
              value={editingUnit ? editUnitData.unit_name : newUnit.unit_name}
              onChange={(e) =>
                editingUnit
                  ? setEditUnitData({ ...editUnitData, unit_name: e.target.value })
                  : setNewUnit({ ...newUnit, unit_name: e.target.value })
              }
              placeholder="e.g., Strip"
              required
            />
            <InputField
              label="Unit Abbreviation"
              id="unitAbbreviation"
              value={
                editingUnit
                  ? editUnitData.unit_abbreviation
                  : newUnit.unit_abbreviation
              }
              onChange={(e) =>
                editingUnit
                  ? setEditUnitData({
                      ...editUnitData,
                      unit_abbreviation: e.target.value,
                    })
                  : setNewUnit({ ...newUnit, unit_abbreviation: e.target.value })
              }
              placeholder="e.g., strip"
            />
            <InputField
              label="Base Unit Name"
              id="baseUnitName"
              value={
                editingUnit
                  ? editUnitData.base_unit_name
                  : newUnit.base_unit_name
              }
              onChange={(e) =>
                editingUnit
                  ? setEditUnitData({
                      ...editUnitData,
                      base_unit_name: e.target.value,
                    })
                  : setNewUnit({ ...newUnit, base_unit_name: e.target.value })
              }
              placeholder="e.g., Tablet"
              required
            />
            <InputField
              label="Base Unit Abbreviation"
              id="baseUnitAbbreviation"
              value={
                editingUnit
                  ? editUnitData.base_unit_abbreviation
                  : newUnit.base_unit_abbreviation
              }
              onChange={(e) =>
                editingUnit
                  ? setEditUnitData({
                      ...editUnitData,
                      base_unit_abbreviation: e.target.value,
                    })
                  : setNewUnit({
                      ...newUnit,
                      base_unit_abbreviation: e.target.value,
                    })
              }
              placeholder="e.g., tab"
            />
            <InputField
              label="Conversion Factor"
              id="conversionFactor"
              type="number"
              value={
                editingUnit
                  ? editUnitData.conversion_factor
                  : newUnit.conversion_factor
              }
              onChange={(e) =>
                editingUnit
                  ? setEditUnitData({
                      ...editUnitData,
                      conversion_factor: e.target.value,
                    })
                  : setNewUnit({ ...newUnit, conversion_factor: e.target.value })
              }
              placeholder="e.g., 10 (for 1 strip = 10 tablets)"
              required
            />
          </div>
          <div className="text-right flex justify-end space-x-3 pt-2">
            {editingUnit && (
              <button
                type="button"
                onClick={() => setEditingUnit(null)}
                className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel Edit
              </button>
            )}
            <SaveButton>{editingUnit ? "Update Unit" : "Add Unit"}</SaveButton>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            Existing Product Units
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abbreviation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Unit Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Unit Abbreviation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Factor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productUnits.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No product units found.
                  </td>
                </tr>
              )}
              {productUnits.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {unit.unit_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unit.unit_abbreviation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unit.base_unit_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unit.base_unit_abbreviation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {unit.conversion_factor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEditClick(unit)}
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- NEW SUPPLIER COMPONENTS ---

const mockSuppliers = [
  {
    id: 1,
    name: "Acme Widgets",
    email: "contact@acme.com",
    phone: "123-456-7890",
    address: "123 Industrial Rd",
    gst: "GSTIN12345",
  },
  {
    id: 2,
    name: "Global Textiles",
    email: "sales@global.com",
    phone: "987-654-3210",
    address: "456 Fabric Way",
    gst: "GSTIN67890",
  },
];

const SupplierList = ({ suppliers, onAddClick, onViewClick, onEditClick }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-5 border-b border-gray-200 sm:flex sm:justify-between sm:items-center">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3 sm:mb-0">
        <TruckIcon className="w-5 h-5 mr-3 text-gray-500" />
        Suppliers
      </h3>
      <button
        onClick={onAddClick}
        className="inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
          {suppliers.length === 0 && (
            <tr>
              <td
                colSpan="4"
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No suppliers found.
              </td>
            </tr>
          )}
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {supplier.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {supplier.email || supplier.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {supplier.gst}
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert("Please fill out at least Supplier Name."); // Simple validation
      return;
    }
    onSave({ name, email, phone, address, gst });
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
            id="supplierName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Acme Widgets"
          />
          <InputField
            label="GST Number"
            id="gstNumber"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            placeholder="e.g., GSTIN12345"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Contact Email"
            id="supplierEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., contact@acme.com"
          />
          <InputField
            label="Contact Phone"
            id="supplierPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., (123) 456-7890"
          />
        </div>
        <div>
          <label
            htmlFor="supplierAddress"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="supplierAddress"
            rows="3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Industrial Rd, Suite 500..."
          ></textarea>
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
  const [name, setName] = useState(supplier.name);
  const [email, setEmail] = useState(supplier.email);
  const [phone, setPhone] = useState(supplier.phone);
  const [address, setAddress] = useState(supplier.address);
  const [gst, setGst] = useState(supplier.gst);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert("Please fill out at least Supplier Name."); // Simple validation
      return;
    }
    onSave({ ...supplier, name, email, phone, address, gst });
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
            id="supplierName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Acme Widgets"
          />
          <InputField
            label="GST Number"
            id="gstNumber"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            placeholder="e.g., GSTIN12345"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Contact Email"
            id="supplierEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., contact@acme.com"
          />
          <InputField
            label="Contact Phone"
            id="supplierPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., (123) 456-7890"
          />
        </div>
        <div>
          <label
            htmlFor="supplierAddress"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="supplierAddress"
            rows="3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Industrial Rd, Suite 500..."
          ></textarea>
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
          className="inline-flex items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mt-3 sm:mt-0"
        >
          Back to List
        </button>
      </div>
      <div className="p-5 space-y-4">
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
          <span className="text-md text-gray-900">{supplier.gst || "N/A"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">Address</span>
          <span className="text-md text-gray-900 whitespace-pre-line">
            {supplier.address || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

const SuppliersPage = ({ navigate }) => {
  const [view, setView] = useState("list"); // 'list', 'add', 'view', 'edit'
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const handleAddSupplier = (newSupplier) => {
    setSuppliers([
      ...suppliers,
      { ...newSupplier, id: suppliers.length + 1 + Math.random() },
    ]);
    setView("list");
  };

  const handleUpdateSupplier = (updatedSupplier) => {
    setSuppliers(
      suppliers.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
    );
    setView("list");
  };

  const showViewPage = (supplier) => {
    setSelectedSupplier(supplier);
    setView("view");
  };

  const showEditPage = (supplier) => {
    setSelectedSupplier(supplier);
    setView("edit");
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

      {view === "list" && (
        <SupplierList
          suppliers={suppliers}
          onAddClick={() => setView("add")}
          onViewClick={showViewPage}
          onEditClick={showEditPage}
        />
      )}

      {view === "add" && (
        <AddSupplierForm
          onSave={handleAddSupplier}
          onCancel={() => setView("list")}
        />
      )}

      {view === "edit" && selectedSupplier && (
        <EditSupplierForm
          supplier={selectedSupplier}
          onSave={handleUpdateSupplier}
          onCancel={() => setView("list")}
        />
      )}

      {view === "view" && selectedSupplier && (
        <SupplierDetails
          supplier={selectedSupplier}
          onClose={() => setView("list")}
        />
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
        title="Product Units"
        icon={<ScaleIcon />}
        onClick={() => navigate("units")}
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
          <SettingsPageWrapper
            title="Store Details"
            icon={<StoreIcon />}
            navigate={setCurrentPage}
          >
            <StoreSettingsForm />
          </SettingsPageWrapper>
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
      case "units":
        return (
          <UnitManagementPage navigate={setCurrentPage} />
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
