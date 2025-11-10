"use strict";
/**
 * Redux middleware for automatically persisting data to SQLite database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlitePersistenceMiddleware = void 0;
const logger_1 = require("../../utils/logger");
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
/**
 * Check if we're running in an Electron environment
 */
function isElectron() {
    return typeof window !== 'undefined' &&
        !!window.electronAPI &&
        !!window.electronAPI.sqlite &&
        typeof window.electronAPI.sqlite === 'object';
}
/**
 * Get the SQLite API if available
 */
function getSQLiteAPI() {
    if (!isElectron()) {
        logger_1.logger.warn('SQLite API not available - not in Electron environment', { component: 'sqlitePersistenceMiddleware', operation: 'sqliteApiNot' });
        return null;
    }
    return window.electronAPI.sqlite;
}
/**
 * Middleware that persists state changes to SQLite database
 */
const sqlitePersistenceMiddleware = (store) => (next) => (action) => {
    // Let the action go through first
    const result = next(action);
    // Get the current state after the action
    const state = store.getState();
    const sqliteAPI = getSQLiteAPI();
    if (!sqliteAPI) {
        // Fallback to localStorage if SQLite is not available
        logger_1.logger.info('🔄 Falling back to localStorage persistence', { component: 'sqlitePersistenceMiddleware', operation: 'fallingBackLocalstorage' });
        return result;
    }
    // Check if we need to persist based on the action type
    if (TASKS_ACTIONS.includes(action.type)) {
        logger_1.logger.info('📄 Persisting tasks to SQLite', { component: 'sqlitePersistenceMiddleware', operation: 'persistingTasksSqlite' });
        handleTaskPersistence(action, state.tasks, sqliteAPI);
    }
    if (JOURNAL_ACTIONS.includes(action.type)) {
        logger_1.logger.info('📖 Persisting journal entries to SQLite', { component: 'sqlitePersistenceMiddleware', operation: 'persistingJournalEntries' });
        handleJournalPersistence(action, state.journal, sqliteAPI);
    }
    if (PROJECTS_ACTIONS.includes(action.type)) {
        logger_1.logger.info('📁 Persisting projects to SQLite', { component: 'sqlitePersistenceMiddleware', operation: 'persistingProjectsSqlite' });
        handleProjectPersistence(action, state.projects, sqliteAPI);
    }
    if (USER_ACTIONS.includes(action.type)) {
        logger_1.logger.info('👤 Persisting user preferences to localStorage', { component: 'sqlitePersistenceMiddleware', operation: 'persistingUserPreferences' });
        // User preferences still go to localStorage for quick access
        localStorage.setItem('serenity_user_preferences', JSON.stringify(state.user));
    }
    return result;
};
exports.sqlitePersistenceMiddleware = sqlitePersistenceMiddleware;
/**
 * Handle task persistence to SQLite
 */
async function handleTaskPersistence(action, tasksState, sqliteAPI) {
    try {
        switch (action.type) {
            case 'tasks/addTask':
                await sqliteAPI.createTask(action.payload);
                break;
            case 'tasks/updateTask':
                const { id, updates } = action.payload;
                await sqliteAPI.updateTask(id, updates);
                break;
            case 'tasks/deleteTask':
                await sqliteAPI.deleteTask(action.payload);
                break;
            case 'tasks/toggleTask':
                const task = tasksState.tasks.find((t) => t.id === action.payload);
                if (task) {
                    await sqliteAPI.updateTask(task.id, { completed: task.completed });
                }
                break;
            default:
                // For other actions, sync all tasks
                logger_1.logger.info('🔄 Syncing all tasks to SQLite', { component: 'sqlitePersistenceMiddleware', operation: 'syncingAllTasks' });
                break;
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to persist task to SQLite:', { component: 'sqlitePersistenceMiddleware', operation: 'failedPersistTask' }, error);
    }
}
/**
 * Handle journal persistence to SQLite
 */
async function handleJournalPersistence(action, journalState, sqliteAPI) {
    try {
        switch (action.type) {
            case 'journal/addEntry':
                await sqliteAPI.createJournalEntry(action.payload);
                break;
            case 'journal/updateEntry':
                const { id, updates } = action.payload;
                await sqliteAPI.updateJournalEntry(id, updates);
                break;
            case 'journal/deleteEntry':
                await sqliteAPI.deleteJournalEntry(action.payload);
                break;
            case 'journal/togglePin':
                const entry = journalState.entries.find((e) => e.id === action.payload);
                if (entry) {
                    await sqliteAPI.updateJournalEntry(entry.id, { pinned: entry.pinned });
                }
                break;
            default:
                logger_1.logger.info('🔄 Syncing all journal entries to SQLite', { component: 'sqlitePersistenceMiddleware', operation: 'syncingAllJournal' });
                break;
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to persist journal entry to SQLite:', { component: 'sqlitePersistenceMiddleware', operation: 'failedPersistJournal' }, error);
    }
}
/**
 * Handle project persistence to SQLite
 */
async function handleProjectPersistence(action, projectsState, sqliteAPI) {
    try {
        switch (action.type) {
            case 'projects/addProject':
                await sqliteAPI.createProject(action.payload);
                break;
            case 'projects/updateProject':
                const { id, updates } = action.payload;
                await sqliteAPI.updateProject(id, updates);
                break;
            case 'projects/deleteProject':
                await sqliteAPI.deleteProject(action.payload);
                break;
            default:
                logger_1.logger.info('🔄 Syncing all projects to SQLite', { component: 'sqlitePersistenceMiddleware', operation: 'syncingAllProjects' });
                break;
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to persist project to SQLite:', { component: 'sqlitePersistenceMiddleware', operation: 'failedPersistProject' }, error);
    }
}
