import { useState } from 'react'
import './App.css'
import DashboardMainContent from './pages/Dasboard.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Medicine from './pages/MedicinesListPage.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          
          <Route path="/Dashboard" element={<DashboardMainContent />} />
          <Route path="/Medicines" element={<Medicine />} />
          {/* Add more routes as needed */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App
