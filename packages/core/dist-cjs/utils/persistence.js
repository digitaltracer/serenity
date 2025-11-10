"use strict";
/**
 * Enhanced localStorage-based persistence for Redux state
 * Provides save/load functionality with data validation and error recovery
 * Handles both browser and Node.js environments (Electron main process)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOrphanedData = exports.validateStoredData = exports.getStorageStats = exports.hasExistingData = exports.clearAllData = exports.saveProjects = exports.loadProjects = exports.saveJournalEntries = exports.loadJournalEntries = exports.saveTasks = exports.loadTasks = void 0;
const logger_1 = require("./logger");
const validation_1 = require("../validation");
/**
 * Check if localStorage is available (browser/renderer process)
 */
const isLocalStorageAvailable = () => {
    try {
        return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    }
    catch {
        return false;
    }
};
const STORAGE_KEYS = {
    TASKS: 'serenity_tasks',
    JOURNAL: 'serenity_journal',
    PROJECTS: 'serenity_projects',
    APP_DATA: 'serenity_app_data', // New unified storage key
    DATA_VERSION: 'serenity_data_version',
};
const CURRENT_DATA_VERSION = '1.0.0';
// Enhanced helper to safely parse and validate JSON from localStorage
const safeJSONParse = (data, fallback, validator) => {
    if (!data)
        return fallback;
    try {
        const parsed = JSON.parse(data);
        // Use validator if provided
        if (validator) {
            const validated = validator(parsed);
            return validated ?? fallback;
        }
        return parsed;
    }
    catch (error) {
        logger_1.logger.error('Failed to parse stored data:', { component: 'persistence', operation: 'failedParseStored' }, error);
        return fallback;
    }
};
// Helper to safely stringify and save to localStorage
const safeSave = (key, data) => {
    if (!isLocalStorageAvailable()) {
        logger_1.logger.warn(`localStorage not available, skipping save of ${key}`, { component: 'persistence', operation: 'operation' });
        return;
    }
    try {
        localStorage.setItem(key, JSON.stringify(data));
    }
    catch (error) {
        logger_1.logger.error(`Failed to save ${key} to localStorage:`, { component: 'persistence', operation: `failedSave${key}` }, error);
    }
};
/**
 * Load tasks from localStorage with validation
 */
const loadTasks = () => {
    if (!isLocalStorageAvailable()) {
        logger_1.logger.warn('localStorage not available, returning empty tasks array', { component: 'persistence', operation: 'operation' });
        return [];
    }
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return safeJSONParse(data, [], validation_1.safeValidateTasks);
};
exports.loadTasks = loadTasks;
/**
 * Save tasks to localStorage
 */
const saveTasks = (tasks) => {
    try {
        // Validate tasks before saving
        const validatedTasks = (0, validation_1.safeValidateTasks)(tasks);
        safeSave(STORAGE_KEYS.TASKS, validatedTasks);
        logger_1.logger.info(`💾 Saved ${validatedTasks.length} tasks to localStorage`, { component: 'persistence', operation: 'saved${validatedtasks.length}Tasks' });
    }
    catch (error) {
        logger_1.logger.error('Failed to save tasks:', { component: 'persistence', operation: 'failedSaveTasks:' }, error);
    }
};
exports.saveTasks = saveTasks;
/**
 * Load journal entries from localStorage with validation
 */
const loadJournalEntries = () => {
    if (!isLocalStorageAvailable()) {
        logger_1.logger.warn('localStorage not available, returning empty journal entries array', { component: 'persistence', operation: 'operation' });
        return [];
    }
    const data = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    return safeJSONParse(data, [], validation_1.safeValidateJournalEntries);
};
exports.loadJournalEntries = loadJournalEntries;
/**
 * Save journal entries to localStorage
 */
const saveJournalEntries = (entries) => {
    try {
        // Validate entries before saving
        const validatedEntries = (0, validation_1.safeValidateJournalEntries)(entries);
        safeSave(STORAGE_KEYS.JOURNAL, validatedEntries);
        logger_1.logger.info(`📖 Saved ${validatedEntries.length} journal entries to localStorage`, { component: 'persistence', operation: 'saved${validatedentries.length}Journal' });
    }
    catch (error) {
        logger_1.logger.error('Failed to save journal entries:', { component: 'persistence', operation: 'failedSaveJournal' }, error);
    }
};
exports.saveJournalEntries = saveJournalEntries;
/**
 * Load projects from localStorage with validation
 */
const loadProjects = () => {
    if (!isLocalStorageAvailable()) {
        logger_1.logger.warn('localStorage not available, returning empty projects array', { component: 'persistence', operation: 'operation' });
        return [];
    }
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return safeJSONParse(data, [], validation_1.safeValidateProjects);
};
exports.loadProjects = loadProjects;
/**
 * Save projects to localStorage
 */
const saveProjects = (projects) => {
    try {
        // Validate projects before saving
        const validatedProjects = (0, validation_1.safeValidateProjects)(projects);
        safeSave(STORAGE_KEYS.PROJECTS, validatedProjects);
        logger_1.logger.info(`📁 Saved ${validatedProjects.length} projects to localStorage`, { component: 'persistence', operation: 'saved${validatedprojects.length}Projects' });
    }
    catch (error) {
        logger_1.logger.error('Failed to save projects:', { component: 'persistence', operation: 'failedSaveProjects:' }, error);
    }
};
exports.saveProjects = saveProjects;
/**
 * Clear all stored data
 */
