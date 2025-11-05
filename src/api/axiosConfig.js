// src/api/axiosConfig.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

// Crea una 'instancia' de axios
const api = axios.create({
  baseURL: API_URL,
});

// --- ¡ESTA ES LA CORRECCIÓN! ---
// Este código se ejecuta 1 sola vez, cuando el archivo es importado
// (antes de que React renderice).
// Lee el token del localStorage y lo pone en la cabecera INMEDIATAMENTE.
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
// --- FIN DE LA CORRECCIÓN ---

// Esta función permite a AuthContext CAMBIAR el token (al loguear/desloguear)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- ¡ESTA ES LA CORRECCIÓN! ---
// Creamos un interceptor para manejar errores 401 (No Autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401, deslogueamos al usuario
    if (error.response && error.response.status === 401) {
      // En lugar de llamar a logout() directamente, despachamos un evento global.
      // AuthContext escuchará este evento.
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);


export default api; // Exporta la instancia ya configurada
