import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Defensive check for a global searchResults variable
if (typeof window !== 'undefined' && typeof window.searchResults === 'undefined') {
  window.searchResults = [];
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
