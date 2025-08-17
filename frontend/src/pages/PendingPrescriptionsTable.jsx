import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionService, prescriptionUtils } from '../api/prescriptionService';

const PendingPrescriptionsTable = () => {
  const navigate = useNavigate();
  
  // State management
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('upload_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 10;

  // Fetch prescriptions on component mount and when filters change
  useEffect(() => {
    fetchPrescriptions();
  }, [currentPage, statusFilter, searchTerm, sortBy, sortOrder]);

  // Update bulk actions visibility when selections change
  useEffect(() => {
    setShowBulkActions(selectedPrescriptions.length > 0);
  }, [selectedPrescriptions]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        page_size: itemsPerPage,
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      });

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.append('verification_status', statusFilter);
      }

      // Add search term if provided
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const result = await prescriptionService.getPrescriptions(Object.fromEntries(params));

      if (result.success) {
        setPrescriptions(result.data);
        setTotalPages(Math.ceil((result.count || 0) / itemsPerPage));
        setError(null);
      } else {
        setError(result.error);
        setPrescriptions([]);
      }
    } catch (err) {
      setError('Failed to fetch prescriptions. Please try again.');
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPrescription = (prescriptionId) => {
    navigate(`/Prescription_Review/${prescriptionId}`);
  };

  const handleQuickStatusUpdate = async (prescriptionId, action) => {
    try {
      const result = await prescriptionService.verifyPrescription(prescriptionId, action);
      if (result.success) {
        await fetchPrescriptions(); // Refresh the list
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error updating prescription status:', err);
      setError('Failed to update prescription status');
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      const updatePromises = selectedPrescriptions.map(id =>
        prescriptionService.verifyPrescription(id, { verification_status: newStatus })
      );

      await Promise.all(updatePromises);
      setSelectedPrescriptions([]);
      await fetchPrescriptions();
    } catch (err) {
      console.error('Error updating prescription statuses:', err);
      setError('Failed to update prescription statuses');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPrescriptions(filteredPrescriptions.map(p => p.id));
    } else {
      setSelectedPrescriptions([]);
    }
  };

  const handleSelectPrescription = (prescriptionId, checked) => {
    if (checked) {
      setSelectedPrescriptions(prev => [...prev, prescriptionId]);
    } else {
      setSelectedPrescriptions(prev => prev.filter(id => id !== prescriptionId));
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Uploaded': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Uploaded', icon: '📤' },
      'AI_Processed': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'AI Processed', icon: '🤖' },
      'Pending_Review': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review', icon: '⏳' },
      'Verified': { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified', icon: '✅' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: '❌' }
    };

    const displayName = prescriptionUtils.getStatusDisplayName(status);
    const colorClass = prescriptionUtils.getStatusColor(status);

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {displayName}
      </span>
    );
  };

  const getPriorityIndicator = (prescription) => {
    const uploadDate = new Date(prescription.upload_date);
    const now = new Date();
    const hoursDiff = (now - uploadDate) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" title="High Priority - Over 24 hours old"></span>;
    } else if (hoursDiff > 12) {
      return <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2" title="Medium Priority - Over 12 hours old"></span>;
    }
    return <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2" title="Normal Priority"></span>;
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = !searchTerm ||
      prescription.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || prescription.verification_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatistics = () => {
    const stats = {
      total: prescriptions.length,
      uploaded: prescriptions.filter(p => p.verification_status === 'Uploaded').length,
      aiProcessed: prescriptions.filter(p => p.verification_status === 'AI_Processed').length,
      pendingReview: prescriptions.filter(p => p.verification_status === 'Pending_Review').length,
      verified: prescriptions.filter(p => p.verification_status === 'Verified').length,
      rejected: prescriptions.filter(p => p.verification_status === 'Rejected').length,
    };
    return stats;
  };

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
          <h1 className="text-3xl font-semibold text-gray-800">📱 Pending Prescriptions</h1>
          <p className="text-sm text-gray-600">Review and verify prescriptions uploaded by customers via mobile app</p>
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
            Prescriptions uploaded from customer mobile app
          </div>
        </div>
        <div className="flex space-x-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="Uploaded">Uploaded</option>
            <option value="AI_Processed">AI Processed</option>
            <option value="Pending_Review">Pending Review</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {(() => {
          const stats = getStatistics();
          return [
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-800' },
            { label: 'Uploaded', value: stats.uploaded, color: 'bg-blue-100 text-blue-800' },
            { label: 'AI Processed', value: stats.aiProcessed, color: 'bg-purple-100 text-purple-800' },
            { label: 'Pending Review', value: stats.pendingReview, color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Verified', value: stats.verified, color: 'bg-green-100 text-green-800' },
            { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-800' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className={`text-sm px-2 py-1 rounded-full inline-block mt-1 ${stat.color}`}>
                {stat.label}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedPrescriptions.length} prescription(s) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusUpdate('Verified')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-150"
              >
                Bulk Verify
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('Rejected')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-150"
              >
                Bulk Reject
              </button>
              <button
                onClick={() => setSelectedPrescriptions([])}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-150"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPrescriptions.length === filteredPrescriptions.length && filteredPrescriptions.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    Prescription ID
                    {sortBy === 'id' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('upload_date')}
                >
                  <div className="flex items-center">
                    Upload Date
                    {sortBy === 'upload_date' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('verification_status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === 'verification_status' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedPrescriptions.includes(prescription.id)}
                      onChange={(e) => handleSelectPrescription(prescription.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {getPriorityIndicator(prescription)}
                      #{prescription.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">
                        {prescription.user?.first_name} {prescription.user?.last_name}
                      </div>
                      <div className="text-gray-500">{prescription.user?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{new Date(prescription.upload_date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(prescription.upload_date).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(prescription.status || prescription.verification_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.order ? `#${prescription.order}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleReviewPrescription(prescription.id)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition duration-150"
                    >
                      Review
                    </button>
                    
                    {prescription.status === 'pending_verification' && (
                      <>
                        <button
                          onClick={() => handleQuickStatusUpdate(prescription.id, 'verified')}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition duration-150"
                        >
                          Quick Verify
                        </button>
                        <button
                          onClick={() => handleQuickStatusUpdate(prescription.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition duration-150"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredPrescriptions.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">No prescriptions match your current filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPrescriptionsTable;
