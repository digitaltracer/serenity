/**
 * Database configuration types for Serenity Notes
 * Supports both SQLite (local) and PostgreSQL (self-hosted) backends
 */
export type DatabaseType = 'sqlite' | 'postgresql';
export interface BaseDatabaseConfig {
    type: DatabaseType;
    name?: string;
    description?: string;
}
export interface SQLiteConfig extends BaseDatabaseConfig {
    type: 'sqlite';
    path?: string;
    memory?: boolean;
    readonly?: boolean;
    encryption?: boolean;
}
export interface PostgreSQLConfig extends BaseDatabaseConfig {
    type: 'postgresql';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionTimeout?: number;
    maxConnections?: number;
}
export type DatabaseConfig = SQLiteConfig | PostgreSQLConfig;
export interface DatabaseConnectionStatus {
    connected: boolean;
    type: DatabaseType;
    lastConnected?: Date;
    error?: string;
    performance?: {
        latency: number;
        throughput: number;
    };
}
export interface DatabasePreset {
    id: string;
    name: string;
    description: string;
    config: DatabaseConfig;
    recommended: boolean;
    tags: string[];
}
export interface DatabaseOperations {
    connect(config: DatabaseConfig): Promise<boolean>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    testConnection(): Promise<boolean>;
    migrate(): Promise<void>;
    getVersion(): Promise<string | null>;
    backup(path: string): Promise<void>;
    restore(path: string): Promise<void>;
    vacuum(): Promise<void>;
    getStats(): Promise<DatabaseStats>;
}
export interface DatabaseStats {
    type: DatabaseType;
    size: number;
    tables: number;
    records: {
        tasks: number;
        projects: number;
        journalEntries: number;
        users: number;
    };
    performance: {
        avgQueryTime: number;
        totalQueries: number;
        errorRate: number;
    };
    health: 'healthy' | 'warning' | 'critical';
    lastOptimized?: Date;
}
export interface DatabaseMigration {
    version: string;
    description: string;
    type: DatabaseType | 'both';
    up: string;
    down?: string;
    dependencies?: string[];
}
export interface DatabasePreferences {
    autoBackup: boolean;
    backupInterval: 'daily' | 'weekly' | 'monthly';
    backupRetention: number;
    optimizeSchedule: 'never' | 'daily' | 'weekly' | 'monthly';
    connectionRetries: number;
    queryTimeout: number;
    showPerformanceMetrics: boolean;
}
//# sourceMappingURL=database.d.ts.map