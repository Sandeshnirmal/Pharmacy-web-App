import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useLocation } from "react-router-dom"; // Import useLocation
import { productAPI } from "../api/apiService.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { ProductListSection } from "../components/ProductListSection.jsx";
import { ProductFilters } from "../components/ProductFilters.jsx"; // Import the new ProductFilters component
import { useCart } from "../context/CartContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

function Shop() {
  const location = useLocation(); // Initialize useLocation
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    search: "",
    filterLogic: "and",
  });
  const [segment, setSegment] = useState("all");
  const [localSearchInput, setLocalSearchInput] = useState("");
  const [localCategoryInput, setLocalCategoryInput] = useState(""); // New local state for category
  const [localFilterLogicInput, setLocalFilterLogicInput] = useState("and"); // New local state for filter logic

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10); // You can make this configurable
  const [totalProducts, setTotalProducts] = useState(0);

  // Effect to update filters after debounce for search, category, and filter logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        search: localSearchInput,
        category: localCategoryInput,
        filterLogic: localFilterLogicInput,
      }));
      setCurrentPage(1); // Reset to first page on new search/filter change
    }, 500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchInput, localCategoryInput, localFilterLogicInput]); // Dependencies for debounce

  // Effect to read URL parameters on initial load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    const searchParam = queryParams.get('search');
    const filterLogicParam = queryParams.get('filter_logic');

    // Initialize local states from URL params
    setLocalCategoryInput(categoryParam || "");
    setLocalSearchInput(searchParam || "");
    setLocalFilterLogicInput(filterLogicParam || "and");

    // Also update filters immediately for initial load, without debounce
    setFilters((prevFilters) => ({
      ...prevFilters,
      category: categoryParam || "",
      search: searchParam || "",
      filterLogic: filterLogicParam || "and",
    }));
  }, [location.search]); // Re-run if URL search params change

  const fetchShopData = useCallback(async (currentFilters, currentSegment, currentPage, productsPerPage) => {
    try {
      setLoading(true);
      setProducts([]); // Clear products immediately when a new fetch starts to prevent stale data flicker
      // Fetch categories
      const categoriesResponse = await productAPI.getCategories();
      setCategories(categoriesResponse.data);

      // Construct query parameters for products
      const queryParams = {
        category: currentFilters.category || undefined,
        min_price: currentFilters.minPrice || undefined,
        max_price: currentFilters.maxPrice || undefined,
        search: currentFilters.search || undefined,
        filter_logic: currentFilters.filterLogic || undefined, // Send filterLogic to backend
      };

      // Add segment specific parameters
      if (currentSegment === "featured") {
        queryParams.is_featured = true;
      } else if (currentSegment === "on_sale") {
        queryParams.on_sale = true;
      }

      // Fetch products based on filters, segment, and pagination
      const productsResponse = await productAPI.getProducts(currentPage, productsPerPage, queryParams);

      const fetchedProducts = productsResponse.data
        .filter(p => p.current_batch !== null) // Filter out products with null current_batch
        .map(p => ({
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
      setTotalProducts(productsResponse.data.length);
    } catch (err) {
      console.error("Error fetching shop data:", err);
      setError("Failed to load shop data.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProducts, setCategories, setError, setTotalProducts]); // Added dependencies for useCallback

  useEffect(() => {
    fetchShopData(filters, segment, currentPage, productsPerPage);
  }, [fetchShopData, filters, segment, currentPage, productsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCategoryFilterChange = (e) => {
    setLocalCategoryInput(e.target.value); // Update local state, which will trigger debounce
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <ProductFilters
            localSearchInput={localSearchInput}
            handleSearchInputChange={handleSearchInputChange}
            localCategoryInput={localCategoryInput}
            handleCategoryFilterChange={handleCategoryFilterChange}
            localFilterLogicInput={localFilterLogicInput}
            setLocalFilterLogicInput={setLocalFilterLogicInput}
            categories={categories}
          />
        </div>

        <div id="filter-select" className="md:col-span-3">
          <div className="mb-8 flex items-center space-x-4 border-b border-gray-200">
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

          <ProductListSection
            products={products}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalProducts={totalProducts}
            productsPerPage={productsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Shop;
