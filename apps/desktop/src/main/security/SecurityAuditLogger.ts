/**
 * Security Audit Logger
 *
 * Tracks and logs security-related events for audit purposes:
 * - Authentication attempts (success/failure)
 * - Session management (creation/destruction)
 * - Password changes
 * - Data access (sensitive operations)
 * - Security violations
 * - Configuration changes
 *
 * Features:
 * - Structured logging with timestamps
 * - Event categorization and severity levels
 * - Automatic log rotation
 * - Queryable audit trail
 * - Privacy-preserving (no sensitive data in logs)
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { logger } from '@serenity/core';

export enum AuditEventType {
  // Authentication events
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_SESSION_CREATED = 'AUTH_SESSION_CREATED',
  AUTH_SESSION_DESTROYED = 'AUTH_SESSION_DESTROYED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',

  // Password events
  PASSWORD_CREATED = 'PASSWORD_CREATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',

  // Security violations
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_SESSION = 'INVALID_SESSION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',

  // Data access
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  DATA_DELETION = 'DATA_DELETION',
  FACTORY_RESET = 'FACTORY_RESET',

  // Configuration changes
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  SECURITY_SETTINGS_CHANGED = 'SECURITY_SETTINGS_CHANGED',
  BIOMETRIC_ENABLED = 'BIOMETRIC_ENABLED',
  BIOMETRIC_DISABLED = 'BIOMETRIC_DISABLED',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private logDir: string;
  private currentLogFile: string;
  private maxLogSizeMB: number = 10;
  private maxLogFiles: number = 10;
  private eventBuffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Set up log directory in user data
    this.logDir = path.join(app.getPath('userData'), 'security-logs');
    this.ensureLogDirectory();
    this.currentLogFile = this.getLogFilePath();

    // Flush buffer every 10 seconds
    this.flushInterval = setInterval(() => this.flushBuffer(), 10000);
  }

  public static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current log file path
   */
  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `security-audit-${date}.log`);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log a security event
   */
  public log(
    type: AuditEventType,
    severity: AuditSeverity,
    details: Record<string, any> = {},
    options: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      severity,
      details: this.sanitizeDetails(details),
      ...options,
    };

    // Add to buffer
    this.eventBuffer.push(event);

    // Console log for immediate visibility
    const logLevel = this.getConsoleLogLevel(severity);
    console[logLevel](
      `[AUDIT ${severity}] ${type}:`,
      JSON.stringify(event.details, null, 2)
    );

    // Flush immediately for critical events
    if (severity === AuditSeverity.CRITICAL || severity === AuditSeverity.ERROR) {
      this.flushBuffer();
    }
  }

  /**
   * Sanitize event details to remove sensitive data
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'masterPassword',
      'hash',
      'token',
      'secret',
      'apiKey',
      'privateKey',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Truncate long values
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '... [TRUNCATED]';
      }
    }

    return sanitized;
  }

  /**
   * Get console log level for severity
   */
  private getConsoleLogLevel(severity: AuditSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case AuditSeverity.CRITICAL:
      case AuditSeverity.ERROR:
        return 'error';
      case AuditSeverity.WARNING:
        return 'warn';
      default:
        return 'log';
    }
  }

  /**
   * Flush event buffer to disk
   */
  private flushBuffer(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }

    try {
      // Check if log file needs rotation
      this.rotateLogsIfNeeded();

      // Append events to log file
      const logLines = this.eventBuffer.map((event) => JSON.stringify(event)).join('\n') + '\n';
      fs.appendFileSync(this.currentLogFile, logLines, 'utf8');

      // Clear buffer
      this.eventBuffer = [];
    } catch (error) {
      logger.error('Failed to flush audit log buffer:', { component: 'SecurityAuditLogger', operation: 'failedFlushAudit' }, error as Error);
    }
  }

  /**
   * Rotate logs if needed
   */
  private rotateLogsIfNeeded(): void {
    try {
      if (!fs.existsSync(this.currentLogFile)) {
        return;
      }

      const stats = fs.statSync(this.currentLogFile);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB >= this.maxLogSizeMB) {
        // Rotate: rename current file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);

        // Clean up old log files
        this.cleanupOldLogs();

        // Update current log file path
        this.currentLogFile = this.getLogFilePath();
      }
    } catch (error) {
      logger.error('Failed to rotate logs:', { component: 'SecurityAuditLogger', operation: 'failedRotateLogs:' }, error as Error);
    }
  }

  /**
   * Clean up old log files
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const logFiles = files
        .filter((f) => f.startsWith('security-audit-') && f.endsWith('.log'))
        .map((f) => ({
          name: f,
          path: path.join(this.logDir, f),
          mtime: fs.statSync(path.join(this.logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Keep only the most recent files
      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          logger.info(`🧹 Deleted old audit log: ${file.name}`, { component: 'SecurityAuditLogger', operation: 'deletedOldAudit' });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old logs:', { component: 'SecurityAuditLogger', operation: 'failedCleanupOld' }, error as Error);
    }
  }

  /**
   * Query audit logs
   */
  public async queryLogs(options: {
    startDate?: number;
    endDate?: number;
    type?: AuditEventType;
    severity?: AuditSeverity;
    limit?: number;
  } = {}): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    const limit = options.limit || 1000;

    try {
      // Flush current buffer first
      this.flushBuffer();

      // Read all log files
      const files = fs.readdirSync(this.logDir);
      const logFiles = files
        .filter((f) => f.startsWith('security-audit-') && f.endsWith('.log'))
        .map((f) => path.join(this.logDir, f));

      for (const logFile of logFiles) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const event: AuditEvent = JSON.parse(line);

            // Apply filters
            if (options.startDate && event.timestamp < options.startDate) continue;
            if (options.endDate && event.timestamp > options.endDate) continue;
            if (options.type && event.type !== options.type) continue;
            if (options.severity && event.severity !== options.severity) continue;

            events.push(event);

            // Stop if reached limit
            if (events.length >= limit) {
              break;
            }
          } catch (error) {
            // Skip invalid JSON lines
            continue;
          }
        }

        if (events.length >= limit) {
          break;
        }
      }

      // Sort by timestamp descending
      events.sort((a, b) => b.timestamp - a.timestamp);

      return events.slice(0, limit);
    } catch (error) {
      logger.error('Failed to query audit logs:', { component: 'SecurityAuditLogger', operation: 'failedQueryAudit' }, error as Error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  public async getStatistics(options: {
    startDate?: number;
    endDate?: number;
  } = {}): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: AuditEvent[];
  }> {
    const events = await this.queryLogs(options);

    const statistics = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      recentEvents: events.slice(0, 10),
    };

    for (const event of events) {
      statistics.eventsByType[event.type] =
        (statistics.eventsByType[event.type] || 0) + 1;
      statistics.eventsBySeverity[event.severity] =
        (statistics.eventsBySeverity[event.severity] || 0) + 1;
    }

    return statistics;
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushBuffer();
  }
}

