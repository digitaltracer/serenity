/**
 * Integration-related IPC handlers
 * Handles encrypted integration storage and management through the business logic layer
 */

import { ipcMain } from 'electron';
import { z } from 'zod';
import { logger } from '@serenity/core';

const EncryptedIntegrationSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['google_calendar', 'github']),
  encrypted_data: z.string().min(1),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export function registerIntegrationHandlers(): void {
  logger.info('🔧 Registering integration IPC handlers...', { component: 'integrationHandlers', operation: 'registeringIntegrationIpc' });

  // Initialize encrypted integrations table
  ipcMain.handle('integrations:initialize-table', async () => {
    try {
      logger.info('🔐 Initializing encrypted integrations table...', { component: 'integrationHandlers', operation: 'initializingEncryptedIntegrations' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(`
        CREATE TABLE IF NOT EXISTS encrypted_integrations (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('google_calendar', 'github')),
          encrypted_data TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to initialize encrypted integrations table:', { component: 'integrationHandlers', operation: 'failedInitializeEncrypted' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize table';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Save encrypted integration data
  ipcMain.handle('integrations:save-encrypted', async (_, integrationData) => {
    try {
      const valid = EncryptedIntegrationSchema.safeParse(integrationData);
      if (!valid.success) return { success: false, data: null, error: 'Invalid integration payload' };
      logger.info('🔐 Saving encrypted integration data:', {  component: 'integrationHandlers', operation: 'savingEncryptedIntegration' , metadata: { data1: integrationData.type, data2: integrationData.id } });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        `INSERT OR REPLACE INTO encrypted_integrations 
         (id, type, encrypted_data, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          integrationData.id,
          integrationData.type,
          integrationData.encrypted_data,
          integrationData.created_at,
          integrationData.updated_at
        ]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to save encrypted integration:', { component: 'integrationHandlers', operation: 'failedSaveEncrypted' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save integration';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Load encrypted integration data
  ipcMain.handle('integrations:load-encrypted', async () => {
    try {
      logger.info('🔐 Loading encrypted integration data...', { component: 'integrationHandlers', operation: 'loadingEncryptedIntegration' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT id, type, encrypted_data, created_at, updated_at FROM encrypted_integrations'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to load encrypted integrations:', { component: 'integrationHandlers', operation: 'failedLoadEncrypted' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load integrations';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Check if encrypted integrations exist
  ipcMain.handle('integrations:has-encrypted', async () => {
    try {
      logger.info('🔍 Checking for encrypted integrations...', { component: 'integrationHandlers', operation: 'checkingForEncrypted' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT COUNT(*) as count FROM encrypted_integrations'
      );
      
      const count = result && result.length > 0 ? result[0].count || 0 : 0;
      
      return { success: true, data: { hasEncrypted: count > 0, count }, error: null };
    } catch (error) {
      logger.error('❌ Failed to check encrypted integrations:', { component: 'integrationHandlers', operation: 'failedCheckEncrypted' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check integrations';
      return { success: false, data: { hasEncrypted: false, count: 0 }, error: errorMessage };
    }
  });

  // Clear all encrypted integration data
  ipcMain.handle('integrations:clear-encrypted', async () => {
    try {
      logger.info('🧹 Clearing encrypted integration data...', { component: 'integrationHandlers', operation: 'clearingEncryptedIntegration' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM encrypted_integrations'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to clear encrypted integrations:', { component: 'integrationHandlers', operation: 'failedClearEncrypted' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear integrations';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Verify encrypted integrations table exists
  ipcMain.handle('integrations:verify-table', async () => {
    try {
      logger.info('🔍 Verifying encrypted integrations table...', { component: 'integrationHandlers', operation: 'verifyingEncryptedIntegrations' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='encrypted_integrations'"
      );
      
      const tableExists = result && result.length > 0;
      
      return { success: true, data: { exists: tableExists }, error: null };
    } catch (error) {
      logger.error('❌ Failed to verify integrations table:', { component: 'integrationHandlers', operation: 'failedVerifyIntegrations' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify table';
      return { success: false, data: { exists: false }, error: errorMessage };
    }
  });

  // Get verification data for integrations
  ipcMain.handle('integrations:get-verification', async () => {
    try {
      logger.info('🔍 Getting integration verification data...', { component: 'integrationHandlers', operation: 'gettingIntegrationVerification' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT id, type FROM encrypted_integrations'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to get verification data:', { component: 'integrationHandlers', operation: 'failedGetVerification' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get verification data';
      return { success: false, data: null, error: errorMessage };
    }
  });

  logger.info('✅ Integration IPC handlers registered', { component: 'integrationHandlers', operation: 'integrationIpcHandlers' });
}
