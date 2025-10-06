/**
 * Enhanced localStorage-based persistence for Redux state
 * Provides save/load functionality with data validation and error recovery
 * Handles both browser and Node.js environments (Electron main process)
 */

import { Task, JournalEntry, Project } from '../types';
import { logger } from './logger';
import {
  safeValidateTasks, 
  safeValidateJournalEntries, 
  safeValidateProjects
} from '../validation';

/**
 * Check if localStorage is available (browser/renderer process)
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const STORAGE_KEYS = {
  TASKS: 'serenity_tasks',
  JOURNAL: 'serenity_journal',
  PROJECTS: 'serenity_projects',
  APP_DATA: 'serenity_app_data', // New unified storage key
  DATA_VERSION: 'serenity_data_version',
} as const;

const CURRENT_DATA_VERSION = '1.0.0';

// Enhanced helper to safely parse and validate JSON from localStorage
const safeJSONParse = <T>(data: string | null, fallback: T, validator?: (data: unknown) => T | null): T => {
  if (!data) return fallback;
  
  try {
    const parsed = JSON.parse(data);
    
    // Use validator if provided
    if (validator) {
      const validated = validator(parsed);
      return validated ?? fallback;
    }
    
    return parsed;
  } catch (error) {
    logger.error('Failed to parse stored data:', { component: 'persistence', operation: 'failedParseStored' }, error as Error);
    return fallback;
  }
};

// Helper to safely stringify and save to localStorage
const safeSave = (key: string, data: any): void => {
  if (!isLocalStorageAvailable()) {
    logger.warn(`localStorage not available, skipping save of ${key}`, { component: 'persistence', operation: 'operation' });
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.error(`Failed to save ${key} to localStorage:`, { component: 'persistence', operation: `failedSave${key}` }, error as Error);
  }
};

/**
 * Load tasks from localStorage with validation
 */
export const loadTasks = (): Task[] => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage not available, returning empty tasks array', { component: 'persistence', operation: 'operation' });
    return [];
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return safeJSONParse(data, [], safeValidateTasks);
};

/**
 * Save tasks to localStorage
 */
export const saveTasks = (tasks: Task[]): void => {
  try {
    // Validate tasks before saving
    const validatedTasks = safeValidateTasks(tasks);
    safeSave(STORAGE_KEYS.TASKS, validatedTasks);
    logger.info(`💾 Saved ${validatedTasks.length} tasks to localStorage`, { component: 'persistence', operation: 'saved${validatedtasks.length}Tasks' });
  } catch (error) {
    logger.error('Failed to save tasks:', { component: 'persistence', operation: 'failedSaveTasks:' }, error as Error);
  }
};

/**
 * Load journal entries from localStorage with validation
 */
export const loadJournalEntries = (): JournalEntry[] => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage not available, returning empty journal entries array', { component: 'persistence', operation: 'operation' });
    return [];
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.JOURNAL);
  return safeJSONParse(data, [], safeValidateJournalEntries);
};

/**
 * Save journal entries to localStorage
 */
export const saveJournalEntries = (entries: JournalEntry[]): void => {
  try {
    // Validate entries before saving
    const validatedEntries = safeValidateJournalEntries(entries);
    safeSave(STORAGE_KEYS.JOURNAL, validatedEntries);
    logger.info(`📖 Saved ${validatedEntries.length} journal entries to localStorage`, { component: 'persistence', operation: 'saved${validatedentries.length}Journal' });
  } catch (error) {
    logger.error('Failed to save journal entries:', { component: 'persistence', operation: 'failedSaveJournal' }, error as Error);
  }
};

/**
 * Load projects from localStorage with validation
 */
export const loadProjects = (): Project[] => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage not available, returning empty projects array', { component: 'persistence', operation: 'operation' });
    return [];
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return safeJSONParse(data, [], safeValidateProjects);
};

/**
 * Save projects to localStorage
 */
export const saveProjects = (projects: Project[]): void => {
  try {
    // Validate projects before saving
    const validatedProjects = safeValidateProjects(projects);
    safeSave(STORAGE_KEYS.PROJECTS, validatedProjects);
    logger.info(`📁 Saved ${validatedProjects.length} projects to localStorage`, { component: 'persistence', operation: 'saved${validatedprojects.length}Projects' });
  } catch (error) {
    logger.error('Failed to save projects:', { component: 'persistence', operation: 'failedSaveProjects:' }, error as Error);
  }
};

/**
 * Clear all stored data
 */
export const clearAllData = (): void => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage not available, cannot clear data', { component: 'persistence', operation: 'operation' });
    return;
  }
  
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.JOURNAL);
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
};

/**
 * Check if there's any existing data in storage
 */
export const hasExistingData = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  return !!(
    localStorage.getItem(STORAGE_KEYS.TASKS) ||
    localStorage.getItem(STORAGE_KEYS.JOURNAL) ||
    localStorage.getItem(STORAGE_KEYS.PROJECTS) ||
    localStorage.getItem(STORAGE_KEYS.APP_DATA)
  );
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = (): {
  used: number;
  tasksSize: number;
  journalSize: number;
  projectsSize: number;
  totalEntries: number;
} => {
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
  const taskCount = loadTasks().length;
  const journalCount = loadJournalEntries().length;
  const projectCount = loadProjects().length;
  
  return {
    used: totalSize,
    tasksSize,
    journalSize,
    projectsSize,
    totalEntries: taskCount + journalCount + projectCount,
  };
};

/**
 * Validate all stored data and return health report
 */
export const validateStoredData = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    validTasks: number;
    validJournalEntries: number;
    validProjects: number;
  };
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
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
      const tasks = safeValidateTasks(JSON.parse(tasksData));
      validTasks = tasks.length;
      if (tasks.length === 0 && tasksData !== '[]') {
        errors.push('Tasks data is corrupted or invalid');
      }
    }
  } catch (error) {
    errors.push(`Tasks validation failed: ${error}`);
  }

  try {
    // Validate journal entries
    const journalData = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    if (journalData) {
      const entries = safeValidateJournalEntries(JSON.parse(journalData));
      validJournalEntries = entries.length;
      if (entries.length === 0 && journalData !== '[]') {
        errors.push('Journal entries data is corrupted or invalid');
      }
    }
  } catch (error) {
    errors.push(`Journal validation failed: ${error}`);
  }

  try {
    // Validate projects
    const projectsData = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (projectsData) {
      const projects = safeValidateProjects(JSON.parse(projectsData));
      validProjects = projects.length;
      if (projects.length === 0 && projectsData !== '[]') {
        errors.push('Projects data is corrupted or invalid');
      }
    }
  } catch (error) {
    errors.push(`Projects validation failed: ${error}`);
  }

  // Check for orphaned data
  const tasks = loadTasks();
  const projects = loadProjects();
  const projectIds = new Set(projects.map(p => p.id));
  
  const orphanedTasks = tasks.filter(task => 
    task.projectId && !projectIds.has(task.projectId)
  );
  
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

/**
 * Clean up orphaned data and fix references
 */
export const cleanupOrphanedData = (): {
  fixed: number;
  removed: number;
} => {
  let fixed = 0;
  let removed = 0;
  
  const tasks = loadTasks();
  const projects = loadProjects();
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
  saveTasks(cleanedTasks);
  
  logger.info(`🧹 Cleanup completed: ${fixed} references fixed, ${removed} items removed`, { component: 'persistence', operation: 'operation' });
  
  return { fixed, removed };
};