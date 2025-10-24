"use strict";
/**
 * Data migration utilities for moving from localStorage to SQLite
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasLocalStorageData = hasLocalStorageData;
exports.getLocalStorageData = getLocalStorageData;
exports.clearLocalStorageData = clearLocalStorageData;
exports.isMigrationComplete = isMigrationComplete;
exports.migrateToSQLite = migrateToSQLite;
exports.loadInitialDataFromSQLite = loadInitialDataFromSQLite;
exports.createMigrationBackup = createMigrationBackup;
const logger_1 = require("./logger");
/**
 * Check if there's existing localStorage data that needs migration
 */
function hasLocalStorageData() {
    const tasks = localStorage.getItem('serenity_tasks');
    const projects = localStorage.getItem('serenity_projects');
    const journal = localStorage.getItem('serenity_journal_entries');
    return !!(tasks || projects || journal);
}
/**
 * Get all data from localStorage for migration
 */
function getLocalStorageData() {
    const tasks = JSON.parse(localStorage.getItem('serenity_tasks') || '[]');
    const projects = JSON.parse(localStorage.getItem('serenity_projects') || '[]');
    const journalEntries = JSON.parse(localStorage.getItem('serenity_journal_entries') || '[]');
    // Convert date strings back to Date objects
    const processedTasks = tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
    }));
    const processedProjects = projects.map((project) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
    }));
    const processedJournalEntries = journalEntries.map((entry) => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
    }));
    return {
        tasks: processedTasks,
        projects: processedProjects,
        journalEntries: processedJournalEntries,
    };
}
/**
 * Clear localStorage data after successful migration
 */
function clearLocalStorageData() {
    localStorage.removeItem('serenity_tasks');
    localStorage.removeItem('serenity_projects');
    localStorage.removeItem('serenity_journal_entries');
    // Mark migration as complete
    localStorage.setItem('serenity_migration_complete', 'true');
    logger_1.logger.info('🧹 LocalStorage data cleared after migration', { component: 'migration', operation: 'localstorageDataCleared' });
}
/**
 * Check if migration has already been completed
 */
function isMigrationComplete() {
    return localStorage.getItem('serenity_migration_complete') === 'true';
}
/**
 * Migrate data from localStorage to SQLite
 */
async function migrateToSQLite() {
    // Check if we're in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI?.sqlite) {
        logger_1.logger.warn('⚠️ SQLite not available - skipping migration', { component: 'migration', operation: 'sqliteNotAvailable' });
        return false;
    }
    // Check if migration is already complete
    if (isMigrationComplete()) {
        logger_1.logger.info('✅ Migration already completed', { component: 'migration', operation: 'migrationAlreadyCompleted' });
        return true;
    }
    // Check if there's data to migrate
    if (!hasLocalStorageData()) {
        logger_1.logger.info('📭 No localStorage data to migrate', { component: 'migration', operation: 'localstorageDataMigrate' });
        localStorage.setItem('serenity_migration_complete', 'true');
        return true;
    }
    logger_1.logger.info('🚀 Starting data migration from localStorage to SQLite...', { component: 'migration', operation: 'startingDataMigration' });
    try {
        // Initialize SQLite database
        const initResult = await window.electronAPI.sqlite.initialize();
        if (!initResult.success) {
            throw new Error(initResult.error);
        }
        // Get data from localStorage
        const data = getLocalStorageData();
        logger_1.logger.info(`📊 Migration data summary:
      - Tasks: ${data.tasks.length}
      - Projects: ${data.projects.length}
      - Journal Entries: ${data.journalEntries.length}`, { component: 'migration', operation: 'operation' });
        // Migrate data to SQLite
        const migrationResult = await window.electronAPI.sqlite.importFromLocalStorage(data);
        if (!migrationResult.success || !migrationResult.data) {
            throw new Error(migrationResult.error || 'Migration failed');
        }
        const { imported, errors } = migrationResult.data;
        logger_1.logger.info(`✅ Migration completed successfully!
      - Items imported: ${imported}
      - Errors: ${errors.length}`, { component: 'migration', operation: 'operation' });
        if (errors.length > 0) {
            logger_1.logger.warn('⚠️ Migration warnings', { component: 'migration', operation: 'migrationWarnings', metadata: { errors } });
        }
        // Clear localStorage data
        clearLocalStorageData();
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Migration failed:', { component: 'migration', operation: 'migrationFailed:' }, error);
        return false;
    }
}
/**
 * Load initial data from SQLite for Redux store
 */
async function loadInitialDataFromSQLite() {
    if (typeof window === 'undefined' || !window.electronAPI?.sqlite) {
        logger_1.logger.warn('⚠️ SQLite not available - using empty data', { component: 'migration', operation: 'sqliteNotAvailable' });
        return null;
    }
    try {
        logger_1.logger.info('📂 Loading initial data from SQLite...', { component: 'migration', operation: 'loadingInitialData' });
        const [tasksResult, projectsResult, journalResult] = await Promise.all([
            window.electronAPI.sqlite.getTasks(),
            window.electronAPI.sqlite.getProjects(),
            window.electronAPI.sqlite.getJournalEntries(),
        ]);
        if (!tasksResult.success || !projectsResult.success || !journalResult.success) {
            throw new Error('Failed to load data from SQLite');
        }
        const data = {
            tasks: tasksResult.data || [],
            projects: projectsResult.data || [],
            journalEntries: journalResult.data || [],
        };
        logger_1.logger.info(`📊 Loaded initial data:
      - Tasks: ${data.tasks.length}
      - Projects: ${data.projects.length}
      - Journal Entries: ${data.journalEntries.length}`, { component: 'migration', operation: 'operation' });
        return data;
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to load initial data from SQLite:', { component: 'migration', operation: 'failedLoadInitial' }, error);
        return null;
    }
}
/**
 * Backup current data before migration
 */
async function createMigrationBackup() {
    if (typeof window === 'undefined' || !window.electronAPI?.sqlite) {
        return false;
    }
    try {
        const data = getLocalStorageData();
        const backup = {
            timestamp: new Date().toISOString(),
            data,
            source: 'localStorage',
        };
        // Save backup to localStorage with a special key
        localStorage.setItem('serenity_migration_backup', JSON.stringify(backup));
        logger_1.logger.info('💾 Migration backup created', { component: 'migration', operation: 'migrationBackupCreated' });
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to create migration backup:', { component: 'migration', operation: 'failedCreateMigration' }, error);
        return false;
    }
}
