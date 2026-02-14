"use strict";
/**
 * Enhanced store configuration with SQLite persistence and migration support
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
exports.createEnhancedStore = createEnhancedStore;
exports.initializeStoreData = initializeStoreData;
exports.checkSQLiteAvailability = checkSQLiteAvailability;
exports.getDatabaseStats = getDatabaseStats;
const toolkit_1 = require("@reduxjs/toolkit");
const tasksSlice_1 = __importDefault(require("./slices/tasksSlice"));
const projectsSlice_1 = __importDefault(require("./slices/projectsSlice"));
const journalSlice_1 = __importDefault(require("./slices/journalSlice"));
const userSlice_1 = __importDefault(require("./slices/userSlice"));
const uiSlice_1 = __importDefault(require("./slices/uiSlice"));
const tagsSlice_1 = __importDefault(require("./slices/tagsSlice"));
const authSlice_1 = __importDefault(require("./slices/authSlice"));
const databaseSlice_1 = __importDefault(require("./slices/databaseSlice"));
const shortcutsSlice_1 = __importDefault(require("./slices/shortcutsSlice"));
const searchSlice_1 = __importDefault(require("./slices/searchSlice"));
const dragDropSlice_1 = __importDefault(require("./slices/dragDropSlice"));
const goalsSlice_1 = __importDefault(require("./slices/goalsSlice"));
const integrationsSlice_1 = __importDefault(require("./slices/integrationsSlice"));
const aiAssistantSlice_1 = __importDefault(require("./slices/aiAssistantSlice"));
const insightsSlice_1 = __importDefault(require("./slices/insightsSlice"));
const summariesSlice_1 = __importDefault(require("./slices/summariesSlice"));
const simplifiedPersistenceMiddleware_1 = require("./middleware/simplifiedPersistenceMiddleware");
const logger_1 = require("../utils/logger");
/**
 * Create the enhanced store - always starts with localStorage middleware
 * SQLite functionality is added after app initialization
 */
