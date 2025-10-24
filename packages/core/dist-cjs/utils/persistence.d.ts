/**
 * Enhanced localStorage-based persistence for Redux state
 * Provides save/load functionality with data validation and error recovery
 * Handles both browser and Node.js environments (Electron main process)
 */
import { Task, JournalEntry, Project } from '../types';
/**
 * Load tasks from localStorage with validation
 */
export declare const loadTasks: () => Task[];
/**
 * Save tasks to localStorage
 */
export declare const saveTasks: (tasks: Task[]) => void;
/**
 * Load journal entries from localStorage with validation
 */
export declare const loadJournalEntries: () => JournalEntry[];
/**
 * Save journal entries to localStorage
 */
export declare const saveJournalEntries: (entries: JournalEntry[]) => void;
/**
 * Load projects from localStorage with validation
 */
export declare const loadProjects: () => Project[];
/**
 * Save projects to localStorage
 */
export declare const saveProjects: (projects: Project[]) => void;
/**
 * Clear all stored data
 */
export declare const clearAllData: () => void;
/**
 * Check if there's any existing data in storage
 */
export declare const hasExistingData: () => boolean;
/**
 * Get storage usage statistics
 */
export declare const getStorageStats: () => {
    used: number;
    tasksSize: number;
    journalSize: number;
    projectsSize: number;
    totalEntries: number;
};
/**
 * Validate all stored data and return health report
 */
export declare const validateStoredData: () => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    stats: {
        validTasks: number;
        validJournalEntries: number;
        validProjects: number;
    };
};
/**
 * Clean up orphaned data and fix references
 */
export declare const cleanupOrphanedData: () => {
    fixed: number;
    removed: number;
};
