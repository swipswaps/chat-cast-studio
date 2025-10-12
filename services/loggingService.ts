
export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: any;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private listeners = new Set<(logs: LogEntry[]) => void>();

  private addLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const entry: LogEntry = { level, message, timestamp: new Date(), data };
    this.logs.push(entry);
    
    // Keep logs from getting too big
    if (this.logs.length > 200) {
      this.logs.shift();
    }
    
    if (level === 'error') {
      console.error(`[${entry.timestamp.toLocaleTimeString()}] ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[${entry.timestamp.toLocaleTimeString()}] ${message}`, data);
    } else {
      console.log(`[${entry.timestamp.toLocaleTimeString()}] ${message}`, data);
    }
    
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately send current logs to the new listener
    listener([...this.logs]); 
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

const logger = new LoggingService();
export default logger;
