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
export const hybridPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  // Let the action go through first
  const result = next(action);
  
  // Get the current state after the action
  const state = store.getState() as any;
  
  // Handle persistence based on action type
  if (TASKS_ACTIONS.includes(action.type)) {
    console.log('🔍 Task action detected:', action.type);
    console.log('🔍 SQLite available:', sqliteAvailable);
    console.log('🔍 SQLite API:', !!sqliteAPI);
    
    if (sqliteAvailable && sqliteAPI) {
      console.log('📄 Persisting task to SQLite');
      handleTaskPersistence(action, state.tasks, sqliteAPI);
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
      console.log('📁 Persisting project to SQLite');
      handleProjectPersistence(action, state.projects, sqliteAPI);
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
  
  return result;
};

/**
 * Handle task persistence to SQLite
 */
async function handleTaskPersistence(action: any, tasksState: any, sqliteAPI: any) {
  try {
    switch (action.type) {
      case 'tasks/addTask':
        // Find the newly created task in the state (it was added by the reducer)
        const newTask = tasksState.tasks[tasksState.tasks.length - 1];
        if (newTask) {
          console.log('📝 Creating task in SQLite:', newTask.title, 'with ID:', newTask.id);
          console.log('🏷️ Task tags to store:', newTask.tags);
          console.log('🔍 Task tags type:', typeof newTask.tags, 'Array?', Array.isArray(newTask.tags));
          console.log('🔍 Full task object:', JSON.stringify(newTask, null, 2));
          
          // Use the special createTaskWithId method to preserve the Redux-generated ID
          await sqliteAPI.createTaskWithId({
            id: newTask.id,
            title: newTask.title,
            description: newTask.description,
            completed: newTask.completed,
            priority: newTask.priority,
            projectId: newTask.projectId,
            dueDate: newTask.dueDate,
            tags: newTask.tags || [],
            createdAt: newTask.createdAt,
            updatedAt: newTask.updatedAt
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
        // Find the newly created entry in the state (it was added by the reducer)
        const newEntry = journalState.entries[journalState.entries.length - 1];
        if (newEntry) {
          console.log('📖 Creating journal entry in SQLite:', newEntry.title || 'Untitled');
          await sqliteAPI.createJournalEntry({
            title: newEntry.title,
            content: newEntry.content,
            mood: newEntry.mood,
            date: newEntry.date,
            pinned: newEntry.pinned || false,
            tags: newEntry.tags || []
          });
        }
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
        // Find the newly created project in the state (it was added by the reducer)
        const newProject = projectsState.projects[projectsState.projects.length - 1];
        if (newProject) {
          console.log('📁 Creating project in SQLite:', newProject.name);
          await sqliteAPI.createProject({
            name: newProject.name,
            description: newProject.description,
            color: newProject.color,
            archived: newProject.archived || false
          });
        }
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