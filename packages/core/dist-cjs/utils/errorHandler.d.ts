/**
 * Standardized Error Handling System for Serenity Notes
 * Provides consistent error classification, logging, and handling across the application
 */
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error categories for better organization
 */
export declare enum ErrorCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    ENCRYPTION = "encryption",
    DATABASE = "database",
    VALIDATION = "validation",
    PERSISTENCE = "persistence",
    INTEGRATION = "integration",
    NETWORK = "network",
    API = "api",
    BUSINESS_LOGIC = "business_logic",
    UI = "ui",
    PERFORMANCE = "performance",
    CONFIGURATION = "configuration",
    INITIALIZATION = "initialization",
    UNKNOWN = "unknown"
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
export declare const ERROR_CODES: {
    readonly AUTH_INVALID_CREDENTIALS: {
        readonly code: "AUTH_INVALID_CREDENTIALS";
        readonly category: ErrorCategory.AUTHENTICATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Invalid credentials provided";
    };
    readonly AUTH_SESSION_EXPIRED: {
        readonly code: "AUTH_SESSION_EXPIRED";
        readonly category: ErrorCategory.AUTHENTICATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Your session has expired. Please log in again.";
    };
    readonly AUTH_BIOMETRIC_FAILED: {
        readonly code: "AUTH_BIOMETRIC_FAILED";
        readonly category: ErrorCategory.AUTHENTICATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Biometric authentication failed";
    };
    readonly AUTH_PASSWORD_REQUIRED: {
        readonly code: "AUTH_PASSWORD_REQUIRED";
        readonly category: ErrorCategory.AUTHENTICATION;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Master password is required for this operation";
    };
    readonly CRYPTO_ENCRYPTION_FAILED: {
        readonly code: "CRYPTO_ENCRYPTION_FAILED";
        readonly category: ErrorCategory.ENCRYPTION;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Failed to encrypt data";
    };
    readonly CRYPTO_DECRYPTION_FAILED: {
        readonly code: "CRYPTO_DECRYPTION_FAILED";
        readonly category: ErrorCategory.ENCRYPTION;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Failed to decrypt data";
    };
    readonly CRYPTO_KEY_GENERATION_FAILED: {
        readonly code: "CRYPTO_KEY_GENERATION_FAILED";
        readonly category: ErrorCategory.ENCRYPTION;
        readonly severity: ErrorSeverity.CRITICAL;
        readonly userMessage: "Failed to generate encryption key";
    };
    readonly CRYPTO_KEY_ROTATION_FAILED: {
        readonly code: "CRYPTO_KEY_ROTATION_FAILED";
        readonly category: ErrorCategory.ENCRYPTION;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Failed to rotate encryption key";
    };
    readonly DB_CONNECTION_FAILED: {
        readonly code: "DB_CONNECTION_FAILED";
        readonly category: ErrorCategory.DATABASE;
        readonly severity: ErrorSeverity.CRITICAL;
        readonly userMessage: "Failed to connect to database";
    };
    readonly DB_QUERY_FAILED: {
        readonly code: "DB_QUERY_FAILED";
        readonly category: ErrorCategory.DATABASE;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Database operation failed";
    };
    readonly DB_MIGRATION_FAILED: {
        readonly code: "DB_MIGRATION_FAILED";
        readonly category: ErrorCategory.DATABASE;
        readonly severity: ErrorSeverity.CRITICAL;
        readonly userMessage: "Database migration failed";
    };
    readonly DB_BACKUP_FAILED: {
        readonly code: "DB_BACKUP_FAILED";
        readonly category: ErrorCategory.DATABASE;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Failed to create database backup";
    };
    readonly VALIDATION_REQUIRED_FIELD: {
        readonly code: "VALIDATION_REQUIRED_FIELD";
        readonly category: ErrorCategory.VALIDATION;
        readonly severity: ErrorSeverity.LOW;
        readonly userMessage: "Required field is missing";
    };
    readonly VALIDATION_INVALID_FORMAT: {
        readonly code: "VALIDATION_INVALID_FORMAT";
        readonly category: ErrorCategory.VALIDATION;
        readonly severity: ErrorSeverity.LOW;
        readonly userMessage: "Invalid data format";
    };
    readonly VALIDATION_OUT_OF_RANGE: {
        readonly code: "VALIDATION_OUT_OF_RANGE";
        readonly category: ErrorCategory.VALIDATION;
        readonly severity: ErrorSeverity.LOW;
        readonly userMessage: "Value is out of acceptable range";
    };
    readonly INTEGRATION_CONNECTION_FAILED: {
        readonly code: "INTEGRATION_CONNECTION_FAILED";
        readonly category: ErrorCategory.INTEGRATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Failed to connect to external service";
    };
    readonly INTEGRATION_AUTH_FAILED: {
        readonly code: "INTEGRATION_AUTH_FAILED";
        readonly category: ErrorCategory.INTEGRATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Authentication with external service failed";
    };
    readonly INTEGRATION_SYNC_FAILED: {
        readonly code: "INTEGRATION_SYNC_FAILED";
        readonly category: ErrorCategory.INTEGRATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Failed to sync with external service";
    };
    readonly INTEGRATION_RATE_LIMIT: {
        readonly code: "INTEGRATION_RATE_LIMIT";
        readonly category: ErrorCategory.INTEGRATION;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Rate limit exceeded for external service";
    };
    readonly NETWORK_TIMEOUT: {
        readonly code: "NETWORK_TIMEOUT";
        readonly category: ErrorCategory.NETWORK;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "Network request timed out";
    };
    readonly NETWORK_OFFLINE: {
        readonly code: "NETWORK_OFFLINE";
        readonly category: ErrorCategory.NETWORK;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "No internet connection available";
    };
    readonly CONFIG_INVALID: {
        readonly code: "CONFIG_INVALID";
        readonly category: ErrorCategory.CONFIGURATION;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Invalid configuration detected";
    };
    readonly CONFIG_MISSING: {
        readonly code: "CONFIG_MISSING";
        readonly category: ErrorCategory.CONFIGURATION;
        readonly severity: ErrorSeverity.HIGH;
        readonly userMessage: "Required configuration is missing";
    };
    readonly UNKNOWN_ERROR: {
        readonly code: "UNKNOWN_ERROR";
        readonly category: ErrorCategory.UNKNOWN;
        readonly severity: ErrorSeverity.MEDIUM;
        readonly userMessage: "An unexpected error occurred";
    };
};
/**
 * Error handler class with standardized methods
 */
