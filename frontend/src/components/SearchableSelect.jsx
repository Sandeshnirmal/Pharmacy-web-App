import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

const SearchableSelect = ({
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Determine the display value for the input field
  const displayValue = selectedValue
    ? (typeof selectedValue === 'object' ? selectedValue[displayField] : options.find(opt => opt[valueField] === selectedValue)?.[displayField]) || ""
    : "";

  // Handle clicks outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced API search
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (onSearch && query.length > 0) {
        setIsLoading(true);
        try {
          const results = await onSearch(query);
          setSearchResults(results);
        } catch (error) {
          console.error("SearchableSelect API search error:", error);
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
    if (onSearch) {
      debouncedSearch(searchTerm);
    } else {
      if (searchTerm.length > 0) {
        const filtered = options.filter((item) =>
          item[displayField]?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } else {
        setSearchResults(options); // Show all options if no search term for local search
      }
    }
  }, [searchTerm, options, displayField, onSearch, debouncedSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectOption = (item) => {
    onSelect(item);
    setSearchTerm(item[displayField]); // Set input to selected item's display value
    setIsOpen(false);
  };

  const handleClearSelection = (e) => {
    e.stopPropagation(); // Prevent opening the dropdown
    onSelect(null); // Clear the selected value
    setSearchTerm(""); // Clear the search term
    setSearchResults(options); // Reset search results
  };

  // Simple debounce utility (can be moved outside if needed globally)
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative mt-1">
        <input
          type="text"
          value={searchTerm || displayValue} // Show search term if typing, else selected value
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          className="block w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {selectedValue && !readOnly && (
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

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-gray-500">Loading...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((item) => (
              <div
                key={item[valueField]}
                onClick={() => handleSelectOption(item)}
                className="p-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700"
              >
                {item[displayField]}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
