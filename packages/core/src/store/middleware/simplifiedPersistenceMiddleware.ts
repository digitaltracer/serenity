/**
 * Simplified persistence middleware that commits to SQLite early
 * Eliminates the complexity of dual localStorage/SQLite paths
 */

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';
import type { RootState } from '../enhancedStore';
import type { Task, Project, JournalEntry, Goal } from '../../types';

type ElectronAPIType = typeof window.electronAPI;

// Actions that should trigger persistence
const PERSISTENT_ACTIONS = [
  // Tasks
  'tasks/addTask',
  'tasks/updateTask',
  'tasks/deleteTask',
  'tasks/toggleTask',
  'tasks/addSubtask',
  'tasks/removeSubtask',
  'tasks/toggleSubtask',
  // Journal
  'journal/addEntry',
  'journal/updateEntry',
  'journal/deleteEntry',
  'journal/togglePin',
  // Goals
  'goals/addGoal',
  'goals/updateGoal',
  'goals/deleteGoal',
  // Projects
  'projects/addProject',
  'projects/updateProject',
  'projects/deleteProject',
  // User preferences (localStorage only - for quick access)
  'user/setTheme',
  'user/setCompactMode',
  'user/updatePreferences',
  // Integrations (localStorage only - for startup)
  'integrations/connectGoogleCalendar',
  'integrations/disconnectGoogleCalendar',
  'integrations/updateGoogleCalendarTokens',
  'integrations/setGoogleCalendarSyncEnabled',
  'integrations/updateGoogleCalendarLastSync',
  'integrations/saveGoogleCalendarCredentials',
  'integrations/connectGitHub',
  'integrations/disconnectGitHub',
  'integrations/setGitHubSyncEnabled',
  'integrations/updateGitHubRepositories',
  'integrations/updateGitHubLastSync',
  // AI Assistant (secure storage for API keys, localStorage for settings)
  'aiAssistant/setApiKey/fulfilled',
  'aiAssistant/setActiveProvider',
  'aiAssistant/clearActiveProvider',
  'aiAssistant/setAutoAnalyze',
  'aiAssistant/setAnalysisFrequency',
  'aiAssistant/setDataTypes',
  // Exclude insight/recap/usage actions from triggering settings saves to avoid loops
];

// Simple state to track if SQLite is initialized
let sqliteInitialized = false;
let isInitializing = false;

// Throttle/persist guards for AI usage to avoid noisy logs and excessive writes
let lastAIUsageSignature: string | null = null;
let lastAIUsagePersistMs = 0;

// Debounce AI settings save calls from renderer to main
let aiSettingsTimer: ReturnType<typeof setTimeout> | null = null;
let lastAISentSignature: string | null = null;

/**
 * Initialize SQLite persistence - called once at app startup
 */
export async function initializeSQLitePersistence(): Promise<boolean> {
  if (sqliteInitialized || isInitializing) {
    return sqliteInitialized;
  }

  isInitializing = true;
  
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
      logger.info('Initializing SQLite persistence', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' });
      const initResult = await window.electronAPI.sqlite.initialize();

      if (initResult.success) {
        sqliteInitialized = true;
        logger.info('SQLite persistence initialized successfully', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' });

        // Migrate any existing localStorage data to SQLite
        await migrateLocalStorageToSQLite();

        return true;
      } else {
        logger.error('SQLite initialization failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence', metadata: { error: initResult.error } });
        sqliteInitialized = false;
        return false;
      }
    }
  } catch (error) {
    logger.error('SQLite initialization error', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' }, error as Error);
    sqliteInitialized = false;
  } finally {
    isInitializing = false;
  }

  logger.info('SQLite not available, falling back to localStorage', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' });
  return false;
}

/**
 * Migrate existing localStorage data to SQLite (one-time operation)
 */
async function migrateLocalStorageToSQLite(): Promise<void> {
  if (!window.electronAPI?.sqlite) return;

  try {
    logger.debug('Checking for localStorage data to migrate', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });

    // Check for existing data
    const tasks = localStorage.getItem('serenity_tasks');
    const projects = localStorage.getItem('serenity_projects');
    const journal = localStorage.getItem('serenity_journal');

    if (tasks || projects || journal) {
      logger.info('Found localStorage data, migrating to SQLite', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });

      const migrationData = {
        tasks: tasks ? JSON.parse(tasks) : [],
        projects: projects ? JSON.parse(projects) : [],
        journal: journal ? JSON.parse(journal) : []
      };

      const result = await window.electronAPI.sqlite.importFromLocalStorage(migrationData);

      if (result.success) {
        logger.info('Data migration completed successfully', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });
        // Clear migrated data from localStorage
        localStorage.removeItem('serenity_tasks');
        localStorage.removeItem('serenity_projects');
        localStorage.removeItem('serenity_journal');
        localStorage.setItem('serenity_data_migrated', 'true');
      } else {
        logger.error('Data migration failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite', metadata: { error: result.error } });
      }
    } else {
      logger.debug('No localStorage data found to migrate', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });
    }
  } catch (error) {
    logger.error('Migration error', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' }, error as Error);
  }
}

