/**
 * Simplified persistence middleware that commits to SQLite early
 * Eliminates the complexity of dual localStorage/SQLite paths
 */
import { Middleware } from '@reduxjs/toolkit';
/**
 * Initialize SQLite persistence - called once at app startup
 */
export declare function initializeSQLitePersistence(): Promise<boolean>;
/**
 * Simplified persistence middleware - SQLite first, localStorage fallback only for specific data
 */
export declare const simplifiedPersistenceMiddleware: Middleware;
/**
 * Check if SQLite is initialized
 */
export declare function isSQLiteInitialized(): boolean;
/**
 * Force SQLite reinitialization (for testing/recovery)
 */
export declare function reinitializeSQLite(): Promise<boolean>;
//# sourceMappingURL=simplifiedPersistenceMiddleware.d.ts.map