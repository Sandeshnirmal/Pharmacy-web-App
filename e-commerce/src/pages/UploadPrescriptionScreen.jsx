import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

const UploadPrescriptionScreen = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotification('Please select a file to upload.', 'error');
      return;
    }

    if (!user || !user.token) {
      showNotification('You must be logged in to upload a prescription.', 'error');
      navigate('/login');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('prescription_image', selectedFile);
    formData.append('user_id', user.id); // Assuming user.id is available

    try {
      const response = await fetch('http://localhost:8000/api/prescriptions/upload-for-order/', { // Using the upload-for-order endpoint
        method: 'POST',
        headers: {
          'Authorization': `Token ${user.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload prescription.');
      }

      const result = await response.json();
      showNotification('Prescription uploaded successfully!', 'success');
      navigate(`/my-prescriptions/${result.prescription_id}`); // Navigate to prescription detail page
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Error uploading prescription.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Upload Prescription</h1>
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="prescription-file" className="block text-gray-700 text-sm font-bold mb-2">
            Select Prescription Image:
          </label>
          <input
            type="file"
            id="prescription-file"
            accept="image/*"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          {loading ? 'Uploading...' : 'Upload Prescription'}
        </button>
        {selectedFile && (
          <p className="mt-4 text-sm text-gray-600">Selected file: {selectedFile.name}</p>
        )}
      </div>
    </div>
  );
};

export default UploadPrescriptionScreen;
