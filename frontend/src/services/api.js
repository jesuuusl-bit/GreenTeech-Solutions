import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://greentech-api-gateway.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 segundos para permitir que los servicios se "despierten"
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Manejo de autenticación - Error 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevenir bucles de reintento infinitos
      
      console.error('🔴 Error 401: Token inválido o expirado.');
      
      // Disparar un evento global para que el AuthContext maneje el logout.
      // Esto desacopla la lógica de API de la navegación.
      window.dispatchEvent(new CustomEvent('auth-error'));
    }

    // Manejo de errores de servidor y timeouts
    if (error.code === 'ECONNABORTED') {
      error.message = 'El servidor está tardando en responder. Los servicios pueden estar iniciándose. Por favor, espera un momento e intenta de nuevo.';
    } else if (error.response?.status === 429) {
      error.message = 'Demasiadas solicitudes. Por favor espera unos segundos antes de intentar de nuevo.';
    } else if (error.response?.status >= 500) {
      error.message = 'Error de conexión con el servidor. Los servicios pueden estar iniciándose o no disponibles.';
    }

    return Promise.reject(error);
  }
);

export default api;
