"use strict";
/**
 * Simplified persistence middleware that commits to SQLite early
 * Eliminates the complexity of dual localStorage/SQLite paths
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifiedPersistenceMiddleware = void 0;
exports.initializeSQLitePersistence = initializeSQLitePersistence;
exports.isSQLiteInitialized = isSQLiteInitialized;
exports.reinitializeSQLite = reinitializeSQLite;
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
let lastAIUsageSignature = null;
let lastAIUsagePersistMs = 0;
// Debounce AI settings save calls from renderer to main
let aiSettingsTimer = null;
let lastAISentSignature = null;
/**
 * Initialize SQLite persistence - called once at app startup
 */
async function initializeSQLitePersistence() {
    if (sqliteInitialized || isInitializing) {
        return sqliteInitialized;
    }
    isInitializing = true;
    try {
        if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
            console.log('🔄 Initializing SQLite persistence...');
            const initResult = await window.electronAPI.sqlite.initialize();
            if (initResult.success) {
                sqliteInitialized = true;
                console.log('✅ SQLite persistence initialized successfully');
                // Migrate any existing localStorage data to SQLite
                await migrateLocalStorageToSQLite();
                return true;
            }
            else {
                console.error('❌ SQLite initialization failed:', initResult.error);
                sqliteInitialized = false;
                return false;
            }
        }
    }
    catch (error) {
        console.error('❌ SQLite initialization error:', error);
        sqliteInitialized = false;
    }
    finally {
        isInitializing = false;
    }
    console.log('💾 SQLite not available, falling back to localStorage');
    return false;
}
/**
 * Migrate existing localStorage data to SQLite (one-time operation)
 */
async function migrateLocalStorageToSQLite() {
    if (!window.electronAPI?.sqlite)
        return;
    try {
        console.log('🔄 Checking for localStorage data to migrate...');
        // Check for existing data
        const tasks = localStorage.getItem('serenity_tasks');
        const projects = localStorage.getItem('serenity_projects');
        const journal = localStorage.getItem('serenity_journal');
        if (tasks || projects || journal) {
            console.log('📦 Found localStorage data, migrating to SQLite...');
            const migrationData = {
                tasks: tasks ? JSON.parse(tasks) : [],
                projects: projects ? JSON.parse(projects) : [],
                journal: journal ? JSON.parse(journal) : []
            };
            const result = await window.electronAPI.sqlite.importFromLocalStorage(migrationData);
            if (result.success) {
                console.log('✅ Data migration completed successfully');
                // Clear migrated data from localStorage
                localStorage.removeItem('serenity_tasks');
                localStorage.removeItem('serenity_projects');
                localStorage.removeItem('serenity_journal');
                localStorage.setItem('serenity_data_migrated', 'true');
            }
            else {
                console.error('❌ Data migration failed:', result.error);
            }
        }
        else {
            console.log('📝 No localStorage data found to migrate');
        }
    }
    catch (error) {
        console.error('❌ Migration error:', error);
    }
}
/**
 * Simplified persistence middleware - SQLite first, localStorage fallback only for specific data
 */
const simplifiedPersistenceMiddleware = (store) => (next) => async (action) => {
    // Let the action go through first
    const result = next(action);
    // Only persist if action type is in our list
    if (!PERSISTENT_ACTIONS.includes(action.type) && !action.type.startsWith('aiAssistant/')) {
        return result;
    }
    const state = store.getState();
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
                        if (aiSettingsTimer)
                            clearTimeout(aiSettingsTimer);
                        aiSettingsTimer = setTimeout(() => {
                            try {
                                window.electronAPI.aiAssistant.saveSettings(aiSettings);
                            }
                            catch { }
                        }, 300);
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
                    }
                    catch { }
                }
            }
            catch (e) {
                console.warn('⚠️ Failed to trigger AI settings save:', e);
            }
        }
        // For data operations, use SQLite if available, otherwise localStorage as temporary fallback
        if (sqliteInitialized && window.electronAPI?.sqlite) {
            await persistToSQLite(action, state);
        }
        else {
            // Temporary fallback to localStorage (should be rare after initialization)
            console.warn('⚠️ SQLite not available, using localStorage fallback');
            persistToLocalStorage(action, state);
        }
    }
    catch (error) {
        console.error('❌ Persistence error for action', action.type, ':', error);
        // Fallback to localStorage if SQLite fails
        persistToLocalStorage(action, state);
    }
    return result;
};
exports.simplifiedPersistenceMiddleware = simplifiedPersistenceMiddleware;
/**
 * Persist to SQLite using the new business logic API
 */
