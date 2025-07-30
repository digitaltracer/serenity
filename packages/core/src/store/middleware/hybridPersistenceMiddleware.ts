/**
 * Hybrid persistence middleware that starts with localStorage and upgrades to SQLite
 */

import { Middleware } from '@reduxjs/toolkit';

// Actions that should trigger persistence
const TASKS_ACTIONS = [
  'tasks/addTask',
  'tasks/updateTask',
  'tasks/deleteTask',
  'tasks/toggleTask',
  'tasks/addSubtask',
  'tasks/removeSubtask',
  'tasks/toggleSubtask',
];

const JOURNAL_ACTIONS = [
  'journal/addEntry',
  'journal/updateEntry',
  'journal/deleteEntry',
  'journal/togglePin',
];

const PROJECTS_ACTIONS = [
  'projects/addProject',
  'projects/updateProject',
  'projects/deleteProject',
];

const USER_ACTIONS = [
  'user/setTheme',
  'user/setCompactMode',
  'user/updatePreferences',
];

const INTEGRATIONS_ACTIONS = [
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
];

// Global flag to track if SQLite is available and initialized
let sqliteAvailable = false;
let sqliteAPI: any = null;

/**
 * Initialize SQLite for persistence if available
 */
export async function initializeSQLitePersistence(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
    try {
      console.log('🔄 Initializing SQLite persistence...');
      const initResult = await window.electronAPI.sqlite.initialize();
      
      if (initResult.success) {
        sqliteAPI = window.electronAPI.sqlite;
        sqliteAvailable = true;
        console.log('✅ SQLite persistence initialized successfully');
        console.log('🔧 SQLite API set:', !!sqliteAPI);
        console.log('🔧 SQLite available:', sqliteAvailable);
        return true;
      } else {
        console.error('❌ SQLite initialization failed:', initResult.error);
        sqliteAvailable = false;
        sqliteAPI = null;
        return false;
      }
    } catch (error) {
      console.error('❌ SQLite initialization error:', error);
      sqliteAvailable = false;
      sqliteAPI = null;
      return false;
    }
  }
  
  console.log('💾 SQLite not available, using localStorage persistence');
  sqliteAvailable = false;
  sqliteAPI = null;
  return false;
}

/**
 * Hybrid middleware that uses localStorage by default and SQLite when available
 */
export const hybridPersistenceMiddleware: Middleware = (store) => (next) => async (action) => {
  // Let the action go through first
  const result = next(action);
  
  // Get the current state after the action
  const state = store.getState() as any;
  
  // Handle persistence based on action type - AWAIT for critical actions to ensure data integrity
  if (TASKS_ACTIONS.includes(action.type)) {
    console.log('🔍 Task action detected:', action.type);
    console.log('🔍 SQLite available:', sqliteAvailable);
    console.log('🔍 SQLite API:', !!sqliteAPI);
    
    if (sqliteAvailable && sqliteAPI) {
      console.log('📄 Persisting task to SQLite (synchronously to prevent data loss)');
      try {
        await handleTaskPersistence(action, state.tasks, sqliteAPI);
        console.log('✅ Task persistence completed successfully');
      } catch (error) {
        console.error('❌ Task persistence failed:', error);
      }
    } else {
      console.log('📄 Persisting tasks to localStorage (SQLite not available)');
      import('../../utils/persistence').then(({ saveTasks }) => {
        saveTasks(state.tasks.tasks);
      });
    }
  }
  
  if (JOURNAL_ACTIONS.includes(action.type)) {
    if (sqliteAvailable && sqliteAPI) {
      console.log('📖 Persisting journal entry to SQLite');
      handleJournalPersistence(action, state.journal, sqliteAPI);
    } else {
      console.log('📖 Persisting journal entries to localStorage');
      import('../../utils/persistence').then(({ saveJournalEntries }) => {
        saveJournalEntries(state.journal.entries);
      });
    }
  }
  
  if (PROJECTS_ACTIONS.includes(action.type)) {
    if (sqliteAvailable && sqliteAPI) {
      console.log('📁 Persisting project to SQLite (synchronously)');
      try {
        await handleProjectPersistence(action, state.projects, sqliteAPI);
        console.log('✅ Project persistence completed');
      } catch (error) {
        console.error('❌ Project persistence failed:', error);
      }
    } else {
      console.log('📁 Persisting projects to localStorage');
      import('../../utils/persistence').then(({ saveProjects }) => {
        saveProjects(state.projects.projects);
      });
    }
  }
  
  if (USER_ACTIONS.includes(action.type)) {
    console.log('👤 Persisting user preferences to localStorage');
    // User preferences always go to localStorage for quick access
    localStorage.setItem('serenity_user_preferences', JSON.stringify(state.user));
  }

  if (INTEGRATIONS_ACTIONS.includes(action.type)) {
    console.log('🔗 Integration state change detected:', action.type);
    // Store integrations state to localStorage for persistence
    // Sensitive tokens are handled by encrypted storage service separately
    try {
      localStorage.setItem('serenity_integrations', JSON.stringify(state.integrations));
      console.log('✅ Integrations state persisted to localStorage');
    } catch (error) {
      console.error('❌ Failed to persist integrations state:', error);
    }
  }
  
  return result;
};

