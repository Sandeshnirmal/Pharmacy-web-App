// Composition-Based Prescription Approval Workflow Component
import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, MessageSquare, Edit3, Eye } from 'lucide-react';

const CompositionBasedApprovalWorkflow = ({ prescription, medicines, onApprove, onReject, onRequestClarification }) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!approvalNotes.trim()) {
      alert('Please provide approval notes');
      return;
    }

    setProcessing(true);
    try {
      await onApprove({
        action: 'verified',
        notes: approvalNotes,
        approval_type: 'composition_based',
        admin_comments: 'Approved after composition-based review'
      });
      setShowApprovalModal(false);
      setApprovalNotes('');
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await onReject({
        action: 'rejected',
        rejection_reason: rejectionReason,
        notes: 'Rejected after composition-based review'
      });
      setShowRejectionModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!clarificationNotes.trim()) {
      alert('Please provide clarification notes');
      return;
    }

    setProcessing(true);
    try {
      await onRequestClarification({
        action: 'need_clarification',
        clarification_notes: clarificationNotes,
        notes: 'Clarification requested after composition-based review'
      });
      setShowClarificationModal(false);
      setClarificationNotes('');
    } catch (error) {
      console.error('Clarification request failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getWorkflowStatus = () => {
    if (prescription?.verification_status === 'Verified') {
      return { status: 'approved', color: 'green', text: 'Approved' };
    } else if (prescription?.verification_status === 'Rejected') {
      return { status: 'rejected', color: 'red', text: 'Rejected' };
    } else if (prescription?.verification_status === 'Need_Clarification') {
      return { status: 'clarification', color: 'yellow', text: 'Needs Clarification' };
    } else {
      return { status: 'pending', color: 'blue', text: 'Pending Review' };
    }
  };

  const workflowStatus = getWorkflowStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            🔐 Admin Approval Workflow
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Review composition-based prescription and customer selections
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${workflowStatus.color}-100 text-${workflowStatus.color}-800`}>
          {workflowStatus.text}
        </div>
      </div>

      {/* Workflow Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Customer Process</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Uploaded prescription image</li>
            <li>✓ AI performed OCR extraction</li>
            <li>✓ Composition-based matching done</li>
            <li>✓ Customer manually selected medicines</li>
            <li>✓ Original prescription uploaded</li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-800">Your Review</span>
          </div>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Verify prescription authenticity</li>
            <li>• Check medicine selections</li>
            <li>• Validate compositions</li>
            <li>• Confirm dosages and quantities</li>
            <li>• Make approval decision</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">Next Steps</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Approve for order processing</li>
            <li>• Reject with detailed reason</li>
            <li>• Request customer clarification</li>
            <li>• Edit medicines if needed</li>
            <li>• Add pharmacist notes</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      {workflowStatus.status === 'pending' && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowApprovalModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Approve Prescription</span>
          </button>

          <button
            onClick={() => setShowRejectionModal(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            <span>Reject Prescription</span>
          </button>

          <button
            onClick={() => setShowClarificationModal(true)}
            className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Request Clarification</span>
          </button>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Approve Prescription
              </h3>
              <p className="text-gray-600 mb-4">
                This will approve the prescription and allow order processing. Please provide approval notes.
              </p>
              
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Enter approval notes (required)..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows="4"
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing || !approvalNotes.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">
                Reject Prescription
              </h3>
              <p className="text-gray-600 mb-4">
                This will reject the prescription. Please provide a detailed reason for rejection.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (required)..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows="4"
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {showClarificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                Request Clarification
              </h3>
              <p className="text-gray-600 mb-4">
                This will request clarification from the customer. Please specify what needs clarification.
              </p>
              
              <textarea
                value={clarificationNotes}
                onChange={(e) => setClarificationNotes(e.target.value)}
                placeholder="Enter clarification request (required)..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows="4"
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowClarificationModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestClarification}
                  disabled={processing || !clarificationNotes.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {processing ? 'Requesting...' : 'Request Clarification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompositionBasedApprovalWorkflow;
