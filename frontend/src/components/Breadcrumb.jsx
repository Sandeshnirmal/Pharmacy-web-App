import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useRoutes } from '../hooks/useRoutes';

const Breadcrumb = () => {
  const { breadcrumbs, currentRoute } = useRoutes();

  if (!breadcrumbs.length) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        Dashboard
      </Link>
      
      {breadcrumbs.length > 1 && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">
            {currentRoute?.title}
          </span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
