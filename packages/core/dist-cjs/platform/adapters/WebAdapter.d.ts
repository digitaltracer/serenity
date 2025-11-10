/**
 * Web Platform Adapter
 *
 * Makes fetch calls to Next.js API routes to implement the IPlatformAdapter interface.
 * This adapter is used when running in the web browser environment.
 */
import { IPlatformAdapter, AIQuickAddOptions, AIQuickAddResult, AISettingsResult, AIAnalyzeOptions, AIGenerateSummaryOptions, DatabaseStats, IntegrationAuthResult, IntegrationSyncResult } from '../types';
export declare class WebAdapter implements IPlatformAdapter {
    readonly name: "web";
    private baseUrl;
    constructor(baseUrl?: string);
    get isAvailable(): boolean;
    private fetch;
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
