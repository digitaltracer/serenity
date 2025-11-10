/**
 * Standardized Error Handling System for Serenity Notes
 * Provides consistent error classification, logging, and handling across the application
 */

import { logger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  // Authentication & Security
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  ENCRYPTION = 'encryption',
  
  // Data Operations
  DATABASE = 'database',
  VALIDATION = 'validation',
  PERSISTENCE = 'persistence',
  
  // External Services
  INTEGRATION = 'integration',
  NETWORK = 'network',
  API = 'api',
  
  // Application Logic
  BUSINESS_LOGIC = 'business_logic',
  UI = 'ui',
  PERFORMANCE = 'performance',
  
  // System
  CONFIGURATION = 'configuration',
  INITIALIZATION = 'initialization',
  UNKNOWN = 'unknown'
}

/**
 * Standardized error interface
 */
interface SerenityError extends Error {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userMessage?: string;
  timestamp: string;
  stack?: string;
  originalError?: Error;
}

/**
 * Error code definitions with metadata
 */
export const ERROR_CODES = {
  // Authentication Errors (AUTH_*)
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid credentials provided'
  },
  AUTH_SESSION_EXPIRED: {
    code: 'AUTH_SESSION_EXPIRED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Your session has expired. Please log in again.'
  },
  AUTH_BIOMETRIC_FAILED: {
    code: 'AUTH_BIOMETRIC_FAILED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Biometric authentication failed'
  },
  AUTH_PASSWORD_REQUIRED: {
    code: 'AUTH_PASSWORD_REQUIRED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Master password is required for this operation'
  },

  // Encryption Errors (CRYPTO_*)
  CRYPTO_ENCRYPTION_FAILED: {
    code: 'CRYPTO_ENCRYPTION_FAILED',
    category: ErrorCategory.ENCRYPTION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Failed to encrypt data'
  },
  CRYPTO_DECRYPTION_FAILED: {
    code: 'CRYPTO_DECRYPTION_FAILED',
    category: ErrorCategory.ENCRYPTION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Failed to decrypt data'
  },
  CRYPTO_KEY_GENERATION_FAILED: {
    code: 'CRYPTO_KEY_GENERATION_FAILED',
    category: ErrorCategory.ENCRYPTION,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'Failed to generate encryption key'
  },
  CRYPTO_KEY_ROTATION_FAILED: {
    code: 'CRYPTO_KEY_ROTATION_FAILED',
    category: ErrorCategory.ENCRYPTION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Failed to rotate encryption key'
  },

  // Database Errors (DB_*)
  DB_CONNECTION_FAILED: {
    code: 'DB_CONNECTION_FAILED',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'Failed to connect to database'
  },
  DB_QUERY_FAILED: {
    code: 'DB_QUERY_FAILED',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Database operation failed'
  },
  DB_MIGRATION_FAILED: {
    code: 'DB_MIGRATION_FAILED',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'Database migration failed'
  },
  DB_BACKUP_FAILED: {
    code: 'DB_BACKUP_FAILED',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Failed to create database backup'
  },

  // Validation Errors (VALIDATION_*)
  VALIDATION_REQUIRED_FIELD: {
    code: 'VALIDATION_REQUIRED_FIELD',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Required field is missing'
  },
  VALIDATION_INVALID_FORMAT: {
    code: 'VALIDATION_INVALID_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Invalid data format'
  },
  VALIDATION_OUT_OF_RANGE: {
    code: 'VALIDATION_OUT_OF_RANGE',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Value is out of acceptable range'
  },

  // Integration Errors (INTEGRATION_*)
  INTEGRATION_CONNECTION_FAILED: {
    code: 'INTEGRATION_CONNECTION_FAILED',
    category: ErrorCategory.INTEGRATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Failed to connect to external service'
  },
  INTEGRATION_AUTH_FAILED: {
    code: 'INTEGRATION_AUTH_FAILED',
    category: ErrorCategory.INTEGRATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Authentication with external service failed'
  },
  INTEGRATION_SYNC_FAILED: {
    code: 'INTEGRATION_SYNC_FAILED',
    category: ErrorCategory.INTEGRATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Failed to sync with external service'
  },
  INTEGRATION_RATE_LIMIT: {
    code: 'INTEGRATION_RATE_LIMIT',
    category: ErrorCategory.INTEGRATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Rate limit exceeded for external service'
  },

  // Network Errors (NETWORK_*)
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Network request timed out'
  },
  NETWORK_OFFLINE: {
    code: 'NETWORK_OFFLINE',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'No internet connection available'
  },

  // Configuration Errors (CONFIG_*)
  CONFIG_INVALID: {
    code: 'CONFIG_INVALID',
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Invalid configuration detected'
  },
  CONFIG_MISSING: {
    code: 'CONFIG_MISSING',
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Required configuration is missing'
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'An unexpected error occurred'
  }
} as const;

