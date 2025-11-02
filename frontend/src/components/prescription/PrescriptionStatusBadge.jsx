import React from 'react';
import { 
  Upload, 
  Bot, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText
} from 'lucide-react';

const PrescriptionStatusBadge = ({ status, size = 'md', showIcon = true, className = '' }) => {
  const statusConfig = {
    'Uploaded': {
      icon: Upload,
      label: 'Uploaded',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600'
    },
    'AI_Processed': {
      icon: Bot,
      label: 'AI Processed',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600'
    },
    'Pending_Review': {
      icon: Clock,
      label: 'Pending Review',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    'Verified': {
      icon: CheckCircle,
      label: 'Verified',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600'
    },
    'Rejected': {
      icon: XCircle,
      label: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600'
    },
    'Clarification_Needed': {
      icon: AlertCircle,
      label: 'Clarification Needed',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600'
    }
  };

  const sizeConfig = {
    'sm': {
      padding: 'px-2 py-1',
      text: 'text-xs',
      iconSize: 12
    },
    'md': {
      padding: 'px-3 py-1',
      text: 'text-sm',
      iconSize: 14
    },
    'lg': {
      padding: 'px-4 py-2',
      text: 'text-base',
      iconSize: 16
    }
  };

  const config = statusConfig[status] || statusConfig['Uploaded'];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeStyles.padding} ${sizeStyles.text}
        ${className}
      `}
    >
      {showIcon && (
        <IconComponent 
          size={sizeStyles.iconSize} 
          className={`mr-1 ${config.iconColor}`} 
        />
      )}
      {config.label}
    </span>
  );
};

export default PrescriptionStatusBadge;