/**
 * Convenience functions for common audit events
 */

export function logAuthSuccess(userId?: string, sessionId?: string): void {
  SecurityAuditLogger.getInstance().log(
    AuditEventType.AUTH_LOGIN_SUCCESS,
    AuditSeverity.INFO,
    { userId },
    { userId, sessionId }
  );
}

export function logAuthFailure(reason: string, attempts?: number): void {
  SecurityAuditLogger.getInstance().log(
    AuditEventType.AUTH_LOGIN_FAILURE,
    AuditSeverity.WARNING,
    { reason, attempts }
  );
}

export function logRateLimitExceeded(operationType: string, identifier: string): void {
  SecurityAuditLogger.getInstance().log(
    AuditEventType.RATE_LIMIT_EXCEEDED,
    AuditSeverity.WARNING,
    { operationType, identifier }
  );
}

export function logSecurityViolation(
  type: string,
  details: Record<string, any>
): void {
  SecurityAuditLogger.getInstance().log(
    AuditEventType.SUSPICIOUS_ACTIVITY,
    AuditSeverity.ERROR,
    { violationType: type, ...details }
  );
}

export function logDataExport(format: string, recordCount: number): void {
  SecurityAuditLogger.getInstance().log(
    AuditEventType.DATA_EXPORT,
    AuditSeverity.INFO,
    { format, recordCount }
  );
}
