// Composition-Based Prescription Processing Page
import React from 'react';
import CompositionBasedPrescriptionProcessor from '../components/CompositionBasedPrescriptionProcessor';

const CompositionBasedPrescription = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧬 Composition-Based Prescription Processing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced AI-powered prescription analysis that matches medicines based on active ingredients and composition, 
            not just brand names. Upload your prescription for intelligent medicine suggestions.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">🔬</div>
            <h3 className="font-semibold text-gray-800 mb-2">OCR-Only AI</h3>
            <p className="text-sm text-gray-600">
              AI extracts medicine names, salts, and dosages without auto-adding to cart
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">🧾</div>
            <h3 className="font-semibold text-gray-800 mb-2">Composition Matching</h3>
            <p className="text-sm text-gray-600">
              Matches based on active ingredients and salts, not brand names
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">👤</div>
            <h3 className="font-semibold text-gray-800 mb-2">User Controlled</h3>
            <p className="text-sm text-gray-600">
              Manual selection and cart addition - you're in complete control
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-semibold text-gray-800 mb-2">Admin Approval</h3>
            <p className="text-sm text-gray-600">
              All orders require admin review and approval before processing
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Upload Prescription</h4>
              <p className="text-sm text-gray-600">Upload your prescription image or PDF</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h4 className="font-medium text-gray-800 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">AI extracts medicines and compositions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Manual Selection</h4>
              <p className="text-sm text-gray-600">Choose medicines from suggestions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Checkout</h4>
              <p className="text-sm text-gray-600">Upload original prescription with order</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                5
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Admin Approval</h4>
              <p className="text-sm text-gray-600">Admin reviews and approves order</p>
            </div>
          </div>
        </div>

        {/* Main Processor Component */}
        <CompositionBasedPrescriptionProcessor />

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Important Notes</h3>
          <ul className="space-y-2 text-yellow-700">
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <span>AI only performs OCR and composition matching - no automatic cart additions</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <span>You must manually select and add medicines to your cart</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <span>Original prescription must be uploaded during checkout</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <span>All orders require admin approval before processing</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <span>Composition matching helps find generic alternatives and exact matches</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompositionBasedPrescription;
