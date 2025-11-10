/**
 * Journal-related IPC handlers
 * Handles all journal operations through the business logic layer
 */

import { ipcMain } from 'electron';
import { z } from 'zod';
import { JournalEntrySchema } from '@serenity/core';
import { apiService } from '../services/ApiService';
import { logger } from '@serenity/core';

export function registerJournalHandlers(): void {
  logger.info('🔧 Registering journal IPC handlers...', { component: 'journalHandlers', operation: 'registeringJournalIpc' });

  // Journal operations through business logic
  ipcMain.handle('journal:get', async () => {
    try {
      logger.info('🔐 Getting journal entries through business layer...', { component: 'journalHandlers', operation: 'gettingJournalEntries' });
      return await apiService.getJournalEntries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get journal entries';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:create', async (_, entry) => {
    try {
      logger.info('🔐 Creating journal entry through business layer...', { component: 'journalHandlers', operation: 'creatingJournalEntry' });
      const validated = JournalEntrySchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(entry);
      return await apiService.createJournalEntry(validated);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:create-with-id', async (_, entry) => {
    try {
      logger.info('🔐 Creating journal entry with ID through business layer:', {  component: 'journalHandlers', operation: 'creatingJournalEntry' , metadata: { data1: entry.title, data2: entry.id } });
      const validated = JournalEntrySchema.parse(entry);
      return await apiService.createJournalEntry(validated);
    } catch (error) {
      logger.error('❌ Business layer: Journal entry creation failed:', { component: 'journalHandlers', operation: 'businessLayer:Journal' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry with ID';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:update', async (_, id, updates) => {
    try {
      logger.info('🔐 Updating journal entry through business layer...', { component: 'journalHandlers', operation: 'updatingJournalEntry' });
      z.string().min(1).parse(id);
      const validatedUpdates = JournalEntrySchema.partial().parse(updates);
      return await apiService.updateJournalEntry(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:delete', async (_, id) => {
    try {
      logger.info('🔐 Deleting journal entry through business layer...', { component: 'journalHandlers', operation: 'deletingJournalEntry' });
      z.string().min(1).parse(id);
      return await apiService.deleteJournalEntry(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete journal entry';
      return { success: false, data: false, error: errorMessage };
    }
  });

  // Additional journal business operations
  ipcMain.handle('journal:pin', async (_, id) => {
    try {
      logger.info('🔐 Pinning journal entry through business layer...', { component: 'journalHandlers', operation: 'pinningJournalEntry' });
      z.string().min(1).parse(id);
      return await apiService.pinJournalEntry(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pin journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:unpin', async (_, id) => {
    try {
      logger.info('🔐 Unpinning journal entry through business layer...', { component: 'journalHandlers', operation: 'unpinningJournalEntry' });
      z.string().min(1).parse(id);
      return await apiService.unpinJournalEntry(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unpin journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:get-by-date-range', async (_, startDate, endDate) => {
    try {
      logger.info('🔐 Getting journal entries by date range through business layer...', { component: 'journalHandlers', operation: 'gettingJournalEntries' });
      const date = (v: unknown) => z.union([z.date(), z.string().datetime(), z.string().date()]).transform((val) => new Date(val)).parse(v);
      return await apiService.getJournalEntriesByDateRange(date(startDate).toISOString(), date(endDate).toISOString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get journal entries by date range';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:get-stats', async () => {
    try {
      logger.info('🔐 Getting journal stats through business layer...', { component: 'journalHandlers', operation: 'gettingJournalStats' });
      return await apiService.getJournalStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get journal stats';
      return { success: false, data: null, error: errorMessage };
    }
  });

  logger.info('✅ Journal IPC handlers registered', { component: 'journalHandlers', operation: 'register' });
}

/**
 * Helper function to query journal entries for AI analysis
 */
export async function queryJournalEntriesIPC() {
  try {
    logger.info('🔐 Querying journal entries for AI analysis...', { component: 'journalHandlers', operation: 'query' });
    return await apiService.getJournalEntries();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to query journal entries';
    return { success: false, data: null, error: errorMessage };
  }
}
