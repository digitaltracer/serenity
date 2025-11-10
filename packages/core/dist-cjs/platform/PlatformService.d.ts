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
import { IPlatformAdapter, PlatformInfo, PlatformType } from './types';
declare class PlatformService implements IPlatformAdapter {
    private adapter;
    private _platformType;
    constructor();
    /**
     * Detect if we're running in Electron environment
     */
    private isElectronEnvironment;
    /**
     * Get current platform information
     */
    get platformInfo(): PlatformInfo;
    /**
     * Get platform type
     */
    get platformType(): PlatformType;
    /**
     * Check if running on Electron
     */
    get isElectron(): boolean;
    /**
     * Check if running on Web
     */
    get isWeb(): boolean;
    get name(): "electron" | "web";
    get isAvailable(): boolean;
    aiQuickAdd(options: Parameters<IPlatformAdapter['aiQuickAdd']>[0]): Promise<import("./types").AIQuickAddResult>;
    aiGetSettings(): Promise<import("./types").AISettingsResult>;
    aiSetApiKey(provider: string, apiKey: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    aiAnalyze(options: Parameters<IPlatformAdapter['aiAnalyze']>[0]): Promise<{
        success: boolean;
        error?: string;
    }>;
    aiGenerateSummary(options: Parameters<IPlatformAdapter['aiGenerateSummary']>[0]): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    databaseGetStats(): Promise<{
        success: boolean;
        stats?: import("./types").DatabaseStats;
        error?: string;
    }>;
    databaseBackup(): Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    integrationAuthGoogle(): Promise<import("./types").IntegrationAuthResult>;
    integrationAuthGitHub(): Promise<import("./types").IntegrationAuthResult>;
    integrationSyncGoogle(): Promise<import("./types").IntegrationSyncResult>;
    integrationSyncGitHub(): Promise<import("./types").IntegrationSyncResult>;
}
export declare const platformService: PlatformService;
export { PlatformService };
