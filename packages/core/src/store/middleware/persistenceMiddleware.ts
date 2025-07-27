/**
 * Redux middleware for automatically persisting tasks, journal entries, and projects
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

/**
 * Middleware that persists state changes to localStorage
 */
export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  // Let the action go through first
  const result = next(action);
  
  // Get the current state after the action
  const state = store.getState() as any;
  
  // Check if we need to persist based on the action type
  if (TASKS_ACTIONS.includes(action.type)) {
    console.log('📄 Persisting tasks to localStorage');
    console.log('📊 Action:', action.type, action.payload);
    console.log('📊 State tasks count:', state.tasks?.tasks?.length || 0);
    console.log('📊 Tasks array:', state.tasks?.tasks);
    
    // Import dynamically to avoid circular dependencies
    import('../../utils/persistence').then(({ saveTasks }) => {
      const tasksToSave = state.tasks.tasks;
      console.log('📊 About to save tasks:', tasksToSave?.length || 0);
      saveTasks(tasksToSave);
    });
  }
  
  if (JOURNAL_ACTIONS.includes(action.type)) {
    console.log('📖 Persisting journal entries to localStorage');
    import('../../utils/persistence').then(({ saveJournalEntries }) => {
      saveJournalEntries(state.journal.entries);
    });
  }
  
  if (PROJECTS_ACTIONS.includes(action.type)) {
    console.log('📁 Persisting projects to localStorage');
    import('../../utils/persistence').then(({ saveProjects }) => {
      saveProjects(state.projects.projects);
    });
  }
  
  return result;
};