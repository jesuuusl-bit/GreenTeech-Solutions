import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import debugLogger from '../utils/debugLogger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      debugLogger.log('🔄 Initializing authentication...');
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const storedUser = authService.getCurrentUser(); // Assumes getCurrentUser parses from localStorage

        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          debugLogger.success('✅ Auth initialized from localStorage.');
        } else {
          debugLogger.log('ℹ️ No active session found in localStorage.');
        }
      } catch (error) {
        debugLogger.error('❌ Error initializing auth:', error);
        // Clear any potentially corrupted state
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        debugLogger.log('🏁 Auth initialization complete.');
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    debugLogger.log('🔐 Attempting login...');
    try {
      const response = await authService.login(email, password);
      
      // Normalize response data
      const responseData = response?.data?.data || response?.data || response;
      const { user: loggedInUser, token } = responseData;

      if (loggedInUser && token) {
        // The authService.login should handle storing the token and user in localStorage
        setUser(loggedInUser);
        setIsAuthenticated(true);
        debugLogger.success('✅ Login successful. Context updated.', { user: loggedInUser.name });
        return response;
      } else {
        throw new Error('Invalid response from server: user or token missing.');
      }
    } catch (error) {
      debugLogger.error('❌ Login failed:', error.message);
      // Ensure state is clean after a failed login
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      throw error; // Re-throw error to be caught by the UI
    }
  };

  const logout = () => {
    authService.logout(); // This should clear localStorage
    setUser(null);
    setIsAuthenticated(false);
    // Clean session storage as well, just in case the old code left anything behind
    sessionStorage.clear();
    debugLogger.log('🗑️ Logout complete. State and storage cleared.');
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
