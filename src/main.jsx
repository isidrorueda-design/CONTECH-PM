// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 1. Importa BrowserRouter
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'; // Importa el Auth

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. BrowserRouter DEBE envolver a AuthProvider y App */}
    <BrowserRouter
      future={{
        // Activa la nueva funcionalidad de transiciones para React Router v7
        v7_startTransition: true,
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)