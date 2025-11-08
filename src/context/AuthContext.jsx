// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthToken } from '../api/axiosConfig';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 1. El estado se inicializa desde localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken ? jwtDecode(savedToken) : null;
  });

  // 2. Función de Logout (estable)
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('token');
  }, []);

  // 3. useEffect de Arranque (para refrescar la página)
  // Se asegura de que la cabecera de 'api' tenga el token
  // si la página se recarga.
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setAuthToken(savedToken);
    }
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

  // 5. ¡FUNCIÓN DE LOGIN CORREGIDA!
  // Ahora devuelve el 'role' para que LoginPage decida.
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
      // Hacemos todo INMEDIATAMENTE, antes de que React redirija.
      
      // 1. Guarda el token en localStorage
      localStorage.setItem('token', newToken);
      // 2. Configura la cabecera de axios
      setAuthToken(newToken);
      // 3. Decodifica y guarda el usuario
      const decodedUser = jwtDecode(newToken);
      setUser(decodedUser);
      // 4. Actualiza el estado de React
      setToken(newToken);
      
      // --- 5. ¡DEVUELVE LA RUTA! ---
      // Esto le dice a LoginPage.jsx a dónde ir.
      if (decodedUser.role === 'super_admin') {
        return '/admin'; // Ruta del Super Admin
      } else {
        return '/projects'; // Ruta del usuario normal
      }
      // --- FIN DE LA CORRECCIÓN ---
    }
  };

  const value = { token, user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}