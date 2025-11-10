/**
 * Universal Database Manager for Serenity Notes
 * Abstracts SQLite and PostgreSQL operations behind a common interface
 */
import { DatabaseConfig, DatabaseOperations, DatabaseConnectionStatus, DatabaseStats } from '../types/database';
export declare class DatabaseManager implements DatabaseOperations {
    private currentAdapter;
    private config;
    private connectionStatus;
    /**
     * Connect to database using the specified configuration
     */
    connect(config: DatabaseConfig): Promise<boolean>;
    /**
     * Disconnect from current database
     */
    disconnect(): Promise<void>;
    /**
     * Check if currently connected to a database
     */
    isConnected(): boolean;
    /**
     * Test current database connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Run database migrations
     */
    migrate(): Promise<void>;
    /**
     * Get current database schema version
     */
    getVersion(): Promise<string | null>;
    /**
     * Backup database to specified path
     */
    backup(path: string): Promise<void>;
    /**
     * Restore database from backup
     */
    restore(path: string): Promise<void>;
    /**
     * Optimize database (vacuum, analyze, etc.)
     */
    vacuum(): Promise<void>;
    /**
     * Get database statistics and health information
     */
    getStats(): Promise<DatabaseStats>;
    /**
     * Get current connection status
     */
    getConnectionStatus(): DatabaseConnectionStatus;
    /**
     * Get current database configuration
     */
    getCurrentConfig(): DatabaseConfig | null;
    /**
     * Switch to a different database configuration
     */
    switchDatabase(config: DatabaseConfig): Promise<boolean>;
    /**
     * Create appropriate database adapter based on configuration
     */
    private createAdapter;
    /**
     * Get recommended database configurations for different use cases
     */
    static getRecommendedConfigs(): {
        personal: {
            id: string;
            name: string;
            description: string;
            config: {
                type: "sqlite";
                encryption: boolean;
            };
            recommended: boolean;
            tags: string[];
        };
        selfHosted: {
            id: string;
            name: string;
            description: string;
            config: {
                type: "postgresql";
                host: string;
                port: number;
                database: string;
                username: string;
                password: string;
                ssl: boolean;
            };
            recommended: boolean;
            tags: string[];
        };
        cloud: {
            id: string;
            name: string;
            description: string;
            config: {
                type: "postgresql";
                host: string;
                port: number;
                database: string;
                username: string;
                password: string;
                ssl: boolean;
            };
            recommended: boolean;
            tags: string[];
        };
    };
}
export declare const databaseManager: DatabaseManager;
