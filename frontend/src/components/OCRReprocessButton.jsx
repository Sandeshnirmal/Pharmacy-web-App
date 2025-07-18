import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const OCRReprocessButton = ({ prescriptionId, onReprocessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleReprocess = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await axiosInstance.post(
        `prescription/admin/reprocess-ocr/${prescriptionId}/`
      );

      if (response.data.success) {
        setResult({
          type: 'success',
          message: response.data.message,
          details: response.data
        });
        
        // Notify parent component
        if (onReprocessComplete) {
          onReprocessComplete(response.data);
        }
      } else {
        setResult({
          type: 'error',
          message: response.data.error || 'OCR processing failed'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error.response?.data?.error || 'Failed to reprocess prescription'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ocr-reprocess-section">
      <button
        onClick={handleReprocess}
        disabled={isProcessing}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing OCR...
          </div>
        ) : (
          '🔄 Reprocess with OCR'
        )}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-md ${
          result.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-medium ${
            result.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.message}
          </div>
          
          {result.type === 'success' && result.details && (
            <div className="mt-2 text-sm text-green-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>OCR Confidence:</strong> {(result.details.ocr_confidence * 100).toFixed(1)}%
                </div>
                <div>
                  <strong>Medicines Found:</strong> {result.details.medicines_processed}
                </div>
                <div>
                  <strong>High Confidence Matches:</strong> {result.details.processing_summary?.high_confidence_matches || 0}
                </div>
                <div>
                  <strong>Total Matches:</strong> {result.details.processing_summary?.matched_count || 0}
                </div>
              </div>
              
              {result.details.details && result.details.details.length > 0 && (
                <div className="mt-3">
                  <strong>Processed Medicines:</strong>
                  <ul className="mt-1 space-y-1">
                    {result.details.details.map((detail, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{detail.medicine_name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          detail.mapping_status === 'Mapped' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {detail.mapping_status} ({detail.matches_found} matches)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRReprocessButton;
