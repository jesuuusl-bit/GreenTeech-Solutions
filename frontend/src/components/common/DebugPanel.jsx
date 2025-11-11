import { useState, useEffect } from 'react';
import { Bug, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { debugAuth } from '../../utils/debugAuth';

export default function DebugPanel() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    // Update logs every 2 seconds
    const interval = setInterval(() => {
      if (window.debugLogger) {
        setLogs(window.debugLogger.getLogs());
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const debugInfo = debugAuth();
  const recentLogs = logs.slice(0, 5); // Show only last 5 logs

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 p-2 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-yellow-300 bg-yellow-100">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-yellow-700" />
          <span className="font-bold text-yellow-900">Debug Panel</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.exportDebugLogs && window.exportDebugLogs()}
            className="p-1 text-yellow-700 hover:bg-yellow-200 rounded"
            title="Export Logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.clearDebugLogs && window.clearDebugLogs()}
            className="p-1 text-yellow-700 hover:bg-yellow-200 rounded"
            title="Clear Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-yellow-700 hover:bg-yellow-200 rounded"
            title="Hide Panel"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auth Status */}
      <div className="p-3 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className={`px-2 py-1 rounded text-center ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Auth: {isAuthenticated ? '✅' : '❌'}
          </div>
          <div className={`px-2 py-1 rounded text-center ${!authLoading ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            Loading: {authLoading ? '⏳' : '✅'}
          </div>
          <div className={`px-2 py-1 rounded text-center ${debugInfo.token ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Token: {debugInfo.token ? '✅' : '❌'}
          </div>
          <div className={`px-2 py-1 rounded text-center ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            User: {user ? '✅' : '❌'}
          </div>
        </div>
        
        {user && (
          <div className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded">
            User: {user.name || user.email || 'Unknown'}
          </div>
        )}
      </div>

      {/* Recent Logs */}
      <div className="p-3 border-t border-yellow-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-yellow-900">Recent Logs</span>
          <span className="text-xs text-yellow-700">{logs.length} total</span>
        </div>
        
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="text-xs text-yellow-600 italic">No logs yet</div>
          ) : (
            recentLogs.map((log, index) => {
              const icon = log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : '🔍';
              const bgColor = log.type === 'error' ? 'bg-red-50' : log.type === 'success' ? 'bg-green-50' : 'bg-blue-50';
              
              return (
                <div key={index} className={`text-xs p-2 rounded ${bgColor}`}>
                  <div className="flex items-start gap-1">
                    <span>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{log.message}</div>
                      <div className="text-gray-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-yellow-300">
          <button
            onClick={() => {
              console.log('🔍 All Debug Logs:');
              if (window.showDebugLogs) {
                window.showDebugLogs();
              }
            }}
            className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-300 w-full"
          >
            Show All Logs in Console
          </button>
        </div>
      </div>
    </div>
  );
}