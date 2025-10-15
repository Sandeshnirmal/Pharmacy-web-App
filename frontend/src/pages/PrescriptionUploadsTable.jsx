// PrescriptionUploadsTable.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance"; // Assumed Axios instance for API calls
import PrescriptionStatusBadge from "../components/prescription/PrescriptionStatusBadge";
import ConfidenceIndicator from "../components/prescription/ConfidenceIndicator";
import PriorityIndicator from "../components/prescription/PriorityIndicator";
import EnhancedPrescriptionDashboard from "../components/prescription/EnhancedPrescriptionDashboard"; // Component for dashboard view

const PrescriptionUploadsTable = () => {
  // State variables for managing prescriptions data, loading, errors, and UI filters
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true); // Indicates if data is currently being fetched
  const [error, setError] = useState(null); // Stores any error messages from API calls
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input
  const [statusFilter, setStatusFilter] = useState("all"); // State for the status filter dropdown
  const [showDashboard, setShowDashboard] = useState(true); // Toggles between table and dashboard view
  const [refreshing, setRefreshing] = useState(false); // Indicates if a refresh operation is in progress
  const [sortBy, setSortBy] = useState("upload_date"); // Current column being sorted
  const [sortOrder, setSortOrder] = useState("desc"); // Sort order: 'asc' or 'desc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // useEffect hook to fetch prescriptions whenever statusFilter, sortBy, or sortOrder changes
  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter, sortBy, sortOrder, currentPage, pageSize]); // Dependencies array: re-run effect if these states change

  // Function to fetch prescriptions from the API
  const fetchPrescriptions = async () => {
    try {
      setLoading(true); // Set loading to true before fetching data
      setError(null); // Clear any previous errors

      // Construct URLSearchParams for query parameters (sorting, filtering, searching)
      const params = new URLSearchParams({
        page: currentPage,
        page_size: pageSize,
        ordering: sortOrder === "desc" ? `-${sortBy}` : sortBy, // Add '-' for descending order
      });

      if (statusFilter !== "all") {
        params.append("verification_status", statusFilter); // Add status filter if not 'all'
      }

      if (searchTerm) {
        params.append("search", searchTerm); // Add search term if present
      }

      // Make GET request to the prescriptions API endpoint
      const response = await axiosInstance.get(
        `prescription/enhanced-prescriptions/?${params}` // Use enhanced-prescriptions endpoint
      );

      // Log the response data for debugging
      console.log(
        "Prescriptions API Response:",
        response.data
      );

      // Update prescriptions state with the fetched data
      setPrescriptions(response.data.results || []);
      setTotalItems(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / pageSize));
    } catch (err) {
      // Catch and handle any errors during the API call
      setError("Failed to fetch prescriptions. Please try again.");
      console.error("Error fetching prescriptions:", err);
    } finally {
      setLoading(false); // Set loading to false after fetch operation completes
    }
  };

  const handleReviewPrescription = (prescriptionId) => {
    navigate(`/Prescription/prescription-details/${prescriptionId}`);
  };

  // Handler for manual refresh button
  const handleRefresh = async () => {
    setRefreshing(true); // Indicate refresh is in progress
    await fetchPrescriptions(); // Re-fetch prescriptions
    setRefreshing(false); // Reset refreshing state
  };

  // Handler for sorting table columns
  const handleSort = (field) => {
    if (sortBy === field) {
      // If clicking the same column, toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new column, set it as sortBy and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter prescriptions based on the search term
  // This filtering happens client-side on the currently loaded data
  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      !searchTerm || // If no search term, include all
      prescription.user_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.user_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.id.toString().includes(searchTerm)
  );
  console.log("Filtered Prescriptions (Client-side):", filteredPrescriptions);

  // Conditional rendering for loading state
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          <p className="ml-3 text-gray-700">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  // Conditional rendering for error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-center">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Conditional rendering: if showDashboard is true, render the dashboard component
  // if (showDashboard) {
  //   return <EnhancedPrescriptionDashboard />;
  // }

  // Main render for the Prescription Uploads Table
  return (
    <div className="p-6 space-y-6">
      {/* Header section with title and toggle button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            All Prescriptions
          </h2>
          <p className="text-gray-600">
            Manage and review prescription uploads
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDashboard(true)} // Button to switch to dashboard view
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Dashboard View
          </button>
          <button
            onClick={handleRefresh} // Button to refresh the table data
            disabled={refreshing} // Disable button while refreshing
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Total Prescriptions
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {prescriptions.length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-yellow-700">
            Pending Review
          </div>
          <div className="text-2xl font-semibold text-yellow-900">
            {
              prescriptions.filter(
                (p) => p.verification_status === "Pending_Review"
              ).length
            }
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-green-700">Verified</div>
          <div className="text-2xl font-semibold text-green-900">
            {
              prescriptions.filter((p) => p.verification_status === "Verified")
                .length
            }
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-red-700">Rejected</div>
          <div className="text-2xl font-semibold text-red-900">
            {
              prescriptions.filter((p) => p.verification_status === "Rejected")
                .length
            }
          </div>
        </div>
      </div>

      {/* Filters and Search section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search input */}
          <div className="flex items-center space-x-4">
            <div className="relative w-full md:w-80">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by ID, patient name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status filter and Export button */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Uploaded">Uploaded</option>
                <option value="AI_Processed">AI Processed</option>
                <option value="Pending_Review">Pending Review</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Table displaying prescription data */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Table Header: ID (sortable) */}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    {sortBy === "id" && (
                      <span className="text-blue-500">
                        {sortOrder === "asc" ? "↑" : "↓"} {/* Sort indicator */}
                      </span>
                    )}
                  </div>
                </th>
                {/* Table Header: Patient */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coustomers
                </th>
                {/* Table Header: Upload Date (sortable) */}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("upload_date")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Upload Date</span>
                    {sortBy === "upload_date" && (
                      <span className="text-blue-500">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                {/* Table Header: Priority */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                {/* Table Header: AI Confidence */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Confidence
                </th>
                {/* Table Header: Status (sortable) */}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("verification_status")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortBy === "verification_status" && (
                      <span className="text-blue-500">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                {/* Table Header: Actions */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Map through filtered prescriptions to render table rows */}
              {filteredPrescriptions.map((prescription) => (
                <tr
                  key={prescription.line_number}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Prescription ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        #{prescription.id}
                      </div>
                    </div>
                  </td>

                  {/* Patient Information (Avatar, Name, Email) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {/* Display first initial of user's first name, or user_name, or 'U' as fallback */}
                            {prescription.user?.first_name?.[0] ||
                              prescription.user_name?.[0] ||
                              "U"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {/* Display full name or user_name fallback */}
                          {prescription.user?.first_name}{" "}
                          {prescription.user?.last_name}
                          {!prescription.user &&
                            (prescription.user_name || "Unknown User")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {/* Display email or 'No email' fallback */}
                          {prescription.user?.email ||
                            prescription.user_email ||
                            "No email"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Upload Date and Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(prescription.upload_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(prescription.upload_date).toLocaleTimeString()}
                    </div>
                  </td>

                  {/* Priority Indicator component */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityIndicator uploadDate={prescription.upload_date} />
                  </td>

                  {/* AI Confidence Indicator component */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ConfidenceIndicator
                      confidence={prescription.ai_confidence_score || 0}
                      size="sm"
                      showIcon={false}
                    />
                  </td>

                  {/* Prescription Status Badge component */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PrescriptionStatusBadge
                      status={prescription.verification_status}
                      size="sm"
                    />
                  </td>

                  {/* Actions column (Review, Order Status, More options) */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* Link to prescription review page */}
                      <Link
                        to={`/Prescription_Review/${prescription.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                      >
                        <Eye size={14} className="mr-1" />
                        Review
                      </Link>

                      {/* Conditionally display "Order Created" badge */}
                      {prescription.has_order && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Order Created
                        </span>
                      )}

                      {/* Button for more options (e.g., dropdown menu) */}
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state message when no prescriptions are found */}
        {filteredPrescriptions.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">
              No prescriptions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No prescriptions match your search criteria."
                : "No prescriptions have been uploaded yet."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when page size changes
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default PrescriptionUploadsTable;
