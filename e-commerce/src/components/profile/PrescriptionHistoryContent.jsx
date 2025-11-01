import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { prescriptionAPI } from '../../api/apiService';
import { useNotification } from '../../context/NotificationContext';
import { FileText, UploadCloud, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

const PrescriptionHistoryContent = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth(); // Destructure isAuthenticated
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchUserPrescriptions = async () => {
      if (!isAuthenticated) { // Check isAuthenticated instead of user.token
        addNotification('You must be logged in to view prescription history.', 'error');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // Assuming getPrescriptions fetches user-specific prescriptions by default
        // or the backend handles it based on the authenticated user's token.
        const response = await prescriptionAPI.getPrescriptions();
        if (response.data && Array.isArray(response.data.results)) {
          setPrescriptions(response.data.results);
        } else {
          setPrescriptions([]);
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError(err.message || 'Failed to fetch prescription history.');
        addNotification(err.message || 'Error fetching prescription history.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPrescriptions();
  }, [user, navigate, addNotification]);

  const handleUploadNewPrescription = () => {
    navigate('/upload-prescription'); // Assuming this route exists
  };

  const handleViewDetails = (prescriptionId) => {
    navigate(`/my-prescriptions/${prescriptionId}`); // Updated to match App.jsx route
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-orange-500';
      case 'processing':
        return 'text-blue-500';
      case 'verified':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'verified':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="ml-3 text-lg text-gray-600">Loading prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-xl font-semibold text-red-600">Error loading prescriptions</p>
        <p className="text-gray-600 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry for now
          className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="text-center p-6">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-gray-700">No prescriptions uploaded yet.</p>
        <p className="text-gray-500 mt-2">Upload your first prescription to get started.</p>
        <button
          onClick={handleUploadNewPrescription}
          className="mt-6 px-6 py-3 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors flex items-center justify-center mx-auto"
        >
          <UploadCloud className="h-5 w-5 mr-2" />
          Upload New Prescription
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Prescription History</h2>
      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <div
            key={prescription.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewDetails(prescription.id)}
          >
            {prescription.image_url ? (
              <img
                src={prescription.image_url}
                alt="Prescription"
                className="w-20 h-20 object-cover rounded-md"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-lg font-semibold">Prescription ID: {prescription.id}</p>
              <div className="flex items-center mt-1">
                {getStatusIcon(prescription.status)}
                <span className={`ml-2 text-sm font-medium ${getStatusColor(prescription.status)}`}>
                  Status: {prescription.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Uploaded: {new Date(prescription.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={handleUploadNewPrescription}
          className="px-6 py-3 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors flex items-center justify-center mx-auto"
        >
          <UploadCloud className="h-5 w-5 mr-2" />
          Upload New Prescription
        </button>
      </div>
    </div>
  );
};

export default PrescriptionHistoryContent;
