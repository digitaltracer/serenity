/**
 * Platform Service Types
 *
 * Defines interfaces for all platform-specific operations.
 * These interfaces are implemented by both Electron and Web adapters.
 */
import type { AISettings, DatabaseStats } from '../types/ipc';
import type { DatabaseConfig } from '../types/database';
export interface AIQuickAddOptions {
    text: string;
    provider: 'openai' | 'gemini' | 'anthropic';
    debug?: boolean;
}
export interface AIQuickAddResult {
    success: boolean;
    data?: {
        kind: 'task' | 'journal';
        title?: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high';
        dueDate?: string;
        tags?: string[];
        project?: string;
    };
    error?: string;
    debug?: {
        provider: string;
        model: string;
        contentSample: string;
    };
}
export interface AISettingsResult {
    success: boolean;
    settings?: AISettings;
    error?: string;
}
export interface AIAnalyzeOptions {
    provider: 'openai' | 'gemini' | 'anthropic';
    dataTypes: ('tasks' | 'journal')[];
    analysisMode: 'incremental' | 'window' | 'full';
    timeWindow?: {
        start: string;
        end: string;
    };
}
export interface AIGenerateSummaryOptions {
    startDate: string;
    endDate: string;
    types: ('tasks' | 'journal')[];
    provider?: 'openai' | 'gemini' | 'anthropic';
}
export type { AISettings, DatabaseConfig, DatabaseStats };
export interface IntegrationAuthResult {
    success: boolean;
    error?: string;
}
export interface IntegrationSyncResult {
    success: boolean;
    syncedItems: number;
    error?: string;
}
/**
 * Main interface that all platform adapters must implement
 */
export interface IPlatformAdapter {
    readonly name: 'electron' | 'web';
    readonly isAvailable: boolean;
    aiQuickAdd(options: AIQuickAddOptions): Promise<AIQuickAddResult>;
    aiGetSettings(): Promise<AISettingsResult>;
    aiSetApiKey(provider: string, apiKey: string): Promise<{
        success: boolean;
        error?: string;
    }>;
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
export type PlatformType = 'electron' | 'web';
export interface PlatformInfo {
    type: PlatformType;
    isElectron: boolean;
    isWeb: boolean;
    adapter: IPlatformAdapter;
}
