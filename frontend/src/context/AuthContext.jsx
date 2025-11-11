// ===== frontend/src/context/AuthContext.jsx =====
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const currentUser = authService.getCurrentUser();
        
        if (token && currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // Clear invalid auth data
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    
    console.log('🔐 Login response in context:', response);
    console.log('🔐 Full response structure:', JSON.stringify(response, null, 2));
    
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
      setUser(user);
      setIsAuthenticated(true);
      console.log('✅ User and auth state updated in context:', user);
    } else {
      console.error('❌ No valid user/token found in response');
      console.error('Available response keys:', Object.keys(response || {}));
      if (response?.data) {
        console.error('Available data keys:', Object.keys(response.data || {}));
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