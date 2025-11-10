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
const logger_1 = require("../../utils/logger");
const PersistenceClient_1 = require("../../persistence/PersistenceClient");
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
            logger_1.logger.info('Initializing SQLite persistence', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' });
            const initResult = await window.electronAPI.sqlite.initialize();
            if (initResult.success) {
                sqliteInitialized = true;
                logger_1.logger.info('SQLite persistence initialized successfully', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' });
                // Migrate any existing localStorage data to SQLite
                await migrateLocalStorageToSQLite();
                return true;
            }
            else {
                logger_1.logger.error('SQLite initialization failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence', metadata: { error: initResult.error } });
                sqliteInitialized = false;
                return false;
            }
        }
    }
    catch (error) {
        logger_1.logger.error('SQLite initialization error', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' }, error);
        sqliteInitialized = false;
    }
    finally {
        isInitializing = false;
    }
    logger_1.logger.info('SQLite not available, falling back to localStorage', { component: 'SimplifiedPersistenceMiddleware', operation: 'initializeSQLitePersistence' });
    return false;
}
/**
 * Migrate existing localStorage data to SQLite (one-time operation)
 */
async function migrateLocalStorageToSQLite() {
    if (!window.electronAPI?.sqlite)
        return;
    try {
        logger_1.logger.debug('Checking for localStorage data to migrate', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });
        // Check for existing data
        const tasks = localStorage.getItem('serenity_tasks');
        const projects = localStorage.getItem('serenity_projects');
        const journal = localStorage.getItem('serenity_journal');
        if (tasks || projects || journal) {
            logger_1.logger.info('Found localStorage data, migrating to SQLite', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });
            const migrationData = {
                tasks: tasks ? JSON.parse(tasks) : [],
                projects: projects ? JSON.parse(projects) : [],
                journal: journal ? JSON.parse(journal) : []
            };
            const result = await window.electronAPI.sqlite.importFromLocalStorage(migrationData);
            if (result.success) {
                logger_1.logger.info('Data migration completed successfully', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });
                // Clear migrated data from localStorage
                localStorage.removeItem('serenity_tasks');
                localStorage.removeItem('serenity_projects');
                localStorage.removeItem('serenity_journal');
                localStorage.setItem('serenity_data_migrated', 'true');
            }
            else {
                logger_1.logger.error('Data migration failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite', metadata: { error: result.error } });
            }
        }
        else {
            logger_1.logger.debug('No localStorage data found to migrate', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' });
        }
    }
    catch (error) {
        logger_1.logger.error('Migration error', { component: 'SimplifiedPersistenceMiddleware', operation: 'migrateLocalStorageToSQLite' }, error);
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
                        // Save activeProvider changes immediately, debounce other settings
                        const isActiveProviderChange = action.type === 'aiAssistant/setActiveProvider' || action.type === 'aiAssistant/clearActiveProvider';
                        if (isActiveProviderChange) {
                            try {
                                window.electronAPI.aiAssistant.saveSettings(aiSettings);
                            }
                            catch { }
                        }
                        else {
                            aiSettingsTimer = setTimeout(() => {
                                try {
                                    window.electronAPI.aiAssistant.saveSettings(aiSettings);
                                }
                                catch { }
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
                    }
                    catch { }
                }
            }
            catch (e) {
                logger_1.logger.error('Failed to trigger AI settings save', { component: 'SimplifiedPersistenceMiddleware', operation: 'middleware' }, e);
            }
        }
        // Persist AI insights/recaps and usage to localStorage when updated
        if (action.type === 'aiAssistant/analyzeUserData/fulfilled' || action.type === 'aiAssistant/clearInsights' || action.type === 'aiAssistant/removeInsight') {
            try {
                localStorage.setItem('serenity_ai_insights', JSON.stringify(state.aiAssistant.insights));
                localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));
            }
            catch { }
            // Also persist to DB via IPC when available (supports local-analysis fallback)
            try {
                if (action.type === 'aiAssistant/analyzeUserData/fulfilled') {
                    const provider = action.payload?.provider || state.aiAssistant.activeProvider || 'local';
                    const insights = action.payload?.insights || [];
                    logger_1.logger.debug('Analyze fulfilled, persisting insights', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights', metadata: { provider, insightCount: insights.length } });
                    // Save usage to database via IPC
                    const usage = action.payload?.usage;
                    if (usage && typeof window !== 'undefined' && window.electronAPI?.aiAssistant?.saveUsage) {
                        logger_1.logger.debug('Saving AI usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights', metadata: { usage } });
                        try {
                            const usageEntry = {
                                provider: provider,
                                operation: 'analyze',
                                promptTokens: Number(usage.promptTokens || 0),
                                completionTokens: Number(usage.completionTokens || 0),
                                totalTokens: Number(usage.totalTokens || 0),
                                timestamp: new Date().toISOString(),
                            };
                            window.electronAPI.aiAssistant.saveUsage(usageEntry).then((result) => {
                                if (result.success) {
                                    logger_1.logger.info('✅ AI usage saved to database via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' });
                                }
                                else {
                                    logger_1.logger.warn('⚠️ Failed to save AI usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights', metadata: { error: result.error } });
                                }
                            }).catch((err) => {
                                logger_1.logger.error('❌ Error saving AI usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' }, err);
                            });
                        }
                        catch (saveError) {
                            logger_1.logger.error('❌ Exception while saving AI usage', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' }, saveError);
                        }
                    }
                }
            }
            catch (e) {
                logger_1.logger.error('Failed to persist AI insights/usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistAIInsights' }, e);
            }
        }
        // Handle direct recordUsage actions - persist individual usage entries to database
        if (action.type === 'aiAssistant/recordUsage') {
            try {
                localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));
                // Persist to database via IPC
                const usageEntry = action.payload;
                if (usageEntry && typeof window !== 'undefined' && window.electronAPI?.aiAssistant?.saveUsage) {
                    logger_1.logger.debug('Saving recordUsage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage', metadata: { usageEntry } });
                    window.electronAPI.aiAssistant.saveUsage(usageEntry).then((result) => {
                        if (result.success) {
                            logger_1.logger.info('✅ Record usage saved to database via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage' });
                        }
                        else {
                            logger_1.logger.warn('⚠️ Failed to save record usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage', metadata: { error: result.error } });
                        }
                    }).catch((err) => {
                        logger_1.logger.error('❌ Error saving record usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage' }, err);
                    });
                }
            }
            catch (e) {
                logger_1.logger.error('Failed to persist recordUsage to database via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecordUsage' }, e);
            }
        }
        // Handle recap generation - save usage to database
        if (action.type === 'aiAssistant/generateRecap/fulfilled') {
            try {
                localStorage.setItem('serenity_ai_recaps', JSON.stringify(state.aiAssistant.recaps));
                localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));
                // Save recap usage to database via IPC
                const usage = action.payload?.usage;
                const provider = action.payload?.provider || state.aiAssistant.activeProvider || 'local';
                if (usage && typeof window !== 'undefined' && window.electronAPI?.aiAssistant?.saveUsage) {
                    logger_1.logger.debug('Saving recap usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecapUsage', metadata: { usage } });
                    try {
                        const usageEntry = {
                            provider: provider,
                            operation: 'recap',
                            promptTokens: Number(usage.promptTokens || 0),
                            completionTokens: Number(usage.completionTokens || 0),
                            totalTokens: Number(usage.totalTokens || 0),
                            timestamp: new Date().toISOString(),
                        };
                        window.electronAPI.aiAssistant.saveUsage(usageEntry).then((result) => {
                            if (result.success) {
                                logger_1.logger.info('✅ Recap usage saved to database via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecapUsage' });
                            }
                            else {
                                logger_1.logger.warn('⚠️ Failed to save recap usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecapUsage', metadata: { error: result.error } });
                            }
                        }).catch((err) => {
                            logger_1.logger.error('❌ Error saving recap usage via IPC', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecapUsage' }, err);
                        });
                    }
                    catch (saveError) {
                        logger_1.logger.error('❌ Exception while saving recap usage', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecapUsage' }, saveError);
                    }
                }
            }
            catch (e) {
                logger_1.logger.error('Failed to persist recap usage', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistRecapUsage' }, e);
            }
        }
        // Handle recap removal - just update localStorage
        if (action.type === 'aiAssistant/removeRecap') {
            try {
                localStorage.setItem('serenity_ai_recaps', JSON.stringify(state.aiAssistant.recaps));
                localStorage.setItem('serenity_ai_usage', JSON.stringify(state.aiAssistant.usage));
            }
            catch { }
        }
        // For data operations, prefer injected persistence client when available
        try {
            const client = (0, PersistenceClient_1.getPersistenceClient)();
            await persistViaClient(action, state, client);
        }
        catch {
            // Fallback for desktop IPC path
            if (sqliteInitialized && window.electronAPI?.sqlite) {
                await persistToSQLite(action, state);
            }
            else {
                logger_1.logger.warn('No persistence client; falling back to localStorage', { component: 'SimplifiedPersistenceMiddleware', operation: 'middleware', metadata: { actionType: action.type } });
                persistToLocalStorage(action, state);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Persistence error for action', { component: 'SimplifiedPersistenceMiddleware', operation: 'middleware', metadata: { actionType: action.type } }, error);
        // Fallback to localStorage if SQLite fails
        persistToLocalStorage(action, state);
    }
    return result;
};
exports.simplifiedPersistenceMiddleware = simplifiedPersistenceMiddleware;
async function persistViaClient(action, state, client) {
    const { type, payload } = action;
    if (type.startsWith('tasks/')) {
        switch (type) {
            case 'tasks/addTask':
                await client.tasks.create(payload);
                break;
            case 'tasks/updateTask': {
                const { id, ...updates } = payload;
                await client.tasks.update(id, updates);
                break;
            }
            case 'tasks/toggleTask': {
                const task = state.tasks.tasks.find((t) => t.id === payload);
                if (task)
                    await client.tasks.update(task.id, { completed: task.completed, completedAt: task.completedAt });
                break;
            }
            case 'tasks/deleteTask':
                await client.tasks.remove(payload);
                break;
            case 'tasks/addSubtask':
            case 'tasks/removeSubtask':
            case 'tasks/toggleSubtask': {
                const task = state.tasks.tasks.find((t) => t.id === payload.taskId);
                if (task)
                    await client.tasks.update(task.id, { subtasks: task.subtasks });
                break;
            }
        }
    }
    else if (type.startsWith('projects/')) {
        switch (type) {
            case 'projects/addProject':
                await client.projects.create(payload);
                break;
            case 'projects/updateProject': {
                const { id, ...updates } = payload;
                await client.projects.update(id, updates);
                break;
            }
            case 'projects/deleteProject':
                await client.projects.remove(payload);
                break;
        }
    }
    else if (type.startsWith('journal/')) {
        switch (type) {
            case 'journal/addEntry':
                await client.journal.create(payload);
                break;
            case 'journal/updateEntry':
            case 'journal/togglePin': {
                const { id, ...updates } = payload;
                await client.journal.update(id, updates);
                break;
            }
            case 'journal/deleteEntry':
                await client.journal.remove(payload);
                break;
        }
    }
    else if (type.startsWith('goals/')) {
        switch (type) {
            case 'goals/addGoal':
                await client.goals.create(payload);
                break;
            case 'goals/updateGoal': {
                const { id, ...updates } = payload;
                await client.goals.update(id, updates);
                break;
            }
            case 'goals/deleteGoal':
                await client.goals.remove(payload);
                break;
        }
    }
}
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
        else if (type.startsWith('goals/')) {
            await handleGoalPersistence(type, payload, state.goals);
        }
    }
    catch (error) {
        logger_1.logger.error('SQLite persistence failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistToSQLite', metadata: { actionType: type } }, error);
        throw error; // Re-throw to trigger localStorage fallback
    }
}
/**
 * Handle task persistence using the new business logic API
 */
