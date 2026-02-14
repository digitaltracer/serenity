/**
 * Shared PostgreSQL Connection Pool
 * 
 * Singleton pool instance used across all MCP server services.
 * Provides consistent connection management and graceful shutdown.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import config from '../config/env.js';
import logger from './logger.js';

/**
 * Shared database pool singleton
 */
class DatabasePool {
  private static instance: Pool | null = null;
  private static isShuttingDown: boolean = false;

  /**
   * Get the shared pool instance
   * Creates the pool on first access
   */
  static getInstance(): Pool {
    if (DatabasePool.isShuttingDown) {
      throw new Error('Database pool is shutting down');
    }

    if (!DatabasePool.instance) {
      if (!config.databaseUrl) {
        throw new Error('DATABASE_URL is required but not configured');
      }

      DatabasePool.instance = new Pool({
        connectionString: config.databaseUrl,
        max: 20, // Maximum connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 5000, // Timeout for new connections
      });

      // Log connection errors
      DatabasePool.instance.on('error', (err: Error) => {
        logger.error('Unexpected database pool error', {
          error: err.message,
          stack: err.stack,
        });
      });

      // Log when pool connects
      DatabasePool.instance.on('connect', () => {
        logger.debug('New database connection established');
      });

      logger.info('Database connection pool initialized', {
        maxConnections: 20,
        database: config.databaseUrl.split('@').pop()?.split('/').pop() || 'unknown',
      });
    }

    return DatabasePool.instance;
  }

  /**
   * Close the pool gracefully
   * Should be called on application shutdown
   */
  static async close(): Promise<void> {
    if (DatabasePool.instance && !DatabasePool.isShuttingDown) {
      DatabasePool.isShuttingDown = true;
      logger.info('Closing database connection pool...');
      
      try {
        await DatabasePool.instance.end();
        DatabasePool.instance = null;
        logger.info('Database connection pool closed successfully');
      } catch (error) {
        logger.error('Error closing database pool', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        DatabasePool.isShuttingDown = false;
      }
    }
  }

  /**
   * Check if the pool is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const pool = DatabasePool.getInstance();
      const result = await pool.query('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  static getStats(): { total: number; idle: number; waiting: number } | null {
    if (!DatabasePool.instance) {
      return null;
    }

    return {
      total: DatabasePool.instance.totalCount,
      idle: DatabasePool.instance.idleCount,
      waiting: DatabasePool.instance.waitingCount,
    };
  }
}

/**
 * Database query helper object
 * Use this for all database operations in the MCP server
 */
export const db = {
  /**
   * Execute a parameterized query
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const pool = DatabasePool.getInstance();
    const start = Date.now();
    
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Query executed', {
        query: text.substring(0, 100),
        duration,
        rowCount: result.rowCount,
      });
      
      return result;
    } catch (error) {
      logger.error('Query failed', {
        query: text.substring(0, 100),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    const pool = DatabasePool.getInstance();
    return pool.connect();
  },

  /**
   * Execute a function within a transaction
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    return DatabasePool.close();
  },

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    return DatabasePool.healthCheck();
  },

  /**
   * Get pool statistics
   */
  getStats(): { total: number; idle: number; waiting: number } | null {
    return DatabasePool.getStats();
  },
};

export default db;
