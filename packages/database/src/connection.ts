import pgPromise from 'pg-promise';
import { config } from 'dotenv';

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
    console.error('Database connection test failed:', error);
    return false;
  }
};