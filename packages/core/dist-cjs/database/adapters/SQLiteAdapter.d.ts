/**
 * SQLite Database Adapter for Serenity Notes
 * Provides SQLite-specific implementation of DatabaseOperations
 */
import { DatabaseConfig, SQLiteConfig, DatabaseOperations, DatabaseStats } from '../../types/database';
export declare class SQLiteAdapter implements DatabaseOperations {
    private dbPath;
    private connected;
    private config;
    /**
     * Connect to SQLite database
     */
    connect(config: DatabaseConfig): Promise<boolean>;
    /**
     * Disconnect from SQLite database
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
     * Get file size of database
     */
    getDatabaseSize(): Promise<number>;
    /**
     * Check database integrity
     */
    checkIntegrity(): Promise<boolean>;
    /**
     * Get SQLite-specific configuration
     */
    getSQLiteConfig(): SQLiteConfig | null;
    /**
     * Get current database file path
     */
    getDatabasePath(): string | null;
    /**
     * Helper to get user data directory
     */
    private getUserDataPath;
    /**
     * Simulate async delay for demo purposes
     */
    private simulateDelay;
}
//# sourceMappingURL=SQLiteAdapter.d.ts.map