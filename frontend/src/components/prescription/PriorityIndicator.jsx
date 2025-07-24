import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const PriorityIndicator = ({ 
  uploadDate, 
  size = 'md', 
  showLabel = false, 
  showTooltip = true,
  className = '' 
}) => {
  const calculatePriority = (uploadDate) => {
    const now = new Date();
    const upload = new Date(uploadDate);
    const hoursDiff = (now - upload) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return {
        level: 'urgent',
        label: 'Urgent',
        description: 'Over 24 hours old',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: AlertTriangle,
        hours: Math.round(hoursDiff)
      };
    } else if (hoursDiff > 12) {
      return {
        level: 'high',
        label: 'High Priority',
        description: 'Over 12 hours old',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        icon: Clock,
        hours: Math.round(hoursDiff)
      };
    } else {
      return {
        level: 'normal',
        label: 'Normal',
        description: 'Recent upload',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        hours: Math.round(hoursDiff)
      };
    }
  };

  const sizeConfig = {
    sm: {
      dotSize: 'w-2 h-2',
      text: 'text-xs',
      iconSize: 12,
      padding: 'px-2 py-1'
    },
    md: {
      dotSize: 'w-3 h-3',
      text: 'text-sm',
      iconSize: 14,
      padding: 'px-3 py-1'
    },
    lg: {
      dotSize: 'w-4 h-4',
      text: 'text-base',
      iconSize: 16,
      padding: 'px-4 py-2'
    }
  };

  const priority = calculatePriority(uploadDate);
  const sizeStyles = sizeConfig[size];
  const IconComponent = priority.icon;

  const formatTimeAgo = (hours) => {
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (showLabel) {
    return (
      <div 
        className={`
          inline-flex items-center rounded-full border
          ${priority.bgColor} ${priority.textColor} ${priority.borderColor}
          ${sizeStyles.padding} ${sizeStyles.text}
          ${className}
        `}
        title={showTooltip ? `${priority.description} - ${formatTimeAgo(priority.hours)}` : ''}
      >
        <IconComponent size={sizeStyles.iconSize} className="mr-1" />
        {priority.label}
        <span className="ml-1 opacity-75">
          ({formatTimeAgo(priority.hours)})
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center ${className}`}
      title={showTooltip ? `${priority.label} - ${priority.description} (${formatTimeAgo(priority.hours)})` : ''}
    >
      <span 
        className={`
          inline-block rounded-full mr-2
          ${sizeStyles.dotSize} ${priority.color}
        `}
      />
      {showTooltip && (
        <span className={`${sizeStyles.text} text-gray-600`}>
          {formatTimeAgo(priority.hours)}
        </span>
      )}
    </div>
  );
};

// Animated pulse variant for urgent items
export const PulsePriorityIndicator = ({ uploadDate, className = '' }) => {
  const priority = React.useMemo(() => {
    const now = new Date();
    const upload = new Date(uploadDate);
    const hoursDiff = (now - upload) / (1000 * 60 * 60);
    return hoursDiff > 24 ? 'urgent' : hoursDiff > 12 ? 'high' : 'normal';
  }, [uploadDate]);

  if (priority === 'urgent') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="relative">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </div>
      </div>
    );
  }

  if (priority === 'high') {
    return (
      <div className={`flex items-center ${className}`}>
        <span className="inline-flex rounded-full h-3 w-3 bg-yellow-500 animate-pulse"></span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className="inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </div>
  );
};

export default PriorityIndicator;
