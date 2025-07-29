// PrescriptionUploadsTable.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, RefreshCw, Eye, MoreHorizontal } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import PrescriptionStatusBadge from '../components/prescription/PrescriptionStatusBadge';
import ConfidenceIndicator from '../components/prescription/ConfidenceIndicator';
import PriorityIndicator from '../components/prescription/PriorityIndicator';
import EnhancedPrescriptionDashboard from '../components/prescription/EnhancedPrescriptionDashboard';

const PrescriptionUploadsTable = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDashboard, setShowDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('upload_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter, sortBy, sortOrder]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      });

      if (statusFilter !== 'all') {
        params.append('verification_status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await axiosInstance.get(`prescription/enhanced-prescriptions/?${params}`);
      setPrescriptions(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    !searchTerm ||
    prescription.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.id.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Show dashboard view if enabled
  if (showDashboard) {
    return <EnhancedPrescriptionDashboard />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">All Prescriptions</h2>
          <p className="text-gray-600">Manage and review prescription uploads</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDashboard(true)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Dashboard View
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, patient name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

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

            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    {sortBy === 'id' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('upload_date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Upload Date</span>
                    {sortBy === 'upload_date' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Confidence
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('verification_status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortBy === 'verification_status' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        #{prescription.id}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {prescription.user?.first_name?.[0] || prescription.user_name?.[0] || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.user?.first_name} {prescription.user?.last_name}
                          {!prescription.user && (prescription.user_name || 'Unknown User')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prescription.user?.email || prescription.user_email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(prescription.upload_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(prescription.upload_date).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityIndicator uploadDate={prescription.upload_date} />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <ConfidenceIndicator
                      confidence={prescription.ai_confidence_score || 0}
                      size="sm"
                      showIcon={false}
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <PrescriptionStatusBadge
                      status={prescription.verification_status}
                      size="sm"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/prescription-review/${prescription.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                      >
                        <Eye size={14} className="mr-1" />
                        Review
                      </Link>

                      {prescription.has_order && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Order Created
                        </span>
                      )}

                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPrescriptions.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No prescriptions match your search criteria.' : 'No prescriptions have been uploaded yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500">Total Prescriptions</div>
          <div className="text-2xl font-semibold text-gray-900">{prescriptions.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-yellow-700">Pending Review</div>
          <div className="text-2xl font-semibold text-yellow-900">
            {prescriptions.filter(p => p.verification_status === 'Pending_Review').length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-700">Verified</div>
          <div className="text-2xl font-semibold text-green-900">
            {prescriptions.filter(p => p.verification_status === 'Verified').length}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-red-700">Rejected</div>
          <div className="text-2xl font-semibold text-red-900">
            {prescriptions.filter(p => p.verification_status === 'Rejected').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUploadsTable;
