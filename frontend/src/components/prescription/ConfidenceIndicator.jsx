import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ConfidenceIndicator = ({ 
  confidence, 
  size = 'md', 
  showPercentage = true, 
  showIcon = true,
  showLabel = false,
  className = '' 
}) => {
  // Normalize confidence to 0-1 range if it's in 0-100 range
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
  const percentage = Math.round(normalizedConfidence * 100);

  const getConfidenceLevel = (conf) => {
    if (conf >= 0.8) return 'high';
    if (conf >= 0.5) return 'medium';
    return 'low';
  };

  const confidenceLevel = getConfidenceLevel(normalizedConfidence);

  const levelConfig = {
    high: {
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: TrendingUp,
      label: 'High Confidence'
    },
    medium: {
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      icon: Minus,
      label: 'Medium Confidence'
    },
    low: {
      color: 'bg-red-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      icon: TrendingDown,
      label: 'Low Confidence'
    }
  };

  const sizeConfig = {
    sm: {
      barHeight: 'h-1',
      barWidth: 'w-12',
      text: 'text-xs',
      iconSize: 12
    },
    md: {
      barHeight: 'h-2',
      barWidth: 'w-16',
      text: 'text-sm',
      iconSize: 14
    },
    lg: {
      barHeight: 'h-3',
      barWidth: 'w-20',
      text: 'text-base',
      iconSize: 16
    }
  };

  const config = levelConfig[confidenceLevel];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Progress Bar */}
      <div className={`${sizeStyles.barWidth} ${sizeStyles.barHeight} bg-gray-200 rounded-full overflow-hidden`}>
        <div 
          className={`${sizeStyles.barHeight} ${config.color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage */}
      {showPercentage && (
        <span className={`${sizeStyles.text} font-medium ${config.textColor}`}>
          {percentage}%
        </span>
      )}

      {/* Icon */}
      {showIcon && (
        <IconComponent 
          size={sizeStyles.iconSize} 
          className={config.textColor} 
        />
      )}

      {/* Label */}
      {showLabel && (
        <span className={`${sizeStyles.text} ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// Circular confidence indicator variant
export const CircularConfidenceIndicator = ({ 
  confidence, 
  size = 60, 
  strokeWidth = 4,
  showPercentage = true,
  className = '' 
}) => {
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
  const percentage = Math.round(normalizedConfidence * 100);
  
  const getConfidenceLevel = (conf) => {
    if (conf >= 0.8) return 'high';
    if (conf >= 0.5) return 'medium';
    return 'low';
  };

  const confidenceLevel = getConfidenceLevel(normalizedConfidence);
  
  const colorMap = {
    high: '#10B981',
    medium: '#F59E0B',
    low: '#EF4444'
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedConfidence * circumference);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[confidenceLevel]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ConfidenceIndicator;
