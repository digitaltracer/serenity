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
exports.initializeIntegrations = exports.initializeDatabaseConfig = exports.initializeSQLitePersistence = exports.initializeStoreData = exports.store = void 0;
// Use enhanced store with proper persistence - export through store.ts for consistency
var store_1 = require("./store");
Object.defineProperty(exports, "store", { enumerable: true, get: function () { return store_1.store; } });
Object.defineProperty(exports, "initializeStoreData", { enumerable: true, get: function () { return store_1.initializeStoreData; } });
var simplifiedPersistenceMiddleware_1 = require("./middleware/simplifiedPersistenceMiddleware");
Object.defineProperty(exports, "initializeSQLitePersistence", { enumerable: true, get: function () { return simplifiedPersistenceMiddleware_1.initializeSQLitePersistence; } });
__exportStar(require("./slices/tasksSlice"), exports);
__exportStar(require("./slices/projectsSlice"), exports);
__exportStar(require("./slices/journalSlice"), exports);
__exportStar(require("./slices/userSlice"), exports);
__exportStar(require("./slices/uiSlice"), exports);
__exportStar(require("./slices/tagsSlice"), exports);
__exportStar(require("./slices/authSlice"), exports);
__exportStar(require("./slices/databaseSlice"), exports);
var databaseSlice_1 = require("./slices/databaseSlice");
Object.defineProperty(exports, "initializeDatabaseConfig", { enumerable: true, get: function () { return databaseSlice_1.initializeDatabaseConfig; } });
__exportStar(require("./slices/shortcutsSlice"), exports);
__exportStar(require("./slices/searchSlice"), exports);
__exportStar(require("./slices/dragDropSlice"), exports);
__exportStar(require("./slices/integrationsSlice"), exports);
var integrationsSlice_1 = require("./slices/integrationsSlice");
Object.defineProperty(exports, "initializeIntegrations", { enumerable: true, get: function () { return integrationsSlice_1.initializeIntegrations; } });
__exportStar(require("./slices/aiAssistantSlice"), exports);
__exportStar(require("./slices/goalsSlice"), exports);
__exportStar(require("./slices/sampleData"), exports);
