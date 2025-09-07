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

/**
 * Register all IPC handlers in organized domain groups
 */
export function registerAllIpcHandlers(): void {
  console.log('🚀 Registering all IPC handlers...');
  
  // Register domain-specific handlers
  registerSystemHandlers();
  registerTaskHandlers();
  registerProjectHandlers();
  registerJournalHandlers();
  registerIntegrationHandlers();
  registerAuthHandlers();
  registerAIAssistantHandlers();
  registerGoalHandlers();
  
  console.log('✅ All IPC handlers registered successfully');
}
