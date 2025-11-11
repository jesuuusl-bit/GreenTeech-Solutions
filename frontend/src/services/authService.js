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
        response = await axios.post('https://greentech-users.onrender.com/users/login', {
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
      
      console.log('📥 Respuesta recibida completa:', response);
      console.log('📥 Response.data:', response.data);
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);
      
      // Try to handle different response structures
      let finalResponse = response.data;
      let token = null;
      let user = null;
      
      if (response.data.success && response.data.data) {
        // Expected structure: { success: true, data: { token, user } }
        token = response.data.data.token;
        user = response.data.data.user;
        console.log('✅ Using expected structure (success + data)');
      } else if (response.data.token && response.data.user) {
        // Alternative structure: { token, user }
        token = response.data.token;
        user = response.data.user;
        finalResponse = { success: true, data: { token, user } };
        console.log('✅ Using alternative structure (direct token + user)');
      } else if (response.data.data && response.data.data.token) {
        // Another structure: { data: { token, user } }
        token = response.data.data.token;
        user = response.data.data.user;
        finalResponse = { success: true, data: { token, user } };
        console.log('✅ Using nested data structure');
      }
      
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Token y usuario guardados:', { token: token.substring(0, 20) + '...', user });
        return finalResponse;
      } else {
        console.error('❌ No se encontró token o usuario en la respuesta');
        console.error('Available keys:', Object.keys(response.data || {}));
        throw new Error('Respuesta del servidor inválida - no contiene token o usuario');
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