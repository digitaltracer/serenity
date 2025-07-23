/**
 * Secure storage utilities for sensitive data like database connections
 * Uses localStorage for now, but in production should use encrypted storage
 */

/// <reference path="../types/electron.d.ts" />

const STORAGE_KEYS = {
  DATABASE_CONNECTION: 'serenity_db_connection',
  DATABASE_CONNECTED: 'serenity_db_connected',
} as const;

export interface DatabaseConnection {
  url: string;
  connected: boolean;
  lastConnected?: string;
}

/**
 * Simple encryption/decryption for localStorage
 * Note: This is basic obfuscation. In production, use proper encryption
 */
const obfuscate = (text: string): string => {
  return btoa(encodeURIComponent(text));
};

const deobfuscate = (encodedText: string): string => {
  try {
    return decodeURIComponent(atob(encodedText));
  } catch {
    return '';
  }
};

/**
 * Save database connection details securely
 */
export const saveDatabaseConnection = (connectionUrl: string): void => {
  try {
    const connection: DatabaseConnection = {
      url: connectionUrl,
      connected: true,
      lastConnected: new Date().toISOString(),
    };
    
    const obfuscatedData = obfuscate(JSON.stringify(connection));
    localStorage.setItem(STORAGE_KEYS.DATABASE_CONNECTION, obfuscatedData);
  } catch (error) {
    console.error('Failed to save database connection:', error);
    throw new Error('Failed to save connection details');
  }
};

/**
 * Get database connection details
 */
export const getDatabaseConnection = (): DatabaseConnection | null => {
  try {
    const obfuscatedData = localStorage.getItem(STORAGE_KEYS.DATABASE_CONNECTION);
    if (!obfuscatedData) return null;
    
    const decodedData = deobfuscate(obfuscatedData);
    if (!decodedData) return null;
    
    return JSON.parse(decodedData) as DatabaseConnection;
  } catch (error) {
    console.error('Failed to retrieve database connection:', error);
    return null;
  }
};

/**
 * Remove database connection details
 */
export const removeDatabaseConnection = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DATABASE_CONNECTION);
  } catch (error) {
    console.error('Failed to remove database connection:', error);
  }
};

/**
 * Check if database is configured and connected
 */
export const isDatabaseConnected = (): boolean => {
  const connection = getDatabaseConnection();
  return connection?.connected ?? false;
};

/**
 * Update connection status
 */
export const updateConnectionStatus = (connected: boolean): void => {
  const existingConnection = getDatabaseConnection();
  if (!existingConnection) return;
  
  const updatedConnection: DatabaseConnection = {
    ...existingConnection,
    connected,
    lastConnected: connected ? new Date().toISOString() : existingConnection.lastConnected,
  };
  
  const obfuscatedData = obfuscate(JSON.stringify(updatedConnection));
  localStorage.setItem(STORAGE_KEYS.DATABASE_CONNECTION, obfuscatedData);
};

/**
 * Test database connection using Electron IPC to main process
 */
export const testDatabaseConnection = async (connectionUrl: string): Promise<boolean> => {
  try {
    // Basic URL validation
    const url = new URL(connectionUrl);
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      throw new Error('Invalid PostgreSQL URL format');
    }

    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Use Electron IPC to test connection in main process
      const result = await window.electronAPI.database.testConnection(connectionUrl);
      return result.success;
    } else {
      // Fallback for non-Electron environments (tests, web, etc.)
      console.warn('Database connection testing not available outside Electron environment');
      return false;
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};