/**
 * Error handler class with standardized methods
 */
class ErrorHandler {
  private static errorReports: SerenityError[] = [];
  private static maxReports = 100; // Keep last 100 errors for debugging

  /**
   * Create a standardized error
   */
  static createError(
    codeKey: keyof typeof ERROR_CODES,
    originalError?: Error,
    context?: Record<string, any>,
    customUserMessage?: string
  ): SerenityError {
    const errorDef = ERROR_CODES[codeKey];
    
    const error: SerenityError = {
      name: 'SerenityError',
      code: errorDef.code,
      category: errorDef.category,
      severity: errorDef.severity,
      message: originalError?.message || errorDef.userMessage,
      userMessage: customUserMessage || errorDef.userMessage,
      timestamp: new Date().toISOString(),
      context: context || {},
      originalError,
      stack: originalError?.stack || new Error().stack
    };

    return error;
  }

  /**
   * Handle and log an error
   */
  static handle(error: SerenityError | Error, context?: Record<string, any>): SerenityError {
    let serenityError: SerenityError;

    if (this.isSerenityError(error)) {
      serenityError = error;
      // Add additional context if provided
      if (context) {
        serenityError.context = { ...serenityError.context, ...context };
      }
    } else {
      // Convert regular error to SerenityError
      serenityError = this.createError('UNKNOWN_ERROR', error, context);
    }

    // Log the error
    this.logError(serenityError);

    // Store error report
    this.storeErrorReport(serenityError);

    return serenityError;
  }

