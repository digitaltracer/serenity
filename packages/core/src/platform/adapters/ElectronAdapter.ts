/**
 * Electron Platform Adapter
 *
 * Wraps Electron IPC calls (window.electronAPI) to implement the IPlatformAdapter interface.
 * This adapter is used when running in the Electron desktop environment.
 */

import {
  IPlatformAdapter,
  AIQuickAddOptions,
  AIQuickAddResult,
  AISettingsResult,
  AIAnalyzeOptions,
  AIGenerateSummaryOptions,
  AIUsageResult,
  DatabaseStats,
  IntegrationAuthResult,
  IntegrationSyncResult,
} from '../types';

export class ElectronAdapter implements IPlatformAdapter {
  readonly name = 'electron' as const;

  get isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  private get electronAPI(): any {
    if (!this.isAvailable) {
      throw new Error('Electron API is not available');
    }
    return (window as any).electronAPI;
  }

  // ============================================================================
  // AI Services
  // ============================================================================

  async aiQuickAdd(options: AIQuickAddOptions): Promise<AIQuickAddResult> {
    try {
      const result = await this.electronAPI.aiAssistant.quickAdd(
        options.text,
        options.provider,
        options.debug
      );
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
      const result = await this.electronAPI.aiAssistant.getSettings();
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
      const result = await this.electronAPI.aiAssistant.setApiKey(provider, apiKey);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async aiRemoveApiKey(provider: 'openai' | 'gemini' | 'anthropic'): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.electronAPI.aiAssistant.removeApiKey(provider);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove API key',
      };
    }
  }

  async aiListUsage(limit: number = 500): Promise<AIUsageResult> {
    try {
      const result = await this.electronAPI.aiAssistant.listUsage();
      if (result.success && result.data) {
        return {
          success: true,
          usage: result.data.slice(0, limit),
        };
      }
      return {
        success: false,
        error: result.error || 'Failed to list usage',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list usage',
      };
    }
  }

  async aiAnalyze(options: AIAnalyzeOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.electronAPI.aiAssistant.analyzeData({
        provider: options.provider,
        dataTypes: options.dataTypes,
        analysisMode: options.analysisMode,
        timeWindow: options.timeWindow,
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
      const result = await this.electronAPI.aiAssistant.generateSummary({
        startDate: options.startDate,
        endDate: options.endDate,
        types: options.types,
        provider: options.provider,
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
      // Electron stores data in Redux, so we might not need IPC for this
      // But if there's a specific IPC handler for database stats, use it
      const result = await this.electronAPI.database?.getStats();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database stats not available',
      };
    }
  }

  async databaseBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const result = await this.electronAPI.database?.backup();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup not available',
      };
    }
  }

  // ============================================================================
  // Integration Services
  // ============================================================================

  async integrationAuthGoogle(): Promise<IntegrationAuthResult> {
    try {
      const result = await this.electronAPI.integrations?.authenticateGoogle();
      return result || { success: false, error: 'No response from integration service' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google auth failed',
      };
    }
  }

  async integrationAuthGitHub(): Promise<IntegrationAuthResult> {
    try {
      const result = await this.electronAPI.integrations?.authenticateGitHub();
      return result || { success: false, error: 'No response from integration service' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub auth failed',
      };
    }
  }

  async integrationSyncGoogle(): Promise<IntegrationSyncResult> {
    try {
      const result = await this.electronAPI.integrations?.syncGoogle();
      return result || { success: false, syncedItems: 0, error: 'No response from sync service' };
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
      const result = await this.electronAPI.integrations?.syncGitHub();
      return result || { success: false, syncedItems: 0, error: 'No response from sync service' };
    } catch (error) {
      return {
        success: false,
        syncedItems: 0,
        error: error instanceof Error ? error.message : 'GitHub sync failed',
      };
    }
  }
}
