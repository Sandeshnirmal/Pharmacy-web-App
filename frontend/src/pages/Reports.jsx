import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const Reports = () => {
  const [reportData, setReportData] = useState({
    salesData: [],
    prescriptionStats: {},
    inventoryStats: {},
    customerStats: {},
    revenueData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [ordersRes, prescriptionsRes, productsRes, usersRes] = await Promise.all([
        axiosInstance.get(`orders/orders/?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`),
        axiosInstance.get('prescription/prescriptions/'),
        axiosInstance.get('product/products/'),
        axiosInstance.get('user/users/?role=customer')
      ]);

      const orders = ordersRes.data.results || ordersRes.data;
      const prescriptions = prescriptionsRes.data.results || prescriptionsRes.data;
      const products = productsRes.data.results || productsRes.data;
      const customers = usersRes.data.results || usersRes.data;

      // Calculate sales data
      const salesByDay = {};
      orders.forEach(order => {
        const date = new Date(order.order_date).toISOString().split('T')[0];
        if (!salesByDay[date]) {
          salesByDay[date] = { date, revenue: 0, orders: 0 };
        }
        salesByDay[date].revenue += parseFloat(order.total_amount || 0);
        salesByDay[date].orders += 1;
      });

      // Calculate prescription stats
      const prescriptionStats = {
        total: prescriptions.length,
        verified: prescriptions.filter(p => p.verification_status === 'Verified').length,
        pending: prescriptions.filter(p => p.verification_status === 'Pending_Review').length,
        rejected: prescriptions.filter(p => p.verification_status === 'Rejected').length
      };

      // Calculate inventory stats
      const inventoryStats = {
        totalProducts: products.length,
        lowStock: products.filter(p => (p.stock_quantity || 0) < 10).length,
        outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length,
        totalValue: products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * parseFloat(p.price || 0)), 0)
      };

      // Calculate customer stats
      const customerStats = {
        total: customers.length,
        active: customers.filter(c => c.is_active).length,
        newThisMonth: customers.filter(c => {
          const joinDate = new Date(c.date_joined);
          const now = new Date();
          return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
        }).length
      };

      setReportData({
        salesData: Object.values(salesByDay).sort((a, b) => new Date(a.date) - new Date(b.date)),
        prescriptionStats,
        inventoryStats,
        customerStats,
        revenueData: orders
      });
    } catch (err) {
      setError('Failed to fetch report data');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = reportData.revenueData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  const averageOrderValue = reportData.revenueData.length > 0 ? totalRevenue / reportData.revenueData.length : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-600">Business insights and performance metrics</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData.revenueData.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">₹{averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData.customerStats.active}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {reportData.salesData.slice(-7).map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((day.revenue / Math.max(...reportData.salesData.map(d => d.revenue))) * 200, 10)}px`,
                    width: '30px'
                  }}
                ></div>
                <div className="text-xs text-gray-600 mt-2 transform -rotate-45">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs font-semibold text-gray-800">₹{day.revenue.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prescription Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Prescription Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Verified</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(reportData.prescriptionStats.verified / reportData.prescriptionStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{reportData.prescriptionStats.verified}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${(reportData.prescriptionStats.pending / reportData.prescriptionStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{reportData.prescriptionStats.pending}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rejected</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(reportData.prescriptionStats.rejected / reportData.prescriptionStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{reportData.prescriptionStats.rejected}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="text-sm font-semibold">{reportData.inventoryStats.totalProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Low Stock Items</span>
              <span className="text-sm font-semibold text-yellow-600">{reportData.inventoryStats.lowStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <span className="text-sm font-semibold text-red-600">{reportData.inventoryStats.outOfStock}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Total Inventory Value</span>
              <span className="text-sm font-semibold">₹{reportData.inventoryStats.totalValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Customers</span>
              <span className="text-sm font-semibold">{reportData.customerStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Customers</span>
              <span className="text-sm font-semibold text-green-600">{reportData.customerStats.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">New This Month</span>
              <span className="text-sm font-semibold text-blue-600">{reportData.customerStats.newThisMonth}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm text-gray-600">Customer Retention</span>
              <span className="text-sm font-semibold">
                {((reportData.customerStats.active / reportData.customerStats.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-150">
              Export Sales Report
            </button>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-150">
              Download Inventory Report
            </button>
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-150">
              Generate Customer Report
            </button>
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-150">
              Prescription Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
