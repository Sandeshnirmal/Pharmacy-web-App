import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { routes, getNavigationRoutes } from '../routes';

/**
 * Custom hook for route management and navigation utilities
 */
export const useRoutes = () => {
  const location = useLocation();

  // Get current route information
  const currentRoute = useMemo(() => {
    return routes.find(route => {
      // Handle dynamic routes (with parameters)
      if (route.path.includes(':')) {
        const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(location.pathname);
      }
      return route.path === location.pathname;
    });
  }, [location.pathname]);

  // Get navigation routes for sidebar
  const navigationRoutes = useMemo(() => {
    return getNavigationRoutes();
  }, []);

  // Get breadcrumb data
  const breadcrumbs = useMemo(() => {
    if (!currentRoute) return [];

    const crumbs = [
      { name: 'Dashboard', path: '/dashboard' }
    ];

    if (currentRoute.path !== '/dashboard') {
      crumbs.push({
        name: currentRoute.title,
        path: currentRoute.path
      });
    }

    return crumbs;
  }, [currentRoute]);

  // Check if current route is active
  const isRouteActive = (routePath) => {
    if (routePath.includes(':')) {
      const routePattern = routePath.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(location.pathname);
    }
    return location.pathname === routePath;
  };

  // Get page title
  const pageTitle = useMemo(() => {
    return currentRoute?.title || 'Pharmacy Admin';
  }, [currentRoute]);

  return {
    currentRoute,
    navigationRoutes,
    breadcrumbs,
    isRouteActive,
    pageTitle,
    currentPath: location.pathname
  };
};

export default useRoutes;
