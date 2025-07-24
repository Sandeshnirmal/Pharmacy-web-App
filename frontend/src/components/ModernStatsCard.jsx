import React from 'react';
import { Link } from 'react-router-dom';

const ModernStatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'bg-blue-500', 
  trend, 
  link, 
  loading = false 
}) => {
  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    if (!trend) return null;
    return trend > 0 ? (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
      </svg>
    );
  };

  const CardContent = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)}
                  <span className="text-sm font-medium">
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <div className={`w-6 h-6 ${color.replace('bg-', 'text-')}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

export default ModernStatsCard; 