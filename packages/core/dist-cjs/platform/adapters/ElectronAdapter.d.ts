/**
 * Electron Platform Adapter
 *
 * Wraps Electron IPC calls (window.electronAPI) to implement the IPlatformAdapter interface.
 * This adapter is used when running in the Electron desktop environment.
 */
import { IPlatformAdapter, AIQuickAddOptions, AIQuickAddResult, AISettingsResult, AIAnalyzeOptions, AIGenerateSummaryOptions, AIUsageResult, DatabaseStats, IntegrationAuthResult, IntegrationSyncResult } from '../types';
export declare class ElectronAdapter implements IPlatformAdapter {
    readonly name: "electron";
    get isAvailable(): boolean;
    private get electronAPI();
    aiQuickAdd(options: AIQuickAddOptions): Promise<AIQuickAddResult>;
    aiGetSettings(): Promise<AISettingsResult>;
    aiSetApiKey(provider: string, apiKey: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    aiRemoveApiKey(provider: 'openai' | 'gemini' | 'anthropic'): Promise<{
        success: boolean;
        error?: string;
    }>;
    aiListUsage(limit?: number): Promise<AIUsageResult>;
    aiAnalyze(options: AIAnalyzeOptions): Promise<{
        success: boolean;
        error?: string;
    }>;
    aiGenerateSummary(options: AIGenerateSummaryOptions): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    databaseGetStats(): Promise<{
        success: boolean;
        stats?: DatabaseStats;
        error?: string;
    }>;
    databaseBackup(): Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    integrationAuthGoogle(): Promise<IntegrationAuthResult>;
    integrationAuthGitHub(): Promise<IntegrationAuthResult>;
    integrationSyncGoogle(): Promise<IntegrationSyncResult>;
    integrationSyncGitHub(): Promise<IntegrationSyncResult>;
}
