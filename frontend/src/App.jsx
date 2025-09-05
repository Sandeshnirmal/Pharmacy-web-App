import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { routes } from './routes'; // Import the routes array

function App() {
  return (
    <Router>
      <Routes>
        {routes.map((route, index) => {
          if (route.public) {
            return <Route key={index} path={route.path} element={<route.element />} />;
          }
          return null;
        })}
        <Route element={<Layout />}>
          {routes.map((route, index) => {
            if (!route.public) {
              return <Route key={index} path={route.path} element={<route.element />} />;
            }
            return null;
          })}
        </Route>
      </Routes>
    </Router>
  );
}

export default App