/**
 * Simplified persistence middleware - SQLite first, localStorage fallback only for specific data
 */
export const simplifiedPersistenceMiddleware: Middleware = (store) => (next) => async (action) => {
  // Let the action go through first
  const result = next(action);
  
  // Only persist if action type is in our list
  if (!PERSISTENT_ACTIONS.includes(action.type) && !action.type.startsWith('aiAssistant/')) {
    return result;
  }
  
  const state = store.getState() as any;
  
  try {
    // Always persist user preferences and integrations to localStorage for quick startup access
    if (action.type.startsWith('user/')) {
      localStorage.setItem('serenity_user_preferences', JSON.stringify(state.user));
      return result;
    }
    
    if (action.type.startsWith('integrations/')) {
      localStorage.setItem('serenity_integrations', JSON.stringify(state.integrations));
      return result;
    }

    // Persist AI Assistant base settings and active provider to both file (handled in main) and SQLite secure_settings for redundancy
    if (PERSISTENT_ACTIONS.includes(action.type)) {
      try {
        const aiSettings = {
          activeProvider: state.aiAssistant.activeProvider,
          autoAnalyze: state.aiAssistant.autoAnalyze,
          analysisFrequency: state.aiAssistant.analysisFrequency,
          dataTypes: state.aiAssistant.dataTypes,
        };
        if (window.electronAPI?.aiAssistant?.saveSettings) {
          const signature = JSON.stringify(aiSettings);
          if (signature !== lastAISentSignature) {
            lastAISentSignature = signature;
            if (aiSettingsTimer) clearTimeout(aiSettingsTimer);
            // Save activeProvider changes immediately, debounce other settings
            const isActiveProviderChange = action.type === 'aiAssistant/setActiveProvider' || action.type === 'aiAssistant/clearActiveProvider';
            if (isActiveProviderChange) {
              try { window.electronAPI!.aiAssistant!.saveSettings(aiSettings); } catch {}
            } else {
              aiSettingsTimer = setTimeout(() => {
                try { window.electronAPI!.aiAssistant!.saveSettings(aiSettings); } catch {}
              }, 300);
            }
          }
        }
        // Persist usage to localStorage for quick access across sessions
        if (state.aiAssistant?.usage) {
          try {
            const signature = JSON.stringify(state.aiAssistant.usage);
            const now = Date.now();
            // Only persist if changed and at least 3s since last write
            if (signature !== lastAIUsageSignature || now - lastAIUsagePersistMs > 3000) {
              localStorage.setItem('serenity_ai_usage', signature);
              lastAIUsageSignature = signature;
              lastAIUsagePersistMs = now;
            }
          } catch {}
        }
      } catch (e) {
        logger.error('Failed to trigger AI settings save', { component: 'SimplifiedPersistenceMiddleware', operation: 'middleware' }, e as Error);
      }
    }

    // Persist AI insights/recaps and usage to localStorage when updated
    if (action.type === 'aiAssistant/analyzeUserData/fulfilled' || action.type === 'aiAssistant/clearInsights' || action.type === 'aiAssistant/removeInsight') {
      try {
        localStorage.setItem('serenity_ai_insights', JSON.stringify(state.aiAssistant.insights));
        localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));
      } catch {}

      // Also persist to DB via IPC when available (supports local-analysis fallback)
      try {
        if (action.type === 'aiAssistant/analyzeUserData/fulfilled') {
          const provider = action.payload?.provider || state.aiAssistant.activeProvider || 'local';
          const insights = action.payload?.insights || [];
          logger.debug('Analyze fulfilled, persisting insights', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights', metadata: { provider, insightCount: insights.length } });
          if (Array.isArray(insights) && insights.length > 0) {
            // Save insights - TODO: add saveInsights to IPC
            logger.debug('Would save insights via IPC (not yet implemented)', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' });
          }
          const usage = action.payload?.usage;
          if (usage) {
            logger.debug('Saving AI usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights', metadata: { usage } });
            // Save usage - TODO: add saveUsage to IPC
            logger.debug('Would save usage via IPC (not yet implemented)', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' });
          }
        }
      } catch (e) {
        logger.error('Failed to persist AI insights/usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' }, e as Error);
      }
    }

    // Handle direct recordUsage actions - persist individual usage entries to database
    if (action.type === 'aiAssistant/recordUsage') {
      try {
        localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));

        // Persist to database via IPC - TODO: implement saveUsage IPC method
        const usageEntry = action.payload;
        logger.debug('Would save recordUsage via IPC (not yet implemented)', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage', metadata: { usageEntry } });
      } catch (e) {
        logger.error('Failed to persist recordUsage to database via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage' }, e as Error);
      }
    }
    if (action.type === 'aiAssistant/generateRecap/fulfilled' || action.type === 'aiAssistant/removeRecap') {
      try { 
        localStorage.setItem('serenity_ai_recaps', JSON.stringify(state.aiAssistant.recaps)); 
        localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));
      } catch {}
    }

    // For data operations, use SQLite if available, otherwise localStorage as temporary fallback
    if (sqliteInitialized && window.electronAPI?.sqlite) {
      await persistToSQLite(action, state);
    } else {
      // Temporary fallback to localStorage (should be rare after initialization)
      logger.warn('SQLite not available, using localStorage fallback', { component: 'SimplifiedPersistenceMiddleware', operation: 'middleware', metadata: { actionType: action.type } });
      persistToLocalStorage(action, state);
    }
  } catch (error) {
    logger.error('Persistence error for action', { component: 'SimplifiedPersistenceMiddleware', operation: 'middleware', metadata: { actionType: action.type } }, error as Error);
    // Fallback to localStorage if SQLite fails
    persistToLocalStorage(action, state);
  }
  
  return result;
};

