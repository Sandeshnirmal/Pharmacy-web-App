import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all required data in parallel
      const [ordersRes, prescriptionsRes, usersRes, productsRes] = await Promise.all([
        axiosInstance.get('orders/orders/'),
        axiosInstance.get('prescription/prescriptions/'),
        axiosInstance.get('user/users/'),
        axiosInstance.get('product/products/')
      ]);

      const orders = ordersRes.data.results || ordersRes.data;
      const prescriptions = prescriptionsRes.data.results || prescriptionsRes.data;
      const users = usersRes.data.results || usersRes.data;
      const products = productsRes.data.results || productsRes.data;

      // Calculate statistics
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const pendingReviews = prescriptions.filter(p => p.verification_status === 'Pending_Review').length;
      const lowStockProducts = products.filter(p => p.stock_quantity && p.stock_quantity < 10);

      setDashboardData({
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
      });
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

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
      title: 'Total Orders',
      value: dashboardData.stats.totalOrders.toLocaleString(),
      color: 'bg-gray-100',
      link: '/Orders'
    },
    {
      title: 'Total Prescriptions',
      value: dashboardData.stats.totalPrescriptions.toLocaleString(),
      color: 'bg-gray-100',
      link: '/Prescription'
    },
    {
      title: 'Pending Reviews',
      value: dashboardData.stats.pendingReviews.toLocaleString(),
      color: 'bg-gray-100',
      link: '/Pending_Prescriptions'
    },
    {
      title: 'Total Revenue',
      value: `₹${dashboardData.stats.totalRevenue.toLocaleString()}`,
      color: 'bg-gray-100',
      link: '/Orders'
    },
    {
      title: 'Active Users',
      value: dashboardData.stats.activeUsers.toLocaleString(),
      color: 'bg-gray-100',
      link: '/customers'
    },
    {
      title: 'Low Stock Items',
      value: dashboardData.stats.lowStockItems.toLocaleString(),
      color: 'bg-gray-100',
      link: '/inventory'
    }
  ];

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Pharmacy Admin Dashboard</h1>
        <p className="text-gray-600">Manage your mobile pharmacy app - Monitor orders, prescriptions, and inventory from customer mobile app</p>
        <div className="mt-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded inline-block">
          Admin Panel for Mobile E-Commerce Pharmacy
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Link key={index} to={stat.link} className="block">
            <div className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">{stat.title}</h3>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
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
