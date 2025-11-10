"use strict";
/**
 * Platform Abstraction Layer
 *
 * Provides a unified interface for platform-specific operations that works
 * across Electron desktop app and Next.js web app.
 *
 * Usage:
 *   import { platformService } from '@serenity/core';
 *
 *   // Automatically uses correct adapter (Electron or Web)
 *   const result = await platformService.aiQuickAdd({
 *     text: 'Buy groceries tomorrow',
 *     provider: 'openai'
 *   });
 */
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
exports.platformService = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./PlatformService"), exports);
__exportStar(require("./adapters/ElectronAdapter"), exports);
__exportStar(require("./adapters/WebAdapter"), exports);
// Re-export singleton for convenience
var PlatformService_1 = require("./PlatformService");
Object.defineProperty(exports, "platformService", { enumerable: true, get: function () { return PlatformService_1.platformService; } });