/**
 * Persist to SQLite using the new business logic API
 */
async function persistToSQLite(action: AnyAction, state: RootState): Promise<void> {
  const { type, payload } = action;

  try {
    if (type.startsWith('tasks/')) {
      await handleTaskPersistence(type, payload, state.tasks);
    } else if (type.startsWith('projects/')) {
      await handleProjectPersistence(type, payload, state.projects);
    } else if (type.startsWith('journal/')) {
      await handleJournalPersistence(type, payload, state.journal);
    } else if (type.startsWith('goals/')) {
      await handleGoalPersistence(type, payload, state.goals);
    }
  } catch (error) {
    logger.error('SQLite persistence failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistToSQLite', metadata: { actionType: type } }, error as Error);
    throw error; // Re-throw to trigger localStorage fallback
  }
}

/**
 * Handle task persistence using the new business logic API
 */
async function handleTaskPersistence(
  actionType: string,
  payload: unknown,
  tasksState: RootState['tasks']
): Promise<void> {
  switch (actionType) {
    case 'tasks/addTask':
      logger.debug('Creating task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { title: (payload as Task).title } });
      await window.electronAPI?.sqlite?.createTask(payload as Task);
      break;

    case 'tasks/updateTask':
      logger.debug('Updating task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { taskId: (payload as Task).id } });
      const { id, ...updates } = payload as Task;
      await window.electronAPI?.sqlite?.updateTask(id, updates);
      break;

    case 'tasks/toggleTask':
      logger.debug('Toggling task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { taskId: payload as string } });
      // For toggleTask, payload is just the task ID (string)
      // We need to get the updated task from state
      const toggledTask = tasksState.tasks.find((t: Task) => t.id === payload);
      if (toggledTask) {
        await window.electronAPI?.sqlite?.updateTask(payload as string, {
          completed: toggledTask.completed,
          completedAt: toggledTask.completedAt,
          updatedAt: toggledTask.updatedAt
        });
      }
      break;

    case 'tasks/deleteTask':
      logger.debug('Deleting task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { taskId: payload as string } });
      await window.electronAPI?.sqlite?.deleteTask(payload as string);
      break;

    case 'tasks/addSubtask':
    case 'tasks/removeSubtask':
    case 'tasks/toggleSubtask':
      // These are handled as task updates
      const payloadWithTaskId = payload as { taskId: string };
      const task = tasksState.tasks.find((t: Task) => t.id === payloadWithTaskId.taskId);
      if (task) {
        await window.electronAPI?.sqlite?.updateTask(task.id, { subtasks: task.subtasks });
      }
      break;
  }
}

/**
 * Handle project persistence using the new business logic API
 */
async function handleProjectPersistence(
  actionType: string,
  payload: unknown,
  projectsState: RootState['projects']
): Promise<void> {
  switch (actionType) {
    case 'projects/addProject':
      logger.debug('Creating project via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleProjectPersistence', metadata: { name: (payload as Project).name } });
      await window.electronAPI?.sqlite?.createProject(payload as Project);
      break;

    case 'projects/updateProject': {
      const projectPayload = payload as Project;
      logger.debug('Updating project via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleProjectPersistence', metadata: { projectId: projectPayload.id } });
      const { id, ...updates } = projectPayload;
      await window.electronAPI?.sqlite?.updateProject(id, updates);
      break;
    }

    case 'projects/deleteProject':
      logger.debug('Deleting project via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleProjectPersistence', metadata: { projectId: payload as string } });
      await window.electronAPI?.sqlite?.deleteProject(payload as string);
      break;
  }
}

/**
 * Handle journal persistence using the new business logic API
 */
async function handleJournalPersistence(
  actionType: string,
  payload: unknown,
  journalState: RootState['journal']
): Promise<void> {
  switch (actionType) {
    case 'journal/addEntry':
      logger.debug('Creating journal entry via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleJournalPersistence', metadata: { title: (payload as JournalEntry).title } });
      await window.electronAPI?.sqlite?.createJournalEntry(payload as JournalEntry);
      break;

    case 'journal/updateEntry':
    case 'journal/togglePin': {
      const journalPayload = payload as JournalEntry;
      logger.debug('Updating journal entry via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleJournalPersistence', metadata: { entryId: journalPayload.id } });
      const { id, ...updates } = journalPayload;
      await window.electronAPI?.sqlite?.updateJournalEntry(id, updates);
      break;
    }

    case 'journal/deleteEntry':
      logger.debug('Deleting journal entry via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleJournalPersistence', metadata: { entryId: payload as string } });
      await window.electronAPI?.sqlite?.deleteJournalEntry(payload as string);
      break;
  }
}

