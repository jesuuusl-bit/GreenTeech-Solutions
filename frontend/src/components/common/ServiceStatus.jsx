import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { apiDirect } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ServiceStatus() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('checking'); // 'checking', 'online', 'waking', 'offline'
  const [lastCheck, setLastCheck] = useState(null);
  const [showStatus, setShowStatus] = useState(false);

  const checkServiceHealth = async () => {
    // No check if not authenticated or still loading auth
    if (!isAuthenticated || authLoading) {
      return;
    }

    try {
      setStatus('checking');
      const response = await apiDirect.get('/users/health', { timeout: 10000 });
      setStatus('online');
      setLastCheck(new Date());
      
      // Auto-hide after 3 seconds if online
      setTimeout(() => setShowStatus(false), 3000);
    } catch (error) {
      // Don't show status errors if we're not authenticated
      if (!isAuthenticated) return;
      
      if (error.code === 'ECONNABORTED') {
        setStatus('waking');
      } else if (error.response?.status >= 500) {
        setStatus('waking');
      } else if (error.response?.status === 401) {
        // Don't show status for auth errors
        return;
      } else {
        setStatus('offline');
      }
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Only check if authenticated and not loading
    if (isAuthenticated && !authLoading) {
      checkServiceHealth();
    }
    
    // Check every 30 seconds when status is not online and we're authenticated
    const interval = setInterval(() => {
      if (status !== 'online' && isAuthenticated && !authLoading) {
        checkServiceHealth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [status, isAuthenticated, authLoading]);

  // Show/hide based on status
  useEffect(() => {
    if (status === 'waking' || status === 'offline') {
      setShowStatus(true);
    }
  }, [status]);

  if (!showStatus && status === 'online') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: Clock,
          text: 'Verificando conexión...',
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'online':
        return {
          icon: CheckCircle,
          text: 'Servicios conectados',
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'waking':
        return {
          icon: Wifi,
          text: 'Servicios iniciándose... Esto puede tomar 1-2 minutos.',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Servicios no disponibles',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Estado desconocido',
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${config.iconColor} ${status === 'checking' || status === 'waking' ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {config.text}
          </p>
          {lastCheck && (
            <p className="text-xs text-gray-500 mt-1">
              Última verificación: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowStatus(false)}
          className={`text-sm ${config.textColor} hover:opacity-70`}
        >
          ×
        </button>
      </div>
      
      {status === 'waking' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/3"></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Los servicios de Render se están activando. Por favor espera...
          </p>
          <button
            onClick={checkServiceHealth}
            className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Verificar ahora
          </button>
        </div>
      )}

      {status === 'offline' && (
        <div className="mt-3">
          <button
            onClick={checkServiceHealth}
            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
          >
            Reintentar conexión
          </button>
        </div>
      )}
    </div>
  );
}