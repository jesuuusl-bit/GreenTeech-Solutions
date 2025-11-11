import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import debugLogger from '../utils/debugLogger';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    // Evitar multiples llamadas si ya se está deslogueado
    if (!localStorage.getItem('token')) return;
    
    authService.logout(); // Limpia localStorage
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.clear(); // Limpiar sessionStorage por si acaso
    debugLogger.log('🗑️ Logout complete. State and storage cleared.');
    toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
  };

  useEffect(() => {
    const initializeAuth = () => {
      debugLogger.log('🔄 Initializing authentication...');
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const storedUser = authService.getCurrentUser();

        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          debugLogger.success('✅ Auth initialized from localStorage.');
        } else {
          debugLogger.log('ℹ️ No active session found in localStorage.');
        }
      } catch (error) {
        debugLogger.error('❌ Error initializing auth:', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        debugLogger.log('🏁 Auth initialization complete.');
      }
    };

    initializeAuth();

    // Listener para el evento de error de autenticación global
    const handleAuthError = () => {
      debugLogger.log('🔴 Auth error event received. Logging out.');
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);

    // Limpieza del listener
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const login = async (email, password) => {
    debugLogger.log('🔐 Attempting login...');
    try {
      const response = await authService.login(email, password);
      
      const responseData = response?.data?.data || response?.data || response;
      const { user: loggedInUser, token } = responseData;

      if (loggedInUser && token) {
        setUser(loggedInUser);
        setIsAuthenticated(true);
        debugLogger.success('✅ Login successful. Context updated.', { user: loggedInUser.name });
        return response;
      } else {
        throw new Error('Invalid response from server: user or token missing.');
      }
    } catch (error) {
      debugLogger.error('❌ Login failed:', error.message);
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};