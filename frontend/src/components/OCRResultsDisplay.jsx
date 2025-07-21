import React from 'react';

const OCRResultsDisplay = ({ prescription, prescriptionDetails }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMappingStatusColor = (status) => {
    switch (status) {
      case 'Mapped':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="ocr-results-display">
      {/* Overall OCR Confidence */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">OCR Processing Results</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getConfidenceColor(prescription.ai_confidence_score)}`}>
              {(prescription.ai_confidence_score * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Overall Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {prescriptionDetails?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Medicines Detected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {prescription.ai_processing_time?.toFixed(1) || 'N/A'}s
            </div>
            <div className="text-sm text-gray-600">Processing Time</div>
          </div>
        </div>
      </div>

      {/* Medicine Details */}
      {prescriptionDetails && prescriptionDetails.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Extracted Medicines</h4>
          {prescriptionDetails.map((detail, index) => (
            <div key={detail.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h5 className="font-medium text-lg text-gray-900">
                    {detail.ai_extracted_medicine_name || 'Unknown Medicine'}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    Raw Text: "{detail.recognized_text_raw}"
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(detail.ai_confidence_score)}`}>
                    {(detail.ai_confidence_score * 100).toFixed(0)}% confidence
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMappingStatusColor(detail.mapping_status)}`}>
                    {detail.mapping_status}
                  </span>
                </div>
              </div>

              {/* Extracted Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dosage</label>
                  <p className="text-sm text-gray-900">{detail.ai_extracted_dosage || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</label>
                  <p className="text-sm text-gray-900">{detail.ai_extracted_frequency || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</label>
                  <p className="text-sm text-gray-900">{detail.ai_extracted_duration || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Instructions</label>
                  <p className="text-sm text-gray-900">{detail.ai_extracted_instructions || 'None'}</p>
                </div>
              </div>

              {/* Mapped Product */}
              {detail.mapped_product && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                  <h6 className="font-medium text-green-800 mb-2">✅ Mapped Product</h6>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Product:</strong> {detail.mapped_product.name}
                    </div>
                    <div>
                      <strong>Strength:</strong> {detail.mapped_product.strength}
                    </div>
                    <div>
                      <strong>Manufacturer:</strong> {detail.mapped_product.manufacturer}
                    </div>
                    <div>
                      <strong>Price:</strong> ₹{detail.mapped_product.price}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Products */}
              {detail.suggested_products && detail.suggested_products.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h6 className="font-medium text-blue-800 mb-2">💡 Suggested Alternatives ({detail.suggested_products.length})</h6>
                  <div className="space-y-2">
                    {detail.suggested_products.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-gray-600 ml-2">({product.strength})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{product.price}</div>
                          <div className="text-xs text-gray-500">{product.manufacturer}</div>
                        </div>
                      </div>
                    ))}
                    {detail.suggested_products.length > 3 && (
                      <div className="text-xs text-blue-600">
                        +{detail.suggested_products.length - 3} more alternatives
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No matches found */}
              {detail.mapping_status === 'Unavailable' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">
                    ❌ No matching products found in database. Manual review required.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No medicine details available. Try reprocessing with OCR.</p>
        </div>
      )}
    </div>
  );
};

export default OCRResultsDisplay;
