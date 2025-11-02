import React, { memo } from "react";

export const ProductFilters = memo(({
  localSearchInput,
  handleSearchInputChange,
  localCategoryInput,
  handleCategoryFilterChange,
  localFilterLogicInput,
  setLocalFilterLogicInput,
  categories
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Filters</h2>
      <div className="space-y-6">
        {/* Search Filter */}
        <div>
          <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
            Search Products
          </label>
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Search by name..."
              value={localSearchInput}
              onChange={handleSearchInputChange}
              className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </form>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={localCategoryInput}
            onChange={handleCategoryFilterChange}
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Logic Selector */}
        <div>
          <label htmlFor="filterLogic" className="block text-gray-700 text-sm font-bold mb-2">
            Filter Logic
          </label>
          <select
            id="filterLogic"
            name="filterLogic"
            value={localFilterLogicInput}
            onChange={(e) => setLocalFilterLogicInput(e.target.value)}
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
        </div>
      </div>
    </div>
  );
});
