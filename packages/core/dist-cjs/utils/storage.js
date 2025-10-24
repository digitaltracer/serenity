"use strict";
/**
 * Secure storage utilities for sensitive data like database connections
 * Uses localStorage for now, but in production should use encrypted storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStoredDatabaseConnection = exports.updateStoredConnectionStatus = exports.isDatabaseConnected = exports.removeDatabaseConnection = exports.getDatabaseConnection = exports.saveDatabaseConnection = void 0;
/// <reference path="../types/electron.d.ts" />
const logger_1 = require("./logger");
const STORAGE_KEYS = {
    DATABASE_CONNECTION: 'serenity_db_connection',
    DATABASE_CONNECTED: 'serenity_db_connected',
};
/**
 * Simple encryption/decryption for localStorage
 * Note: This is basic obfuscation. In production, use proper encryption
 */
const obfuscate = (text) => {
    return btoa(encodeURIComponent(text));
};
const deobfuscate = (encodedText) => {
    try {
        return decodeURIComponent(atob(encodedText));
    }
    catch {
        return '';
    }
};
/**
 * Save database connection details securely
 */
const saveDatabaseConnection = (connectionUrl) => {
    try {
        const connection = {
            url: connectionUrl,
            connected: true,
            lastConnected: new Date().toISOString(),
        };
        const obfuscatedData = obfuscate(JSON.stringify(connection));
        localStorage.setItem(STORAGE_KEYS.DATABASE_CONNECTION, obfuscatedData);
    }
    catch (error) {
        logger_1.logger.error('Failed to save database connection:', { component: 'storage', operation: 'failedSaveDatabase' }, error);
        throw new Error('Failed to save connection details');
    }
};
exports.saveDatabaseConnection = saveDatabaseConnection;
/**
 * Get database connection details
 */
const getDatabaseConnection = () => {
    try {
        const obfuscatedData = localStorage.getItem(STORAGE_KEYS.DATABASE_CONNECTION);
        if (!obfuscatedData)
            return null;
        const decodedData = deobfuscate(obfuscatedData);
        if (!decodedData)
            return null;
        return JSON.parse(decodedData);
    }
    catch (error) {
        logger_1.logger.error('Failed to retrieve database connection:', { component: 'storage', operation: 'failedRetrieveDatabase' }, error);
        return null;
    }
};
exports.getDatabaseConnection = getDatabaseConnection;
/**
 * Remove database connection details
 */
const removeDatabaseConnection = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.DATABASE_CONNECTION);
    }
    catch (error) {
        logger_1.logger.error('Failed to remove database connection:', { component: 'storage', operation: 'failedRemoveDatabase' }, error);
    }
};
exports.removeDatabaseConnection = removeDatabaseConnection;
/**
 * Check if database is configured and connected
 */
const isDatabaseConnected = () => {
    const connection = (0, exports.getDatabaseConnection)();
    return connection?.connected ?? false;
};
exports.isDatabaseConnected = isDatabaseConnected;
/**
 * Update connection status
 */
const updateStoredConnectionStatus = (connected) => {
    const existingConnection = (0, exports.getDatabaseConnection)();
    if (!existingConnection)
        return;
    const updatedConnection = {
        ...existingConnection,
        connected,
        lastConnected: connected ? new Date().toISOString() : existingConnection.lastConnected,
    };
    const obfuscatedData = obfuscate(JSON.stringify(updatedConnection));
    localStorage.setItem(STORAGE_KEYS.DATABASE_CONNECTION, obfuscatedData);
};
exports.updateStoredConnectionStatus = updateStoredConnectionStatus;
/**
 * Test database connection using Electron IPC to main process
 */
const testStoredDatabaseConnection = async (connectionUrl) => {
    try {
        // Check if we're in Electron environment
        if (typeof window !== 'undefined' && window.electronAPI) {
            // Use Electron IPC to test connection in main process
            const result = await window.electronAPI.database.testConnection(connectionUrl);
            return result.success;
        }
        else {
            // Fallback for non-Electron environments (tests, web, etc.)
            logger_1.logger.warn('Database connection testing not available outside Electron environment', { component: 'storage', operation: 'databaseConnectionTesting' });
            return false;
        }
    }
    catch (error) {
        logger_1.logger.error('Database connection test failed:', { component: 'storage', operation: 'databaseConnectionTest' }, error);
        return false;
    }
};
exports.testStoredDatabaseConnection = testStoredDatabaseConnection;
