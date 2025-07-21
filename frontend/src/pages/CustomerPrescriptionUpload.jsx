// CustomerPrescriptionUpload.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const CustomerPrescriptionUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [selectedMedicines, setSelectedMedicines] = useState({});

  useEffect(() => {
    fetchUserPrescriptions();
  }, []);

  const fetchUserPrescriptions = async () => {
    try {
      const response = await axiosInstance.get('prescription/prescriptions/');
      setUploadedPrescriptions(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a prescription image first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image_file', selectedFile);

    try {
      const response = await axiosInstance.post(
        'prescription/prescriptions/upload_prescription/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        alert('Prescription uploaded successfully! AI processing started.');
        setSelectedFile(null);
        document.getElementById('file-input').value = '';
        
        // Start polling for processing status
        pollProcessingStatus(response.data.prescription_id);
        
        // Refresh prescriptions list
        fetchUserPrescriptions();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pollProcessingStatus = async (prescriptionId) => {
    const maxAttempts = 30; // Poll for 30 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axiosInstance.get(
          `prescription/prescriptions/${prescriptionId}/processing_status/`
        );
        
        setProcessingStatus(prev => ({
          ...prev,
          [prescriptionId]: response.data
        }));

        // If still processing and haven't exceeded max attempts, continue polling
        if (response.data.status === 'AI_Processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000); // Poll every second
        } else {
          // Processing complete or timeout, refresh prescriptions
          fetchUserPrescriptions();
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    poll();
  };

  const handleViewSuggestions = (prescriptionId) => {
    setShowSuggestions(prev => ({
      ...prev,
      [prescriptionId]: !prev[prescriptionId]
    }));
  };

  const handleMedicineSelection = (detailId, productId, selected) => {
    setSelectedMedicines(prev => ({
      ...prev,
      [detailId]: selected ? productId : null
    }));
  };

  const handleApproveSuggestions = async (prescriptionId) => {
    const prescription = uploadedPrescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    const approvedItems = prescription.details.map(detail => ({
      detail_id: detail.id,
      approved: !!selectedMedicines[detail.id],
      selected_product_id: selectedMedicines[detail.id]
    }));

    try {
      const response = await axiosInstance.post(
        `prescription/prescriptions/${prescriptionId}/approve_suggestions/`,
        { approved_items: approvedItems }
      );

      if (response.data.success) {
        alert('Medicine selections approved! Your prescription is now ready for pharmacist review.');
        fetchUserPrescriptions();
        setSelectedMedicines({});
      }
    } catch (error) {
      console.error('Error approving suggestions:', error);
      alert('Failed to approve selections. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'AI_Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'AI_Processed':
        return 'bg-green-100 text-green-800';
      case 'Pending_Review':
        return 'bg-orange-100 text-orange-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Prescription</h2>

      {/* Upload Section */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <div className="mb-4">
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Choose Prescription Image
            </label>
          </div>
          
          {selectedFile && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
              <p className="text-xs text-gray-500">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading & Processing...' : 'Upload Prescription'}
          </button>
          
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPEG, PNG, WebP (Max 5MB)
          </p>
        </div>
      </div>

      {/* Prescriptions List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Prescriptions</h3>
        
        {uploadedPrescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No prescriptions uploaded yet.</p>
            <p className="text-sm">Upload your first prescription to get AI-powered medicine suggestions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadedPrescriptions.map((prescription) => (
              <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      Prescription #{prescription.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(prescription.upload_date).toLocaleDateString()}
                    </p>
                    {prescription.doctor_name && (
                      <p className="text-sm text-gray-600">Doctor: {prescription.doctor_name}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prescription.verification_status)}`}>
                    {prescription.verification_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Processing Status */}
                {processingStatus[prescription.id] && (
                  <div className="mb-3 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      AI Processing: {processingStatus[prescription.id].medicines_count} medicines found
                      {processingStatus[prescription.id].confidence_score && 
                        ` (${Math.round(processingStatus[prescription.id].confidence_score * 100)}% confidence)`
                      }
                    </p>
                  </div>
                )}

                {/* AI Suggestions */}
                {prescription.verification_status === 'AI_Processed' && prescription.details.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleViewSuggestions(prescription.id)}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      {showSuggestions[prescription.id] ? 'Hide' : 'View'} AI Medicine Suggestions ({prescription.details.length})
                    </button>

                    {showSuggestions[prescription.id] && (
                      <div className="mt-3 space-y-3">
                        {prescription.details.map((detail) => (
                          <div key={detail.id} className="p-3 bg-gray-50 rounded">
                            <p className="font-medium text-gray-900">
                              {detail.ai_extracted_medicine_name} {detail.ai_extracted_dosage}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              {detail.ai_extracted_instructions}
                            </p>
                            
                            {detail.suggested_products.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Available Options:</p>
                                <div className="space-y-2">
                                  {detail.suggested_products.map((product) => (
                                    <label key={product.id} className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        name={`medicine-${detail.id}`}
                                        value={product.id}
                                        onChange={(e) => handleMedicineSelection(detail.id, product.id, e.target.checked)}
                                        className="text-gray-600"
                                      />
                                      <span className="text-sm">
                                        {product.name} - {product.strength} ({product.form}) - ₹{product.price}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <button
                          onClick={() => handleApproveSuggestions(prescription.id)}
                          className="mt-3 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                        >
                          Approve Selected Medicines
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Messages */}
                {prescription.verification_status === 'Verified' && (
                  <div className="mt-3 p-3 bg-green-50 rounded">
                    <p className="text-sm text-green-800">
                      ✅ Prescription verified by pharmacist. Ready to order!
                    </p>
                  </div>
                )}

                {prescription.verification_status === 'Rejected' && (
                  <div className="mt-3 p-3 bg-red-50 rounded">
                    <p className="text-sm text-red-800">
                      ❌ Prescription rejected: {prescription.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPrescriptionUpload;