async function persistToSQLite(action, state) {
    const { type, payload } = action;
    try {
        if (type.startsWith('tasks/')) {
            await handleTaskPersistence(type, payload, state.tasks);
        }
        else if (type.startsWith('projects/')) {
            await handleProjectPersistence(type, payload, state.projects);
        }
        else if (type.startsWith('journal/')) {
            await handleJournalPersistence(type, payload, state.journal);
        }
    }
    catch (error) {
        console.error('❌ SQLite persistence failed:', error);
        throw error; // Re-throw to trigger localStorage fallback
    }
}
/**
 * Handle task persistence using the new business logic API
 */
async function handleTaskPersistence(actionType, payload, tasksState) {
    switch (actionType) {
        case 'tasks/addTask':
            console.log('📝 Creating task via SQLite API:', payload.title);
            await window.electronAPI?.sqlite?.createTask(payload);
            break;
        case 'tasks/updateTask':
            console.log('📝 Updating task via SQLite API:', payload.id);
            const { id, ...updates } = payload;
            await window.electronAPI?.sqlite?.updateTask(id, updates);
            break;
        case 'tasks/toggleTask':
            console.log('📝 Toggling task via SQLite API:', payload);
            // For toggleTask, payload is just the task ID (string)
            // We need to get the updated task from state
            const toggledTask = tasksState.tasks.find((t) => t.id === payload);
            if (toggledTask) {
                await window.electronAPI?.sqlite?.updateTask(payload, {
                    completed: toggledTask.completed,
                    updatedAt: toggledTask.updatedAt
                });
            }
            break;
        case 'tasks/deleteTask':
            console.log('📝 Deleting task via SQLite API:', payload);
            await window.electronAPI?.sqlite?.deleteTask(payload);
            break;
        case 'tasks/addSubtask':
        case 'tasks/removeSubtask':
        case 'tasks/toggleSubtask':
            // These are handled as task updates
            const task = tasksState.tasks.find((t) => t.id === payload.taskId);
            if (task) {
                await window.electronAPI?.sqlite?.updateTask(task.id, { subtasks: task.subtasks });
            }
            break;
    }
}
/**
 * Handle project persistence using the new business logic API
 */
async function handleProjectPersistence(actionType, payload, projectsState) {
    switch (actionType) {
        case 'projects/addProject':
            console.log('📁 Creating project via SQLite API:', payload.name);
            await window.electronAPI?.sqlite?.createProject(payload);
            break;
        case 'projects/updateProject':
            console.log('📁 Updating project via SQLite API:', payload.id);
            const { id, ...updates } = payload;
            await window.electronAPI?.sqlite?.updateProject(id, updates);
            break;
        case 'projects/deleteProject':
            console.log('📁 Deleting project via SQLite API:', payload);
            await window.electronAPI?.sqlite?.deleteProject(payload);
            break;
    }
}
/**
 * Handle journal persistence using the new business logic API
 */
async function handleJournalPersistence(actionType, payload, journalState) {
    switch (actionType) {
        case 'journal/addEntry':
            console.log('📖 Creating journal entry via SQLite API:', payload.title);
            await window.electronAPI?.sqlite?.createJournalEntry(payload);
            break;
        case 'journal/updateEntry':
        case 'journal/togglePin':
            console.log('📖 Updating journal entry via SQLite API:', payload.id);
            const { id, ...updates } = payload;
            await window.electronAPI?.sqlite?.updateJournalEntry(id, updates);
            break;
        case 'journal/deleteEntry':
            console.log('📖 Deleting journal entry via SQLite API:', payload);
            await window.electronAPI?.sqlite?.deleteJournalEntry(payload);
            break;
    }
}
/**
 * Fallback persistence to localStorage (temporary, should be rare)
 */
function persistToLocalStorage(action, state) {
    const { type } = action;
    try {
        if (type.startsWith('tasks/')) {
            localStorage.setItem('serenity_tasks', JSON.stringify(state.tasks.tasks));
        }
        else if (type.startsWith('projects/')) {
            localStorage.setItem('serenity_projects', JSON.stringify(state.projects.projects));
        }
        else if (type.startsWith('journal/')) {
            localStorage.setItem('serenity_journal', JSON.stringify(state.journal.entries));
        }
        console.log('📄 Fallback: Data persisted to localStorage');
    }
    catch (error) {
        console.error('❌ localStorage fallback failed:', error);
    }
}
/**
 * Check if SQLite is initialized
 */
function isSQLiteInitialized() {
    return sqliteInitialized;
}
/**
 * Force SQLite reinitialization (for testing/recovery)
 */
async function reinitializeSQLite() {
    sqliteInitialized = false;
    return await initializeSQLitePersistence();
}
