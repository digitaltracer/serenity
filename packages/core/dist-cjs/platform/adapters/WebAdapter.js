"use strict";
/**
 * Web Platform Adapter
 *
 * Makes fetch calls to Next.js API routes to implement the IPlatformAdapter interface.
 * This adapter is used when running in the web browser environment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAdapter = void 0;
class WebAdapter {
    constructor(baseUrl = '/api') {
        this.name = 'web';
        this.baseUrl = baseUrl;
    }
    get isAvailable() {
        // Web adapter is always available in browser environment
        return typeof window !== 'undefined';
    }
    async fetch(endpoint, options) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }
    // ============================================================================
    // AI Services
    // ============================================================================
    async aiQuickAdd(options) {
        try {
            const result = await this.fetch('/ai/quick-add', {
                method: 'POST',
                body: JSON.stringify(options),
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
    async aiGetSettings() {
        try {
            const result = await this.fetch('/ai/settings', {
                method: 'GET',
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
    async aiSetApiKey(provider, apiKey) {
        try {
            const result = await this.fetch('/ai/api-key', {
                method: 'POST',
                body: JSON.stringify({ provider, apiKey }),
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
    async aiRemoveApiKey(provider) {
        try {
            const result = await this.fetch(`/ai/api-key?provider=${provider}`, {
                method: 'DELETE',
            });
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to remove API key',
            };
        }
    }
    async aiListUsage(limit = 500) {
        try {
            const result = await this.fetch(`/ai/usage?limit=${limit}`, {
                method: 'GET',
            });
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list usage',
            };
        }
    }
    async aiAnalyze(options) {
        try {
            const result = await this.fetch('/ai/analyze', {
                method: 'POST',
                body: JSON.stringify(options),
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
            const result = await this.fetch('/ai/summary', {
                method: 'POST',
                body: JSON.stringify(options),
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
            const result = await this.fetch('/database/stats', {
                method: 'GET',
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
    async databaseBackup() {
        try {
            const result = await this.fetch('/database/backup', {
                method: 'POST',
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
    // Integration Services
    // ============================================================================
    async integrationAuthGoogle() {
        try {
            // For OAuth, we might redirect to the OAuth flow
            const result = await this.fetch('/integrations/google/auth', {
                method: 'POST',
            });
            return result;
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
            const result = await this.fetch('/integrations/github/auth', {
                method: 'POST',
            });
            return result;
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
            const result = await this.fetch('/integrations/google/sync', {
                method: 'POST',
            });
            return result;
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
            const result = await this.fetch('/integrations/github/sync', {
                method: 'POST',
            });
            return result;
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
exports.WebAdapter = WebAdapter;
