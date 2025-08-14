/**
 * Production-ready logging system for Serenity Notes
 * Features: structured logging, log levels, performance tracking, secure data filtering
 */
export declare enum LogLevel {
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
declare class Logger {
    private currentLevel;
    private isDevelopment;
    private isElectron;
    private logHistory;
    private maxHistorySize;
    private sensitivePatterns;
    constructor();
    setLevel(level: LogLevel): void;
    private shouldLog;
    private sanitizeData;
    private isSensitiveKey;
    private redactSensitiveData;
    private formatTimestamp;
    private createLogEntry;
    private writeLog;
    error(message: string, context?: LogContext, error?: Error): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    trace(message: string, context?: LogContext): void;
    time(label: string): void;
    timeEnd(label: string, context?: LogContext): void;
    getLogHistory(level?: LogLevel): LogEntry[];
    clearHistory(): void;
    exportLogs(): string;
}
export declare const logger: Logger;
export declare const error: (message: string, context?: LogContext, error?: Error) => void, warn: (message: string, context?: LogContext) => void, info: (message: string, context?: LogContext) => void, debug: (message: string, context?: LogContext) => void, trace: (message: string, context?: LogContext) => void, time: (label: string) => void, timeEnd: (label: string, context?: LogContext) => void;
export {};
//# sourceMappingURL=logger.d.ts.map