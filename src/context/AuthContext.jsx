// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 1. El estado se inicializa desde localStorage
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('access_token');
    return savedToken ? jwtDecode(savedToken) : null;
  });

  // 2. Función de Logout (estable)
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    // La redirección se maneja en el interceptor, pero podemos forzarla aquí también si es necesario.
    window.location.href = '/login';
  }, []);

  // 4. useEffect del Interceptor (te desloguea si el token expira)
  useEffect(() => {
    const errorInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(errorInterceptor);
    };
  }, [logout]);

  const login = async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await api.post('/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      const newToken = response.data.access_token;

      // --- INICIO DE LA CORRECCIÓN ---
      // 1. Guarda el token en localStorage
      localStorage.setItem('access_token', newToken);
      // El interceptor de request en axiosConfig se encargará de añadir la cabecera.
      // 3. Decodifica y guarda el usuario
      const decodedUser = jwtDecode(newToken);
      setUser(decodedUser);
      // 4. Actualiza el estado de React
      setToken(newToken);

      if (decodedUser.role === 'super_admin') {
        return '/admin'; // Ruta del Super Admin
      } else {
        return '/projects'; // Ruta del usuario normal
      }
    }
  };

  const value = { token, user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}