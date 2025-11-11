import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://greentech-api-gateway.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
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

      const loginTimestamp = sessionStorage.getItem('loginTimestamp');
      const now = Date.now();
      const GRACE_PERIOD_MS = 10000; // 10 segundos

      if (loginTimestamp && (now - parseInt(loginTimestamp)) < GRACE_PERIOD_MS) {
        // Error 401 dentro del período de gracia post-login
        console.warn(`🟡 401 dentro del período de gracia. Reintentando en 1s...`);
        
        // Esperar un poco y reintentar la petición original
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);

      } else {
        // Error 401 real o fuera del período de gracia
        console.error('🔴 Error 401: Token inválido o expirado. Deslogueando...');
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
    }

    // Manejo de otros errores de servidor
    if (error.code === 'ECONNABORTED') {
      error.message = 'El servidor está tardando en responder. Los servicios pueden estar iniciándose.';
    } else if (error.response?.status === 429) {
      error.message = 'Demasiadas solicitudes. Por favor espera unos segundos.';
    } else if (error.response?.status >= 500) {
      error.message = 'Error de conexión con el servidor. Los servicios pueden estar no disponibles.';
    }

    return Promise.reject(error);
  }
);

export default api;