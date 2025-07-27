/**
 * Data migration utilities for moving from localStorage to SQLite
 */

import { Task, Project, JournalEntry } from '../types';

/**
 * Check if there's existing localStorage data that needs migration
 */
export function hasLocalStorageData(): boolean {
  const tasks = localStorage.getItem('serenity_tasks');
  const projects = localStorage.getItem('serenity_projects');
  const journal = localStorage.getItem('serenity_journal_entries');
  
  return !!(tasks || projects || journal);
}

/**
 * Get all data from localStorage for migration
 */
export function getLocalStorageData(): {
  tasks: Task[];
  projects: Project[];
  journalEntries: JournalEntry[];
} {
  const tasks = JSON.parse(localStorage.getItem('serenity_tasks') || '[]');
  const projects = JSON.parse(localStorage.getItem('serenity_projects') || '[]');
  const journalEntries = JSON.parse(localStorage.getItem('serenity_journal_entries') || '[]');
  
  // Convert date strings back to Date objects
  const processedTasks = tasks.map((task: any) => ({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  }));
  
  const processedProjects = projects.map((project: any) => ({
    ...project,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  }));
  
  const processedJournalEntries = journalEntries.map((entry: any) => ({
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
export function clearLocalStorageData(): void {
  localStorage.removeItem('serenity_tasks');
  localStorage.removeItem('serenity_projects');
  localStorage.removeItem('serenity_journal_entries');
  
  // Mark migration as complete
  localStorage.setItem('serenity_migration_complete', 'true');
  
  console.log('🧹 LocalStorage data cleared after migration');
}

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem('serenity_migration_complete') === 'true';
}

/**
 * Migrate data from localStorage to SQLite
 */
export async function migrateToSQLite(): Promise<boolean> {
  // Check if we're in Electron environment
  if (typeof window === 'undefined' || !window.electronAPI?.sqlite) {
    console.warn('⚠️ SQLite not available - skipping migration');
    return false;
  }
  
  // Check if migration is already complete
  if (isMigrationComplete()) {
    console.log('✅ Migration already completed');
    return true;
  }
  
  // Check if there's data to migrate
  if (!hasLocalStorageData()) {
    console.log('📭 No localStorage data to migrate');
    localStorage.setItem('serenity_migration_complete', 'true');
    return true;
  }
  
  console.log('🚀 Starting data migration from localStorage to SQLite...');
  
  try {
    // Initialize SQLite database
    const initResult = await window.electronAPI!.sqlite!.initialize();
    if (!initResult.success) {
      throw new Error(initResult.error);
    }
    
    // Get data from localStorage
    const data = getLocalStorageData();
    
    console.log(`📊 Migration data summary:
      - Tasks: ${data.tasks.length}
      - Projects: ${data.projects.length}
      - Journal Entries: ${data.journalEntries.length}`);
    
    // Migrate data to SQLite
    const migrationResult = await window.electronAPI!.sqlite!.importFromLocalStorage(data);
    
    if (!migrationResult.success) {
      throw new Error(migrationResult.error);
    }
    
    const { imported, errors } = migrationResult.result;
    
    console.log(`✅ Migration completed successfully!
      - Items imported: ${imported}
      - Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.warn('⚠️ Migration warnings:', errors);
    }
    
    // Clear localStorage data
    clearLocalStorageData();
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

/**
 * Load initial data from SQLite for Redux store
 */
export async function loadInitialDataFromSQLite(): Promise<{
  tasks: Task[];
  projects: Project[];
  journalEntries: JournalEntry[];
} | null> {
  if (typeof window === 'undefined' || !window.electronAPI?.sqlite) {
    console.warn('⚠️ SQLite not available - using empty data');
    return null;
  }
  
  try {
    console.log('📂 Loading initial data from SQLite...');
    
    const [tasksResult, projectsResult, journalResult] = await Promise.all([
      window.electronAPI!.sqlite!.getTasks(),
      window.electronAPI!.sqlite!.getProjects(),
      window.electronAPI!.sqlite!.getJournalEntries(),
    ]);
    
    if (!tasksResult.success || !projectsResult.success || !journalResult.success) {
      throw new Error('Failed to load data from SQLite');
    }
    
    const data = {
      tasks: tasksResult.data || [],
      projects: projectsResult.data || [],
      journalEntries: journalResult.data || [],
    };
    
    console.log(`📊 Loaded initial data:
      - Tasks: ${data.tasks.length}
      - Projects: ${data.projects.length}
      - Journal Entries: ${data.journalEntries.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to load initial data from SQLite:', error);
    return null;
  }
}

/**
 * Backup current data before migration
 */
export async function createMigrationBackup(): Promise<boolean> {
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
    console.log('💾 Migration backup created');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create migration backup:', error);
    return false;
  }
}