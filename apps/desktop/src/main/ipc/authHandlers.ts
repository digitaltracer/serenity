/**
 * Authentication-related IPC handlers
 * Handles master password and secure settings through the business logic layer
 */

import { ipcMain } from 'electron';
import { z } from 'zod';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { logger } from '@serenity/core';

const keySchema = z.string().min(1);
const valueSchema = z.string();

export function registerAuthHandlers(): void {
  logger.info('🔧 Registering authentication IPC handlers...', { component: 'authHandlers', operation: 'registeringAuthenticationIpc' });

  const authMiddleware = AuthMiddleware.getInstance();

  // Initialize secure settings table
  ipcMain.handle('auth:initialize-secure-settings', async () => {
    try {
      logger.info('🔐 Initializing secure settings table...', { component: 'authHandlers', operation: 'initializingSecureSettings' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(`
        CREATE TABLE IF NOT EXISTS secure_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to initialize secure settings table:', { component: 'authHandlers', operation: 'failedInitializeSecure' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize secure settings';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Set master password hash
  ipcMain.handle('auth:set-master-password-hash', async (_, passwordHash) => {
    try {
      if (typeof passwordHash !== 'string' || passwordHash.length < 10) {
        return { success: false, data: null, error: 'Invalid password hash' };
      }
      logger.info('🔐 Setting master password hash...', { component: 'authHandlers', operation: 'settingMasterPassword' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const now = new Date().toISOString();
      const result = await sqliteService.executeRawQuery(
        'INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['master_password_hash', passwordHash, now, now]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to set master password hash:', { component: 'authHandlers', operation: 'failedSetMaster' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set master password';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Get master password hash
  ipcMain.handle('auth:get-master-password-hash', async () => {
    try {
      logger.info('🔍 Getting master password hash...', { component: 'authHandlers', operation: 'gettingMasterPassword' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT value FROM secure_settings WHERE key = ?',
        ['master_password_hash']
      );
      
      const hash = result && result.length > 0 ? result[0].value : null;
      
      return { success: true, data: { hash }, error: null };
    } catch (error) {
      logger.error('❌ Failed to get master password hash:', { component: 'authHandlers', operation: 'failedGetMaster' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get master password';
      return { success: false, data: { hash: null }, error: errorMessage };
    }
  });

  // Check if master password is set
  ipcMain.handle('auth:has-master-password', async () => {
    try {
      logger.info('🔍 Checking if master password is set...', { component: 'authHandlers', operation: 'checkingMasterPassword' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT COUNT(*) as count FROM secure_settings WHERE key = ?',
        ['master_password_hash']
      );
      
      const hasPassword = result && result.length > 0 && result[0].count > 0;
      
      return { success: true, data: { hasMasterPassword: hasPassword }, error: null };
    } catch (error) {
      logger.error('❌ Failed to check master password:', { component: 'authHandlers', operation: 'failedCheckMaster' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check master password';
      return { success: false, data: { hasMasterPassword: false }, error: errorMessage };
    }
  });

  // Clear master password hash
  ipcMain.handle('auth:clear-master-password-hash', async () => {
    try {
      logger.info('🧹 Clearing master password hash...', { component: 'authHandlers', operation: 'clearingMasterPassword' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM secure_settings WHERE key = ?',
        ['master_password_hash']
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to clear master password hash:', { component: 'authHandlers', operation: 'failedClearMaster' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear master password';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Clear all secure settings
  ipcMain.handle('auth:clear-all-secure-settings', async () => {
    try {
      logger.info('🧹 Clearing all secure settings...', { component: 'authHandlers', operation: 'clearingAllSecure' });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM secure_settings'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to clear all secure settings:', { component: 'authHandlers', operation: 'failedClearAll' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear secure settings';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Get secure setting by key
  ipcMain.handle('auth:get-secure-setting', async (_, key) => {
    try {
      const v = keySchema.safeParse(key);
      if (!v.success) return { success: false, data: { value: null }, error: 'Invalid key' };
      logger.info('🔍 Getting secure setting:', {  component: 'authHandlers', operation: 'gettingSecureSetting:' , metadata: { value: key } });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT value FROM secure_settings WHERE key = ?',
        [key]
      );
      
      const value = result && result.length > 0 ? result[0].value : null;
      
      return { success: true, data: { value }, error: null };
    } catch (error) {
      logger.error('❌ Failed to get secure setting:', { component: 'authHandlers', operation: 'failedGetSecure' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get secure setting';
      return { success: false, data: { value: null }, error: errorMessage };
    }
  });

  // Set secure setting
  ipcMain.handle('auth:set-secure-setting', async (_, key, value) => {
    try {
      const k = keySchema.safeParse(key);
      const v = valueSchema.safeParse(value);
      if (!k.success || !v.success) return { success: false, data: null, error: 'Invalid key/value' };
      logger.info('🔐 Setting secure setting:', {  component: 'authHandlers', operation: 'settingSecureSetting:' , metadata: { value: key } });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const now = new Date().toISOString();
      const result = await sqliteService.executeRawQuery(
        'INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [key, value, now, now]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to set secure setting:', { component: 'authHandlers', operation: 'failedSetSecure' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set secure setting';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Delete secure setting by key
  ipcMain.handle('auth:delete-secure-setting', async (_, key) => {
    try {
      const v = keySchema.safeParse(key);
      if (!v.success) return { success: false, data: null, error: 'Invalid key' };
      logger.info('🗑️ Deleting secure setting:', {  component: 'authHandlers', operation: '🗑️DeletingSecure' , metadata: { value: key } });
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM secure_settings WHERE key = ?',
        [key]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Failed to delete secure setting:', { component: 'authHandlers', operation: 'failedDeleteSecure' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete secure setting';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Session management handlers
  ipcMain.handle('auth:create-session', async () => {
    try {
      logger.info('🔓 Creating new session...', { component: 'authHandlers', operation: 'creatingNewSession...' });
      authMiddleware.createSession();
      return { success: true, data: null, error: null };
    } catch (error) {
      logger.error('❌ Failed to create session:', { component: 'authHandlers', operation: 'failedCreateSession:' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('auth:destroy-session', async () => {
    try {
      logger.info('🔒 Destroying session...', { component: 'authHandlers', operation: 'destroyingSession...' });
      authMiddleware.destroySession();
      return { success: true, data: null, error: null };
    } catch (error) {
      logger.error('❌ Failed to destroy session:', { component: 'authHandlers', operation: 'failedDestroySession:' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to destroy session';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('auth:validate-session', async () => {
    try {
      const isValid = authMiddleware.isSessionValid();
      return { success: true, data: { isValid }, error: null };
    } catch (error) {
      logger.error('❌ Failed to validate session:', { component: 'authHandlers', operation: 'failedValidateSession:' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate session';
      return { success: false, data: { isValid: false }, error: errorMessage };
    }
  });

  ipcMain.handle('auth:get-session-status', async () => {
    try {
      const status = authMiddleware.getSessionStatus();
      return { success: true, data: status, error: null };
    } catch (error) {
      logger.error('❌ Failed to get session status:', { component: 'authHandlers', operation: 'failedGetSession' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get session status';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('auth:update-activity', async () => {
    try {
      authMiddleware.updateActivity();
      return { success: true, data: null, error: null };
    } catch (error) {
      logger.error('❌ Failed to update activity:', { component: 'authHandlers', operation: 'failedUpdateActivity:' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update activity';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('auth:record-failed-attempt', async () => {
    try {
      authMiddleware.recordFailedAttempt();
      const status = authMiddleware.getSessionStatus();
      return { success: true, data: status, error: null };
    } catch (error) {
      logger.error('❌ Failed to record failed attempt:', { component: 'authHandlers', operation: 'failedRecordFailed' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record failed attempt';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('auth:reset-failed-attempts', async () => {
    try {
      authMiddleware.resetFailedAttempts();
      return { success: true, data: null, error: null };
    } catch (error) {
      logger.error('❌ Failed to reset failed attempts:', { component: 'authHandlers', operation: 'failedResetFailed' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset failed attempts';
      return { success: false, data: null, error: errorMessage };
    }
  });

  logger.info('✅ Authentication IPC handlers registered', { component: 'authHandlers', operation: 'authenticationIpcHandlers' });
}
