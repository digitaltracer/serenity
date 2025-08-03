/**
 * Integration-related IPC handlers
 * Handles encrypted integration storage and management through the business logic layer
 */

import { ipcMain } from 'electron';

export function registerIntegrationHandlers(): void {
  console.log('🔧 Registering integration IPC handlers...');

  // Initialize encrypted integrations table
  ipcMain.handle('integrations:initialize-table', async () => {
    try {
      console.log('🔐 Initializing encrypted integrations table...');
      
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
      console.error('❌ Failed to initialize encrypted integrations table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize table';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Save encrypted integration data
  ipcMain.handle('integrations:save-encrypted', async (_, integrationData) => {
    try {
      console.log('🔐 Saving encrypted integration data:', integrationData.type, integrationData.id);
      
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
      console.error('❌ Failed to save encrypted integration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save integration';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Load encrypted integration data
  ipcMain.handle('integrations:load-encrypted', async () => {
    try {
      console.log('🔐 Loading encrypted integration data...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT id, type, encrypted_data, created_at, updated_at FROM encrypted_integrations'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to load encrypted integrations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load integrations';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Check if encrypted integrations exist
  ipcMain.handle('integrations:has-encrypted', async () => {
    try {
      console.log('🔍 Checking for encrypted integrations...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT COUNT(*) as count FROM encrypted_integrations'
      );
      
      const count = result && result.length > 0 ? result[0].count || 0 : 0;
      
      return { success: true, data: { hasEncrypted: count > 0, count }, error: null };
    } catch (error) {
      console.error('❌ Failed to check encrypted integrations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check integrations';
      return { success: false, data: { hasEncrypted: false, count: 0 }, error: errorMessage };
    }
  });

  // Clear all encrypted integration data
  ipcMain.handle('integrations:clear-encrypted', async () => {
    try {
      console.log('🧹 Clearing encrypted integration data...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM encrypted_integrations'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to clear encrypted integrations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear integrations';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Verify encrypted integrations table exists
  ipcMain.handle('integrations:verify-table', async () => {
    try {
      console.log('🔍 Verifying encrypted integrations table...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='encrypted_integrations'"
      );
      
      const tableExists = result && result.length > 0;
      
      return { success: true, data: { exists: tableExists }, error: null };
    } catch (error) {
      console.error('❌ Failed to verify integrations table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify table';
      return { success: false, data: { exists: false }, error: errorMessage };
    }
  });

  // Get verification data for integrations
  ipcMain.handle('integrations:get-verification', async () => {
    try {
      console.log('🔍 Getting integration verification data...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT id, type FROM encrypted_integrations'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to get verification data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get verification data';
      return { success: false, data: null, error: errorMessage };
    }
  });

  console.log('✅ Integration IPC handlers registered');
}