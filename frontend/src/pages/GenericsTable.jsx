import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { productAPI } from "../api/apiService"; // Using centralized API service

const GenericsTable = () => {
  // State Management
  const [activeTab, setActiveTab] = useState("compositions"); // Default tab
  const [compositionsData, setCompositionsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetches the list of categories. This is the single source of truth for category data.
  const fetchCategories = () => {
    // If the active tab is 'categories', show the loading spinner for the table.
    if (activeTab === "categories") setIsLoading(true);
    productAPI
      .getCategories()
      .then((res) => {
        setCategoriesData(res.data.results || res.data); // Handle potential pagination
      })
      .catch((err) => console.error("Error fetching categories:", err))
      .finally(() => {
        if (activeTab === "categories") setIsLoading(false);
      });
  };

  // Fetches the list of compositions.
  const fetchCompositions = () => {
    setIsLoading(true);
    productAPI
      .getCompositions()
      .then((res) => {
        setCompositionsData(res.data.results || res.data); // Handle potential pagination
      })
      .catch((err) => console.error("Error fetching compositions:", err))
      .finally(() => setIsLoading(false));
  };

  // Fetch categories once on initial load for the dropdown.
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch data for the visible table when the active tab changes.
  useEffect(() => {
    if (activeTab === "compositions") {
      fetchCompositions();
    } else {
      // Re-fetch categories to ensure the table is up-to-date.
      fetchCategories();
    }
  }, [activeTab]);

  const handleAddNew = () => {
    // Reset form data based on the active tab
    if (activeTab === "compositions") {
      setFormData({
        name: "",
        description: "",
        scientific_name: "",
        category: "",
        contraindications: "",
        side_effects: "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Main handler for form submission, delegates to specific handlers
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "compositions") {
      handleCompositionSubmit();
    } else {
      handleCategorySubmit();
    }
  };

  // Handles submitting a new category
  const handleCategorySubmit = async () => {
    try {
      await productAPI.createCategory(formData);
      setShowModal(false);
      // Refetch categories. This updates both the dropdown list and the table view.
      fetchCategories();
    } catch (err) {
      console.error(
        "Error adding category:",
        err.response ? err.response.data : err
      );
      // You could add a user-facing error message here
    }
  };

  // Handles submitting a new composition
  const handleCompositionSubmit = async () => {
    try {
      const payload = { ...formData };
      if (payload.category) {
        payload.category = parseInt(payload.category, 10);
      }
      await productAPI.createComposition(payload);
      setShowModal(false);
      // Refetch compositions to update the table.
      fetchCompositions();
    } catch (err) {
      console.error(
        "Error submitting composition:",
        err.response ? err.response.data : err
      );
      // You could add a user-facing error message here
    }
  };

  // Helper to find category name from its ID
  const getCategoryName = (categoryId) => {
    const category = categoriesData.find((c) => c.id === categoryId);
    return category ? category.name : "N/A";
  };

  // Render the table based on the active tab
  const renderTable = () => {
    if (isLoading) {
      return <p className="text-center py-8">Loading...</p>;
    }

    const isCompositions = activeTab === "compositions";
    const data = isCompositions ? compositionsData : categoriesData;

    if (!data || data.length === 0) {
      return <p className="text-center py-8">No data available.</p>;
    }

    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                {isCompositions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scientific Name
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                {isCompositions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {item.name}
                  </td>
                  {isCompositions && (
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {item.scientific_name || "N/A"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.description}
                  </td>
                  {isCompositions && (
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {getCategoryName(item.category)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render the modal form
  const renderModal = () => {
    if (!showModal) return null;

    const isCompositions = activeTab === "compositions";

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
          <h2 className="text-xl font-semibold mb-4 capitalize">
            Add {activeTab.slice(0, -1)}
          </h2>
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleFormChange}
                  required
                  className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              {isCompositions && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Scientific Name
                    </label>
                    <input
                      type="text"
                      name="scientific_name"
                      value={formData.scientific_name || ""}
                      onChange={handleFormChange}
                      className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category || ""}
                      onChange={handleFormChange}
                      required
                      className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white"
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categoriesData.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
                />
              </div>
              {isCompositions && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contraindications
                    </label>
                    <textarea
                      name="contraindications"
                      value={formData.contraindications || ""}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Side Effects
                    </label>
                    <textarea
                      name="side_effects"
                      value={formData.side_effects || ""}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter">
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "compositions"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("compositions")}
        >
          Compositions
        </button>
        <button
          className={`pb-2 px-4 font-medium ${
            activeTab === "categories"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 capitalize">
          {activeTab}
        </h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md"
        >
          Add New
        </button>
      </div>

      {renderTable()}
      {renderModal()}
    </div>
  );
};

export default GenericsTable;
