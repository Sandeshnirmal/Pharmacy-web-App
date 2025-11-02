import React, { Suspense } from 'react'; // Import Suspense
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner'; // Import LoadingSpinner
import { routes, getPublicRoutes, getProtectedRoutes } from './routes'; // Import routes and helper functions

function App() {
  const publicRoutes = getPublicRoutes();
  const protectedRoutes = getProtectedRoutes();

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}> {/* Wrap routes with Suspense */}
        <Routes>
          {/* Public Routes (e.g., Login) */}
          {publicRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={<route.element />} />
          ))}

          {/* Protected Routes - Inside Layout (With Sidebar) */}
          <Route element={<Layout />}>
            {protectedRoutes.map((route, index) => (
              <Route key={index} path={route.path} element={<route.element />} />
            ))}
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
