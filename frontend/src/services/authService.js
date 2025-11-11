// ===== frontend/src/services/authService.js =====
import api from './api';
import axios from 'axios';

export const authService = {
  login: async (email, password) => {
    try {
      console.log('📡 Enviando petición de login...');
      let response;
      
      try {
        // Intentar primero con API Gateway
        response = await api.post('/users/login', { email, password });
        console.log('✅ Login exitoso vía API Gateway');
      } catch (apiGatewayError) {
        console.log('⚠️ API Gateway falló, intentando directamente con Users Service...');
        
        // Si falla API Gateway, intentar directamente con Users Service
        response = await axios.post('https://greentech-users.onrender.com/api/users/login', {
          email,
          password,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        });
        console.log('✅ Login exitoso vía Users Service directo');
      }
      
      console.log('📥 Respuesta recibida:', response.data);
      
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Token y usuario guardados');
        return response.data;
      } else {
        throw new Error('Respuesta del servidor inválida');
      }
    } catch (error) {
      console.error('❌ Error en authService.login:', error);
      throw error;
    }
  },

  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};