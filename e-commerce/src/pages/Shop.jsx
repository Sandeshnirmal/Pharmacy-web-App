import React, { useState, useEffect } from "react";
import { productAPI } from "../api/apiService.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });
  const [segment, setSegment] = useState("all");
  const [localSearchInput, setLocalSearchInput] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10); // You can make this configurable
  const [totalProducts, setTotalProducts] = useState(0);

  // Effect to update filters.search after debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prevFilters) => ({ ...prevFilters, search: localSearchInput }));
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchInput]);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const categoriesResponse = await productAPI.getCategories();
        setCategories(categoriesResponse.data);

        // Construct query parameters for products
        const queryParams = {
          category_name: filters.category || undefined,
          min_price: filters.minPrice || undefined,
          max_price: filters.maxPrice || undefined,
          search: filters.search || undefined,
        };

        // Add segment specific parameters
        if (segment === "featured") {
          queryParams.is_featured = true;
        } else if (segment === "on_sale") {
          queryParams.on_sale = true;
        }

        // Fetch products based on filters, segment, and pagination
        const productsResponse = await productAPI.getProducts(currentPage, productsPerPage, queryParams);
        // console.log("Products API Response:", productsResponse); // Removed console log
        // console.log("Products API Data:", productsResponse.data); // Removed console log

        const fetchedProducts = productsResponse.data.map(p => ({ // Corrected to productsResponse.data.map
          id: p.id,
          category: p.category_name,
          name: p.name,
          description: p.description,
          online_mrp_price: p.current_batch.online_mrp_price,
          online_discount_percentage: p.current_batch.online_discount_percentage,
          online_selling_price: p.current_batch.online_selling_price,
          images: p.images && p.images.length > 0 ? [p.images[0].image_url] : ["https://via.placeholder.com/300x200?text=No+Image+Available"],
          fullDescription: p.description,
          usage: p.usage_instructions,
          ingredients: p.ingredients,
          reviews: [],
        }));
        setProducts(fetchedProducts);
        setTotalProducts(productsResponse.data.length); // Corrected to productsResponse.data.length
      } catch (err) {
        console.error("Error fetching shop data:", err);
        setError("Failed to load shop data.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [filters.category, filters.minPrice, filters.maxPrice, filters.search, segment, currentPage, productsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCategoryFilterChange = (e) => {
    const { value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, category: value }));
  };

  const handleSearchInputChange = (e) => {
    setLocalSearchInput(e.target.value);
  };

  const handleSegmentChange = (newSegment) => {
    setSegment(newSegment);
  };

  if (loading) {
    return <div className="text-center py-16">Loading shop...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Shop</h1>

      {/* Segment/Tab Navigation */}
      <div className="mb-8 flex space-x-4 border-b border-gray-200">
        <button
          className={`py-2 px-4 text-lg font-medium ${
            segment === "all" ? "border-b-2 border-green-500 text-green-600" : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => handleSegmentChange("all")}
        >
          All Products
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            segment === "featured" ? "border-b-2 border-green-500 text-green-600" : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => handleSegmentChange("featured")}
        >
          Featured
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium ${
            segment === "on_sale" ? "border-b-2 border-green-500 text-green-600" : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => handleSegmentChange("on_sale")}
        >
          On Sale
        </button>
      </div>

      {/* Filters Section (moved to top) */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleCategoryFilterChange}
              className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
              Search Products
            </label>
            <form onSubmit={(e) => e.preventDefault()}> {/* Add form with preventDefault */}
              <input
                type="text"
                id="search"
                name="search"
                placeholder="Search by name or description"
                value={localSearchInput} // Controlled by local state
                onChange={handleSearchInputChange} // Updates local state
                className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Product Listing */}
      <div>
          {products.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">No products found matching your criteria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalProducts > productsPerPage && (
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(Math.ceil(totalProducts / productsPerPage))].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 border rounded-md ${
                  currentPage === index + 1
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
              className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
    </div>
  );
}

export default Shop;
