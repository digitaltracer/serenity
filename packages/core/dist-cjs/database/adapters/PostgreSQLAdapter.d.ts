/**
 * PostgreSQL Database Adapter for Serenity Notes
 * Provides PostgreSQL-specific implementation of DatabaseOperations
 */
import { DatabaseConfig, PostgreSQLConfig, DatabaseOperations, DatabaseStats } from '../../types/database';
export declare class PostgreSQLAdapter implements DatabaseOperations {
    private connected;
    private config;
    private pool;
    /**
     * Connect to PostgreSQL database
     */
    connect(config: DatabaseConfig): Promise<boolean>;
    /**
     * Disconnect from PostgreSQL database
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Test database connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Run database migrations
     */
    migrate(): Promise<void>;
    /**
     * Get database version
     */
    getVersion(): Promise<string | null>;
    /**
     * Backup database
     */
    backup(path: string): Promise<void>;
    /**
     * Restore database from backup
     */
    restore(path: string): Promise<void>;
    /**
     * Vacuum/optimize database
     */
    vacuum(): Promise<void>;
    /**
     * Get database statistics
     */
    getStats(): Promise<DatabaseStats>;
    /**
     * Get PostgreSQL server version
     */
    getServerVersion(): Promise<string>;
    /**
     * Get active connections count
     */
    getActiveConnections(): Promise<number>;
    /**
     * Get PostgreSQL-specific configuration
     */
    getPostgreSQLConfig(): PostgreSQLConfig | null;
    /**
     * Create the application schema with all required tables
     */
    private createApplicationSchema;
}
