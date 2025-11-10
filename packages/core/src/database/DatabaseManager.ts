/**
 * Universal Database Manager for Serenity Notes
 * Abstracts SQLite and PostgreSQL operations behind a common interface
 */

import { logger } from '../utils/logger';
import {
  DatabaseConfig,
  DatabaseType,
  DatabaseOperations,
  DatabaseConnectionStatus,
  DatabaseStats,
  DatabasePreferences
} from '../types/database';

export class DatabaseManager implements DatabaseOperations {
  private currentAdapter: DatabaseOperations | null = null;
  private config: DatabaseConfig | null = null;
  private connectionStatus: DatabaseConnectionStatus = {
    connected: false,
    type: 'sqlite',
  };

  /**
   * Connect to database using the specified configuration
   */
  async connect(config: DatabaseConfig): Promise<boolean> {
    try {
      logger.info(`🔌 Connecting to ${config.type} database...`, { component: 'DatabaseManager', operation: 'connecting${config.type}Database...' });
      
      // Disconnect from current database if connected
      if (this.currentAdapter) {
        await this.disconnect();
      }

      // Create appropriate adapter
      this.currentAdapter = await this.createAdapter(config);
      
      // Test the connection
      const connected = await this.currentAdapter.connect(config);
      
      if (connected) {
        this.config = config;
        this.connectionStatus = {
          connected: true,
          type: config.type,
          lastConnected: new Date(),
        };
        
        logger.info(`✅ Connected to ${config.type} database successfully`, { component: 'DatabaseManager', operation: 'connected${config.type}Database' });
        
        // Run migrations if needed
        await this.migrate();
        
        return true;
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      logger.error(`❌ Failed to connect to ${config.type} database:`, { component: 'DatabaseManager', operation: 'failedConnect${config.type}' }, error as Error);

      this.connectionStatus = {
        connected: false,
        type: config.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.currentAdapter = null;
      this.config = null;
      
      return false;
    }
  }

  /**
   * Disconnect from current database
   */
  async disconnect(): Promise<void> {
    if (this.currentAdapter) {
      try {
        await this.currentAdapter.disconnect();
        logger.info('🔌 Database disconnected', { component: 'DatabaseManager', operation: 'databaseDisconnected' });
      } catch (error) {
        logger.error('Error during disconnect:', { component: 'DatabaseManager', operation: 'errorDuringDisconnect:' }, error as Error);
      }
      
      this.currentAdapter = null;
      this.config = null;
      this.connectionStatus.connected = false;
    }
  }

  /**
   * Check if currently connected to a database
   */
  isConnected(): boolean {
    return this.connectionStatus.connected && this.currentAdapter !== null;
  }

  /**
   * Test current database connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.currentAdapter) {
      return false;
    }
    
    try {
      const result = await this.currentAdapter.testConnection();
      
      // Update performance metrics
      const startTime = performance.now();
      await this.currentAdapter.testConnection();
      const latency = performance.now() - startTime;
      
      if (result) {
        this.connectionStatus.performance = {
          latency,
          throughput: 1000 / latency, // rough estimate
        };
      }
      
      return result;
    } catch (error) {
      this.connectionStatus.error = error instanceof Error ? error.message : 'Connection test failed';
      return false;
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error('No database connection available');
    }
    
    logger.info('📋 Running database migrations...', { component: 'DatabaseManager', operation: 'runningDatabaseMigrations...' });
    await this.currentAdapter.migrate();
    logger.info('✅ Migrations completed successfully', { component: 'DatabaseManager', operation: 'migrationsCompletedSuccessfully' });
  }

  /**
   * Get current database schema version
   */
  async getVersion(): Promise<string | null> {
    if (!this.currentAdapter) {
      return null;
    }
    
    return this.currentAdapter.getVersion();
  }

  /**
   * Backup database to specified path
   */
  async backup(path: string): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error('No database connection available');
    }
    
    logger.info(`💾 Creating database backup at: ${path}`, { component: 'DatabaseManager', operation: 'creatingDatabaseBackup' });
    await this.currentAdapter.backup(path);
    logger.info('✅ Backup completed successfully', { component: 'DatabaseManager', operation: 'backupCompletedSuccessfully' });
  }

