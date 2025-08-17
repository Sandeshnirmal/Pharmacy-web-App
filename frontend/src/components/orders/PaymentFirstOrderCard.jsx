import React, { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Eye, FileText, CreditCard } from 'lucide-react';
import { prescriptionAPI } from '../../api/apiService'; // Using centralized API service

const PaymentFirstOrderCard = ({ order, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const getStatusInfo = (status) => {
    const statusMap = {
      'pending_payment': {
        icon: Clock,
        color: 'orange',
        text: 'Awaiting Payment',
        description: 'Prescription uploaded, waiting for payment completion'
      },
      'pending_verification': {
        icon: Clock,
        color: 'blue',
        text: 'Awaiting Verification',
        description: 'Payment completed, prescription needs pharmacist review'
      },
      'under_review': {
        icon: Eye,
        color: 'yellow',
        text: 'Under Review',
        description: 'Pharmacist reviewing prescription'
      },
      'verified': {
        icon: CheckCircle,
        color: 'green',
        text: 'Prescription Verified',
        description: 'Prescription verified, order ready for processing'
      },
      'processing': {
        icon: Clock,
        color: 'blue',
        text: 'Processing',
        description: 'Order being prepared'
      },
      'shipped': {
        icon: CheckCircle,
        color: 'green',
        text: 'Shipped',
        description: 'Order shipped to customer'
      },
      'delivered': {
        icon: CheckCircle,
        color: 'green',
        text: 'Delivered',
        description: 'Order delivered successfully'
      },
      'rejected': {
        icon: AlertTriangle,
        color: 'red',
        text: 'Prescription Rejected',
        description: 'Prescription needs to be resubmitted'
      }
    };
    return statusMap[status] || statusMap['pending_payment'];
  };

  const handleVerifyPrescription = async () => {
    setIsUpdating(true);
    try {
      // Verify the prescription
      await prescriptionAPI.verifyPrescription(order.prescription_id, {
        status: 'verified',
        notes: 'Prescription verified by pharmacist'
      });

      // Update order status to verified (payment already completed)
      onStatusUpdate(order.id, 'verified');
    } catch (error) {
      console.error('Error verifying prescription:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectPrescription = async () => {
    setIsUpdating(true);
    try {
      await prescriptionAPI.verifyPrescription(order.prescription_id, {
        status: 'rejected',
        notes: 'Prescription rejected - please resubmit'
      });
      
      onStatusUpdate(order.id, 'rejected');
    } catch (error) {
      console.error('Error rejecting prescription:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.order_number || order.id}
          </h3>
          <p className="text-sm text-gray-600">
            {order.customer_name} • ₹{order.total_amount}
          </p>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
          <StatusIcon size={16} />
          <span>{statusInfo.text}</span>
        </div>
      </div>

      {/* Status Description */}
      <p className="text-sm text-gray-600 mb-4">{statusInfo.description}</p>

      {/* Order Items Preview */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Items ({order.items?.length || 0})</h4>
        <div className="space-y-1">
          {order.items?.slice(0, 3).map((item, index) => (
            <div key={index} className="text-sm text-gray-600">
              {item.name} × {item.quantity}
            </div>
          ))}
          {order.items?.length > 3 && (
            <div className="text-sm text-gray-500">
              +{order.items.length - 3} more items
            </div>
          )}
        </div>
      </div>

      {/* Prescription Section */}
      {order.prescription_id && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Prescription Uploaded
              </span>
            </div>
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {order.status === 'pending_payment' && (
          <div className="flex-1 bg-orange-100 text-orange-800 px-4 py-2 rounded-md text-sm font-medium text-center">
            📋 Prescription Uploaded - Waiting for payment completion
          </div>
        )}

        {order.status === 'pending_verification' && (
          <>
            <button
              onClick={handleVerifyPrescription}
              disabled={isUpdating}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {isUpdating ? 'Verifying...' : 'Verify Prescription'}
            </button>
            <button
              onClick={handleRejectPrescription}
              disabled={isUpdating}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {isUpdating ? 'Rejecting...' : 'Reject Prescription'}
            </button>
          </>
        )}

        {order.status === 'verified' && (
          <button
            onClick={() => onStatusUpdate(order.id, 'processing')}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Start Processing Order
          </button>
        )}

        {order.status === 'processing' && (
          <button
            onClick={() => onStatusUpdate(order.id, 'shipped')}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            Mark as Shipped
          </button>
        )}

        {order.status === 'shipped' && (
          <button
            onClick={() => onStatusUpdate(order.id, 'delivered')}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Mark as Delivered
          </button>
        )}

        {order.status === 'rejected' && (
          <div className="flex-1 bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium text-center">
            ✗ Prescription Rejected - Customer needs to resubmit
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Prescription Image</h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              {order.prescription_image_url ? (
                <img
                  src={order.prescription_image_url}
                  alt="Prescription"
                  className="w-full h-auto rounded-lg border"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No prescription image available</span>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFirstOrderCard;
