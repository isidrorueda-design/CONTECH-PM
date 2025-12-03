// src/components/HomePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Cargando sesión...</p>;
  }

  if (user.role === 'super_admin') {
    return <Navigate to="/admin" replace />; } else {
    return <Navigate to="/projects" replace />;
  }
}

export default HomePage;