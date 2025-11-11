// ===== frontend/src/context/AuthContext.jsx =====
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import debugLogger from '../utils/debugLogger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        debugLogger.log('🔄 Inicializando autenticación...');
        
        // Esperar un poco para evitar race conditions con el login
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const token = localStorage.getItem('token');
        const currentUser = authService.getCurrentUser();
        
        debugLogger.log('🔍 Token en localStorage:', token ? `${token.substring(0, 20)}...` : 'No encontrado');
        debugLogger.log('🔍 Usuario en localStorage:', currentUser);
        
        if (token && currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          debugLogger.success('✅ Autenticación inicializada correctamente', {
            user: currentUser.name,
            role: currentUser.role
          });
        } else {
          // Solo limpiar si estamos realmente en la página de login
          // No limpiar si acabamos de hacer login (podría ser un race condition)
          const isLoginPage = window.location.pathname.includes('/login');
          
          if (isLoginPage) {
            debugLogger.log('⚠️ En página de login, token/usuario faltante es normal');
          } else {
            debugLogger.log('⚠️ Token o usuario faltante, limpiando datos de auth');
            authService.logout();
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        debugLogger.error('❌ Error inicializando auth', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        debugLogger.log('🏁 Inicialización de auth completada');
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    debugLogger.log('🔐 Iniciando login en AuthContext');
    const response = await authService.login(email, password);
    
    debugLogger.log('🔐 Login response in context', response);
    debugLogger.log('🔐 Full response structure', response);
    
    // Check multiple possible response structures
    let user = null;
    let token = null;
    
    if (response?.data?.data?.user) {
      // Structure: { data: { data: { user, token } } }
      user = response.data.data.user;
      token = response.data.data.token;
      console.log('📋 Using nested data structure');
    } else if (response?.data?.user) {
      // Structure: { data: { user, token } }
      user = response.data.user;
      token = response.data.token;
      console.log('📋 Using direct data structure');
    } else if (response?.user) {
      // Structure: { user, token }
      user = response.user;
      token = response.token;
      console.log('📋 Using flat structure');
    }
    
    if (user && token) {
      // Establecer estado primero, luego verificar que se guardó correctamente
      setUser(user);
      setIsAuthenticated(true);
      
      // Verificar que el token realmente se guardó después de un pequeño delay
      setTimeout(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        debugLogger.log('🔍 Verificación post-login', {
          tokenSaved: !!savedToken,
          userSaved: !!savedUser,
          tokenPreview: savedToken ? savedToken.substring(0, 20) + '...' : 'No encontrado'
        });
      }, 100);
      
      debugLogger.success('✅ User and auth state updated in context', { 
        user: user.name || user.email,
        isAuthenticated: true 
      });
    } else {
      debugLogger.error('❌ No valid user/token found in response');
      debugLogger.error('Available response keys', Object.keys(response || {}));
      if (response?.data) {
        debugLogger.error('Available data keys', Object.keys(response.data || {}));
      }
      throw new Error('Invalid response from server - no user or token found');
    }
    
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};