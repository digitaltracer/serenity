/**
 * Secure storage utilities for sensitive data like database connections
 * Uses localStorage for now, but in production should use encrypted storage
 */
export interface DatabaseConnection {
    url: string;
    connected: boolean;
    lastConnected?: string;
}
/**
 * Save database connection details securely
 */
export declare const saveDatabaseConnection: (connectionUrl: string) => void;
/**
 * Get database connection details
 */
export declare const getDatabaseConnection: () => DatabaseConnection | null;
/**
 * Remove database connection details
 */
export declare const removeDatabaseConnection: () => void;
/**
 * Check if database is configured and connected
 */
export declare const isDatabaseConnected: () => boolean;
/**
 * Update connection status
 */
export declare const updateStoredConnectionStatus: (connected: boolean) => void;
/**
 * Test database connection using Electron IPC to main process
 */
export declare const testStoredDatabaseConnection: (connectionUrl: string) => Promise<boolean>;
