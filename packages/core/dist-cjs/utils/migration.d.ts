/**
 * Data migration utilities for moving from localStorage to SQLite
 */
import { Task, Project, JournalEntry } from '../types';
/**
 * Check if there's existing localStorage data that needs migration
 */
export declare function hasLocalStorageData(): boolean;
/**
 * Get all data from localStorage for migration
 */
export declare function getLocalStorageData(): {
    tasks: Task[];
    projects: Project[];
    journalEntries: JournalEntry[];
};
/**
 * Clear localStorage data after successful migration
 */
export declare function clearLocalStorageData(): void;
/**
 * Check if migration has already been completed
 */
export declare function isMigrationComplete(): boolean;
/**
 * Migrate data from localStorage to SQLite
 */
export declare function migrateToSQLite(): Promise<boolean>;
/**
 * Load initial data from SQLite for Redux store
 */
export declare function loadInitialDataFromSQLite(): Promise<{
    tasks: Task[];
    projects: Project[];
    journalEntries: JournalEntry[];
} | null>;
/**
 * Backup current data before migration
 */
export declare function createMigrationBackup(): Promise<boolean>;
//# sourceMappingURL=migration.d.ts.map