  /**
   * Log error with appropriate level using centralized logger
   */
  private static logError(error: SerenityError): void {
    const logContext = {
      component: 'ErrorHandler',
      operation: 'logError',
      metadata: {
        code: error.code,
        category: error.category,
        severity: error.severity,
        context: error.context,
        timestamp: error.timestamp
      }
    };

    const message = `${error.code}: ${error.message}`;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`🚨 CRITICAL - ${message}`, logContext, error.originalError);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`❌ ERROR - ${message}`, logContext, error.originalError);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`⚠️ WARNING - ${message}`, logContext);
        break;
      case ErrorSeverity.LOW:
        logger.info(`ℹ️ INFO - ${message}`, logContext);
        break;
    }
  }

  /**
   * Store error report for debugging
   */
  private static storeErrorReport(error: SerenityError): void {
    this.errorReports.push(error);

    // Keep only the most recent errors
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }
  }

  /**
   * Check if an error is a SerenityError
   */
  static isSerenityError(error: any): error is SerenityError {
    return error && 
           typeof error === 'object' && 
           'code' in error && 
           'category' in error && 
           'severity' in error;
  }

  /**
   * Wrap async functions with error handling
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    errorCode: keyof typeof ERROR_CODES,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const serenityError = this.createError(
        errorCode, 
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw this.handle(serenityError);
    }
  }

  /**
   * Wrap synchronous functions with error handling
   */
  static wrap<T>(
    fn: () => T,
    errorCode: keyof typeof ERROR_CODES,
    context?: Record<string, any>
  ): T {
    try {
      return fn();
    } catch (error) {
      const serenityError = this.createError(
        errorCode,
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw this.handle(serenityError);
    }
  }

  /**
   * Get error reports for debugging
   */
  static getErrorReports(
    category?: ErrorCategory,
    severity?: ErrorSeverity,
    limit?: number
  ): SerenityError[] {
    let reports = [...this.errorReports];

    if (category) {
      reports = reports.filter(error => error.category === category);
    }

    if (severity) {
      reports = reports.filter(error => error.severity === severity);
    }

    if (limit) {
      reports = reports.slice(-limit);
    }

    return reports.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Clear error reports
   */
  static clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recentErrors: number; // Last hour
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errorReports.filter(
      error => new Date(error.timestamp) > oneHourAgo
    );

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorReports.filter(e => e.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const byCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = this.errorReports.filter(e => e.category === category).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    return {
      totalErrors: this.errorReports.length,
      bySeverity,
      byCategory,
      recentErrors: recentErrors.length
    };
  }
}

/**
 * Convenience functions for common error operations
 */

/**
 * Create and throw an authentication error
 */
export function throwAuthError(
  code: 'AUTH_INVALID_CREDENTIALS' | 'AUTH_SESSION_EXPIRED' | 'AUTH_BIOMETRIC_FAILED' | 'AUTH_PASSWORD_REQUIRED',
  originalError?: Error,
  context?: Record<string, any>
): never {
  throw ErrorHandler.handle(ErrorHandler.createError(code, originalError, context));
}

/**
 * Create and throw a database error
 */
export function throwDatabaseError(
  code: 'DB_CONNECTION_FAILED' | 'DB_QUERY_FAILED' | 'DB_MIGRATION_FAILED' | 'DB_BACKUP_FAILED',
  originalError?: Error,
  context?: Record<string, any>
): never {
  throw ErrorHandler.handle(ErrorHandler.createError(code, originalError, context));
}

/**
 * Create and throw an encryption error
 */
export function throwEncryptionError(
  code: 'CRYPTO_ENCRYPTION_FAILED' | 'CRYPTO_DECRYPTION_FAILED' | 'CRYPTO_KEY_GENERATION_FAILED' | 'CRYPTO_KEY_ROTATION_FAILED',
  originalError?: Error,
  context?: Record<string, any>
): never {
  throw ErrorHandler.handle(ErrorHandler.createError(code, originalError, context));
}

/**
 * Create and throw an integration error
 */
export function throwIntegrationError(
  code: 'INTEGRATION_CONNECTION_FAILED' | 'INTEGRATION_AUTH_FAILED' | 'INTEGRATION_SYNC_FAILED' | 'INTEGRATION_RATE_LIMIT',
  originalError?: Error,
  context?: Record<string, any>
): never {
  throw ErrorHandler.handle(ErrorHandler.createError(code, originalError, context));
}

/**
 * Create and throw a validation error
 */
export function throwValidationError(
  code: 'VALIDATION_REQUIRED_FIELD' | 'VALIDATION_INVALID_FORMAT' | 'VALIDATION_OUT_OF_RANGE',
  originalError?: Error,
  context?: Record<string, any>
): never {
  throw ErrorHandler.handle(ErrorHandler.createError(code, originalError, context));
}

/**
 * Safe error message extraction for user display
 */
export function getUserMessage(error: unknown): string {
  if (ErrorHandler.isSerenityError(error)) {
    return error.userMessage || error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (!ErrorHandler.isSerenityError(error)) return false;
  
  // Network and rate limit errors are generally retryable
  return error.category === ErrorCategory.NETWORK || 
         error.code === 'INTEGRATION_RATE_LIMIT';
}

// Export the error types and handler
export { ErrorHandler, type SerenityError };