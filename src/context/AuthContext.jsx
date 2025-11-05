// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthToken } from '../api/axiosConfig';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken ? jwtDecode(savedToken) : null;
  });

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('token');
  }, []);

  // Hook de Arranque (setea el token en axios si la página se recarga)
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setAuthToken(savedToken);
    }
  }, []);

  // Hook Interceptor (te desloguea si el token expira)
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

  // --- ¡FUNCIÓN DE LOGIN CORREGIDA! ---
  // Ahora devuelve la ruta de redirección
  const login = async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await api.post('/login', params, { 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      const newToken = response.data.access_token;
      
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
    }
    // Si falla, la promesa se rechazará y el 'catch' en LoginPage se activará
  };
  // --- FIN DE LA CORRECCIÓN ---

  const value = { token, user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}