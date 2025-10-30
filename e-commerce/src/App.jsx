import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Navbar from './components/Navabr.jsx'
import Home from './pages/Home.jsx'
import ProductPage from "./pages/ProductPage.jsx";
import ProfilePage from './pages/Profile.jsx';
import CartPage from './pages/Cart.jsx';

const App = () => {
  return (
    <Router>
      {/* <Route path="/home" component={Navbar} /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </Router>
  )
}

export default App

