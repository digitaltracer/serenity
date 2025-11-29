import { startServer } from './server.js';
import logger from './utils/logger.js';
import config from './config/env.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT gracefully (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
logger.info('Starting Serenity MCP Server...', {
  environment: config.nodeEnv,
  port: config.port,
});

startServer();
