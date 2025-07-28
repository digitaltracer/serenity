/**
 * Enhanced store configuration with SQLite persistence and migration support
 */

import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import projectsReducer from './slices/projectsSlice';
import journalReducer from './slices/journalSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import tagsReducer from './slices/tagsSlice';
import authReducer from './slices/authSlice';
import databaseReducer from './slices/databaseSlice';
import shortcutsReducer from './slices/shortcutsSlice';
import searchReducer from './slices/searchSlice';
import dragDropReducer from './slices/dragDropSlice';
import goalsReducer from './slices/goalsSlice';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';
import { hybridPersistenceMiddleware, initializeSQLitePersistence } from './middleware/hybridPersistenceMiddleware';

/**
 * Create the enhanced store - always starts with localStorage middleware
 * SQLite functionality is added after app initialization
 */
export function createEnhancedStore() {
  return configureStore({
    reducer: {
      tasks: tasksReducer,
      projects: projectsReducer,
      journal: journalReducer,
      user: userReducer,
      ui: uiReducer,
      tags: tagsReducer,
      auth: authReducer,
      database: databaseReducer,
      shortcuts: shortcutsReducer,
      search: searchReducer,
      dragDrop: dragDropReducer,
      goals: goalsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
          ignoredActionsPaths: [
            'payload.date', 
            'payload.createdAt', 
            'payload.updatedAt', 
            'payload.dueDate', 
            'payload.lastConnected', 
            'payload.lastBackup', 
            'payload.lastOptimized', 
            'payload.startDate', 
            'payload.endDate', 
            'payload.reminderDate'
          ],
        },
      }).concat(hybridPersistenceMiddleware), // Use hybrid persistence with SQLite support
  });
}

// Create the store instance
export const store = createEnhancedStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Initialize the store with data from appropriate source
 */
export async function initializeStoreData() {
  try {
    console.log('🔄 Starting store data initialization...');
    
    // Check if we're in Electron environment with SQLite support
    const hasElectronSQLite = typeof window !== 'undefined' && 
                              window.electronAPI && 
                              window.electronAPI.sqlite;
    
    if (hasElectronSQLite) {
      console.log('🗄️ Electron SQLite environment detected');
      
      // Import migration utilities
      const { 
        migrateToSQLite, 
        loadInitialDataFromSQLite, 
        hasLocalStorageData,
        getLocalStorageData 
      } = await import('../utils/migration');
      
      // Initialize SQLite persistence
      console.log('🗄️ Initializing SQLite persistence...');
      const sqliteInitialized = await initializeSQLitePersistence();
      
      if (sqliteInitialized) {
        // Check if we should migrate
        console.log('🚀 Starting SQLite migration process...');
        const migrationSuccess = await migrateToSQLite();
      
      if (migrationSuccess) {
        // Load data from SQLite
        console.log('📂 Loading data from SQLite...');
        const sqliteData = await loadInitialDataFromSQLite();
        
        if (sqliteData) {
          // Populate Redux store with SQLite data
          console.log('📊 Populating Redux store with SQLite data...');
          
          // Dispatch actions to populate the store
          if (sqliteData.tasks.length > 0) {
            store.dispatch({ type: 'tasks/setTasks', payload: sqliteData.tasks });
            console.log(`✅ Loaded ${sqliteData.tasks.length} tasks from SQLite`);
          }
          
          if (sqliteData.projects.length > 0) {
            store.dispatch({ type: 'projects/setProjects', payload: sqliteData.projects });
            console.log(`✅ Loaded ${sqliteData.projects.length} projects from SQLite`);
          }
          
          if (sqliteData.journalEntries.length > 0) {
            store.dispatch({ type: 'journal/setEntries', payload: sqliteData.journalEntries });
            console.log(`✅ Loaded ${sqliteData.journalEntries.length} journal entries from SQLite`);
          }
          
          console.log('✅ SQLite data initialization completed successfully');
          return true;
        } else {
          console.log('📭 No SQLite data found');
        }
      } else {
          console.log('⚠️ SQLite migration failed, falling back to localStorage');
        }
      } else {
        console.log('⚠️ SQLite initialization failed, using localStorage');
      }
    } else {
      console.log('💾 No SQLite support detected, using localStorage');
    }
    
    // Fallback: Load from localStorage if SQLite is not available
    const { hasLocalStorageData, getLocalStorageData } = await import('../utils/migration');
    
    if (hasLocalStorageData()) {
      console.log('📦 Loading data from localStorage as fallback...');
      const localData = getLocalStorageData();
      
      if (localData.tasks.length > 0) {
        store.dispatch({ type: 'tasks/setTasks', payload: localData.tasks });
        console.log(`✅ Loaded ${localData.tasks.length} tasks from localStorage`);
      }
      
      if (localData.projects.length > 0) {
        store.dispatch({ type: 'projects/setProjects', payload: localData.projects });
        console.log(`✅ Loaded ${localData.projects.length} projects from localStorage`);
      }
      
      if (localData.journalEntries.length > 0) {
        store.dispatch({ type: 'journal/setEntries', payload: localData.journalEntries });
        console.log(`✅ Loaded ${localData.journalEntries.length} journal entries from localStorage`);
      }
      
      console.log('✅ LocalStorage data initialization completed');
      return true;
    }
    
    console.log('📭 No existing data found - starting with empty store');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize store data:', error);
    return false;
  }
}

/**
 * Check if SQLite is available and working
 */
export async function checkSQLiteAvailability(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
    try {
      const result = await window.electronAPI.sqlite.testConnection();
      return result.success;
    } catch (error) {
      console.error('SQLite availability check failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Get database statistics for monitoring
 */
export async function getDatabaseStats() {
  if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
    try {
      const result = await window.electronAPI.sqlite.getStats();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }
  return null;
}