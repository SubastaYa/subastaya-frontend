import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const TOKEN_STORAGE_KEY = 'subastaya_token';

// Instancia centralizada de Axios para la API de SubastaYa
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5017/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud: Adjunta automáticamente el token Bearer si existe en localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Maneja desautorización global (HTTP 401)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (existingToken) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Notificar al contexto o suscriptores de sesión caducada
        window.dispatchEvent(new CustomEvent('subastaya:auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
