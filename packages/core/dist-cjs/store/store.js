"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeStoreData = exports.store = void 0;
// Re-export the enhanced store with proper persistence
var enhancedStore_1 = require("./enhancedStore");
Object.defineProperty(exports, "store", { enumerable: true, get: function () { return enhancedStore_1.store; } });
Object.defineProperty(exports, "initializeStoreData", { enumerable: true, get: function () { return enhancedStore_1.initializeStoreData; } });
