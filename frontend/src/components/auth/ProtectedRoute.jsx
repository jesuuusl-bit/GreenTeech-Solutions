// ===== frontend/src/components/auth/ProtectedRoute.jsx =====
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [extraLoading, setExtraLoading] = useState(true);

  // Add extra loading time to give AuthContext time to properly initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setExtraLoading(false);
    }, 300); // Wait a bit longer for auth to stabilize

    return () => clearTimeout(timer);
  }, []);

  if (loading || extraLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  // Final fallback: check localStorage directly if context says not authenticated
  if (!isAuthenticated) {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // If we have tokens but context says not authenticated, give it more time
    if (token && storedUser) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
        </div>
      );
    }
    
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