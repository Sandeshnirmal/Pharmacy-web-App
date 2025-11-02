import React from 'react';
import { 
  Upload, 
  Bot, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Package,
  Truck,
  ArrowRight
} from 'lucide-react';

const PrescriptionWorkflowVisualization = ({ 
  currentStatus, 
  hasOrder = false,
  isDelivered = false,
  className = '' 
}) => {
  const workflowSteps = [
    {
      id: 'uploaded',
      label: 'Uploaded',
      icon: Upload,
      description: 'Customer uploads prescription',
      statuses: ['Uploaded']
    },
    {
      id: 'processing',
      label: 'Processing',
      icon: Bot,
      description: 'System processes prescription',
      statuses: ['Processing']
    },
    {
      id: 'review',
      label: 'Pharmacist Review',
      icon: Eye,
      description: 'Manual verification by pharmacist',
      statuses: ['Pending_Review']
    },
    {
      id: 'decision',
      label: 'Decision',
      icon: CheckCircle,
      description: 'Approved or rejected',
      statuses: ['Verified', 'Rejected']
    },
    {
      id: 'order',
      label: 'Order Created',
      icon: Package,
      description: 'Order generated for verified prescription',
      statuses: ['Verified'],
      conditional: true
    },
    {
      id: 'delivery',
      label: 'Delivered',
      icon: Truck,
      description: 'Medicine delivered to customer',
      statuses: ['Verified'],
      conditional: true
    }
  ];

  const getStepStatus = (step) => {
    if (step.conditional) {
      if (step.id === 'order' && !hasOrder) return 'disabled';
      if (step.id === 'delivery' && !isDelivered) return 'disabled';
    }

    if (step.statuses.includes(currentStatus)) {
      if (currentStatus === 'Rejected' && step.id === 'decision') {
        return 'rejected';
      }
      return 'active';
    }

    // Check if this step should be completed based on workflow progression
    const stepIndex = workflowSteps.findIndex(s => s.id === step.id);
    const currentStepIndex = workflowSteps.findIndex(s => s.statuses.includes(currentStatus));
    
    if (currentStepIndex > stepIndex) {
      return 'completed';
    }

    return 'pending';
  };

  const getStepStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'bg-green-500 text-white',
          text: 'text-green-800',
          connector: 'bg-green-500'
        };
      case 'active':
        return {
          container: 'bg-blue-50 border-blue-200 ring-2 ring-blue-300',
          icon: 'bg-blue-500 text-white animate-pulse',
          text: 'text-blue-800',
          connector: 'bg-gray-300'
        };
      case 'rejected':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'bg-red-500 text-white',
          text: 'text-red-800',
          connector: 'bg-red-500'
        };
      case 'disabled':
        return {
          container: 'bg-gray-50 border-gray-200 opacity-50',
          icon: 'bg-gray-300 text-gray-500',
          text: 'text-gray-500',
          connector: 'bg-gray-300'
        };
      default: // pending
        return {
          container: 'bg-gray-50 border-gray-200',
          icon: 'bg-gray-300 text-gray-600',
          text: 'text-gray-600',
          connector: 'bg-gray-300'
        };
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Prescription Workflow
      </h3>
      
      <div className="relative">
        {workflowSteps.map((step, index) => {
          const status = getStepStatus(step);
          const styles = getStepStyles(status);
          const IconComponent = step.icon;
          const isLast = index === workflowSteps.length - 1;

          // Skip disabled conditional steps
          if (status === 'disabled') return null;

          return (
            <div key={step.id} className="relative">
              {/* Step Container */}
              <div className={`
                flex items-center p-4 rounded-lg border transition-all duration-300
                ${styles.container}
              `}>
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${styles.icon}
                `}>
                  <IconComponent size={20} />
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <h4 className={`font-medium ${styles.text}`}>
                    {step.label}
                  </h4>
                  <p className={`text-sm ${styles.text} opacity-75`}>
                    {step.description}
                  </p>
                </div>

                {/* Status Indicator */}
                {status === 'active' && (
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      In Progress
                    </span>
                  </div>
                )}
                
                {status === 'completed' && (
                  <div className="ml-4">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                )}

                {status === 'rejected' && (
                  <div className="ml-4">
                    <XCircle size={20} className="text-red-500" />
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex justify-center my-2">
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Current Status:</span>
          <span className="font-medium text-gray-900">
            {currentStatus?.replace('_', ' ') || 'Unknown'}
          </span>
        </div>
        {hasOrder && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Order Status:</span>
            <span className="font-medium text-green-700">
              {isDelivered ? 'Delivered' : 'Processing'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionWorkflowVisualization;
