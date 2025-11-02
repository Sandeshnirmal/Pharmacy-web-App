import React, { useState, useEffect } from "react";

function AddressBookContent({ addresses, onAddAddress, onUpdateAddress, onDeleteAddress }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // null or address object
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (editingAddress) {
      setFormData(editingAddress);
    } else {
      setFormData({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: '', // Assuming country is still part of the form
        address_type: 'Home', // Default address type
        landmark: '',
        is_default: false,
      });
    }
  }, [editingAddress, isAdding]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    try {
      if (editingAddress) {
        await onUpdateAddress(editingAddress.id, formData);
        setMessage("Address updated successfully!");
      } else {
        await onAddAddress(formData);
        setMessage("Address added successfully!");
      }
      setMessageType("success");
      setIsAdding(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Error saving address:", error);
      setMessage("Failed to save address. Please try again.");
      setMessageType("error");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Address Book</h2>
      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            messageType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {(isAdding || editingAddress) ? (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="address_line1"
              placeholder="Address Line 1"
              value={formData.address_line1 || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
            <input
              type="text"
              name="address_line2"
              placeholder="Address Line 2 (Optional)"
              value={formData.address_line2 || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="text"
              name="landmark"
              placeholder="Landmark (Optional)"
              value={formData.landmark || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={formData.pincode || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
            <select
              name="address_type"
              value={formData.address_type || 'Home'}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_default"
                id="is_default"
                checked={formData.is_default || false}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                Set as default address
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingAddress(null); }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses && addresses.length > 0 ? (
            addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 relative"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {address.address_type} {address.is_default && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
                </h3>
                <p className="text-gray-700">{address.address_line1}</p>
                {address.address_line2 && <p className="text-gray-700">{address.address_line2}</p>}
                <p className="text-gray-700">{address.city}, {address.state} - {address.pincode}</p>
                {address.landmark && <p className="text-gray-700">Landmark: {address.landmark}</p>}
                <p className="text-gray-700">{address.country}</p>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setEditingAddress(address)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteAddress(address.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No addresses found. Add a new one!</p>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            + Add New Address
          </button>
        </div>
      )}
    </div>
  );
}

export default AddressBookContent;
