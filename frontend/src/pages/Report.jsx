// SalesReportsAnalysisPage.jsx
import React, { useState, useEffect } from "react";
// Using icons relevant for sales/orders: ShoppingCart, CheckCircle, Clock, XCircle, Search, Eye
// Added icons for summary stats: DollarSign, Package, RefreshCcw (for returned), Ban (for cancelled)
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Eye,
  Package,
  DollarSign,
  RefreshCcw,
  Ban,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance"; // Assuming you have an axiosInstance configured

const SalesReportsAnalysisPage = () => {
  // State to hold the list of sales orders/reports
  const [salesReports, setSalesReports] = useState([]);
  // State to manage loading status during API calls
  const [loading, setLoading] = useState(true);
  // State to store any error messages
  const [error, setError] = useState(null);
  // State to hold the ID of the currently selected report for detail view (will not be directly triggered by table anymore)
  const [selectedReportId, setSelectedReportId] = useState(null);
  // State for search term to filter reports
  const [searchTerm, setSearchTerm] = useState("");
  // State for filter by order status (e.g., 'all', 'completed', 'pending', 'cancelled', 'returned')
  const [statusFilter, setStatusFilter] = useState("all");

  // useEffect hook to fetch sales reports when the component mounts or filters change
  useEffect(() => {
    fetchSalesReports();
  }, [statusFilter]); // Re-fetch when statusFilter changes

  // Function to simulate fetching sales reports from an API
  const fetchSalesReports = async () => {
    setLoading(true); // Set loading to true before fetching
    setError(null); // Clear previous errors

    try {
      // --- MOCK API CALL ---
      // In a real application, you would replace this with your actual API endpoint
      // Example: const response = await axiosInstance.get('/api/sales-reports');
      // For demonstration, we'll use a setTimeout to simulate network delay and mock data.

      const mockSalesReports = [
        {
          orderId: "ORD001",
          customerName: "Alice Johnson",
          email: "alice.j@example.com",
          orderDate: "2023-07-20T10:30:00Z",
          totalAmount: 125.5,
          status: "completed", // 'completed', 'pending', 'cancelled', 'returned'
          items: [
            {
              productId: "MED001",
              name: "Painkiller 500mg",
              quantity: 2,
              price: 10.25,
            },
            {
              productId: "SUP005",
              name: "Vitamin C 1000mg",
              quantity: 1,
              price: 15.0,
            },
          ],
          shippingAddress: "123 Main St, Anytown, USA",
          paymentMethod: "Credit Card",
        },
        {
          orderId: "ORD002",
          customerName: "Bob Williams",
          email: "bob.w@example.com",
          orderDate: "2023-07-19T14:00:00Z",
          totalAmount: 45.99,
          status: "pending",
          items: [
            {
              productId: "COS010",
              name: "Sunscreen SPF30",
              quantity: 1,
              price: 25.99,
            },
            {
              productId: "MED006",
              name: "Cough Drops",
              quantity: 2,
              price: 5.0,
            },
          ],
          shippingAddress: "456 Oak Ave, Otherville, USA",
          paymentMethod: "PayPal",
        },
        {
          orderId: "ORD003",
          customerName: "Charlie Brown",
          email: "charlie.b@example.com",
          orderDate: "2023-07-18T09:15:00Z",
          totalAmount: 200.0,
          status: "cancelled",
          items: [
            {
              productId: "MED002",
              name: "Cough Syrup",
              quantity: 1,
              price: 12.0,
            },
            {
              productId: "MED003",
              name: "Bandages (pack)",
              quantity: 3,
              price: 5.0,
            },
            {
              productId: "SUP002",
              name: "Multivitamin",
              quantity: 1,
              price: 15.0,
            },
          ],
          shippingAddress: "789 Pine Ln, Somewhere, USA",
          paymentMethod: "Credit Card",
        },
        {
          orderId: "ORD004",
          customerName: "Diana Prince",
          email: "diana.p@example.com",
          orderDate: "2023-07-17T11:45:00Z",
          totalAmount: 75.2,
          status: "completed",
          items: [
            {
              productId: "SUP001",
              name: "Protein Powder",
              quantity: 1,
              price: 75.2,
            },
          ],
          shippingAddress: "101 Elm St, Villagetown, USA",
          paymentMethod: "Debit Card",
        },
        {
          orderId: "ORD005",
          customerName: "Eve Adams",
          email: "eve.a@example.com",
          orderDate: "2023-07-16T16:20:00Z",
          totalAmount: 30.0,
          status: "pending",
          items: [
            {
              productId: "MED004",
              name: "Allergy Relief",
              quantity: 1,
              price: 30.0,
            },
          ],
          shippingAddress: "222 River Rd, Cityville, USA",
          paymentMethod: "Credit Card",
        },
        {
          orderId: "ORD006",
          customerName: "Frank Green",
          email: "frank.g@example.com",
          orderDate: "2023-07-15T10:00:00Z",
          totalAmount: 50.0,
          status: "returned", // Added a returned status order
          items: [
            {
              productId: "SKN001",
              name: "Moisturizer",
              quantity: 1,
              price: 50.0,
            },
          ],
          shippingAddress: "333 Forest Ave, Treeland, USA",
          paymentMethod: "Credit Card",
        },
        {
          orderId: "ORD007",
          customerName: "Grace Hall",
          email: "grace.h@example.com",
          orderDate: "2023-07-14T11:00:00Z",
          totalAmount: 25.0,
          status: "completed",
          items: [
            {
              productId: "MED007",
              name: "Hand Sanitizer",
              quantity: 2,
              price: 12.5,
            },
          ],
          shippingAddress: "444 Lake Dr, Waterway, USA",
          paymentMethod: "PayPal",
        },
      ];

      // Simulate filtering by status
      const filteredMockReports =
        statusFilter === "all"
          ? mockSalesReports
          : mockSalesReports.filter((report) => report.status === statusFilter);

      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

      setSalesReports(filteredMockReports); // Update state with fetched/filtered reports
    } catch (err) {
      console.error("Error fetching sales reports:", err);
      setError("Failed to load sales reports. Please try again.");
    } finally {
      setLoading(false); // Set loading to false after operation
    }
  };

  // Get the currently selected report object
  const selectedReport = salesReports.find(
    (report) => report.orderId === selectedReportId
  );

  // Filter reports based on search term (client-side filtering for simplicity)
  const filteredSalesReports = salesReports.filter(
    (report) =>
      report.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) // Search within item names
  );

  // --- Calculate Summary Statistics ---
  // Total Sales: Sum of totalAmount for all non-cancelled orders
  const totalSales = salesReports
    .reduce(
      (sum, report) =>
        report.status !== "cancelled" ? sum + report.totalAmount : sum,
      0
    )
    .toFixed(2);

  // Total Number of Orders
  const totalOrders = salesReports.length;

  // Number of Pending Orders
  const pendingOrders = salesReports.filter(
    (report) => report.status === "pending"
  ).length;

  // Number of Completed Orders
  const completedOrders = salesReports.filter(
    (report) => report.status === "completed"
  ).length;

  // Number of Cancelled Orders
  const cancelledOrders = salesReports.filter(
    (report) => report.status === "cancelled"
  ).length;

  // Number of Returned Orders (newly added status)
  const returnedOrders = salesReports.filter(
    (report) => report.status === "returned"
  ).length;

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading sales data...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
        <button
          onClick={fetchSalesReports}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
          Sales & Report Analysis
        </h1>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {/* Total Sales Card */}
          <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
              <DollarSign size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalSales}
              </p>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
              <ShoppingCart size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalOrders}
              </p>
            </div>
          </div>

          {/* Pending Orders Card */}
          <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pending Orders
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingOrders}
              </p>
            </div>
          </div>

          {/* Completed Orders Card */}
          <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Completed Orders
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedOrders}
              </p>
            </div>
          </div>

          {/* Cancelled Orders Card */}
          <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-full">
              <Ban size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cancelled Orders
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {cancelledOrders}
              </p>
            </div>
          </div>

          {/* Returned Orders Card */}
          <div className="bg-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full">
              <RefreshCcw size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Returned Orders
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {returnedOrders}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section (retained for future use or if you add a different display) */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by Order ID, customer, or product..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label
              htmlFor="statusFilter"
              className="text-gray-700 text-sm font-medium"
            >
              Status:
            </label>
            <select
              id="statusFilter"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>{" "}
              {/* Added returned status */}
            </select>
          </div>
        </div>

        {/* Removed the Sales Reports List Table as requested */}
        {/* The detail view is still present, but won't be triggered directly without a table row click */}

        {/* Sales Report Detail View (Modal-like) */}
        {selectedReport && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in-up">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details: {selectedReport.orderId}
                </h2>
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Customer Name:
                  </p>
                  <p className="text-lg text-gray-900">
                    {selectedReport.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email:</p>
                  <p className="text-lg text-gray-900">
                    {selectedReport.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Order Date:
                  </p>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedReport.orderDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Amount:
                  </p>
                  <p className="text-lg text-gray-900 font-semibold text-green-700">
                    ${selectedReport.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status:</p>
                  <p className="text-lg text-gray-900">
                    {selectedReport.status === "pending" && (
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <Clock size={16} className="mr-2" /> Pending
                      </span>
                    )}
                    {selectedReport.status === "completed" && (
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle size={16} className="mr-2" /> Completed
                      </span>
                    )}
                    {selectedReport.status === "cancelled" && (
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <XCircle size={16} className="mr-2" /> Cancelled
                      </span>
                    )}
                    {selectedReport.status === "returned" && (
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        <RefreshCcw size={16} className="mr-2" /> Returned
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Shipping Address:
                  </p>
                  <p className="text-lg text-gray-900">
                    {selectedReport.shippingAddress}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Payment Method:
                  </p>
                  <p className="text-lg text-gray-900">
                    {selectedReport.paymentMethod}
                  </p>
                </div>
                {selectedReport.items && selectedReport.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Items Ordered:
                    </p>
                    <ul className="list-disc list-inside text-gray-800 space-y-1">
                      {selectedReport.items.map((item, index) => (
                        <li key={index} className="text-base">
                          {item.name} (x{item.quantity}) - $
                          {item.price.toFixed(2)} each
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReportsAnalysisPage;
