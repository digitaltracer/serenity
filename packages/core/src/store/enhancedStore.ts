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
import integrationsReducer from './slices/integrationsSlice';
import aiAssistantReducer from './slices/aiAssistantSlice';
import { restoreInsights, restoreRecaps } from './slices/aiAssistantSlice';
import insightsReducer from './slices/insightsSlice';
import summariesReducer from './slices/summariesSlice';
import { simplifiedPersistenceMiddleware, initializeSQLitePersistence } from './middleware/simplifiedPersistenceMiddleware';
import { logger } from '../utils/logger';

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
      integrations: integrationsReducer,
      aiAssistant: aiAssistantReducer,
      insights: insightsReducer,
      summaries: summariesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
          ignoredActionsPaths: [
            'payload.date',
            'payload.createdAt',
            'payload.updatedAt',
            'payload.completedAt',
            'payload.dueDate',
            'payload.lastConnected',
            'payload.lastBackup',
            'payload.lastOptimized',
            'payload.startDate',
            'payload.endDate',
            'payload.reminderDate'
          ],
        },
      }).concat(simplifiedPersistenceMiddleware), // Use simplified persistence with early SQLite commitment
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
    logger.info('🔄 Starting store data initialization...', { component: 'enhancedStore', operation: 'startingStoreData' });
    
    // Check if we're in Electron environment with SQLite support
    const hasElectronSQLite = typeof window !== 'undefined' && 
                              window.electronAPI && 
                              window.electronAPI.sqlite;
    
    if (hasElectronSQLite) {
      logger.info('🗄️ Electron SQLite environment detected', { component: 'enhancedStore', operation: '🗄️ElectronSqlite' });
      
      // Import migration utilities
      const { 
        migrateToSQLite, 
        loadInitialDataFromSQLite, 
        hasLocalStorageData,
        getLocalStorageData 
      } = await import('../utils/migration');
      
      // Initialize SQLite persistence
      logger.info('🗄️ Initializing SQLite persistence...', { component: 'enhancedStore', operation: '🗄️InitializingSqlite' });
      const sqliteInitialized = await initializeSQLitePersistence();
      
      if (sqliteInitialized) {
        // Check if we should migrate
        logger.info('🚀 Starting SQLite migration process...', { component: 'enhancedStore', operation: 'startingSqliteMigration' });
        const migrationSuccess = await migrateToSQLite();
      
      if (migrationSuccess) {
        // Load data from SQLite
        logger.info('📂 Loading data from SQLite...', { component: 'enhancedStore', operation: 'loadingDataFrom' });
        const sqliteData = await loadInitialDataFromSQLite();
        
        if (sqliteData) {
          // Populate Redux store with SQLite data
          logger.info('📊 Populating Redux store with SQLite data...', { component: 'enhancedStore', operation: 'populatingReduxStore' });
          
          // Dispatch actions to populate the store
          if (sqliteData.tasks.length > 0) {
            store.dispatch({ type: 'tasks/setTasks', payload: sqliteData.tasks });
            logger.info(`✅ Loaded ${sqliteData.tasks.length} tasks from SQLite`, { component: 'enhancedStore', operation: 'loaded${sqlitedata.tasks.length}Tasks' });
            
            // Extract and set used tags from tasks
            const taskTags = sqliteData.tasks
              .flatMap((task: any) => task.tags || [])
              .filter((tag: string) => tag && tag.trim());
            if (taskTags.length > 0) {
              store.dispatch({ type: 'tags/addUsedTags', payload: taskTags });
              logger.info(`✅ Loaded ${taskTags.length} tags from tasks`, { component: 'enhancedStore', operation: 'loaded${tasktags.length}Tags' });
            }
          }
          
          if (sqliteData.projects.length > 0) {
            store.dispatch({ type: 'projects/setProjects', payload: sqliteData.projects });
            logger.info(`✅ Loaded ${sqliteData.projects.length} projects from SQLite`, { component: 'enhancedStore', operation: 'loaded${sqlitedata.projects.length}Projects' });
          }
          
          if (sqliteData.journalEntries.length > 0) {
            store.dispatch({ type: 'journal/setEntries', payload: sqliteData.journalEntries });
            logger.info(`✅ Loaded ${sqliteData.journalEntries.length} journal entries from SQLite`, { component: 'enhancedStore', operation: 'loaded${sqlitedata.journalentries.length}Journal' });
            
            // Extract and set used tags from journal entries
            const journalTags = sqliteData.journalEntries
              .flatMap((entry: any) => entry.tags || [])
              .filter((tag: string) => tag && tag.trim());
            if (journalTags.length > 0) {
              store.dispatch({ type: 'tags/addUsedTags', payload: journalTags });
              logger.info(`✅ Loaded ${journalTags.length} tags from journal entries`, { component: 'enhancedStore', operation: 'loaded${journaltags.length}Tags' });
            }
          }
          
          // Load goals via IPC
          try {
            const anyWindow: any = window as any;
            const goalsResult = await anyWindow.electronAPI?.goals?.get();
            if (goalsResult?.success && Array.isArray(goalsResult.data)) {
              store.dispatch({ type: 'goals/setGoals', payload: goalsResult.data });
              logger.info(`✅ Loaded ${goalsResult.data.length} goals from SQLite`, { component: 'enhancedStore', operation: 'loaded${goalsresult.data.length}Goals' });
            } else {
              logger.warn('⚠️ No goals loaded from SQLite', { component: 'enhancedStore', operation: 'goalsLoadedFrom' });
            }
          } catch (e) {
            logger.warn('⚠️ Failed to load goals from SQLite', { component: 'enhancedStore', operation: 'failedLoadGoals' });
          }

          // Load AI insights/recaps/usage from SQLite and hydrate Redux
          try {
            const anyWindow: any = window as any;
            logger.info('🔄 Loading AI insights/recaps/usage from SQLite...', { component: 'enhancedStore', operation: 'loadingInsights/recaps/usageFrom' });
            const [insightsRes, recapsRes, usageRes] = await Promise.all([
              anyWindow.electronAPI?.aiAssistant?.listInsights?.(),
              anyWindow.electronAPI?.aiAssistant?.listRecaps?.(),
              anyWindow.electronAPI?.aiAssistant?.listUsage?.(),
            ]);

            // Map and restore insights
            if (insightsRes?.success && Array.isArray(insightsRes.data)) {
              const insights = insightsRes.data.map((row: any) => ({
                id: row.id,
                type: row.type,
                title: row.title,
                description: row.description,
                confidence: Number(row.confidence ?? 0.5),
                createdAt: row.created_at,
                source: row.provider,
                category: row.category,
                actionable: !!row.actionable,
                metadata: (() => { try { return JSON.parse(row.metadata || '{}'); } catch { return {}; } })(),
              }));
              store.dispatch({ type: 'aiAssistant/restoreInsights', payload: insights });
              logger.info(`✅ Loaded ${insights.length} AI insights from SQLite`, { component: 'enhancedStore', operation: 'loaded${insights.length}Insights' });
              try { logger.info('🧪 Insights hydration sample (first 3)', { component: 'enhancedStore', operation: 'insightsHydrationSample', metadata: { sample: insights.slice(0,3) } }); } catch {}
              try { localStorage.setItem('serenity_ai_insights', JSON.stringify(insights)); } catch {}
            }

            // Map and restore recaps
            if (recapsRes?.success && Array.isArray(recapsRes.data)) {
              const recaps = recapsRes.data.map((row: any) => ({
                id: row.id,
                type: row.type,
                title: row.title,
                summary: row.summary,
                highlights: (() => { try { return JSON.parse(row.highlights || '[]'); } catch { return []; } })(),
                challenges: (() => { try { return JSON.parse(row.challenges || '[]'); } catch { return []; } })(),
                recommendations: (() => { try { return JSON.parse(row.recommendations || '[]'); } catch { return []; } })(),
                period: (() => { try { return JSON.parse(row.period || '{}'); } catch { return {}; } })(),
                createdAt: row.created_at,
                source: row.provider,
                metadata: (() => { try { return JSON.parse(row.metadata || '{}'); } catch { return {}; } })(),
              }));
              store.dispatch({ type: 'aiAssistant/restoreRecaps', payload: recaps });
              logger.info(`✅ Loaded ${recaps.length} AI recaps from SQLite`, { component: 'enhancedStore', operation: 'loaded${recaps.length}Recaps' });
              try { logger.info('🧪 Recaps hydration sample (first 2)', { component: 'enhancedStore', operation: 'recapsHydrationSample', metadata: { sample: recaps.slice(0,2).map((r:any)=>({title:r.title,type:r.type,period:r.period})) } }); } catch {}
              try { localStorage.setItem('serenity_ai_recaps', JSON.stringify(recaps)); } catch {}
            }

            // Map and restore usage
            if (usageRes?.success && Array.isArray(usageRes.data)) {
              logger.info(`📊 Hydrating ${usageRes.data.length} AI usage rows from SQLite`, { component: 'enhancedStore', operation: 'hydrating${usageres.data.length}Usage' });
              // Clear and repopulate usage entries
              store.dispatch({ type: 'aiAssistant/clearUsage' });
              usageRes.data.forEach((u: any) => {
                store.dispatch({
                  type: 'aiAssistant/recordUsage',
                  payload: {
                    id: u.id,
                    timestamp: u.timestamp,
                    provider: u.provider,
                    operation: u.operation,
                    promptTokens: Number(u.prompt_tokens || 0),
                    completionTokens: Number(u.completion_tokens || 0),
                    totalTokens: Number(u.total_tokens || 0),
                  },
                });
              });
              try {
                const hydratedUsage = (store.getState() as any).aiAssistant.usage;
                logger.info('🧪 Usage hydration sample (first 3)', { component: 'enhancedStore', operation: 'usageHydrationSample', metadata: { sample: hydratedUsage.slice(0, 3) } });
              } catch {}
              logger.info(`✅ Loaded ${usageRes.data.length} AI usage rows from SQLite`, { component: 'enhancedStore', operation: 'loaded${usageres.data.length}Usage' });
              try { localStorage.setItem('serenity_ai_usage', JSON.stringify((store.getState() as any).aiAssistant.usage)); } catch {}
            }
          } catch (e) {
            logger.warn('⚠️ Failed to load AI insights/recaps/usage from SQLite', { component: 'enhancedStore', operation: 'failedLoadInsightsRecapsUsage' });
          }

          logger.info('✅ SQLite data initialization completed successfully', { component: 'enhancedStore', operation: 'sqliteDataInitialization' });
          return true;
        } else {
          logger.info('📭 No SQLite data found', { component: 'enhancedStore', operation: 'sqliteDataFound' });
        }
      } else {
          logger.info('⚠️ SQLite migration failed, falling back to localStorage', { component: 'enhancedStore', operation: 'operation' });
        }
      } else {
        logger.info('⚠️ SQLite initialization failed, using localStorage', { component: 'enhancedStore', operation: 'operation' });
      }
    } else {
      logger.info('💾 No SQLite support detected, using localStorage', { component: 'enhancedStore', operation: 'operation' });
    }
    
    // Fallback: Load from localStorage if SQLite is not available
    const { hasLocalStorageData, getLocalStorageData } = await import('../utils/migration');
    
    if (hasLocalStorageData()) {
      logger.info('📦 Loading data from localStorage as fallback...', { component: 'enhancedStore', operation: 'loadingDataFrom' });
      const localData = getLocalStorageData();
      
      if (localData.tasks.length > 0) {
        store.dispatch({ type: 'tasks/setTasks', payload: localData.tasks });
        logger.info(`✅ Loaded ${localData.tasks.length} tasks from localStorage`, { component: 'enhancedStore', operation: 'loaded${localdata.tasks.length}Tasks' });
        
        // Extract and set used tags from tasks
        const taskTags = localData.tasks
          .flatMap((task: any) => task.tags || [])
          .filter((tag: string) => tag && tag.trim());
        if (taskTags.length > 0) {
          store.dispatch({ type: 'tags/addUsedTags', payload: taskTags });
          logger.info(`✅ Loaded ${taskTags.length} tags from tasks`, { component: 'enhancedStore', operation: 'loaded${tasktags.length}Tags' });
        }
      }

      // Goals (optional fallback key)
      try {
        const goalsStr = localStorage.getItem('serenity_goals');
        if (goalsStr) {
          const goals = JSON.parse(goalsStr);
          store.dispatch({ type: 'goals/setGoals', payload: goals });
          logger.info(`✅ Loaded ${goals.length} goals from localStorage`, { component: 'enhancedStore', operation: 'loaded${goals.length}Goals' });
        }
      } catch (e) {
        logger.warn('⚠️ Failed to load goals from localStorage', { component: 'enhancedStore', operation: 'failedLoadGoals' });
      }
      
      if (localData.projects.length > 0) {
        store.dispatch({ type: 'projects/setProjects', payload: localData.projects });
        logger.info(`✅ Loaded ${localData.projects.length} projects from localStorage`, { component: 'enhancedStore', operation: 'loaded${localdata.projects.length}Projects' });
      }
      
      if (localData.journalEntries.length > 0) {
        store.dispatch({ type: 'journal/setEntries', payload: localData.journalEntries });
        logger.info(`✅ Loaded ${localData.journalEntries.length} journal entries from localStorage`, { component: 'enhancedStore', operation: 'loaded${localdata.journalentries.length}Journal' });
        
        // Extract and set used tags from journal entries
        const journalTags = localData.journalEntries
          .flatMap((entry: any) => entry.tags || [])
          .filter((tag: string) => tag && tag.trim());
        if (journalTags.length > 0) {
          store.dispatch({ type: 'tags/addUsedTags', payload: journalTags });
          logger.info(`✅ Loaded ${journalTags.length} tags from journal entries`, { component: 'enhancedStore', operation: 'loaded${journaltags.length}Tags' });
        }
      }
      
      logger.info('✅ LocalStorage data initialization completed', { component: 'enhancedStore', operation: 'localstorageDataInitialization' });
      return true;
    }
    
    // Always try to load integrations state from localStorage (regardless of SQLite)
    loadIntegrationsState();
    
    logger.info('📭 No existing data found - starting with empty store', { component: 'enhancedStore', operation: 'existingDataFound' });
    return true;

  } catch (error) {
    logger.error('❌ Failed to initialize store data:', { component: 'enhancedStore', operation: 'failedInitializeStore' }, error as Error);
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
      logger.error('SQLite availability check failed:', { component: 'enhancedStore', operation: 'sqliteAvailabilityCheck' }, error as Error);
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
      logger.error('Failed to get database stats:', { component: 'enhancedStore', operation: 'failedGetDatabase' }, error as Error);
      return null;
    }
  }
  return null;
}

/**
 * Load integrations state from localStorage
 */
function loadIntegrationsState() {
  try {
    logger.info('🔗 Loading integrations state from localStorage...', { component: 'enhancedStore', operation: 'loadingIntegrationsState' });
    const integrationsData = localStorage.getItem('serenity_integrations');
    
    if (integrationsData) {
      const parsedData = require('../utils/cryptoUtils').safeJsonParse(integrationsData);
      logger.info('✅ Found integrations data:', { component: 'enhancedStore', operation: 'foundIntegrationsData:' });
      
      // Dispatch action to restore integrations state
      store.dispatch({ type: 'integrations/restoreState', payload: parsedData });
      logger.info('✅ Integrations state restored successfully', { component: 'enhancedStore', operation: 'integrationsStateRestored' });
    } else {
      logger.info('📭 No integrations data found in localStorage', { component: 'enhancedStore', operation: 'integrationsDataFound' });
    }
  } catch (error) {
    logger.error('❌ Failed to load integrations state:', { component: 'enhancedStore', operation: 'failedLoadIntegrations' }, error as Error);
  }
}
