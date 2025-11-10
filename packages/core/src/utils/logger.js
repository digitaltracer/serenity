/**
 * Production-ready logging system for Serenity Notes
 * Features: structured logging, log levels, performance tracking, secure data filtering
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor() {
        this.logHistory = [];
        this.maxHistorySize = 1000;
        // Sensitive data patterns to redact
        this.sensitivePatterns = [
            /password/i,
            /token/i,
            /key/i,
            /secret/i,
            /auth/i,
            /credential/i,
            /masterPassword/i
        ];
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
        this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
    setLevel(level) {
        this.currentLevel = level;
    }
    shouldLog(level) {
        return level <= this.currentLevel;
    }
    sanitizeData(data) {
        if (typeof data === 'string') {
            return this.redactSensitiveData(data);
        }
        if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                if (this.isSensitiveKey(key)) {
                    sanitized[key] = '[REDACTED]';
                }
                else {
                    sanitized[key] = this.sanitizeData(value);
                }
            }
            return sanitized;
        }
        return data;
    }
    isSensitiveKey(key) {
        return this.sensitivePatterns.some(pattern => pattern.test(key));
    }
    redactSensitiveData(text) {
        // Redact potential sensitive data in log messages
        return text.replace(/(['"]\w*(?:password|token|key|secret|auth|credential)\w*['"])\s*:\s*['"]\w+['"]/gi, '$1: "[REDACTED]"');
    }
    formatTimestamp() {
        return new Date().toISOString();
    }
    createLogEntry(level, message, context, error) {
        const entry = {
            timestamp: this.formatTimestamp(),
            level,
            message: this.redactSensitiveData(message),
            context: context ? this.sanitizeData(context) : undefined
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
    writeLog(entry) {
        // Add to history
        this.logHistory.push(entry);
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
        // Format for console output (only in development)
        if (this.isDevelopment) {
            const levelColors = {
                [LogLevel.ERROR]: '\x1b[31m', // Red
                [LogLevel.WARN]: '\x1b[33m', // Yellow
                [LogLevel.INFO]: '\x1b[36m', // Cyan
                [LogLevel.DEBUG]: '\x1b[35m', // Magenta
                [LogLevel.TRACE]: '\x1b[37m' // White
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
                    console.log(logMessage, entry.context);
                    break;
            }
        }
        // Write to file via Electron IPC (async, non-blocking)
        // Only persist WARN and ERROR to file to avoid excessive disk writes
        if (this.isElectron && entry.level <= LogLevel.WARN) {
            this.persistToFile(entry);
        }
    }
    persistToFile(entry) {
        try {
            if (typeof window !== 'undefined' && 'electronAPI' in window) {
                const api = window.electronAPI;
                if (api?.system?.writeLog) {
                    // Fire and forget - don't await to avoid blocking
                    api.system.writeLog(entry).catch(() => {
                        // Silently fail to avoid infinite logging loops
                    });
                }
            }
        }
        catch {
            // Silently fail - logging infrastructure shouldn't crash the app
        }
    }
    error(message, context, error) {
        if (this.shouldLog(LogLevel.ERROR)) {
            this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            this.writeLog(this.createLogEntry(LogLevel.WARN, message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            this.writeLog(this.createLogEntry(LogLevel.INFO, message, context));
        }
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context));
        }
    }
    trace(message, context) {
        if (this.shouldLog(LogLevel.TRACE)) {
            this.writeLog(this.createLogEntry(LogLevel.TRACE, message, context));
        }
    }
    // Performance timing utilities
    time(label) {
        if (this.isDevelopment) {
            console.time(label);
        }
    }
    timeEnd(label, context) {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }
    // Get recent log history for debugging
    getLogHistory(level) {
        return level !== undefined
            ? this.logHistory.filter(entry => entry.level <= level)
            : [...this.logHistory];
    }
    // Clear log history
    clearHistory() {
        this.logHistory = [];
    }
    // Export logs for debugging
    exportLogs() {
        return JSON.stringify(this.logHistory, null, 2);
    }
}
// Singleton logger instance
export const logger = new Logger();
// Convenience exports for direct usage
export const { error, warn, info, debug, trace, time, timeEnd } = logger;