declare class ErrorHandler {
    private static errorReports;
    private static maxReports;
    /**
     * Create a standardized error
     */
    static createError(codeKey: keyof typeof ERROR_CODES, originalError?: Error, context?: Record<string, any>, customUserMessage?: string): SerenityError;
    /**
     * Handle and log an error
     */
    static handle(error: SerenityError | Error, context?: Record<string, any>): SerenityError;
    /**
     * Log error with appropriate level using centralized logger
     */
    private static logError;
    /**
     * Store error report for debugging
     */
    private static storeErrorReport;
    /**
     * Check if an error is a SerenityError
     */
    static isSerenityError(error: any): error is SerenityError;
    /**
     * Wrap async functions with error handling
     */
    static wrapAsync<T>(fn: () => Promise<T>, errorCode: keyof typeof ERROR_CODES, context?: Record<string, any>): Promise<T>;
    /**
     * Wrap synchronous functions with error handling
     */
    static wrap<T>(fn: () => T, errorCode: keyof typeof ERROR_CODES, context?: Record<string, any>): T;
    /**
     * Get error reports for debugging
     */
    static getErrorReports(category?: ErrorCategory, severity?: ErrorSeverity, limit?: number): SerenityError[];
    /**
     * Clear error reports
     */
    static clearErrorReports(): void;
    /**
     * Get error statistics
     */
    static getErrorStats(): {
        totalErrors: number;
        bySeverity: Record<ErrorSeverity, number>;
        byCategory: Record<ErrorCategory, number>;
        recentErrors: number;
    };
}
/**
 * Convenience functions for common error operations
 */
/**
 * Create and throw an authentication error
 */
export declare function throwAuthError(code: 'AUTH_INVALID_CREDENTIALS' | 'AUTH_SESSION_EXPIRED' | 'AUTH_BIOMETRIC_FAILED' | 'AUTH_PASSWORD_REQUIRED', originalError?: Error, context?: Record<string, any>): never;
/**
 * Create and throw a database error
 */
export declare function throwDatabaseError(code: 'DB_CONNECTION_FAILED' | 'DB_QUERY_FAILED' | 'DB_MIGRATION_FAILED' | 'DB_BACKUP_FAILED', originalError?: Error, context?: Record<string, any>): never;
/**
 * Create and throw an encryption error
 */
export declare function throwEncryptionError(code: 'CRYPTO_ENCRYPTION_FAILED' | 'CRYPTO_DECRYPTION_FAILED' | 'CRYPTO_KEY_GENERATION_FAILED' | 'CRYPTO_KEY_ROTATION_FAILED', originalError?: Error, context?: Record<string, any>): never;
/**
 * Create and throw an integration error
 */
export declare function throwIntegrationError(code: 'INTEGRATION_CONNECTION_FAILED' | 'INTEGRATION_AUTH_FAILED' | 'INTEGRATION_SYNC_FAILED' | 'INTEGRATION_RATE_LIMIT', originalError?: Error, context?: Record<string, any>): never;
/**
 * Create and throw a validation error
 */
export declare function throwValidationError(code: 'VALIDATION_REQUIRED_FIELD' | 'VALIDATION_INVALID_FORMAT' | 'VALIDATION_OUT_OF_RANGE', originalError?: Error, context?: Record<string, any>): never;
/**
 * Safe error message extraction for user display
 */
export declare function getUserMessage(error: unknown): string;
/**
 * Check if error should be retried
 */
export declare function isRetryableError(error: unknown): boolean;
export { ErrorHandler, type SerenityError };
