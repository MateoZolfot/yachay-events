// frontend/src/services/api.js
import axios from 'axios';
import authService from './authService'; // Para obtener el token

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor para añadir el token a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Opcional: Interceptor para manejar errores de token (ej. 401 Unauthorized) globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el error es 401 (Token inválido/expirado)
      // Podrías desloguear al usuario y redirigirlo a la página de login.
      // authService.logout(); // Asegúrate que esto no cause un bucle si el logout también hace una llamada API
      // window.location.href = '/login'; // Redirección simple
      console.error('Error 401: Token inválido o expirado. Se recomienda desloguear.');
      // Es importante manejar esto con cuidado para no crear bucles de redirección.
      // Por ahora, solo lo logueamos. En una app más grande, se implementaría un logout robusto.
    }
    return Promise.reject(error);
  }
);


export default apiClient;