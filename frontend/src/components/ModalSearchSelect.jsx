  import React, { useState, useCallback, useEffect } from 'react';
  import { Search, X } from 'lucide-react';

  const ModalSearchSelect = ({
    label,
    placeholder,
    options, // Array of objects for local search, or empty for API search
    onSelect, // (selectedItem) => void
    selectedValue, // The currently selected item object or ID
    displayField, // Key to display in the list (e.g., 'name')
    valueField, // Key to use as the actual value (e.g., 'id')
    onSearch, // (searchTerm) => Promise<Array> for API-driven search
    readOnly = false,
    required = false,
    className = "",
    searchDelay = 300, // Debounce delay for API search
    columns = [], // [{ header: 'Header', field: 'fieldName' }] for displaying details
  }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [internalSelectedValue, setInternalSelectedValue] = useState(selectedValue);

    // Update internal selected value when prop changes
    useEffect(() => {
      setInternalSelectedValue(selectedValue);
    }, [selectedValue]);

    // Determine the display value for the input field
    const displayValue = internalSelectedValue
      ? (typeof internalSelectedValue === 'object' ? internalSelectedValue[displayField] : options?.find(opt => opt[valueField] === internalSelectedValue)?.[displayField]) || ""
      : "";

    // Debounce utility
    const debounce = (func, delay) => {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
      };
    };

    // Debounced API search
    const debouncedSearch = useCallback(
      debounce(async (query) => {
        if (onSearch && query.length > 0) {
          setIsLoading(true);
          try {
            const results = await onSearch(query);
            setSearchResults(results);
          } catch (error) {
            console.error("ModalSearchSelect API search error:", error);
            setSearchResults([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setSearchResults([]);
        }
      }, searchDelay),
      [onSearch, searchDelay]
    );

    // Local search or trigger API search
    useEffect(() => {
      if (isModalOpen) {
        if (onSearch) {
          debouncedSearch(searchTerm);
        } else {
          if (searchTerm.length > 0) {
            const filtered = (options || []).filter((item) =>
              item[displayField]?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(filtered);
          } else {
            setSearchResults(options || []); // Show all options if no search term for local search, default to empty array
          }
        }
      }
    }, [searchTerm, options, displayField, onSearch, debouncedSearch, isModalOpen]);

    const handleOpenModal = () => {
      if (!readOnly) {
        setIsModalOpen(true);
        setSearchTerm(displayValue); // Initialize search term with current display value
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSearchTerm(""); // Clear search term on close
    };

    const handleSelectOption = (item) => {
      onSelect(item);
      setInternalSelectedValue(item);
      handleCloseModal();
    };

    const handleClearSelection = (e) => {
      e.stopPropagation();
      onSelect(null);
      setInternalSelectedValue(null);
      setSearchTerm("");
    };

    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative mt-1">
          <input
            type="text"
            value={displayValue}
            onFocus={handleOpenModal}
            placeholder={placeholder}
            readOnly={true} // Always read-only, interaction is via modal
            required={required}
            className="block w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          {internalSelectedValue && !readOnly && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label="Clear selection"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
              <div className="flex justify-between items-center pb-3 border-b mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{label || "Select Item"}</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${label?.toLowerCase() || "items"}...`}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : searchResults.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {columns.map((col, idx) => (
                          <th
                            key={idx}
                            scope="col"
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col.header}
                          </th>
                        ))}
                        <th scope="col" className="relative px-4 py-2">
                          <span className="sr-only">Select</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.map((item) => (
                        <tr key={item[valueField]} className="hover:bg-gray-50">
                          {columns.map((col, idx) => (
                            <td key={idx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {item[col.field]}
                            </td>
                          ))}
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleSelectOption(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-gray-500">No results found.</div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default ModalSearchSelect;
