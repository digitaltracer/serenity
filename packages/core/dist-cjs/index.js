"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCompactMode = exports.checkSQLiteAvailability = exports.getDatabaseStats = exports.initializeStoreData = exports.store = exports.migratePasswordHash = exports.needsPasswordMigration = exports.removePostgreSQLConfigSecure = exports.getPostgreSQLConfigSecure = exports.savePostgreSQLConfigSecure = exports.secureSessionManager = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./validation"), exports);
__exportStar(require("./database/DatabaseManager"), exports);
// Export secure session manager for secure password handling
var secureSessionManager_1 = require("./utils/secureSessionManager");
Object.defineProperty(exports, "secureSessionManager", { enumerable: true, get: function () { return secureSessionManager_1.secureSessionManager; } });
__exportStar(require("./hooks/useKeyboardShortcuts"), exports);
__exportStar(require("./hooks/useDragDrop"), exports);
__exportStar(require("./services/googleCalendarService"), exports);
__exportStar(require("./services/githubService"), exports);
__exportStar(require("./services/integrationSyncService"), exports);
__exportStar(require("./services/encryptedIntegrationService"), exports);
__exportStar(require("./services/biometricAuthService"), exports);
__exportStar(require("./services/aiAssistantService"), exports);
// Export secure storage functions
var secureStorage_1 = require("./utils/secureStorage");
Object.defineProperty(exports, "savePostgreSQLConfigSecure", { enumerable: true, get: function () { return secureStorage_1.savePostgreSQLConfigSecure; } });
Object.defineProperty(exports, "getPostgreSQLConfigSecure", { enumerable: true, get: function () { return secureStorage_1.getPostgreSQLConfigSecure; } });
Object.defineProperty(exports, "removePostgreSQLConfigSecure", { enumerable: true, get: function () { return secureStorage_1.removePostgreSQLConfigSecure; } });
// Export password migration functions
var privacy_1 = require("./utils/privacy");
Object.defineProperty(exports, "needsPasswordMigration", { enumerable: true, get: function () { return privacy_1.needsPasswordMigration; } });
Object.defineProperty(exports, "migratePasswordHash", { enumerable: true, get: function () { return privacy_1.migratePasswordHash; } });
// Use enhanced store with proper persistence but also export all slice functionality
var enhancedStore_1 = require("./store/enhancedStore");
Object.defineProperty(exports, "store", { enumerable: true, get: function () { return enhancedStore_1.store; } });
Object.defineProperty(exports, "initializeStoreData", { enumerable: true, get: function () { return enhancedStore_1.initializeStoreData; } });
Object.defineProperty(exports, "getDatabaseStats", { enumerable: true, get: function () { return enhancedStore_1.getDatabaseStats; } });
Object.defineProperty(exports, "checkSQLiteAvailability", { enumerable: true, get: function () { return enhancedStore_1.checkSQLiteAvailability; } });
// Export all store functionality
__exportStar(require("./store"), exports);
// Explicit selector re-exports used by UI package
var uiSlice_1 = require("./store/slices/uiSlice");
Object.defineProperty(exports, "selectCompactMode", { enumerable: true, get: function () { return uiSlice_1.selectCompactMode; } });
