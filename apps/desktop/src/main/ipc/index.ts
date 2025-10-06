/**
 * IPC handlers registration - centralized entry point
 * Registers all domain-specific IPC handlers
 */

import { registerSystemHandlers } from './systemHandlers';
import { registerTaskHandlers } from './taskHandlers';
import { registerProjectHandlers } from './projectHandlers';
import { registerJournalHandlers } from './journalHandlers';
import { registerIntegrationHandlers } from './integrationHandlers';
import { registerAuthHandlers } from './authHandlers';
import { registerAIAssistantHandlers } from './aiAssistantHandlers';
import { registerGoalHandlers } from './goalsHandlers';
import { logger } from '@serenity/core';

/**
 * Register all IPC handlers in organized domain groups
 */
export function registerAllIpcHandlers(): void {
  logger.info('🚀 Registering all IPC handlers...', { component: 'index', operation: 'registeringAllIpc' });
  
  // Register domain-specific handlers
  registerSystemHandlers();
  registerTaskHandlers();
  registerProjectHandlers();
  registerJournalHandlers();
  registerIntegrationHandlers();
  registerAuthHandlers();
  registerAIAssistantHandlers();
  registerGoalHandlers();
  
  logger.info('✅ All IPC handlers registered successfully', { component: 'index', operation: 'allIpcHandlers' });
}
