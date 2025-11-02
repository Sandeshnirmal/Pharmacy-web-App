import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  RefreshCw
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import PrescriptionStatusBadge from './PrescriptionStatusBadge';
import PriorityIndicator from './PriorityIndicator';

const EnhancedPrescriptionDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    avgProcessingTime: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [prescriptionsRes, statsRes] = await Promise.all([
        axiosInstance.get('prescription/prescriptions/?limit=10&ordering=-upload_date'),
        axiosInstance.get('prescription/prescriptions/stats/')
      ]);

      setRecentPrescriptions(prescriptionsRes.data.results || prescriptionsRes.data);
      setStats(statsRes.data || {
        total: prescriptionsRes.data.results?.length || 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        avgProcessingTime: 2.5
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const statCards = [
    {
      title: 'Total Prescriptions',
      value: stats.total,
      icon: FileText,
      color: 'blue',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'yellow',
      change: '-5%',
      changeType: 'positive'
    },
    {
      title: 'Verified Today',
      value: stats.verified,
      icon: CheckCircle,
      color: 'green',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Avg Processing Time',
      value: `${stats.avgProcessingTime}h`,
      icon: Clock,
      color: 'purple',
      change: '-15%',
      changeType: 'positive'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'bg-blue-500',
        text: 'text-blue-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'bg-yellow-500',
        text: 'text-yellow-600'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'bg-green-500',
        text: 'text-green-600'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'bg-purple-500',
        text: 'text-purple-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Dashboard</h1>
          <p className="text-gray-600">Monitor and manage prescription processing workflow</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const IconComponent = stat.icon;
          
          return (
            <div key={index} className={`${colors.bg} rounded-lg p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last week</span>
                  </div>
                </div>
                <div className={`${colors.icon} p-3 rounded-lg`}>
                  <IconComponent size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/pending-prescriptions"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Review Pending</h3>
              <p className="text-gray-600">Review {stats.pending} pending prescriptions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/prescriptions"
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">All Prescriptions</h3>
              <p className="text-gray-600">View all prescription uploads</p>
            </div>
          </div>
        </Link>


      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Prescriptions</h2>
            <Link
              to="/prescriptions"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPrescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{prescription.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(prescription.upload_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prescription.user?.first_name} {prescription.user?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {prescription.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PrescriptionStatusBadge status={prescription.verification_status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(prescription.upload_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityIndicator uploadDate={prescription.upload_date} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/prescription-review/${prescription.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPrescriptionDashboard;
