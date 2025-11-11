// ===== frontend/src/context/AuthContext.jsx =====
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import debugLogger from '../utils/debugLogger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recentLogin, setRecentLogin] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        debugLogger.log('🔄 Inicializando autenticación...');
        
        // Si acabamos de hacer login o estamos navegando después del login, no ejecutar inicialización
        const loginTimestamp = sessionStorage.getItem('loginTimestamp');
        const navigatingAfterLogin = sessionStorage.getItem('navigatingAfterLogin');
        const now = Date.now();
        const recentLoginTime = loginTimestamp ? (now - parseInt(loginTimestamp)) : Infinity;
        
        if (navigatingAfterLogin === 'true') {
          debugLogger.log('🔄 Navegación post-login detectada, saltando inicialización completamente');
          setLoading(false);
          return;
        }
        
        if (recentLoginTime < 5000) { // Extendido a 5 segundos
          debugLogger.log('🔄 Login reciente detectado, saltando inicialización para evitar conflictos');
          setLoading(false);
          return;
        }
        
        // Esperar más tiempo para evitar race conditions con el login
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Intentar obtener token y usuario con reintentos
        let token = localStorage.getItem('token');
        let currentUser = authService.getCurrentUser();
        
        // Si no hay datos, intentar varias veces (especialmente importante en Vercel)
        if (!token || !currentUser) {
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            token = localStorage.getItem('token');
            currentUser = authService.getCurrentUser();
            if (token && currentUser) break;
          }
        }
        
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
          const isLoginPage = window.location.pathname.includes('/login');
          const isDashboardPage = window.location.pathname.includes('/dashboard');
          
          if (isLoginPage) {
            debugLogger.log('⚠️ En página de login, token/usuario faltante es normal');
            // Solo limpiar si no hay ningún estado previo
            if (!isAuthenticated) {
              setUser(null);
              setIsAuthenticated(false);
            }
          } else if (isDashboardPage) {
            debugLogger.log('⚠️ En dashboard sin token - intentando recuperar de sessionStorage');
            
            // Verificar si hay datos en sessionStorage como backup
            const sessionToken = sessionStorage.getItem('token');
            const sessionUser = sessionStorage.getItem('user');
            
            if (sessionToken && sessionUser) {
              debugLogger.log('🔄 Recuperando desde sessionStorage');
              // Restaurar a localStorage
              localStorage.setItem('token', sessionToken);
              localStorage.setItem('user', sessionUser);
              
              const parsedUser = JSON.parse(sessionUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
              debugLogger.success('✅ Estado recuperado desde sessionStorage');
            } else {
              // Si ya estamos autenticados, no cambiar el estado (puede ser re-mount)
              if (isAuthenticated) {
                debugLogger.log('✅ Manteniendo estado autenticado existente - no hay token pero el contexto indica autenticado');
              } else {
                debugLogger.log('⚠️ No hay backup y no hay estado previo - redirigiendo a login');
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } else {
            // En otras páginas, solo limpiar si no hay estado de autenticación
            if (!isAuthenticated) {
              debugLogger.log('⚠️ Token o usuario faltante en página protegida, limpiando datos de auth');
              authService.logout();
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        debugLogger.error('❌ Error inicializando auth', error);
        // Solo limpiar en caso de error si no hay estado previo
        if (!isAuthenticated) {
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
        debugLogger.log('🏁 Inicialización de auth completada');
      }
    };

    initializeAuth();
  }, []); // No incluir isAuthenticated como dependencia para evitar loops

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
      // Marcar login reciente
      setRecentLogin(true);
      
      // Establecer estado primero, luego verificar que se guardó correctamente
      setUser(user);
      setIsAuthenticated(true);
      
      // Guardar también en sessionStorage como backup para re-mounts
      const now = Date.now().toString();
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('loginTimestamp', now);
      debugLogger.log('💾 Backup guardado en sessionStorage con timestamp:', now);
      
      // Limpiar la flag después de un tiempo
      setTimeout(() => {
        setRecentLogin(false);
        debugLogger.log('🔄 Flag de login reciente limpiada');
      }, 3000);
      
      // Forzar una doble verificación de guardado para Vercel
      setTimeout(() => {
        // Verificar y re-guardar si es necesario
        if (!localStorage.getItem('token')) {
          localStorage.setItem('token', token);
          debugLogger.log('🔄 Re-guardando token en localStorage');
        }
        if (!localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(user));
          debugLogger.log('🔄 Re-guardando usuario en localStorage');
        }
        
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const sessionBackup = sessionStorage.getItem('token');
        debugLogger.log('🔍 Verificación post-login', {
          tokenSaved: !!savedToken,
          userSaved: !!savedUser,
          sessionBackup: !!sessionBackup,
          tokenPreview: savedToken ? savedToken.substring(0, 20) + '...' : 'No encontrado'
        });
      }, 100);
      
      // Segunda verificación más tardía para ambientes como Vercel
      setTimeout(() => {
        const finalToken = localStorage.getItem('token');
        const finalUser = localStorage.getItem('user');
        if (!finalToken || !finalUser) {
          debugLogger.log('⚠️ Datos perdidos después de login, restaurando desde sessionStorage');
          const backupToken = sessionStorage.getItem('token');
          const backupUser = sessionStorage.getItem('user');
          
          if (backupToken && backupUser) {
            localStorage.setItem('token', backupToken);
            localStorage.setItem('user', backupUser);
            
            // Forzar actualización del contexto también
            const parsedUser = JSON.parse(backupUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            debugLogger.success('✅ Estado restaurado exitosamente desde sessionStorage');
          } else {
            debugLogger.error('❌ No hay backup disponible en sessionStorage');
          }
        }
      }, 500);
      
      // Verificación adicional más tardía para casos extremos
      setTimeout(() => {
        const veryFinalToken = localStorage.getItem('token');
        const veryFinalUser = localStorage.getItem('user');
        if (!veryFinalToken || !veryFinalUser) {
          debugLogger.log('⚠️ Verificación adicional: Datos aún perdidos, restauración final');
          const backupToken = sessionStorage.getItem('token');
          const backupUser = sessionStorage.getItem('user');
          
          if (backupToken && backupUser) {
            localStorage.setItem('token', backupToken);
            localStorage.setItem('user', backupUser);
            
            const parsedUser = JSON.parse(backupUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            debugLogger.success('✅ Restauración final exitosa');
          }
        }
      }, 1500);
      
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
    // Limpiar también sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    debugLogger.log('🗑️ Logout completo - localStorage y sessionStorage limpiados');
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