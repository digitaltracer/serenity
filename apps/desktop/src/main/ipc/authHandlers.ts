/**
 * Authentication-related IPC handlers
 * Handles master password and secure settings through the business logic layer
 */

import { ipcMain } from 'electron';
import { z } from 'zod';

const keySchema = z.string().min(1);
const valueSchema = z.string();

export function registerAuthHandlers(): void {
  console.log('🔧 Registering authentication IPC handlers...');

  // Initialize secure settings table
  ipcMain.handle('auth:initialize-secure-settings', async () => {
    try {
      console.log('🔐 Initializing secure settings table...');
      
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
      console.error('❌ Failed to initialize secure settings table:', error);
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
      console.log('🔐 Setting master password hash...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const now = new Date().toISOString();
      const result = await sqliteService.executeRawQuery(
        'INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['master_password_hash', passwordHash, now, now]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to set master password hash:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set master password';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Get master password hash
  ipcMain.handle('auth:get-master-password-hash', async () => {
    try {
      console.log('🔍 Getting master password hash...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT value FROM secure_settings WHERE key = ?',
        ['master_password_hash']
      );
      
      const hash = result && result.length > 0 ? result[0].value : null;
      
      return { success: true, data: { hash }, error: null };
    } catch (error) {
      console.error('❌ Failed to get master password hash:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get master password';
      return { success: false, data: { hash: null }, error: errorMessage };
    }
  });

  // Check if master password is set
  ipcMain.handle('auth:has-master-password', async () => {
    try {
      console.log('🔍 Checking if master password is set...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT COUNT(*) as count FROM secure_settings WHERE key = ?',
        ['master_password_hash']
      );
      
      const hasPassword = result && result.length > 0 && result[0].count > 0;
      
      return { success: true, data: { hasMasterPassword: hasPassword }, error: null };
    } catch (error) {
      console.error('❌ Failed to check master password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check master password';
      return { success: false, data: { hasMasterPassword: false }, error: errorMessage };
    }
  });

  // Clear master password hash
  ipcMain.handle('auth:clear-master-password-hash', async () => {
    try {
      console.log('🧹 Clearing master password hash...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM secure_settings WHERE key = ?',
        ['master_password_hash']
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to clear master password hash:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear master password';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Clear all secure settings
  ipcMain.handle('auth:clear-all-secure-settings', async () => {
    try {
      console.log('🧹 Clearing all secure settings...');
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM secure_settings'
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to clear all secure settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear secure settings';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Get secure setting by key
  ipcMain.handle('auth:get-secure-setting', async (_, key) => {
    try {
      const v = keySchema.safeParse(key);
      if (!v.success) return { success: false, data: { value: null }, error: 'Invalid key' };
      console.log('🔍 Getting secure setting:', key);
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'SELECT value FROM secure_settings WHERE key = ?',
        [key]
      );
      
      const value = result && result.length > 0 ? result[0].value : null;
      
      return { success: true, data: { value }, error: null };
    } catch (error) {
      console.error('❌ Failed to get secure setting:', error);
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
      console.log('🔐 Setting secure setting:', key);
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const now = new Date().toISOString();
      const result = await sqliteService.executeRawQuery(
        'INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [key, value, now, now]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to set secure setting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set secure setting';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Delete secure setting by key
  ipcMain.handle('auth:delete-secure-setting', async (_, key) => {
    try {
      const v = keySchema.safeParse(key);
      if (!v.success) return { success: false, data: null, error: 'Invalid key' };
      console.log('🗑️ Deleting secure setting:', key);
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      
      const result = await sqliteService.executeRawQuery(
        'DELETE FROM secure_settings WHERE key = ?',
        [key]
      );
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Failed to delete secure setting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete secure setting';
      return { success: false, data: null, error: errorMessage };
    }
  });

  console.log('✅ Authentication IPC handlers registered');
}