const clearAllData = () => {
    if (!isLocalStorageAvailable()) {
        logger_1.logger.warn('localStorage not available, cannot clear data', { component: 'persistence', operation: 'operation' });
        return;
    }
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.JOURNAL);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
};
exports.clearAllData = clearAllData;
/**
 * Check if there's any existing data in storage
 */
const hasExistingData = () => {
    if (!isLocalStorageAvailable()) {
        return false;
    }
    return !!(localStorage.getItem(STORAGE_KEYS.TASKS) ||
        localStorage.getItem(STORAGE_KEYS.JOURNAL) ||
        localStorage.getItem(STORAGE_KEYS.PROJECTS) ||
        localStorage.getItem(STORAGE_KEYS.APP_DATA));
};
exports.hasExistingData = hasExistingData;
/**
 * Get storage usage statistics
 */
const getStorageStats = () => {
    if (!isLocalStorageAvailable()) {
        return {
            used: 0,
            tasksSize: 0,
            journalSize: 0,
            projectsSize: 0,
            totalEntries: 0,
        };
    }
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS) || '';
    const journal = localStorage.getItem(STORAGE_KEYS.JOURNAL) || '';
    const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS) || '';
    const tasksSize = new Blob([tasks]).size;
    const journalSize = new Blob([journal]).size;
    const projectsSize = new Blob([projects]).size;
    const totalSize = tasksSize + journalSize + projectsSize;
    // Count entries
    const taskCount = (0, exports.loadTasks)().length;
    const journalCount = (0, exports.loadJournalEntries)().length;
    const projectCount = (0, exports.loadProjects)().length;
    return {
        used: totalSize,
        tasksSize,
        journalSize,
        projectsSize,
        totalEntries: taskCount + journalCount + projectCount,
    };
};
exports.getStorageStats = getStorageStats;
/**
 * Validate all stored data and return health report
 */
const validateStoredData = () => {
    const errors = [];
    const warnings = [];
    let validTasks = 0;
    let validJournalEntries = 0;
    let validProjects = 0;
    if (!isLocalStorageAvailable()) {
        return {
            isValid: true,
            errors: [],
            warnings: ['localStorage not available'],
            stats: {
                validTasks: 0,
                validJournalEntries: 0,
                validProjects: 0,
            },
        };
    }
    try {
        // Validate tasks
        const tasksData = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (tasksData) {
            const tasks = (0, validation_1.safeValidateTasks)(JSON.parse(tasksData));
            validTasks = tasks.length;
            if (tasks.length === 0 && tasksData !== '[]') {
                errors.push('Tasks data is corrupted or invalid');
            }
        }
    }
    catch (error) {
        errors.push(`Tasks validation failed: ${error}`);
    }
    try {
        // Validate journal entries
        const journalData = localStorage.getItem(STORAGE_KEYS.JOURNAL);
        if (journalData) {
            const entries = (0, validation_1.safeValidateJournalEntries)(JSON.parse(journalData));
            validJournalEntries = entries.length;
            if (entries.length === 0 && journalData !== '[]') {
                errors.push('Journal entries data is corrupted or invalid');
            }
        }
    }
    catch (error) {
        errors.push(`Journal validation failed: ${error}`);
    }
    try {
        // Validate projects
        const projectsData = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (projectsData) {
            const projects = (0, validation_1.safeValidateProjects)(JSON.parse(projectsData));
            validProjects = projects.length;
            if (projects.length === 0 && projectsData !== '[]') {
                errors.push('Projects data is corrupted or invalid');
            }
        }
    }
    catch (error) {
        errors.push(`Projects validation failed: ${error}`);
    }
    // Check for orphaned data
    const tasks = (0, exports.loadTasks)();
    const projects = (0, exports.loadProjects)();
    const projectIds = new Set(projects.map(p => p.id));
    const orphanedTasks = tasks.filter(task => task.projectId && !projectIds.has(task.projectId));
    if (orphanedTasks.length > 0) {
        warnings.push(`Found ${orphanedTasks.length} tasks with invalid project references`);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats: {
            validTasks,
            validJournalEntries,
            validProjects,
        },
    };
};
exports.validateStoredData = validateStoredData;
/**
 * Clean up orphaned data and fix references
 */
const cleanupOrphanedData = () => {
    let fixed = 0;
    let removed = 0;
    const tasks = (0, exports.loadTasks)();
    const projects = (0, exports.loadProjects)();
    const projectIds = new Set(projects.map(p => p.id));
    // Fix tasks with invalid project references
    const cleanedTasks = tasks.map(task => {
        if (task.projectId && !projectIds.has(task.projectId)) {
            fixed++;
            return { ...task, projectId: undefined };
        }
        return task;
    });
    // Save cleaned data
    (0, exports.saveTasks)(cleanedTasks);
    logger_1.logger.info(`🧹 Cleanup completed: ${fixed} references fixed, ${removed} items removed`, { component: 'persistence', operation: 'operation' });
    return { fixed, removed };
};
exports.cleanupOrphanedData = cleanupOrphanedData;
