// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// 🔐 Vérifie si connecté
const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
const currentRoute = window.location.hash;

if (!isLoggedIn && !currentRoute.includes('/login')) {
  window.location.hash = '#/login';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
