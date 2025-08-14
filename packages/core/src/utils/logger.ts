/**
 * Production-ready logging system for Serenity Notes
 * Features: structured logging, log levels, performance tracking, secure data filtering
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;
  private isElectron: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;

  // Sensitive data patterns to redact
  private sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /credential/i,
    /masterPassword/i
  ];

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.redactSensitiveData(data);
    }
    
    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private isSensitiveKey(key: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(key));
  }

  private redactSensitiveData(text: string): string {
    // Redact potential sensitive data in log messages
    return text.replace(/(['"]\w*(?:password|token|key|secret|auth|credential)\w*['"])\s*:\s*['"]\w+['"]/gi, 
                       '$1: "[REDACTED]"');
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message: this.redactSensitiveData(message),
      context: context ? this.sanitizeData(context) as LogContext : undefined
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: this.redactSensitiveData(error.message),
        stack: this.isDevelopment ? error.stack : undefined
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Format for console output
    const levelColors = {
      [LogLevel.ERROR]: '\x1b[31m',   // Red
      [LogLevel.WARN]: '\x1b[33m',    // Yellow
      [LogLevel.INFO]: '\x1b[36m',    // Cyan
      [LogLevel.DEBUG]: '\x1b[35m',   // Magenta
      [LogLevel.TRACE]: '\x1b[37m'    // White
    };

    const reset = '\x1b[0m';
    const levelName = LogLevel[entry.level];
    const color = levelColors[entry.level] || '';
    
    const contextStr = entry.context ? 
      ` [${entry.context.component || 'Unknown'}${entry.context.operation ? ':' + entry.context.operation : ''}]` : '';
    
    const logMessage = `${color}[${entry.timestamp}] ${levelName}${contextStr}: ${entry.message}${reset}`;

    // Route to appropriate console method
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage, entry.context, entry.error);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.context);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.context);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        if (this.isDevelopment) {
          console.log(logMessage, entry.context);
        }
        break;
    }

    // TODO: Implement file logging via Electron main process
    // For now, critical errors are logged to console and can be captured by Electron's logging
    if (this.isElectron && entry.level <= LogLevel.ERROR) {
      // Could add file logging by extending the Electron API in the future
      // window.electronAPI?.system?.logToFile?.(entry);
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.createLogEntry(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  trace(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      this.writeLog(this.createLogEntry(LogLevel.TRACE, message, context));
    }
  }

  // Performance timing utilities
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Get recent log history for debugging
  getLogHistory(level?: LogLevel): LogEntry[] {
    return level !== undefined 
      ? this.logHistory.filter(entry => entry.level <= level)
      : [...this.logHistory];
  }

  // Clear log history
  clearHistory(): void {
    this.logHistory = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Singleton logger instance
export const logger = new Logger();

// Convenience exports for direct usage
export const { error, warn, info, debug, trace, time, timeEnd } = logger;