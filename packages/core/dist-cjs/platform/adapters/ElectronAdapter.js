"use strict";
/**
 * Electron Platform Adapter
 *
 * Wraps Electron IPC calls (window.electronAPI) to implement the IPlatformAdapter interface.
 * This adapter is used when running in the Electron desktop environment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronAdapter = void 0;
class ElectronAdapter {
    constructor() {
        this.name = 'electron';
    }
    get isAvailable() {
        return typeof window !== 'undefined' && !!window.electronAPI;
    }
    get electronAPI() {
        if (!this.isAvailable) {
            throw new Error('Electron API is not available');
        }
        return window.electronAPI;
    }
    // ============================================================================
    // AI Services
    // ============================================================================
    async aiQuickAdd(options) {
        try {
            const result = await this.electronAPI.aiAssistant.quickAdd(options.text, options.provider, options.debug);
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async aiGetSettings() {
        try {
            const result = await this.electronAPI.aiAssistant.getSettings();
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async aiSetApiKey(provider, apiKey) {
        try {
            const result = await this.electronAPI.aiAssistant.setApiKey(provider, apiKey);
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async aiAnalyze(options) {
        try {
            const result = await this.electronAPI.aiAssistant.analyzeData({
                provider: options.provider,
                dataTypes: options.dataTypes,
                analysisMode: options.analysisMode,
                timeWindow: options.timeWindow,
            });
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async aiGenerateSummary(options) {
        try {
            const result = await this.electronAPI.aiAssistant.generateSummary({
                startDate: options.startDate,
                endDate: options.endDate,
                types: options.types,
                provider: options.provider,
            });
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    // ============================================================================
    // Database Services
    // ============================================================================
    async databaseGetStats() {
        try {
            // Electron stores data in Redux, so we might not need IPC for this
            // But if there's a specific IPC handler for database stats, use it
            const result = await this.electronAPI.database?.getStats();
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Database stats not available',
            };
        }
    }
    async databaseBackup() {
        try {
            const result = await this.electronAPI.database?.backup();
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Backup not available',
            };
        }
    }
    // ============================================================================
    // Integration Services
    // ============================================================================
    async integrationAuthGoogle() {
        try {
            const result = await this.electronAPI.integrations?.authenticateGoogle();
            return result || { success: false, error: 'No response from integration service' };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Google auth failed',
            };
        }
    }
    async integrationAuthGitHub() {
        try {
            const result = await this.electronAPI.integrations?.authenticateGitHub();
            return result || { success: false, error: 'No response from integration service' };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'GitHub auth failed',
            };
        }
    }
    async integrationSyncGoogle() {
        try {
            const result = await this.electronAPI.integrations?.syncGoogle();
            return result || { success: false, syncedItems: 0, error: 'No response from sync service' };
        }
        catch (error) {
            return {
                success: false,
                syncedItems: 0,
                error: error instanceof Error ? error.message : 'Google sync failed',
            };
        }
    }
    async integrationSyncGitHub() {
        try {
            const result = await this.electronAPI.integrations?.syncGitHub();
            return result || { success: false, syncedItems: 0, error: 'No response from sync service' };
        }
        catch (error) {
            return {
                success: false,
                syncedItems: 0,
                error: error instanceof Error ? error.message : 'GitHub sync failed',
            };
        }
    }
}
exports.ElectronAdapter = ElectronAdapter;
