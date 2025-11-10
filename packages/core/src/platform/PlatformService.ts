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
import { ElectronAdapter } from './adapters/ElectronAdapter';
import { WebAdapter } from './adapters/WebAdapter';

class PlatformService implements IPlatformAdapter {
  private adapter: IPlatformAdapter;
  private _platformType: PlatformType;

  constructor() {
    // Detect platform and initialize appropriate adapter
    if (this.isElectronEnvironment()) {
      this.adapter = new ElectronAdapter();
      this._platformType = 'electron';
    } else {
      this.adapter = new WebAdapter();
      this._platformType = 'web';
    }
  }

  /**
   * Detect if we're running in Electron environment
   */
  private isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  /**
   * Get current platform information
   */
  get platformInfo(): PlatformInfo {
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
  get platformType(): PlatformType {
    return this._platformType;
  }

  /**
   * Check if running on Electron
   */
  get isElectron(): boolean {
    return this._platformType === 'electron';
  }

  /**
   * Check if running on Web
   */
  get isWeb(): boolean {
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
  async aiQuickAdd(options: Parameters<IPlatformAdapter['aiQuickAdd']>[0]) {
    return this.adapter.aiQuickAdd(options);
  }

  async aiGetSettings() {
    return this.adapter.aiGetSettings();
  }

  async aiSetApiKey(provider: string, apiKey: string) {
    return this.adapter.aiSetApiKey(provider, apiKey);
  }

  async aiAnalyze(options: Parameters<IPlatformAdapter['aiAnalyze']>[0]) {
    return this.adapter.aiAnalyze(options);
  }

  async aiGenerateSummary(options: Parameters<IPlatformAdapter['aiGenerateSummary']>[0]) {
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

// Singleton instance
export const platformService = new PlatformService();

// Also export the class for testing
export { PlatformService };
