"use strict";
/**
 * Platform Service
 *
 * Auto-detects the platform (Electron vs Web) and provides the appropriate adapter.
 * This is the main entry point for all platform-specific operations.
 *
 * Usage:
 *   import { platformService } from '@serenity/core';
 *   const result = await platformService.aiQuickAdd({ text, provider });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformService = exports.platformService = void 0;
const ElectronAdapter_1 = require("./adapters/ElectronAdapter");
const WebAdapter_1 = require("./adapters/WebAdapter");
class PlatformService {
    constructor() {
        // Detect platform and initialize appropriate adapter
        if (this.isElectronEnvironment()) {
            this.adapter = new ElectronAdapter_1.ElectronAdapter();
            this._platformType = 'electron';
        }
        else {
            this.adapter = new WebAdapter_1.WebAdapter();
            this._platformType = 'web';
        }
    }
    /**
     * Detect if we're running in Electron environment
     */
    isElectronEnvironment() {
        return typeof window !== 'undefined' && !!window.electronAPI;
    }
    /**
     * Get current platform information
     */
    get platformInfo() {
        return {
            type: this._platformType,
            isElectron: this._platformType === 'electron',
            isWeb: this._platformType === 'web',
            adapter: this.adapter,
        };
    }
    /**
     * Get platform type
     */
    get platformType() {
        return this._platformType;
    }
    /**
     * Check if running on Electron
     */
    get isElectron() {
        return this._platformType === 'electron';
    }
    /**
     * Check if running on Web
     */
    get isWeb() {
        return this._platformType === 'web';
    }
    // ============================================================================
    // IPlatformAdapter Implementation - Delegates to active adapter
    // ============================================================================
    get name() {
        return this.adapter.name;
    }
    get isAvailable() {
        return this.adapter.isAvailable;
    }
    // AI Services
    async aiQuickAdd(options) {
        return this.adapter.aiQuickAdd(options);
    }
    async aiGetSettings() {
        return this.adapter.aiGetSettings();
    }
    async aiSetApiKey(provider, apiKey) {
        return this.adapter.aiSetApiKey(provider, apiKey);
    }
    async aiAnalyze(options) {
        return this.adapter.aiAnalyze(options);
    }
    async aiGenerateSummary(options) {
        return this.adapter.aiGenerateSummary(options);
    }
    // Database Services
    async databaseGetStats() {
        return this.adapter.databaseGetStats();
    }
    async databaseBackup() {
        return this.adapter.databaseBackup();
    }
    // Integration Services
    async integrationAuthGoogle() {
        return this.adapter.integrationAuthGoogle();
    }
    async integrationAuthGitHub() {
        return this.adapter.integrationAuthGitHub();
    }
    async integrationSyncGoogle() {
        return this.adapter.integrationSyncGoogle();
    }
    async integrationSyncGitHub() {
        return this.adapter.integrationSyncGitHub();
    }
}
exports.PlatformService = PlatformService;
// Singleton instance
exports.platformService = new PlatformService();
