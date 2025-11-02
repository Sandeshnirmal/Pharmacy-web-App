import React, { useState, useEffect } from "react";
import { userAPI } from "../../api/apiService"; // Import userAPI

function PersonalInfoContent({ user, onUpdateUser }) {
  const [formData, setFormData] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  useEffect(() => {
    setFormData(user || {});
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      if (!user || !user.id) {
        throw new Error("User ID not found for update.");
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
      };

      await userAPI.updateUser(user.id, payload);
      setMessage("Profile updated successfully!");
      setMessageType("success");
      onUpdateUser(formData);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Personal Information
      </h2>
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
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="flex flex-col">
            <label
              htmlFor="first_name"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          {/* Last Name */}
          <div className="flex flex-col">
            <label
              htmlFor="last_name"
              className="text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name || ""}
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
            value={formData.email || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        {/* Phone */}
        <div className="flex flex-col">
          <label
            htmlFor="phone_number"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Phone
            </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Save Button */}
        <div className="text-right pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-400 text-black font-semibold py-2 px-6 rounded-full transition-all duration-300 hover:bg-green-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PersonalInfoContent;
