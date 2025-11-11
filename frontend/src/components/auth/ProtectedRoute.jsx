// ===== frontend/src/components/auth/ProtectedRoute.jsx =====
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import debugLogger from '../../utils/debugLogger';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [extraLoading, setExtraLoading] = useState(true);
  const [forceLoading, setForceLoading] = useState(false);

  // Add extra loading time to give AuthContext time to properly initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setExtraLoading(false);
    }, 500); // Increased wait time

    return () => clearTimeout(timer);
  }, []);

  // Check for recent login activity or navigation after login
  useEffect(() => {
    const loginTimestamp = sessionStorage.getItem('loginTimestamp');
    const navigatingAfterLogin = sessionStorage.getItem('navigatingAfterLogin');
    
    if (navigatingAfterLogin === 'true') {
      debugLogger.log('🛡️ ProtectedRoute: Navigation after login detected, forcing extended loading');
      setForceLoading(true);
      const timer = setTimeout(() => {
        setForceLoading(false);
      }, 3000); // Extended loading for navigation
      return () => clearTimeout(timer);
    } else if (loginTimestamp) {
      const timeSinceLogin = Date.now() - parseInt(loginTimestamp);
      if (timeSinceLogin < 7000) { // Extended window - 7 seconds
        debugLogger.log('🛡️ ProtectedRoute: Recent login detected, extending loading period');
        setForceLoading(true);
        const timer = setTimeout(() => {
          setForceLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (loading || extraLoading || forceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  // Enhanced fallback: check localStorage directly and restore context if needed
  if (!isAuthenticated) {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const sessionToken = sessionStorage.getItem('token');
    const sessionUser = sessionStorage.getItem('user');
    
    debugLogger.log('🛡️ ProtectedRoute: Not authenticated, checking storage', {
      hasToken: !!token,
      hasUser: !!storedUser,
      hasSessionToken: !!sessionToken,
      hasSessionUser: !!sessionUser
    });
    
    // If we have tokens but context says not authenticated, try to recover
    if ((token && storedUser) || (sessionToken && sessionUser)) {
      debugLogger.log('🛡️ ProtectedRoute: Found auth data, giving more time for context recovery');
      
      // Force restore from session if localStorage is empty
      if (!token && sessionToken) {
        localStorage.setItem('token', sessionToken);
      }
      if (!storedUser && sessionUser) {
        localStorage.setItem('user', sessionUser);
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
        </div>
      );
    }
    
    debugLogger.log('🛡️ ProtectedRoute: No auth data found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return children;
}