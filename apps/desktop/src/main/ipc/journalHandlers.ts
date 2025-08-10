/**
 * Journal-related IPC handlers
 * Handles all journal operations through the business logic layer
 */

import { ipcMain } from 'electron';
import { apiService } from '../services/ApiService';

export function registerJournalHandlers(): void {
  console.log('🔧 Registering journal IPC handlers...');

  // Journal operations through business logic
  ipcMain.handle('journal:get', async () => {
    try {
      console.log('🔐 Getting journal entries through business layer...');
      return await apiService.getJournalEntries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get journal entries';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:create', async (_, entry) => {
    try {
      console.log('🔐 Creating journal entry through business layer...');
      return await apiService.createJournalEntry(entry);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:create-with-id', async (_, entry) => {
    try {
      console.log('🔐 Creating journal entry with ID through business layer:', entry.title, entry.id);
      // Business layer will handle ID assignment validation
      return await apiService.createJournalEntry(entry);
    } catch (error) {
      console.error('❌ Business layer: Journal entry creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry with ID';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:update', async (_, id, updates) => {
    try {
      console.log('🔐 Updating journal entry through business layer...');
      return await apiService.updateJournalEntry(id, updates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:delete', async (_, id) => {
    try {
      console.log('🔐 Deleting journal entry through business layer...');
      return await apiService.deleteJournalEntry(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete journal entry';
      return { success: false, data: false, error: errorMessage };
    }
  });

  // Additional journal business operations
  ipcMain.handle('journal:pin', async (_, id) => {
    try {
      console.log('🔐 Pinning journal entry through business layer...');
      return await apiService.pinJournalEntry(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pin journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:unpin', async (_, id) => {
    try {
      console.log('🔐 Unpinning journal entry through business layer...');
      return await apiService.unpinJournalEntry(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unpin journal entry';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:get-by-date-range', async (_, startDate, endDate) => {
    try {
      console.log('🔐 Getting journal entries by date range through business layer...');
      return await apiService.getJournalEntriesByDateRange(startDate, endDate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get journal entries by date range';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('journal:get-stats', async () => {
    try {
      console.log('🔐 Getting journal stats through business layer...');
      return await apiService.getJournalStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get journal stats';
      return { success: false, data: null, error: errorMessage };
    }
  });

  console.log('✅ Journal IPC handlers registered');
}

/**
 * Helper function to query journal entries for AI analysis
 */
export async function queryJournalEntriesIPC() {
  try {
    console.log('🔐 Querying journal entries for AI analysis...');
    return await apiService.getJournalEntries();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to query journal entries';
    return { success: false, data: null, error: errorMessage };
  }
}