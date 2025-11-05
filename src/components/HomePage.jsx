// src/components/HomePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function HomePage() {
  const { user } = useAuth();

  if (!user) {
    // Si no hay usuario (aún cargando o token inválido), espera
    return <p>Cargando sesión...</p>;
  }

  // ¡La lógica de enrutamiento!
  if (user.role === 'super_admin') {
    // Si es Super Admin, llévalo al dashboard de admin
    return <Navigate to="/admin" replace />;
  } else {
    // Si es 'admin' o 'user', llévalo a la lista de proyectos
    return <Navigate to="/projects" replace />;
  }
}

export default HomePage;