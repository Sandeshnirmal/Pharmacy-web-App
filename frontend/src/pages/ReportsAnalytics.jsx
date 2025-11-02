// Comprehensive Reports and Analysis Page
// Intelligent Pharmacy Management System

import React, { useState, useEffect } from 'react';
import { reportsAPI, apiUtils } from '../api/apiService';

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Report data states
  const [overviewData, setOverviewData] = useState({});
  const [prescriptionData, setPrescriptionData] = useState({});
  const [inventoryData, setInventoryData] = useState({});
  const [userAnalytics, setUserAnalytics] = useState({});

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all reports data in parallel
      const [
        adminReports,
        prescriptionAnalytics,
        inventoryReports,
        userStats,
      ] = await Promise.allSettled([
        reportsAPI.getAdminReports(),
        reportsAPI.getPrescriptionAnalytics(),
        reportsAPI.getInventoryReports(),
        reportsAPI.getUserAnalytics(),
      ]);

      // Process results
      if (adminReports.status === 'fulfilled') {
        setOverviewData(adminReports.value.data);
      }

      if (prescriptionAnalytics.status === 'fulfilled') {
        setPrescriptionData(prescriptionAnalytics.value.data);
      }

      if (inventoryReports.status === 'fulfilled') {
        setInventoryData(inventoryReports.value.data);
      }

      if (userStats.status === 'fulfilled') {
        setUserAnalytics(userStats.value.data);
      }

    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 font-medium text-sm rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={overviewData.total_users || 0}
          subtitle="Registered users"
          color="blue"
        />
        <StatCard
          title="Total Prescriptions"
          value={overviewData.total_prescriptions || 0}
          subtitle="All prescriptions"
          color="green"
        />
        <StatCard
          title="Pending Verifications"
          value={overviewData.pending_verifications || 0}
          subtitle="Awaiting review"
          color="yellow"
        />
        <StatCard
          title="Total Products"
          value={overviewData.total_products || 0}
          subtitle="In inventory"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {(overviewData.recent_activities || []).map((activity, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">{activity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Server Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PrescriptionTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Prescription Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Prescriptions"
          value={prescriptionData.total_prescriptions || 0}
          subtitle="All time"
          color="blue"
        />
        <StatCard
          title="Verified Today"
          value={prescriptionData.verified_today || 0}
          subtitle="Today's verifications"
          color="green"
        />
        <StatCard
          title="Rejected Today"
          value={prescriptionData.rejected_today || 0}
          subtitle="Today's rejections"
          color="red"
        />
        <StatCard
          title="Need Clarification"
          value={prescriptionData.need_clarification || 0}
          subtitle="Pending clarification"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Processing Time</span>
              <span className="font-semibold">{prescriptionData.average_processing_time || 0} hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">AI Accuracy Rate</span>
              <span className="font-semibold">{prescriptionData.ai_accuracy_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Verification</span>
              <span className="font-semibold">{prescriptionData.pending_verification || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-800">Verified</span>
              <span className="text-sm font-bold text-green-600">
                {((prescriptionData.verified_today || 0) / Math.max(prescriptionData.total_prescriptions || 1, 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-800">Rejected</span>
              <span className="text-sm font-bold text-red-600">
                {((prescriptionData.rejected_today || 0) / Math.max(prescriptionData.total_prescriptions || 1, 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-800">Need Clarification</span>
              <span className="text-sm font-bold text-yellow-600">
                {((prescriptionData.need_clarification || 0) / Math.max(prescriptionData.total_prescriptions || 1, 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Inventory Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={inventoryData.total_products || 0}
          subtitle="In inventory"
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={inventoryData.low_stock_count || 0}
          subtitle="Need restocking"
          color="red"
        />
        <StatCard
          title="Out of Stock"
          value={inventoryData.out_of_stock || 0}
          subtitle="Currently unavailable"
          color="gray"
        />
        <StatCard
          title="Total Value"
          value={`₹${(inventoryData.total_value || 0).toLocaleString()}`}
          subtitle="Inventory value"
          color="green"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Low Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Medicines
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {inventoryData.total_products || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {inventoryData.low_stock_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Good
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const UserTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(userAnalytics).map(([role, count]) => (
          <StatCard
            key={role}
            title={role.charAt(0).toUpperCase() + role.slice(1)}
            value={count}
            subtitle={`${role} users`}
            color="blue"
          />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
        <div className="space-y-4">
          {Object.entries(userAnalytics).map(([role, count]) => {
            const total = Object.values(userAnalytics).reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            
            return (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{role}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading reports</p>
            <p>{error}</p>
          </div>
          <button
            onClick={loadReportsData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive insights into your pharmacy operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-2 overflow-x-auto">
            <TabButton
              id="overview"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={setActiveTab}
            />
            <TabButton
              id="prescriptions"
              label="Prescriptions"
              active={activeTab === 'prescriptions'}
              onClick={setActiveTab}
            />
            <TabButton
              id="inventory"
              label="Inventory"
              active={activeTab === 'inventory'}
              onClick={setActiveTab}
            />
            <TabButton
              id="users"
              label="Users"
              active={activeTab === 'users'}
              onClick={setActiveTab}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'prescriptions' && <PrescriptionTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'users' && <UserTab />}
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
