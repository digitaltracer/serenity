import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  webAppUrl: string;
  allowedOrigins: string[];
  rateLimitRequests: number;
  rateLimitWindow: number;
  logLevel: string;
  sentryDsn?: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
}

export const config: ServerConfig = {
  port: getEnvNumber('PORT', 3001),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  databaseUrl: getEnv('DATABASE_URL'),
  webAppUrl: getEnv('WEB_APP_URL', 'http://localhost:3000'),
  allowedOrigins: getEnv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
  rateLimitRequests: getEnvNumber('RATE_LIMIT_REQUESTS', 100),
  rateLimitWindow: getEnvNumber('RATE_LIMIT_WINDOW', 60000),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  sentryDsn: process.env.SENTRY_DSN,
};

// Validate configuration
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default config;
