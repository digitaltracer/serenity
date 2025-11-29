import { startServer } from './server.js';
import logger from './utils/logger.js';
import config from './config/env.js';
import { DeviceFlowAuthService } from './services/DeviceFlowAuthService.js';

// Global MCP session token (set after device flow authentication)
export let mcpSessionToken: string | null = null;

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

/**
 * Main application entry point
 * Handles OAuth device flow authentication before starting server
 */
async function main() {
  logger.info('Starting Serenity MCP Server...', {
    environment: config.nodeEnv,
    port: config.port,
  });

  // Initialize device flow auth service
  const authService = new DeviceFlowAuthService(config.webAppUrl);

  try {
    // Try loading existing session
    logger.info('Checking for saved session...');
    let token = await authService.loadSession();

    // If no session, trigger device flow
    if (!token) {
      logger.info('No saved session found. Starting OAuth device flow...');
      token = await authService.authorize();
      logger.info('✓ Authentication successful!');
    } else {
      logger.info('✓ Using saved session');
    }

    // Store token globally
    mcpSessionToken = token;

    // Start the MCP server
    startServer();
  } catch (error) {
    logger.error('Failed to authenticate MCP server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    logger.error('\nAuthentication failed. Cannot start MCP server without valid credentials.');
    logger.info('Please ensure:');
    logger.info('  1. The web app is running and accessible');
    logger.info('  2. You have a valid user account');
    logger.info('  3. You approve the device authorization when prompted\n');
    process.exit(1);
  }
}

// Start main
main().catch((error) => {
  logger.error('Fatal error in main', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
