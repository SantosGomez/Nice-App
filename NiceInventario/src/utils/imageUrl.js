import api from '../services/api.js';

/**
 * Resuelve la URL completa de una imagen para mostrar en la interfaz.
 * Maneja URLs absolutas (http/https), cadenas en Base64 (data:image/...) y rutas relativas del backend (/uploads/...).
 *
 * @param {string} url - Ruta o URL de la imagen
 * @returns {string} URL lista para usar en <q-img> o <img>
 */
export function formatImagenUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Si ya es URL completa o Base64/Blob, devolver tal cual
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Obtener la raíz del host del backend (removiendo '/api' al final)
  const apiBase = api.defaults.baseURL || 'http://localhost:3000/api';
  const serverHost = apiBase.replace(/\/api\/?$/, '');

  // Asegurar que la ruta empiece con '/'
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${serverHost}${cleanPath}`;
}

export default formatImagenUrl;