  /**
   * Restore database from backup
   */
  async restore(path: string): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error('No database connection available');
    }
    
    logger.info(`📂 Restoring database from: ${path}`, { component: 'DatabaseManager', operation: 'restoringDatabaseFrom:' });
    await this.currentAdapter.restore(path);
    logger.info('✅ Restore completed successfully', { component: 'DatabaseManager', operation: 'restoreCompletedSuccessfully' });
  }

  /**
   * Optimize database (vacuum, analyze, etc.)
   */
  async vacuum(): Promise<void> {
    if (!this.currentAdapter) {
      throw new Error('No database connection available');
    }
    
    logger.info('🧹 Optimizing database...', { component: 'DatabaseManager', operation: 'optimizingDatabase...' });
    await this.currentAdapter.vacuum();
    logger.info('✅ Database optimization completed', { component: 'DatabaseManager', operation: 'databaseOptimizationCompleted' });
  }

  /**
   * Get database statistics and health information
   */
  async getStats(): Promise<DatabaseStats> {
    if (!this.currentAdapter) {
      throw new Error('No database connection available');
    }
    
    return this.currentAdapter.getStats();
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): DatabaseConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get current database configuration
   */
  getCurrentConfig(): DatabaseConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Switch to a different database configuration
   */
  async switchDatabase(config: DatabaseConfig): Promise<boolean> {
    logger.info(`🔄 Switching from ${this.config?.type || 'none'} to ${config.type}`, { component: 'DatabaseManager', operation: 'switchingFrom${this.config?.type' });
    
    // Backup current data if switching between different types
    if (this.config && this.config.type !== config.type && this.isConnected()) {
      const backupPath = `serenity-backup-${Date.now()}.sql`;
      try {
        await this.backup(backupPath);
        logger.info(`📄 Created backup before switching: ${backupPath}`, { component: 'DatabaseManager', operation: 'createdBackupBefore' });
      } catch (error) {
        logger.warn('Failed to create backup before switching', { component: 'DatabaseManager', operation: 'failedCreateBackup' });
      }
    }
    
    return this.connect(config);
  }

  /**
   * Create appropriate database adapter based on configuration
   */
  private async createAdapter(config: DatabaseConfig): Promise<DatabaseOperations> {
    switch (config.type) {
      case 'sqlite':
        const { SQLiteAdapter } = await import('./adapters/SQLiteAdapter');
        return new SQLiteAdapter();
        
      case 'postgresql':
        const { PostgreSQLAdapter } = await import('./adapters/PostgreSQLAdapter');
        return new PostgreSQLAdapter();
        
      default:
        throw new Error(`Unsupported database type: ${(config as any).type}`);
    }
  }

  /**
   * Get recommended database configurations for different use cases
   */
  static getRecommendedConfigs() {
    return {
      personal: {
        id: 'personal-sqlite',
        name: 'Personal (SQLite)',
        description: 'Fast local database, perfect for personal use',
        config: {
          type: 'sqlite' as const,
          encryption: true,
        },
        recommended: true,
        tags: ['local', 'fast', 'encrypted'],
      },
      
      selfHosted: {
        id: 'self-hosted-postgres',
        name: 'Self-Hosted (PostgreSQL)',
        description: 'Full-featured database for power users and teams',
        config: {
          type: 'postgresql' as const,
          host: 'localhost',
          port: 5432,
          database: 'serenity_notes',
          username: 'serenity',
          password: '',
          ssl: false,
        },
        recommended: false,
        tags: ['self-hosted', 'postgresql', 'scalable'],
      },
      
      cloud: {
        id: 'cloud-postgres',
        name: 'Cloud PostgreSQL',
        description: 'Managed PostgreSQL for teams and businesses',
        config: {
          type: 'postgresql' as const,
          host: '',
          port: 5432,
          database: 'serenity_notes',
          username: '',
          password: '',
          ssl: true,
        },
        recommended: false,
        tags: ['cloud', 'managed', 'secure'],
      },
    };
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();