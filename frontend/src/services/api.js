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

// Función para retry automático
const retry = async (fn, retries = 1, delay = 3000) => {
  try {
    return await fn();
  } catch (error) {
    // No retry para errores de rate limiting
    if (error.response?.status === 429) {
      throw error;
    }
    
    // Solo retry para errores de servidor y timeouts
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
      console.log(`🔄 Reintentando request... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Manejo de autenticación
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Manejo de errores de servidor y timeouts
    if (error.code === 'ECONNABORTED') {
      error.message = 'El servidor está tardando en responder. Los servicios pueden estar iniciándose. Por favor, espera un momento e intenta de nuevo.';
    } else if (error.response?.status === 429) {
      error.message = 'Demasiadas solicitudes. Por favor espera unos segundos antes de intentar de nuevo.';
    } else if (error.response?.status === 502) {
      error.message = 'Error de conexión con el servidor. Los servicios pueden estar iniciándose. Intenta de nuevo en unos segundos.';
    } else if (error.response?.status === 503) {
      error.message = 'Servicio temporalmente no disponible. Los servicios están iniciándose, intenta de nuevo en unos segundos.';
    } else if (error.response?.status === 504) {
      error.message = 'El servidor tardó demasiado en responder. Los servicios pueden estar iniciándose.';
    }

    return Promise.reject(error);
  }
);

// Wrapper para requests con retry automático
const apiWithRetry = {
  get: (url, config) => retry(() => api.get(url, config)),
  post: (url, data, config) => retry(() => api.post(url, data, config)),
  put: (url, data, config) => retry(() => api.put(url, data, config)),
  delete: (url, config) => retry(() => api.delete(url, config)),
  patch: (url, data, config) => retry(() => api.patch(url, data, config)),
};

export default apiWithRetry;
export { api as apiDirect }; // Para casos donde no queremos retry