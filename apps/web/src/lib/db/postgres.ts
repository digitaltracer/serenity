/**
 * PostgreSQL database connection pool
 * Singleton pattern to reuse connections across API routes
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

class DatabasePool {
  private static instance: Pool | null = null

  static getInstance(): Pool {
    if (!DatabasePool.instance) {
      const connectionString = process.env.DATABASE_URL

      if (!connectionString) {
        throw new Error(
          'DATABASE_URL environment variable is not set. Please configure your database connection.'
        )
      }

      DatabasePool.instance = new Pool({
        connectionString,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be obtained
      })

      // Log connection errors
      DatabasePool.instance.on('error', (err) => {
        console.error('Unexpected error on idle client', err)
      })

      console.log('✅ Database connection pool initialized')
    }

    return DatabasePool.instance
  }

  static async close(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end()
      DatabasePool.instance = null
      console.log('Database connection pool closed')
    }
  }
}

export const db = {
  /**
   * Execute a query
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const pool = DatabasePool.getInstance()
    return pool.query<T>(text, params)
  },

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    const pool = DatabasePool.getInstance()
    return pool.connect()
  },

  /**
   * Execute a function within a transaction
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient()
    try {
      await client.query('BEGIN')
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  /**
   * Close the connection pool (for graceful shutdown)
   */
  async close(): Promise<void> {
    return DatabasePool.close()
  },
}

// Helper function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.query('SELECT 1 as test')
    return result.rows[0]?.test === 1
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}
