// Debug logger que persiste logs en localStorage
class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.loadLogs();
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
      type: 'log'
    };
    
    console.log(`🔍 [${timestamp}] ${message}`, data || '');
    this.addLog(logEntry);
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: error ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : null,
      type: 'error'
    };
    
    console.error(`❌ [${timestamp}] ${message}`, error || '');
    this.addLog(logEntry);
  }

  success(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
      type: 'success'
    };
    
    console.log(`✅ [${timestamp}] ${message}`, data || '');
    this.addLog(logEntry);
  }

  addLog(logEntry) {
    this.logs.unshift(logEntry); // Add to beginning
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    this.saveLogs();
  }

  saveLogs() {
    try {
      localStorage.setItem('debugLogs', JSON.stringify(this.logs));
    } catch (e) {
      console.error('Could not save debug logs:', e);
    }
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem('debugLogs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Could not load debug logs:', e);
      this.logs = [];
    }
  }

  getLogs() {
    return this.logs;
  }

  getFormattedLogs() {
    return this.logs.map(log => {
      const icon = log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : '🔍';
      const data = log.data ? `\n${log.data}` : '';
      return `${icon} [${log.timestamp}] ${log.message}${data}`;
    }).join('\n\n');
  }

  clear() {
    this.logs = [];
    localStorage.removeItem('debugLogs');
    console.clear();
    console.log('🧹 Debug logs cleared');
  }

  exportLogs() {
    const formatted = this.getFormattedLogs();
    const blob = new Blob([formatted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Create global instance
const debugLogger = new DebugLogger();

// Make available globally for console access
window.debugLogger = debugLogger;
window.showDebugLogs = () => {
  console.log('📋 Current Debug Logs:');
  console.log(debugLogger.getFormattedLogs());
  return debugLogger.getLogs();
};
window.clearDebugLogs = () => debugLogger.clear();
window.exportDebugLogs = () => debugLogger.exportLogs();

export default debugLogger;