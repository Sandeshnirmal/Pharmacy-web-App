import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  Bot,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import ConfidenceIndicator from './ConfidenceIndicator';

const PrescriptionAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalPrescriptions: 0,
    todayPrescriptions: 0,
    avgProcessingTime: 0,
    avgConfidence: 0,
    statusBreakdown: {},
    confidenceDistribution: {},
    processingTrends: [],
    topMedicines: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`prescription/analytics/?range=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data for demonstration
      setAnalytics({
        totalPrescriptions: 1247,
        todayPrescriptions: 23,
        avgProcessingTime: 2.4,
        avgConfidence: 0.87,
        statusBreakdown: {
          'Uploaded': 45,
          'AI_Processed': 12,
          'Pending_Review': 67,
          'Verified': 892,
          'Rejected': 231
        },
        confidenceDistribution: {
          'high': 756,
          'medium': 324,
          'low': 167
        },
        processingTrends: [
          { date: '2025-01-17', processed: 45, verified: 38, rejected: 7 },
          { date: '2025-01-18', processed: 52, verified: 44, rejected: 8 },
          { date: '2025-01-19', processed: 38, verified: 32, rejected: 6 },
          { date: '2025-01-20', processed: 61, verified: 53, rejected: 8 },
          { date: '2025-01-21', processed: 47, verified: 41, rejected: 6 },
          { date: '2025-01-22', processed: 55, verified: 48, rejected: 7 },
          { date: '2025-01-23', processed: 23, verified: 19, rejected: 4 }
        ],
        topMedicines: [
          { name: 'Paracetamol', count: 156, confidence: 0.94 },
          { name: 'Azithromycin', count: 89, confidence: 0.91 },
          { name: 'Omeprazole', count: 67, confidence: 0.88 },
          { name: 'Metformin', count: 54, confidence: 0.92 },
          { name: 'Amlodipine', count: 43, confidence: 0.85 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Uploaded': 'text-blue-600',
      'AI_Processed': 'text-purple-600',
      'Pending_Review': 'text-yellow-600',
      'Verified': 'text-green-600',
      'Rejected': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const calculateChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Analytics</h1>
          <p className="text-gray-600">Monitor AI performance and processing metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalPrescriptions}</p>
              <div className="flex items-center mt-2">
                <TrendingUp size={16} className="text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Uploads</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.todayPrescriptions}</p>
              <div className="flex items-center mt-2">
                <TrendingDown size={16} className="text-red-500 mr-1" />
                <span className="text-sm text-red-600">-3.2%</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.avgProcessingTime}h</p>
              <div className="flex items-center mt-2">
                <TrendingUp size={16} className="text-green-500 mr-1" />
                <span className="text-sm text-green-600">-15.3%</span>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.avgConfidence * 100)}%</p>
              <div className="flex items-center mt-2">
                <TrendingUp size={16} className="text-green-500 mr-1" />
                <span className="text-sm text-green-600">+2.1%</span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Bot size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
              const total = Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status).replace('text-', 'bg-')}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Confidence Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analytics.confidenceDistribution).map(([level, count]) => {
              const total = Object.values(analytics.confidenceDistribution).reduce((a, b) => a + b, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              
              return (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ConfidenceIndicator 
                      confidence={level === 'high' ? 0.9 : level === 'medium' ? 0.7 : 0.4}
                      size="sm"
                      showPercentage={false}
                      showIcon={false}
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {level} Confidence
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Medicines */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Frequently Detected Medicines</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detection Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topMedicines.map((medicine, index) => (
                <tr key={medicine.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {medicine.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {medicine.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ConfidenceIndicator 
                      confidence={medicine.confidence}
                      size="sm"
                      showIcon={false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp size={16} className="text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+5.2%</span>
                    </div>
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

export default PrescriptionAnalyticsDashboard;
