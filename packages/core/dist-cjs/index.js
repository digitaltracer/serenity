"use strict";
/// <reference path="./types/electron.d.ts" />
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
exports.selectCompactMode = exports.WebApiPersistenceClient = exports.checkSQLiteAvailability = exports.getDatabaseStats = exports.initializeStoreData = exports.store = exports.migratePasswordHash = exports.needsPasswordMigration = exports.removePostgreSQLConfigSecure = exports.getPostgreSQLConfigSecure = exports.savePostgreSQLConfigSecure = exports.AISummarizationService = exports.ThemeTrackingService = exports.VisualizationService = exports.AIPreprocessingService = exports.AICredentialService = exports.EncryptedIntegrationService = exports.secureSessionManager = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./validation"), exports);
__exportStar(require("./database/DatabaseManager"), exports);
// Export platform abstraction layer for cross-platform compatibility
__exportStar(require("./platform"), exports);
// Export secure session manager for secure password handling
var secureSessionManager_1 = require("./utils/secureSessionManager");
Object.defineProperty(exports, "secureSessionManager", { enumerable: true, get: function () { return secureSessionManager_1.secureSessionManager; } });
__exportStar(require("./hooks/useKeyboardShortcuts"), exports);
__exportStar(require("./hooks/useDragDrop"), exports);
__exportStar(require("./services/googleCalendarService"), exports);
__exportStar(require("./services/githubService"), exports);
__exportStar(require("./services/integrationSyncService"), exports);
// Export only the service class, not the EncryptedIntegrationData type
// (EncryptedIntegrationData is exported from ./types/ipc)
var encryptedIntegrationService_1 = require("./services/encryptedIntegrationService");
Object.defineProperty(exports, "EncryptedIntegrationService", { enumerable: true, get: function () { return encryptedIntegrationService_1.EncryptedIntegrationService; } });
// biometricAuthService is only used dynamically to avoid bundle conflicts
__exportStar(require("./services/aiAssistantService"), exports);
var aiCredentialService_1 = require("./services/aiCredentialService");
Object.defineProperty(exports, "AICredentialService", { enumerable: true, get: function () { return aiCredentialService_1.AICredentialService; } });
// Re-export preprocessing service but avoid duplicate exports
var aiPreprocessingService_1 = require("./services/aiPreprocessingService");
Object.defineProperty(exports, "AIPreprocessingService", { enumerable: true, get: function () { return aiPreprocessingService_1.AIPreprocessingService; } });
__exportStar(require("./services/promptEngineeringService"), exports);
__exportStar(require("./services/insightQualityService"), exports);
__exportStar(require("./services/userProfileService"), exports);
// Export visualizationService but avoid duplicating KPIMetrics and TimeRange from insightsSlice
var visualizationService_1 = require("./services/visualizationService");
Object.defineProperty(exports, "VisualizationService", { enumerable: true, get: function () { return visualizationService_1.VisualizationService; } });
__exportStar(require("./services/actionabilityService"), exports);
__exportStar(require("./services/feedbackService"), exports);
var themeTrackingService_1 = require("./services/themeTrackingService");
Object.defineProperty(exports, "ThemeTrackingService", { enumerable: true, get: function () { return themeTrackingService_1.ThemeTrackingService; } });
var aiSummarizationService_1 = require("./services/aiSummarizationService");
Object.defineProperty(exports, "AISummarizationService", { enumerable: true, get: function () { return aiSummarizationService_1.AISummarizationService; } });
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
// Persistence DI for server-centric web apps
__exportStar(require("./persistence/PersistenceClient"), exports);
var WebApiPersistenceClient_1 = require("./persistence/WebApiPersistenceClient");
Object.defineProperty(exports, "WebApiPersistenceClient", { enumerable: true, get: function () { return WebApiPersistenceClient_1.WebApiPersistenceClient; } });
// Explicit selector re-exports used by UI package
var uiSlice_1 = require("./store/slices/uiSlice");
Object.defineProperty(exports, "selectCompactMode", { enumerable: true, get: function () { return uiSlice_1.selectCompactMode; } });
// Export journal templates
__exportStar(require("./journal/templates"), exports);