/**
 * Handle task persistence to SQLite
 */
async function handleTaskPersistence(action: any, tasksState: any, sqliteAPI: any) {
  try {
    switch (action.type) {
      case 'tasks/addTask':
        // The action payload now contains the complete task with generated ID, createdAt, updatedAt
        const newTask = action.payload;
        
        console.log('📝 Creating task in SQLite:', newTask.title, 'with ID:', newTask.id);
        console.log('🔗 Task projectId:', newTask.projectId);
        
        // Validate projectId exists in SQLite before creating task
        let validProjectId = newTask.projectId || null;
        if (validProjectId) {
          let retries = 3;
          let projectFound = false;
          
          while (retries > 0 && !projectFound) {
            try {
              console.log(`🔍 Checking if project ${validProjectId} exists in SQLite (attempt ${4 - retries}/3)...`);
              const projectResult = await sqliteAPI.getProject(validProjectId);
              
              // Check both the result structure and data existence
              if (!projectResult || !projectResult.success || !projectResult.data) {
                console.log(`⚠️ Project ${validProjectId} not found in SQLite (result: ${JSON.stringify(projectResult)})`);
                retries--;
                if (retries > 0) {
                  console.log(`🔄 Retrying in 100ms... (${retries} attempts left)`);
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              } else {
                console.log(`✅ Project ${validProjectId} exists in SQLite:`, projectResult.data.name);
                projectFound = true;
              }
            } catch (error) {
              console.warn(`❌ Error checking project ${validProjectId}:`, error);
              retries--;
              if (retries > 0) {
                console.log(`🔄 Retrying in 100ms... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
          }
          
          if (!projectFound) {
            console.warn(`⚠️ Project ${validProjectId} still not found after retries, setting task projectId to null`);
            validProjectId = null;
          }
        } else {
          console.log('📝 Task has no projectId, proceeding with null');
        }
        
        // Persist the complete task object to SQLite
        try {
          console.log('💾 Attempting to save task to SQLite...');
          const savedTask = await sqliteAPI.createTaskWithId({
            id: newTask.id,
            title: newTask.title,
            description: newTask.description || '',
            completed: newTask.completed || false,
            priority: newTask.priority || 'medium',
            projectId: validProjectId,
            dueDate: newTask.dueDate || null,
            tags: Array.isArray(newTask.tags) ? newTask.tags : [],
            createdAt: newTask.createdAt,
            updatedAt: newTask.updatedAt,
            recurring: newTask.recurring || null,
            subtasks: newTask.subtasks || []
          });
          
          if (savedTask && savedTask.success) {
            console.log('✅ Task persisted to SQLite successfully');
          } else if (savedTask) {
            console.error('❌ Task persistence failed:', savedTask.error);
          } else {
            console.log('✅ Task saved to SQLite (no response wrapper)');
          }
        } catch (error) {
          console.error('❌ SQLite task creation error:', error);
          console.error('❌ Error details:', {
            message: (error as any)?.message || 'Unknown error',
            code: (error as any)?.code || 'NO_CODE',
            taskId: newTask.id,
            projectId: validProjectId
          });
        }
        break;
      case 'tasks/updateTask':
        const { id, ...updates } = action.payload;
        console.log('📝 Updating task in SQLite:', id);
        await sqliteAPI.updateTask(id, updates);
        break;
      case 'tasks/deleteTask':
        console.log('🗑️ Deleting task from SQLite:', action.payload);
        await sqliteAPI.deleteTask(action.payload);
        break;
      case 'tasks/toggleTask':
        const task = tasksState.tasks.find((t: any) => t.id === action.payload);
        if (task) {
          console.log('✅ Toggling task completion in SQLite:', task.id);
          await sqliteAPI.updateTask(task.id, { completed: task.completed });
        }
        break;
      default:
        console.log('🔄 Task action handled with fallback');
        break;
    }
  } catch (error) {
    console.error('Failed to persist task to SQLite:', error);
    // Fallback to localStorage
    import('../../utils/persistence').then(({ saveTasks }) => {
      saveTasks(tasksState.tasks);
    });
  }
}

/**
 * Handle journal persistence to SQLite
 */
async function handleJournalPersistence(action: any, journalState: any, sqliteAPI: any) {
  try {
    switch (action.type) {
      case 'journal/addEntry':
        // The action payload now contains the complete entry with generated ID, createdAt, updatedAt
        const newEntry = action.payload;
        
        console.log('📖 Creating journal entry in SQLite:', newEntry.title || 'Untitled');
        await sqliteAPI.createJournalEntryWithId({
          id: newEntry.id,
          title: newEntry.title || '',
          content: newEntry.content,
          mood: newEntry.mood || null,
          date: newEntry.date,
          pinned: newEntry.pinned || false,
          tags: Array.isArray(newEntry.tags) ? newEntry.tags : [],
          createdAt: newEntry.createdAt,
          updatedAt: newEntry.updatedAt
        });
        break;
      case 'journal/updateEntry':
        const { id, ...updates } = action.payload;
        console.log('📖 Updating journal entry in SQLite:', id);
        await sqliteAPI.updateJournalEntry(id, updates);
        break;
      case 'journal/deleteEntry':
        console.log('🗑️ Deleting journal entry from SQLite:', action.payload);
        await sqliteAPI.deleteJournalEntry(action.payload);
        break;
      case 'journal/togglePin':
        const entry = journalState.entries.find((e: any) => e.id === action.payload);
        if (entry) {
          console.log('📌 Toggling journal entry pin in SQLite:', entry.id);
          await sqliteAPI.updateJournalEntry(entry.id, { pinned: entry.pinned });
        }
        break;
      default:
        console.log('🔄 Journal action handled with fallback');
        break;
    }
  } catch (error) {
    console.error('Failed to persist journal entry to SQLite:', error);
    // Fallback to localStorage
    import('../../utils/persistence').then(({ saveJournalEntries }) => {
      saveJournalEntries(journalState.entries);
    });
  }
}

/**
 * Handle project persistence to SQLite
 */
async function handleProjectPersistence(action: any, projectsState: any, sqliteAPI: any) {
  try {
    switch (action.type) {
      case 'projects/addProject':
        // The action payload now contains the complete project with generated ID, createdAt, updatedAt
        const newProject = action.payload;
        
        console.log('📁 Creating project in SQLite:', newProject.name, 'with ID:', newProject.id);
        const result = await sqliteAPI.createProjectWithId({
          id: newProject.id,
          name: newProject.name,
          description: newProject.description || '',
          color: newProject.color,
          archived: newProject.archived || false,
          createdAt: newProject.createdAt,
          updatedAt: newProject.updatedAt
        });
        console.log('✅ Project successfully created in SQLite:', newProject.id);
        break;
      case 'projects/updateProject':
        const { id, ...updates } = action.payload;
        console.log('📁 Updating project in SQLite:', id);
        await sqliteAPI.updateProject(id, updates);
        break;
      case 'projects/deleteProject':
        console.log('🗑️ Deleting project from SQLite:', action.payload);
        await sqliteAPI.deleteProject(action.payload);
        break;
      default:
        console.log('🔄 Project action handled with fallback');
        break;
    }
  } catch (error) {
    console.error('Failed to persist project to SQLite:', error);
    // Fallback to localStorage
    import('../../utils/persistence').then(({ saveProjects }) => {
      saveProjects(projectsState.projects);
    });
  }
}