export type LogType = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  type: LogType;
  message: string;
  details?: any;
}

type LogListener = () => void;

class LoggingService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogSize = 100;

  private addLog(type: LogType, message: string, details?: any) {
    console[type](message, details || '');
    this.logs.push({ timestamp: new Date(), type, message, details });
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }
    this.notifyListeners();
  }
  
  info(message: string, details?: any) {
    this.addLog('info', message, details);
  }

  warn(message: string, details?: any) {
    this.addLog('warn', message, details);
  }

  error(message: string, details?: any) {
    this.addLog('error', message, details);
  }
  
  getLogs(): LogEntry[] {
    return this.logs;
  }

  subscribe(listener: LogListener) {
    this.listeners.add(listener);
  }

  unsubscribe(listener: LogListener) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

const logger = new LoggingService();
export default logger;