function createEnhancedStore() {
    return (0, toolkit_1.configureStore)({
        reducer: {
            tasks: tasksSlice_1.default,
            projects: projectsSlice_1.default,
            journal: journalSlice_1.default,
            user: userSlice_1.default,
            ui: uiSlice_1.default,
            tags: tagsSlice_1.default,
            auth: authSlice_1.default,
            database: databaseSlice_1.default,
            shortcuts: shortcutsSlice_1.default,
            search: searchSlice_1.default,
            dragDrop: dragDropSlice_1.default,
            goals: goalsSlice_1.default,
            integrations: integrationsSlice_1.default,
            aiAssistant: aiAssistantSlice_1.default,
            insights: insightsSlice_1.default,
            summaries: summariesSlice_1.default,
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({
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
        }).concat(simplifiedPersistenceMiddleware_1.simplifiedPersistenceMiddleware), // Use simplified persistence with early SQLite commitment
    });
}
// Create the store instance
exports.store = createEnhancedStore();
/**
 * Initialize the store with data from appropriate source
 */
async function initializeStoreData() {
    try {
        logger_1.logger.info('🔄 Starting store data initialization...', { component: 'enhancedStore', operation: 'startingStoreData' });
        // Check if we're in Electron environment with SQLite support
        const hasElectronSQLite = typeof window !== 'undefined' &&
            window.electronAPI &&
            window.electronAPI.sqlite;
        if (hasElectronSQLite) {
            logger_1.logger.info('🗄️ Electron SQLite environment detected', { component: 'enhancedStore', operation: '🗄️ElectronSqlite' });
            // Import migration utilities
            const { migrateToSQLite, loadInitialDataFromSQLite, hasLocalStorageData, getLocalStorageData } = await Promise.resolve().then(() => __importStar(require('../utils/migration')));
            // Initialize SQLite persistence
            logger_1.logger.info('🗄️ Initializing SQLite persistence...', { component: 'enhancedStore', operation: '🗄️InitializingSqlite' });
            const sqliteInitialized = await (0, simplifiedPersistenceMiddleware_1.initializeSQLitePersistence)();
            if (sqliteInitialized) {
                // Check if we should migrate
                logger_1.logger.info('🚀 Starting SQLite migration process...', { component: 'enhancedStore', operation: 'startingSqliteMigration' });
                const migrationSuccess = await migrateToSQLite();
                if (migrationSuccess) {
                    // Load data from SQLite
                    logger_1.logger.info('📂 Loading data from SQLite...', { component: 'enhancedStore', operation: 'loadingDataFrom' });
                    const sqliteData = await loadInitialDataFromSQLite();
                    if (sqliteData) {
                        // Populate Redux store with SQLite data
                        logger_1.logger.info('📊 Populating Redux store with SQLite data...', { component: 'enhancedStore', operation: 'populatingReduxStore' });
                        // Dispatch actions to populate the store
                        if (sqliteData.tasks.length > 0) {
                            exports.store.dispatch({ type: 'tasks/setTasks', payload: sqliteData.tasks });
                            logger_1.logger.info(`✅ Loaded ${sqliteData.tasks.length} tasks from SQLite`, { component: 'enhancedStore', operation: 'loaded${sqlitedata.tasks.length}Tasks' });
                            // Extract and set used tags from tasks
                            const taskTags = sqliteData.tasks
                                .flatMap((task) => task.tags || [])
                                .filter((tag) => tag && tag.trim());
                            if (taskTags.length > 0) {
                                exports.store.dispatch({ type: 'tags/addUsedTags', payload: taskTags });
                                logger_1.logger.info(`✅ Loaded ${taskTags.length} tags from tasks`, { component: 'enhancedStore', operation: 'loaded${tasktags.length}Tags' });
                            }
                        }
                        if (sqliteData.projects.length > 0) {
                            exports.store.dispatch({ type: 'projects/setProjects', payload: sqliteData.projects });
                            logger_1.logger.info(`✅ Loaded ${sqliteData.projects.length} projects from SQLite`, { component: 'enhancedStore', operation: 'loaded${sqlitedata.projects.length}Projects' });
                        }
                        if (sqliteData.journalEntries.length > 0) {
                            exports.store.dispatch({ type: 'journal/setEntries', payload: sqliteData.journalEntries });
                            logger_1.logger.info(`✅ Loaded ${sqliteData.journalEntries.length} journal entries from SQLite`, { component: 'enhancedStore', operation: 'loaded${sqlitedata.journalentries.length}Journal' });
                            // Extract and set used tags from journal entries
                            const journalTags = sqliteData.journalEntries
                                .flatMap((entry) => entry.tags || [])
                                .filter((tag) => tag && tag.trim());
                            if (journalTags.length > 0) {
                                exports.store.dispatch({ type: 'tags/addUsedTags', payload: journalTags });
                                logger_1.logger.info(`✅ Loaded ${journalTags.length} tags from journal entries`, { component: 'enhancedStore', operation: 'loaded${journaltags.length}Tags' });
                            }
                        }
                        // Load goals via IPC
                        try {
                            const anyWindow = window;
                            const goalsResult = await anyWindow.electronAPI?.goals?.get();
                            if (goalsResult?.success && Array.isArray(goalsResult.data)) {
                                exports.store.dispatch({ type: 'goals/setGoals', payload: goalsResult.data });
                                logger_1.logger.info(`✅ Loaded ${goalsResult.data.length} goals from SQLite`, { component: 'enhancedStore', operation: 'loaded${goalsresult.data.length}Goals' });
                            }
                            else {
                                logger_1.logger.warn('⚠️ No goals loaded from SQLite', { component: 'enhancedStore', operation: 'goalsLoadedFrom' });
                            }
                        }
                        catch (e) {
                            logger_1.logger.warn('⚠️ Failed to load goals from SQLite', { component: 'enhancedStore', operation: 'failedLoadGoals' });
                        }
                        // Load AI insights/recaps/usage from SQLite and hydrate Redux
                        try {
                            const anyWindow = window;
                            logger_1.logger.info('🔄 Loading AI insights/recaps/usage from SQLite...', { component: 'enhancedStore', operation: 'loadingInsights/recaps/usageFrom' });
                            const [insightsRes, recapsRes, usageRes] = await Promise.all([
                                anyWindow.electronAPI?.aiAssistant?.listInsights?.(),
                                anyWindow.electronAPI?.aiAssistant?.listRecaps?.(),
                                anyWindow.electronAPI?.aiAssistant?.listUsage?.(),
                            ]);
                            // Map and restore insights
                            if (insightsRes?.success && Array.isArray(insightsRes.data)) {
                                const insights = insightsRes.data.map((row) => ({
                                    id: row.id,
                                    type: row.type,
                                    title: row.title,
                                    description: row.description,
                                    confidence: Number(row.confidence ?? 0.5),
                                    createdAt: row.created_at,
                                    source: row.provider,
                                    category: row.category,
                                    actionable: !!row.actionable,
                                    metadata: (() => { try {
                                        return JSON.parse(row.metadata || '{}');
                                    }
                                    catch {
                                        return {};
                                    } })(),
                                }));
                                exports.store.dispatch({ type: 'aiAssistant/restoreInsights', payload: insights });
                                logger_1.logger.info(`✅ Loaded ${insights.length} AI insights from SQLite`, { component: 'enhancedStore', operation: 'loaded${insights.length}Insights' });
                                try {
                                    logger_1.logger.info('🧪 Insights hydration sample (first 3)', { component: 'enhancedStore', operation: 'insightsHydrationSample', metadata: { sample: insights.slice(0, 3) } });
                                }
                                catch { }
                                try {
                                    localStorage.setItem('serenity_ai_insights', JSON.stringify(insights));
                                }
                                catch { }
                            }
                            // Map and restore recaps
                            if (recapsRes?.success && Array.isArray(recapsRes.data)) {
                                const recaps = recapsRes.data.map((row) => ({
                                    id: row.id,
                                    type: row.type,
                                    title: row.title,
                                    summary: row.summary,
                                    highlights: (() => { try {
                                        return JSON.parse(row.highlights || '[]');
                                    }
                                    catch {
                                        return [];
                                    } })(),
                                    challenges: (() => { try {
                                        return JSON.parse(row.challenges || '[]');
                                    }
                                    catch {
                                        return [];
                                    } })(),
                                    recommendations: (() => { try {
                                        return JSON.parse(row.recommendations || '[]');
                                    }
                                    catch {
                                        return [];
                                    } })(),
                                    period: (() => { try {
                                        return JSON.parse(row.period || '{}');
                                    }
                                    catch {
                                        return {};
                                    } })(),
                                    createdAt: row.created_at,
                                    source: row.provider,
                                    metadata: (() => { try {
                                        return JSON.parse(row.metadata || '{}');
                                    }
                                    catch {
                                        return {};
                                    } })(),
                                }));
                                exports.store.dispatch({ type: 'aiAssistant/restoreRecaps', payload: recaps });
                                logger_1.logger.info(`✅ Loaded ${recaps.length} AI recaps from SQLite`, { component: 'enhancedStore', operation: 'loaded${recaps.length}Recaps' });
                                try {
                                    logger_1.logger.info('🧪 Recaps hydration sample (first 2)', { component: 'enhancedStore', operation: 'recapsHydrationSample', metadata: { sample: recaps.slice(0, 2).map((r) => ({ title: r.title, type: r.type, period: r.period })) } });
                                }
                                catch { }
                                try {
                                    localStorage.setItem('serenity_ai_recaps', JSON.stringify(recaps));
                                }
                                catch { }
                            }
                            // Map and restore usage
                            if (usageRes?.success && Array.isArray(usageRes.data)) {
                                logger_1.logger.info(`📊 Hydrating ${usageRes.data.length} AI usage rows from SQLite`, { component: 'enhancedStore', operation: 'hydrating${usageres.data.length}Usage' });
                                // Clear and repopulate usage entries
                                exports.store.dispatch({ type: 'aiAssistant/clearUsage' });
                                usageRes.data.forEach((u) => {
                                    exports.store.dispatch({
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
                                    const hydratedUsage = exports.store.getState().aiAssistant.usage;
                                    logger_1.logger.info('🧪 Usage hydration sample (first 3)', { component: 'enhancedStore', operation: 'usageHydrationSample', metadata: { sample: hydratedUsage.slice(0, 3) } });
                                }
                                catch { }
                                logger_1.logger.info(`✅ Loaded ${usageRes.data.length} AI usage rows from SQLite`, { component: 'enhancedStore', operation: 'loaded${usageres.data.length}Usage' });
                                try {
                                    localStorage.setItem('serenity_ai_usage', JSON.stringify(exports.store.getState().aiAssistant.usage));
                                }
                                catch { }
                            }
                        }
                        catch (e) {
                            logger_1.logger.warn('⚠️ Failed to load AI insights/recaps/usage from SQLite', { component: 'enhancedStore', operation: 'failedLoadInsightsRecapsUsage' });
                        }
                        logger_1.logger.info('✅ SQLite data initialization completed successfully', { component: 'enhancedStore', operation: 'sqliteDataInitialization' });
                        return true;
                    }
                    else {
                        logger_1.logger.info('📭 No SQLite data found', { component: 'enhancedStore', operation: 'sqliteDataFound' });
                    }
                }
                else {
                    logger_1.logger.info('⚠️ SQLite migration failed, falling back to localStorage', { component: 'enhancedStore', operation: 'operation' });
                }
            }
            else {
                logger_1.logger.info('⚠️ SQLite initialization failed, using localStorage', { component: 'enhancedStore', operation: 'operation' });
            }
        }
        else {
            logger_1.logger.info('💾 No SQLite support detected, using localStorage', { component: 'enhancedStore', operation: 'operation' });
        }
        // Fallback: Load from localStorage if SQLite is not available
        const { hasLocalStorageData, getLocalStorageData } = await Promise.resolve().then(() => __importStar(require('../utils/migration')));
        if (hasLocalStorageData()) {
            logger_1.logger.info('📦 Loading data from localStorage as fallback...', { component: 'enhancedStore', operation: 'loadingDataFrom' });
            const localData = getLocalStorageData();
            if (localData.tasks.length > 0) {
                exports.store.dispatch({ type: 'tasks/setTasks', payload: localData.tasks });
                logger_1.logger.info(`✅ Loaded ${localData.tasks.length} tasks from localStorage`, { component: 'enhancedStore', operation: 'loaded${localdata.tasks.length}Tasks' });
                // Extract and set used tags from tasks
                const taskTags = localData.tasks
                    .flatMap((task) => task.tags || [])
                    .filter((tag) => tag && tag.trim());
                if (taskTags.length > 0) {
                    exports.store.dispatch({ type: 'tags/addUsedTags', payload: taskTags });
                    logger_1.logger.info(`✅ Loaded ${taskTags.length} tags from tasks`, { component: 'enhancedStore', operation: 'loaded${tasktags.length}Tags' });
                }
            }
            // Goals (optional fallback key)
            try {
                const goalsStr = localStorage.getItem('serenity_goals');
                if (goalsStr) {
                    const goals = JSON.parse(goalsStr);
                    exports.store.dispatch({ type: 'goals/setGoals', payload: goals });
                    logger_1.logger.info(`✅ Loaded ${goals.length} goals from localStorage`, { component: 'enhancedStore', operation: 'loaded${goals.length}Goals' });
                }
            }
            catch (e) {
                logger_1.logger.warn('⚠️ Failed to load goals from localStorage', { component: 'enhancedStore', operation: 'failedLoadGoals' });
            }
            if (localData.projects.length > 0) {
                exports.store.dispatch({ type: 'projects/setProjects', payload: localData.projects });
                logger_1.logger.info(`✅ Loaded ${localData.projects.length} projects from localStorage`, { component: 'enhancedStore', operation: 'loaded${localdata.projects.length}Projects' });
            }
            if (localData.journalEntries.length > 0) {
                exports.store.dispatch({ type: 'journal/setEntries', payload: localData.journalEntries });
                logger_1.logger.info(`✅ Loaded ${localData.journalEntries.length} journal entries from localStorage`, { component: 'enhancedStore', operation: 'loaded${localdata.journalentries.length}Journal' });
                // Extract and set used tags from journal entries
                const journalTags = localData.journalEntries
                    .flatMap((entry) => entry.tags || [])
                    .filter((tag) => tag && tag.trim());
                if (journalTags.length > 0) {
                    exports.store.dispatch({ type: 'tags/addUsedTags', payload: journalTags });
                    logger_1.logger.info(`✅ Loaded ${journalTags.length} tags from journal entries`, { component: 'enhancedStore', operation: 'loaded${journaltags.length}Tags' });
                }
            }
            logger_1.logger.info('✅ LocalStorage data initialization completed', { component: 'enhancedStore', operation: 'localstorageDataInitialization' });
            return true;
        }
        // Always try to load integrations state from localStorage (regardless of SQLite)
        loadIntegrationsState();
        logger_1.logger.info('📭 No existing data found - starting with empty store', { component: 'enhancedStore', operation: 'existingDataFound' });
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to initialize store data:', { component: 'enhancedStore', operation: 'failedInitializeStore' }, error);
        return false;
    }
}
/**
 * Check if SQLite is available and working
 */
async function checkSQLiteAvailability() {
    if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
        try {
            const result = await window.electronAPI.sqlite.testConnection();
            return result.success;
        }
        catch (error) {
            logger_1.logger.error('SQLite availability check failed:', { component: 'enhancedStore', operation: 'sqliteAvailabilityCheck' }, error);
            return false;
        }
    }
    return false;
}
/**
 * Get database statistics for monitoring
 */
async function getDatabaseStats() {
    if (typeof window !== 'undefined' && window.electronAPI?.sqlite) {
        try {
            const result = await window.electronAPI.sqlite.getStats();
            return result.success ? result.data : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get database stats:', { component: 'enhancedStore', operation: 'failedGetDatabase' }, error);
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
        logger_1.logger.info('🔗 Loading integrations state from localStorage...', { component: 'enhancedStore', operation: 'loadingIntegrationsState' });
        const integrationsData = localStorage.getItem('serenity_integrations');
        if (integrationsData) {
            const parsedData = require('../utils/cryptoUtils').safeJsonParse(integrationsData);
            logger_1.logger.info('✅ Found integrations data:', { component: 'enhancedStore', operation: 'foundIntegrationsData:' });
            // Dispatch action to restore integrations state
            exports.store.dispatch({ type: 'integrations/restoreState', payload: parsedData });
            logger_1.logger.info('✅ Integrations state restored successfully', { component: 'enhancedStore', operation: 'integrationsStateRestored' });
        }
        else {
            logger_1.logger.info('📭 No integrations data found in localStorage', { component: 'enhancedStore', operation: 'integrationsDataFound' });
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to load integrations state:', { component: 'enhancedStore', operation: 'failedLoadIntegrations' }, error);
    }
}
