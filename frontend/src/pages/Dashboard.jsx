import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ModernStatsCard from '../components/ModernStatsCard';
import useRealTimeData from '../hooks/useRealTimeData';
import { orderAPI, prescriptionAPI, userAPI, productAPI, apiUtils } from '../api/apiService';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

function DashboardMainContent() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalOrders: 0,
      totalPrescriptions: 0,
      pendingReviews: 0,
      totalRevenue: 0,
      activeUsers: 0,
      lowStockItems: 0
    },
    recentOrders: [],
    recentPrescriptions: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartData, setChartData] = useState({
    salesOverTime: {
      labels: [],
      datasets: []
    },
    productCategories: {
      labels: [],
      datasets: []
    },
    orderStatusDistribution: {
      labels: [],
      datasets: []
    }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all required data in parallel using apiService
      const [ordersRes, prescriptionsRes, usersRes, productsRes] =
        await Promise.all([
          orderAPI.getOrders(),
          prescriptionAPI.getPrescriptions(),
          userAPI.getUsers(),
          productAPI.getProducts(),
        ]);

      const orders = ordersRes.data.results || ordersRes.data;
      const prescriptions = prescriptionsRes.data.results || prescriptionsRes.data;
      const users = usersRes.data.results || usersRes.data;
      const products = productsRes.data.results || productsRes.data;

      // Calculate statistics
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const pendingReviews = prescriptions.filter(p => p.verification_status === 'Pending_Review').length;
      const lowStockProducts = products.filter(p => p.stock_quantity && p.stock_quantity < 10);

      const newDashboardData = {
        stats: {
          totalOrders: orders.length,
          totalPrescriptions: prescriptions.length,
          pendingReviews,
          totalRevenue,
          activeUsers: users.filter(u => u.is_active).length,
          lowStockItems: lowStockProducts.length
        },
        recentOrders: orders.slice(0, 5),
        recentPrescriptions: prescriptions.slice(0, 5),
        lowStockProducts: lowStockProducts.slice(0, 5)
      };
      setDashboardData(newDashboardData);
      setLastUpdated(new Date());

      // Process data for charts
      const salesByMonth = orders.reduce((acc, order) => {
        const month = new Date(order.order_date).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + parseFloat(order.total_amount || 0);
        return acc;
      }, {});

      const productCategoryCounts = products.reduce((acc, product) => {
        const categoryName = product.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      const orderStatusCounts = orders.reduce((acc, order) => {
        acc[order.order_status] = (acc[order.order_status] || 0) + 1;
        return acc;
      }, {});

      setChartData({
        salesOverTime: {
          labels: Object.keys(salesByMonth),
          datasets: [{
            label: 'Sales Revenue',
            data: Object.values(salesByMonth),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        productCategories: {
          labels: Object.keys(productCategoryCounts),
          datasets: [{
            label: 'Product Categories',
            data: Object.values(productCategoryCounts),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        orderStatusDistribution: {
          labels: Object.keys(orderStatusCounts),
          datasets: [{
            label: 'Order Status',
            data: Object.values(orderStatusCounts),
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)', // Delivered
              'rgba(54, 162, 235, 0.6)', // Shipped
              'rgba(255, 206, 86, 0.6)', // Processing
              'rgba(255, 99, 132, 0.6)', // Cancelled
              'rgba(153, 102, 255, 0.6)' // Default/Other
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }]
        }
      });

      return { data: newDashboardData }; // Return the data in the expected format
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message || 'Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
      throw err; // Re-throw the error so useRealTimeData can catch it
    } finally {
      setLoading(false);
    }
  }, [setLoading, setDashboardData, setLastUpdated, setError]); // Add all state setters as dependencies

  // Integrate useRealTimeData hook for periodic data fetching
  // Assuming useRealTimeData takes a fetch function and an interval in milliseconds
  const { 
    data: realTimeDashboardData, 
    loading: realTimeLoading, 
    error: realTimeError, 
    lastUpdated: realTimeLastUpdated, 
    startPolling, 
    stopPolling 
  } = useRealTimeData(fetchDashboardData, 60000); // Poll every 60 seconds

  useEffect(() => {
    if (realTimeDashboardData) {
      setDashboardData(realTimeDashboardData);
    }
    if (realTimeLastUpdated) {
      setLastUpdated(realTimeLastUpdated);
    }
    setLoading(realTimeLoading);
    setError(realTimeError);
  }, [realTimeDashboardData, realTimeLoading, realTimeError, realTimeLastUpdated]);

  useEffect(() => {
    startPolling(); // Start polling when component mounts
    return () => stopPolling(); // Stop polling when component unmounts
  }, [startPolling, stopPolling]); // Dependencies for starting/stopping polling

  // ... rest of the component remains the same

  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'Shipped':
        return 'bg-sky-100 text-sky-800';
      case 'Processing':
        return 'bg-amber-100 text-amber-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: '🛒 Total Orders',
      value: dashboardData.stats.totalOrders.toLocaleString(),
      icon: (
         // Your provided SVG code goes here directly
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),

      
      color: 'bg-blue-500',
      link: '/Orders',
      trend: 12 // Example trend data
    },
    {
      title: '📋 Prescription Orders',
      value: dashboardData.stats.totalPrescriptions.toLocaleString(),
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-green-500',
      link: '/Prescription',
      trend: 8
    },
    {
      title: 'Pending Reviews',
      value: dashboardData.stats.pendingReviews.toLocaleString(),
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-yellow-500',
      link: '/Pending_Prescriptions',
      trend: -5
    },
    {
      title: '💰 Total Revenue',
      value: `₹${dashboardData.stats.totalRevenue.toLocaleString()}`,
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-purple-500',
      link: '/Orders',
      trend: 15
    },
    {
      title: '👥 Active Customers',
      value: dashboardData.stats.activeUsers.toLocaleString(),
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      color: 'bg-indigo-500',
      link: '/Customers',
      trend: 3
    },
    {
      title: '⚠️ Low Stock Alert',
      value: dashboardData.stats.lowStockItems.toLocaleString(),
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-red-500',
      link: '/Inventory',
      trend: -2
    }
  ];

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50">
      {/* Header */}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">E-Commerce Pharmacy Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your online pharmacy business - Orders, Products, Customers & Inventory</p>
          <div className="mt-3 flex space-x-2">
            <span className="text-sm text-white bg-blue-600 px-3 py-1 rounded-full">
              📱 Mobile App Admin
            </span>
            <span className="text-sm text-white bg-green-600 px-3 py-1 rounded-full">
              🛒 E-Commerce Platform
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium text-gray-700">
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.181m0-4.54l-3.181-3.181" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348H4.992v-.001m0 0l3.181-3.181A1.64 1.64 0 0112 4.001h2.008m-2.008 3.181l-3.181-3.181m0 0A1.64 1.64 0 0112 19.999h2.008m-2.008-3.181l3.181 3.181m0 0h4.992v-.001m0 0l-3.181-3.181A1.64 1.64 0 0012 16.001h-2.008m2.008-3.181l-3.181 3.181" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <ModernStatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            link={stat.link}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Revenue Over Time</h2>
          <Line data={chartData.salesOverTime} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Categories Distribution</h2>
          <Pie data={chartData.productCategories} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status Distribution</h2>
          <Bar data={chartData.orderStatusDistribution} />
        </div>
      </div>

      {/* E-Commerce Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/Orders" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">New Orders</h3>
              <p className="text-sm text-gray-600">Process pending orders</p>
            </div>
          </div>
        </Link>

        <Link to="/Inventory" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Inventory</h3>
              <p className="text-sm text-gray-600">Manage stock levels</p>
            </div>
          </div>
        </Link>

        <Link to="/Customers" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Customers</h3>
              <p className="text-sm text-gray-600">Manage customer accounts</p>
            </div>
          </div>
        </Link>

        <Link to="/ReportsAnalytics" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">View sales reports</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/Orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">#{order.id}</p>
                  <p className="text-sm text-gray-600">
                    {order.user?.first_name} {order.user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{order.total_amount}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
            ))}
            {dashboardData.recentOrders.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Prescriptions</h2>
            <Link to="/Prescription" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.recentPrescriptions.map((prescription) => (
              <div key={prescription.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">#{prescription.id}</p>
                  <p className="text-sm text-gray-600">
                    {prescription.user?.first_name} {prescription.user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(prescription.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    prescription.verification_status === 'Verified' ? 'bg-green-100 text-green-800' :
                    prescription.verification_status === 'Pending_Review' ? 'bg-yellow-100 text-yellow-800' :
                    prescription.verification_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {prescription.verification_status}
                  </span>
                </div>
              </div>
            ))}
            {dashboardData.recentPrescriptions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent prescriptions</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {dashboardData.lowStockProducts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Low Stock Alert</h2>
            <Link to="/inventory" className="text-red-600 hover:text-red-800 text-sm font-medium">
              Manage Inventory
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.lowStockProducts.map((product) => (
              <div key={product.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.generic_name?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      Stock: {product.stock_quantity || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default DashboardMainContent;
