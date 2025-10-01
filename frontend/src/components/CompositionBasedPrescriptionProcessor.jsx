// Composition-Based Prescription Processor Component
import React, { useState } from 'react';
import { Upload, Search, ShoppingCart, CheckCircle, AlertCircle, Info } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const CompositionBasedPrescriptionProcessor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, PNG) or PDF');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setResults(null);
      setSelectedMedicines([]);
    }
  };

  const processPrescription = async () => {
    if (!selectedFile) {
      setError('Please select a prescription image first');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('prescription_image', selectedFile);

      const response = await axiosInstance.post(
        'prescription/enhanced-prescriptions/process_composition_based_prescription/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setResults(response.data);
      } else {
        setError(response.data.error || 'Failed to process prescription');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process prescription');
    } finally {
      setProcessing(false);
    }
  };

  const toggleMedicineSelection = (extractedIndex, matchIndex, medicine) => {
    const selectionKey = `${extractedIndex}-${matchIndex}`;
    const isSelected = selectedMedicines.some(m => m.selectionKey === selectionKey);

    if (isSelected) {
      setSelectedMedicines(prev => prev.filter(m => m.selectionKey !== selectionKey));
    } else {
      setSelectedMedicines(prev => [...prev, {
        selectionKey,
        extractedIndex,
        matchIndex,
        extractedMedicine: results.composition_matches[extractedIndex].extracted_medicine,
        selectedProduct: medicine,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (selectionKey, quantity) => {
    setSelectedMedicines(prev => 
      prev.map(m => 
        m.selectionKey === selectionKey 
          ? { ...m, quantity: Math.max(1, parseInt(quantity) || 1) }
          : m
      )
    );
  };

  const addToCart = () => {
    if (selectedMedicines.length === 0) {
      setError('Please select at least one medicine');
      return;
    }

    // Here you would integrate with your cart system
    console.log('Adding to cart:', selectedMedicines);
    alert(`${selectedMedicines.length} medicines added to cart. Please upload the original prescription during checkout.`);
  };

  const getMatchTypeColor = (matchType) => {
    const colors = {
      'exact_match': 'bg-green-100 text-green-800',
      'high_similarity': 'bg-blue-100 text-blue-800',
      'moderate_similarity': 'bg-yellow-100 text-yellow-800',
      'low_similarity': 'bg-gray-100 text-gray-800'
    };
    return colors[matchType] || 'bg-gray-100 text-gray-800';
  };

  const getMatchTypeLabel = (matchType) => {
    const labels = {
      'exact_match': 'Exact Match',
      'high_similarity': 'High Similarity',
      'moderate_similarity': 'Moderate Similarity',
      'low_similarity': 'Low Similarity'
    };
    return labels[matchType] || 'Unknown';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🧬 Composition-Based Prescription Processor
        </h2>
        <p className="text-gray-600">
          Upload your prescription for AI-powered composition analysis and manual medicine selection
        </p>
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="mb-4">
            <label htmlFor="prescription-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-medium">
                Click to upload prescription
              </span>
              <input
                id="prescription-upload"
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
              />
            </label>
            <p className="text-gray-500 text-sm mt-1">
              Supports JPG, PNG, PDF (max 10MB)
            </p>
          </div>
          
          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-blue-800 font-medium">{selectedFile.name}</p>
              <p className="text-blue-600 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <button
            onClick={processPrescription}
            disabled={!selectedFile || processing}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              !selectedFile || processing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processing ? (
              <>
                <Search className="inline h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search className="inline h-4 w-4 mr-2" />
                Process Prescription
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Processing Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-green-800">
                Prescription Processed Successfully
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-green-600 font-medium">OCR Confidence</p>
                <p className="text-green-800">{Math.round(results.ocr_confidence * 100)}%</p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Medicines Found</p>
                <p className="text-green-800">{results.total_medicines_extracted}</p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Total Matches</p>
                <p className="text-green-800">{results.match_statistics?.total_composition_matches || 0}</p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Avg Match Score</p>
                <p className="text-green-800">
                  {Math.round((results.match_statistics?.average_match_score || 0) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Next Steps</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
              <li>Review extracted medicines and their compositions below</li>
              <li>Manually select medicines from composition-based matches</li>
              <li>Add selected medicines to cart</li>
              <li>Upload original prescription during checkout</li>
              <li>Order will be sent to admin for approval</li>
            </ol>
          </div>

          {/* Composition Matches */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Composition-Based Medicine Matches
            </h3>
            
            {results.composition_matches?.map((match, extractedIndex) => (
              <div key={extractedIndex} className="mb-6 border border-gray-200 rounded-lg p-4">
                {/* Extracted Medicine Info */}
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Extracted Medicine: {match.extracted_medicine.medicine_name}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <p><span className="font-medium">Composition:</span> {match.extracted_medicine.composition}</p>
                    <p><span className="font-medium">Strength:</span> {match.extracted_medicine.strength || 'N/A'}</p>
                    <p><span className="font-medium">Form:</span> {match.extracted_medicine.form || 'N/A'}</p>
                    <p><span className="font-medium">Frequency:</span> {match.extracted_medicine.frequency || 'N/A'}</p>
                  </div>
                </div>

                {/* Available Matches */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">
                    Available Matches ({match.composition_matches.length})
                  </h5>
                  
                  {match.composition_matches.length === 0 ? (
                    <p className="text-gray-500 italic">No composition matches found</p>
                  ) : (
                    <div className="grid gap-3">
                      {match.composition_matches.map((medicine, matchIndex) => {
                        const selectionKey = `${extractedIndex}-${matchIndex}`;
                        const isSelected = selectedMedicines.some(m => m.selectionKey === selectionKey);
                        const selectedMedicine = selectedMedicines.find(m => m.selectionKey === selectionKey);
                        
                        return (
                          <div
                            key={matchIndex}
                            className={`border rounded-lg p-3 transition-colors ${
                              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h6 className="font-medium text-gray-900">{medicine.product_name}</h6>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(medicine.match_type)}`}>
                                    {getMatchTypeLabel(medicine.match_type)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(medicine.match_score * 100)}% match
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                                  <p><span className="font-medium">Composition:</span> {medicine.composition}</p>
                                  <p><span className="font-medium">Strength:</span> {medicine.strength || 'N/A'}</p>
                                  <p><span className="font-medium">Form:</span> {medicine.form || 'N/A'}</p>
                                  <p><span className="font-medium">Manufacturer:</span> {medicine.manufacturer}</p>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm">
                                  <p className="font-semibold text-green-600">₹{medicine.price}</p>
                                  <p className="text-gray-500">MRP: ₹{medicine.mrp}</p>
                                  <p className={`px-2 py-1 rounded text-xs ${
                                    medicine.stock_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {medicine.stock_available ? 'In Stock' : 'Out of Stock'}
                                  </p>
                                  {medicine.is_prescription_required && (
                                    <p className="text-orange-600 text-xs">Prescription Required</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {isSelected && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedMedicine?.quantity || 1}
                                    onChange={(e) => updateQuantity(selectionKey, e.target.value)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Qty"
                                  />
                                )}
                                
                                <button
                                  onClick={() => toggleMedicineSelection(extractedIndex, matchIndex, medicine)}
                                  disabled={!medicine.stock_available}
                                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    !medicine.stock_available
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  {isSelected ? 'Remove' : 'Select'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Medicines Summary & Add to Cart */}
          {selectedMedicines.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Selected Medicines ({selectedMedicines.length})
              </h3>
              
              <div className="space-y-2 mb-4">
                {selectedMedicines.map((medicine) => (
                  <div key={medicine.selectionKey} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{medicine.selectedProduct.product_name}</span>
                    <span>Qty: {medicine.quantity} × ₹{medicine.selectedProduct.price} = ₹{(medicine.quantity * medicine.selectedProduct.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-700 font-semibold">
                    Total: ₹{selectedMedicines.reduce((total, med) => total + (med.quantity * med.selectedProduct.price), 0).toFixed(2)}
                  </p>
                  <p className="text-green-600 text-sm">
                    Remember to upload original prescription during checkout
                  </p>
                </div>
                
                <button
                  onClick={addToCart}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompositionBasedPrescriptionProcessor;
