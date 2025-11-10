import pgPromise from 'pg-promise';
import { config } from 'dotenv';
import { logger } from '@serenity/core';

config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

const pgp = pgPromise({
  // Initialization options
  capSQL: true,
});

let db: pgPromise.IDatabase<{}> | null = null;

export const initializeDatabase = (config: DatabaseConfig): pgPromise.IDatabase<{}> => {
  if (db) {
    return db;
  }

  const connectionString = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  
  db = pgp({
    connectionString,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  });

  return db;
};

export const getDatabase = (): pgPromise.IDatabase<{}> => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.$pool.end();
    db = null;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const database = getDatabase();
    await database.one('SELECT 1 as test');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', { component: 'connection', operation: 'databaseConnectionTest' }, error as Error);
    return false;
  }
};

export const testDatabaseConnection = async (connectionUrl: string): Promise<boolean> => {
  let testDb: pgPromise.IDatabase<{}> | null = null;
  
  try {
    // Parse connection URL
    const url = new URL(connectionUrl);
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      throw new Error('Invalid PostgreSQL URL format');
    }

    const config: DatabaseConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('ssl') === 'true' || url.searchParams.get('sslmode') === 'require'
    };

    // Create temporary connection for testing
    const connectionString = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    testDb = pgp({
      connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    // Test the connection with a timeout
    const testQuery = testDb.one('SELECT 1 as test');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    
    await Promise.race([testQuery, timeoutPromise]);
    
    return true;
  } catch (error) {
    return false;
  } finally {
    // Ensure cleanup happens even if test fails
    if (testDb) {
      try {
        await testDb.$pool.end();
      } catch (cleanupError) {
        logger.error('Error during connection cleanup:', { component: 'connection', operation: 'errorDuringConnection' }, cleanupError as Error);
      }
    }
  }
};