async function handleTaskPersistence(actionType, payload, tasksState) {
    switch (actionType) {
        case 'tasks/addTask':
            logger_1.logger.debug('Creating task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { title: payload.title } });
            await window.electronAPI?.sqlite?.createTask(payload);
            break;
        case 'tasks/updateTask':
            logger_1.logger.debug('Updating task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { taskId: payload.id } });
            const { id, ...updates } = payload;
            await window.electronAPI?.sqlite?.updateTask(id, updates);
            break;
        case 'tasks/toggleTask':
            logger_1.logger.debug('Toggling task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { taskId: payload } });
            // For toggleTask, payload is just the task ID (string)
            // We need to get the updated task from state
            const toggledTask = tasksState.tasks.find((t) => t.id === payload);
            if (toggledTask) {
                await window.electronAPI?.sqlite?.updateTask(payload, {
                    completed: toggledTask.completed,
                    completedAt: toggledTask.completedAt,
                    updatedAt: toggledTask.updatedAt
                });
            }
            break;
        case 'tasks/deleteTask':
            logger_1.logger.debug('Deleting task via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleTaskPersistence', metadata: { taskId: payload } });
            await window.electronAPI?.sqlite?.deleteTask(payload);
            break;
        case 'tasks/addSubtask':
        case 'tasks/removeSubtask':
        case 'tasks/toggleSubtask':
            // These are handled as task updates
            const payloadWithTaskId = payload;
            const task = tasksState.tasks.find((t) => t.id === payloadWithTaskId.taskId);
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
            logger_1.logger.debug('Creating project via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleProjectPersistence', metadata: { name: payload.name } });
            await window.electronAPI?.sqlite?.createProject(payload);
            break;
        case 'projects/updateProject': {
            const projectPayload = payload;
            logger_1.logger.debug('Updating project via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleProjectPersistence', metadata: { projectId: projectPayload.id } });
            const { id, ...updates } = projectPayload;
            await window.electronAPI?.sqlite?.updateProject(id, updates);
            break;
        }
        case 'projects/deleteProject':
            logger_1.logger.debug('Deleting project via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleProjectPersistence', metadata: { projectId: payload } });
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
            logger_1.logger.debug('Creating journal entry via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleJournalPersistence', metadata: { title: payload.title } });
            await window.electronAPI?.sqlite?.createJournalEntry(payload);
            break;
        case 'journal/updateEntry':
        case 'journal/togglePin': {
            const journalPayload = payload;
            logger_1.logger.debug('Updating journal entry via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleJournalPersistence', metadata: { entryId: journalPayload.id } });
            const { id, ...updates } = journalPayload;
            await window.electronAPI?.sqlite?.updateJournalEntry(id, updates);
            break;
        }
        case 'journal/deleteEntry':
            logger_1.logger.debug('Deleting journal entry via SQLite API', { component: 'SimplifiedPersistenceMiddleware', operation: 'handleJournalPersistence', metadata: { entryId: payload } });
            await window.electronAPI?.sqlite?.deleteJournalEntry(payload);
            break;
    }
}
/**
 * Handle goal persistence via IPC
 * TODO: Implement goals IPC interface in electron.d.ts
 */
async function handleGoalPersistence(actionType, payload, goalsState) {
    // TODO: Add goals interface to window.electronAPI
    logger_1.logger.debug('Goal persistence via IPC not yet implemented', {
        component: 'SimplifiedPersistenceMiddleware',
        operation: 'handleGoalPersistence',
        metadata: { actionType }
    });
    // Store in localStorage as fallback
    try {
        localStorage.setItem('serenity_goals', JSON.stringify(goalsState.goals));
    }
    catch (e) {
        logger_1.logger.error('Failed to persist goals to localStorage', {
            component: 'SimplifiedPersistenceMiddleware',
            operation: 'handleGoalPersistence'
        }, e);
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
        else if (type.startsWith('goals/')) {
            localStorage.setItem('serenity_goals', JSON.stringify(state.goals.goals));
        }
        logger_1.logger.debug('Fallback: Data persisted to localStorage', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistToLocalStorage', metadata: { actionType: type } });
    }
    catch (error) {
        logger_1.logger.error('localStorage fallback failed', { component: 'SimplifiedPersistenceMiddleware', operation: 'persistToLocalStorage', metadata: { actionType: type } }, error);
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
