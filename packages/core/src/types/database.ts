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
  path?: string; // Optional custom path, defaults to user data directory
  memory?: boolean; // For testing/temporary use
  readonly?: boolean;
  encryption?: boolean; // Whether to encrypt the SQLite file
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
    latency: number; // in ms
    throughput: number; // operations per second
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

// Common database operations interface
export interface DatabaseOperations {
  // Connection management
  connect(config: DatabaseConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  testConnection(): Promise<boolean>;
  
  // Schema management
  migrate(): Promise<void>;
  getVersion(): Promise<string | null>;
  
  // Data operations
  backup(path: string): Promise<void>;
  restore(path: string): Promise<void>;
  vacuum(): Promise<void>;
  
  // Statistics
  getStats(): Promise<DatabaseStats>;
}

export interface DatabaseStats {
  type: DatabaseType;
  size: number; // in bytes
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

// Database migration interface
export interface DatabaseMigration {
  version: string;
  description: string;
  type: DatabaseType | 'both'; // Which database types this migration applies to
  up: string; // SQL to apply migration
  down?: string; // SQL to rollback migration
  dependencies?: string[]; // Required previous migrations
}

// User preferences for database
export interface DatabasePreferences {
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
  backupRetention: number; // number of backups to keep
  optimizeSchedule: 'never' | 'daily' | 'weekly' | 'monthly';
  connectionRetries: number;
  queryTimeout: number; // in ms
  showPerformanceMetrics: boolean;
}