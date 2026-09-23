import axios from 'axios';

// URL base del backend Express (por defecto localhost:3000/api o variable de entorno Vite)
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de peticiones: Inyectar automáticamente el Token JWT si existe
api.interceptors.request.use(
  (config) => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed && parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // Ignorar error al parsear localStorage
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas para manejo de errores de conectividad y sesión expirada
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn('⚠️ [API] Sin conexión con el servidor backend (Modo Offline activo)');
    } else if (error.response.status === 401) {
      const isAuthUrl =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthUrl) {
        console.warn('⚠️ [API] Sesión expirada o token inválido (401). Redirigiendo a Login...');
        try {
          localStorage.removeItem('auth');
          if (typeof window !== 'undefined' && !window.location.hash.includes('#/login')) {
            window.location.hash = '#/login';
          }
        } catch (e) {
          console.error('Error al limpiar sesión expirada:', e);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
