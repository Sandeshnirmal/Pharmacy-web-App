import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { getPublicRoutes, getProtectedRoutes } from './routes';

// Helper function to render route element with lazy loading
const renderRouteElement = (route) => {
  const Component = route.element;

  if (route.lazy) {
    return (
      <Suspense fallback={<LoadingSpinner message={`Loading ${route.title}...`} />}>
        <Component />
      </Suspense>
    );
  }

  return <Component />;
};

function App() {
  const publicRoutes = getPublicRoutes();
  const protectedRoutes = getProtectedRoutes();

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes - Outside Layout (No Sidebar) */}
          {publicRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={renderRouteElement(route)}
            />
          ))}

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes - Inside Layout (With Sidebar) */}
          <Route element={<Layout />}>
            {protectedRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={renderRouteElement(route)}
              />
            ))}

            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App
