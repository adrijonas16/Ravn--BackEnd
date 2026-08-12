// Cliente axios centralizado — todas las llamadas a la API pasan por aquí
import axios from 'axios';

const api = axios.create({
  // URL base: todas las rutas se concatenan a esta (ej: api.get('/products') → GET localhost:3000/api/v1/products)
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de request: adjunta el token JWT automáticamente a cada petición
// Así no tienes que escribir headers: { Authorization: ... } en cada llamada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: si la API devuelve 401 (no autorizado), limpia el token y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Solo redirige si no estamos ya en login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
