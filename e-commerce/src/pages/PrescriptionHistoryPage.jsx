import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prescriptionAPI } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { FileText, UploadCloud, Loader2, AlertCircle, ChevronRight, XCircle, CheckCircle } from 'lucide-react';

const PrescriptionHistoryPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchUserPrescriptions = async () => {
      if (!isAuthenticated) {
        addNotification('You must be logged in to view prescription history.', 'error');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
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
  }, [user, navigate, addNotification, isAuthenticated]);

  const fetchUserPrescriptions = async () => {
    if (!isAuthenticated) {
      addNotification('You must be logged in to view prescription history.', 'error');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
      setUploadSuccess(false);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      addNotification('You must be logged in to upload a prescription.', 'error');
      navigate('/login');
      return;
    }

    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      await prescriptionAPI.uploadPrescription(formData);
      setUploadSuccess(true);
      addNotification('Prescription uploaded successfully!', 'success');
      setSelectedFile(null);
      setPreviewUrl(null);
      // Refresh the prescription list after successful upload
      fetchUserPrescriptions();
    } catch (err) {
      console.error('Error uploading prescription:', err);
      setUploadError(err.response?.data?.detail || err.message || 'Failed to upload prescription.');
      addNotification(err.response?.data?.detail || err.message || 'Error uploading prescription.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = (prescriptionId) => {
    navigate(`/my-prescriptions/${prescriptionId}`);
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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Upload New Prescription</h2>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {previewUrl ? (
                  <div className="relative mx-auto w-48 h-48 mb-4">
                    <img src={previewUrl} alt="Prescription Preview" className="w-full h-full object-contain rounded-md" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setUploadError(null);
                        setUploadSuccess(false);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg text-gray-600">Drag & drop your prescription here, or <span className="text-teal-500 font-medium">click to browse</span></p>
                    <p className="text-sm text-gray-500 mt-1">Supports images (JPG, PNG, GIF)</p>
                  </>
                )}
              </div>

              {selectedFile && (
                <p className="text-center text-gray-700 mt-4">Selected file: <span className="font-medium">{selectedFile.name}</span></p>
              )}

              {uploadError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span className="block sm:inline">{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="block sm:inline">Prescription uploaded successfully!</span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`mt-8 w-full px-6 py-3 rounded-md shadow-md text-white flex items-center justify-center transition-colors
                  ${!selectedFile || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-5 w-5 mr-2" />
                    Upload Prescription
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                <p className="ml-3 text-lg text-gray-600">Loading prescriptions...</p>
              </div>
            ) : error ? (
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-red-600">Error loading prescriptions</p>
                <p className="text-gray-600 mt-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center p-6">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">No prescriptions uploaded yet.</p>
                <p className="text-gray-500 mt-2">Upload your first prescription to get started.</p>
              </div>
            ) : (
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrescriptionHistoryPage;
