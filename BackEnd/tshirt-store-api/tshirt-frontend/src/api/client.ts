// Cliente axios centralizado — todas las llamadas a la API pasan por aquí
import axios from 'axios';
import {
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const api = axios.create({
  // URL base: todas las rutas se concatenan a esta (ej: api.get('/products') → GET localhost:3000/api/v1/products)
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

function clearStoredSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function isAuthRoute(path?: string) {
  return (
    path?.includes('/auth/signin') ||
    path?.includes('/auth/signup') ||
    path?.includes('/auth/refresh') ||
    path?.includes('/auth/signout')
  );
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('Missing refresh token');

  const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
  localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  return data.accessToken;
}

// Interceptor de request: adjunta el token JWT automáticamente a cada petición
// Así no tienes que escribir headers: { Authorization: ... } en cada llamada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: si la API devuelve 401 (no autorizado), limpia el token y redirige al login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        clearStoredSession();
      }
    }

    if (error.response?.status === 401) {
      clearStoredSession();
      // Solo redirige si no estamos ya en login/register
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        !window.location.pathname.includes('/forgot-password') &&
        !window.location.pathname.includes('/reset-password')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
