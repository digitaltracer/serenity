/**
 * Web Platform Adapter
 *
 * Makes fetch calls to Next.js API routes to implement the IPlatformAdapter interface.
 * This adapter is used when running in the web browser environment.
 */

import {
  IPlatformAdapter,
  AIQuickAddOptions,
  AIQuickAddResult,
  AISettingsResult,
  AIAnalyzeOptions,
  AIGenerateSummaryOptions,
  DatabaseStats,
  IntegrationAuthResult,
  IntegrationSyncResult,
} from '../types';

export class WebAdapter implements IPlatformAdapter {
  readonly name = 'web' as const;
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  get isAvailable(): boolean {
    // Web adapter is always available in browser environment
    return typeof window !== 'undefined';
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

  async aiQuickAdd(options: AIQuickAddOptions): Promise<AIQuickAddResult> {
    try {
      const result = await this.fetch<AIQuickAddResult>('/ai/quick-add', {
        method: 'POST',
        body: JSON.stringify(options),
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async aiGetSettings(): Promise<AISettingsResult> {
    try {
      const result = await this.fetch<AISettingsResult>('/ai/settings', {
        method: 'GET',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async aiSetApiKey(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.fetch<{ success: boolean; error?: string }>('/ai/api-key', {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey }),
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async aiAnalyze(options: AIAnalyzeOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.fetch<{ success: boolean; error?: string }>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(options),
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async aiGenerateSummary(options: AIGenerateSummaryOptions): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.fetch<{ success: boolean; data?: any; error?: string }>('/ai/summary', {
        method: 'POST',
        body: JSON.stringify(options),
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Database Services
  // ============================================================================

  async databaseGetStats(): Promise<{ success: boolean; stats?: DatabaseStats; error?: string }> {
    try {
      const result = await this.fetch<{ success: boolean; stats?: DatabaseStats; error?: string }>('/database/stats', {
        method: 'GET',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async databaseBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const result = await this.fetch<{ success: boolean; path?: string; error?: string }>('/database/backup', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Integration Services
  // ============================================================================

  async integrationAuthGoogle(): Promise<IntegrationAuthResult> {
    try {
      // For OAuth, we might redirect to the OAuth flow
      const result = await this.fetch<IntegrationAuthResult>('/integrations/google/auth', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google auth failed',
      };
    }
  }

  async integrationAuthGitHub(): Promise<IntegrationAuthResult> {
    try {
      const result = await this.fetch<IntegrationAuthResult>('/integrations/github/auth', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub auth failed',
      };
    }
  }

  async integrationSyncGoogle(): Promise<IntegrationSyncResult> {
    try {
      const result = await this.fetch<IntegrationSyncResult>('/integrations/google/sync', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        syncedItems: 0,
        error: error instanceof Error ? error.message : 'Google sync failed',
      };
    }
  }

  async integrationSyncGitHub(): Promise<IntegrationSyncResult> {
    try {
      const result = await this.fetch<IntegrationSyncResult>('/integrations/github/sync', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      return {
        success: false,
        syncedItems: 0,
        error: error instanceof Error ? error.message : 'GitHub sync failed',
      };
    }
  }
}