/**
 * Handle goal persistence via IPC
 * TODO: Implement goals IPC interface in electron.d.ts
 */
async function handleGoalPersistence(
  actionType: string,
  payload: unknown,
  goalsState: RootState['goals']
): Promise<void> {
  // TODO: Add goals interface to window.electronAPI
  logger.debug('Goal persistence via IPC not yet implemented', {
    component: 'SimplifiedPersistenceMiddleware',
    operation: 'handleGoalPersistence',
    metadata: { actionType }
  });

  // Store in localStorage as fallback
  try {
    localStorage.setItem('serenity_goals', JSON.stringify(goalsState.goals));
  } catch (e) {
    logger.error('Failed to persist goals to localStorage', {
      component: 'SimplifiedPersistenceMiddleware',
      operation: 'handleGoalPersistence'
    }, e as Error);
  }
}

/**
 * Fallback persistence to localStorage (temporary, should be rare)
 */
function persistToLocalStorage(action: AnyAction, state: RootState): void {
  const { type } = action;
  
  try {
    if (type.startsWith('tasks/')) {
      localStorage.setItem('serenity_tasks', JSON.stringify(state.tasks.tasks));
    } else if (type.startsWith('projects/')) {
      localStorage.setItem('serenity_projects', JSON.stringify(state.projects.projects));
    } else if (type.startsWith('journal/')) {
      localStorage.setItem('serenity_journal', JSON.stringify(state.journal.entries));
    } else if (type.startsWith('goals/')) {
      localStorage.setItem('serenity_goals', JSON.stringify(state.goals.goals));
    }

    logger.debug('Fallback: Data persisted to localStorage', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistToLocalStorage', metadata: { actionType: type } });
  } catch (error) {
    logger.error('localStorage fallback failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistToLocalStorage', metadata: { actionType: type } }, error as Error);
  }
}

/**
 * Check if SQLite is initialized
 */
export function isSQLiteInitialized(): boolean {
  return sqliteInitialized;
}

/**
 * Force SQLite reinitialization (for testing/recovery)
 */
export async function reinitializeSQLite(): Promise<boolean> {
  sqliteInitialized = false;
  return await initializeSQLitePersistence();
}
