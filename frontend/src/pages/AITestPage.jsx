// AI Prescription Test Page
import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const AITestPage = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);

  // Sample prescription image URLs for testing
  const sampleImages = [
    'https://example.com/prescription1.jpg',
    'https://example.com/prescription2.jpg',
    'https://example.com/prescription3.jpg',
    'https://example.com/prescription4.jpg'
  ];

  const handleTestAI = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Upload prescription for AI processing
      const uploadResponse = await axiosInstance.post('/prescription/mobile/upload/', {
        image_url: imageUrl
      });

      const prescId = uploadResponse.data.prescription_id;
      setPrescriptionId(prescId);

      // Step 2: Get AI processing results
      setTimeout(async () => {
        try {
          const suggestionsResponse = await axiosInstance.get(`/prescription/mobile/suggestions/${prescId}/`);
          setResult(suggestionsResponse.data);
        } catch (err) {
          if (err.response?.status === 202) {
            // Still processing, try again
            setTimeout(async () => {
              try {
                const retryResponse = await axiosInstance.get(`/prescription/mobile/suggestions/${prescId}/`);
                setResult(retryResponse.data);
              } catch (retryErr) {
                setError('AI processing failed: ' + (retryErr.response?.data?.message || retryErr.message));
              }
            }, 2000);
          } else {
            setError('Failed to get suggestions: ' + (err.response?.data?.message || err.message));
          }
        }
      }, 1000);

    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTestStatus = async () => {
    if (!prescriptionId) {
      setError('No prescription ID available. Upload a prescription first.');
      return;
    }

    try {
      const statusResponse = await axiosInstance.get(`/prescription/mobile/status/${prescriptionId}/`);
      alert(`Status: ${statusResponse.data.status}\nAI Processed: ${statusResponse.data.ai_processed}\nConfidence: ${statusResponse.data.confidence_score || 'N/A'}`);
    } catch (err) {
      setError('Failed to get status: ' + (err.response?.data?.error || err.message));
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Prescription Test Page</h1>
        <p className="text-gray-600">Test the AI prescription text extraction and medicine suggestion service</p>
      </div>

      {/* Input Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Prescription for AI Processing</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Prescription Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter prescription image URL (e.g., https://example.com/prescription.jpg)"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sample URLs (Click to use)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sampleImages.map((url, index) => (
              <button
                key={index}
                onClick={() => setImageUrl(url)}
                className="text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
              >
                Sample Prescription {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleTestAI}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Test AI Extraction'}
          </button>
          
          {prescriptionId && (
            <button
              onClick={handleTestStatus}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Check Status
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">AI Processing Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="block text-sm text-blue-600">Status</span>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
              </div>
              <div>
                <span className="block text-sm text-blue-600">AI Confidence</span>
                <span className={`font-semibold ${getConfidenceColor(result.ai_confidence)}`}>
                  {Math.round((result.ai_confidence || 0) * 100)}%
                </span>
              </div>
              <div>
                <span className="block text-sm text-blue-600">Medicines Found</span>
                <span className="font-semibold text-blue-800">{result.total_medicines_found}</span>
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Extracted Medicines</h3>
            
            {result.medicines && result.medicines.length > 0 ? (
              <div className="space-y-4">
                {result.medicines.map((medicine, index) => (
                  <div key={index} className="p-4 bg-white border border-green-200 rounded">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{medicine.medicine_name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getConfidenceColor(medicine.confidence_score)}`}>
                          {Math.round((medicine.confidence_score || 0) * 100)}% confidence
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          medicine.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {medicine.is_available ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Dosage:</span>
                        <span className="ml-2 text-gray-800">{medicine.dosage || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Quantity:</span>
                        <span className="ml-2 text-gray-800">{medicine.quantity || 'Not specified'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Instructions:</span>
                        <span className="ml-2 text-gray-800">{medicine.instructions || 'Not specified'}</span>
                      </div>
                    </div>

                    {/* Product Information */}
                    {medicine.product_info && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h5 className="font-medium text-gray-800 mb-2">Available Product</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Name:</span>
                            <span className="ml-2 text-gray-800">{medicine.product_info.name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Price:</span>
                            <span className="ml-2 text-gray-800">₹{medicine.product_info.price}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Stock:</span>
                            <span className="ml-2 text-gray-800">{medicine.product_info.stock_quantity} units</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-700">No medicines extracted from the prescription.</p>
            )}
          </div>

          {/* Pricing */}
          {result.pricing && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Cost Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="block text-yellow-600">Subtotal</span>
                  <span className="font-semibold text-yellow-800">₹{result.pricing.subtotal}</span>
                </div>
                <div>
                  <span className="block text-yellow-600">Shipping</span>
                  <span className="font-semibold text-yellow-800">₹{result.pricing.shipping}</span>
                </div>
                <div>
                  <span className="block text-yellow-600">Discount</span>
                  <span className="font-semibold text-yellow-800">-₹{result.pricing.discount}</span>
                </div>
                <div>
                  <span className="block text-yellow-600">Total</span>
                  <span className="font-bold text-yellow-800 text-lg">₹{result.pricing.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Raw Response */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Raw API Response</h3>
            <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-3 rounded border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Enter a prescription image URL or click on a sample URL</li>
          <li>Click "Test AI Extraction" to upload and process the prescription</li>
          <li>Wait for AI processing to complete (usually 1-3 seconds)</li>
          <li>Review the extracted medicines and their confidence scores</li>
          <li>Check if medicines are mapped to available products</li>
          <li>Use "Check Status" to verify processing status anytime</li>
        </ol>
      </div>
    </div>
  );
};

export default AITestPage;
