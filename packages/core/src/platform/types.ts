/**
 * Platform Service Types
 *
 * Defines interfaces for all platform-specific operations.
 * These interfaces are implemented by both Electron and Web adapters.
 */

// Import existing types from core to avoid duplication
import type { AISettings, DatabaseStats } from '../types/ipc';
import type { DatabaseConfig } from '../types/database';

// ============================================================================
// AI Service Types
// ============================================================================

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

export interface AIUsageRecord {
  id?: number;
  provider: 'openai' | 'gemini' | 'anthropic';
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: string;
}

export interface AIUsageResult {
  success: boolean;
  usage?: AIUsageRecord[];
  error?: string;
}

// ============================================================================
// Database Service Types
// ============================================================================

// Re-export imported types for convenience
export type { AISettings, DatabaseConfig, DatabaseStats };

// ============================================================================
// Integration Service Types
// ============================================================================

export interface IntegrationAuthResult {
  success: boolean;
  error?: string;
}

export interface IntegrationSyncResult {
  success: boolean;
  syncedItems: number;
  error?: string;
}

// ============================================================================
// Platform Adapter Interface
// ============================================================================

/**
 * Main interface that all platform adapters must implement
 */
export interface IPlatformAdapter {
  // Platform detection
  readonly name: 'electron' | 'web';
  readonly isAvailable: boolean;

  // AI Services
  aiQuickAdd(options: AIQuickAddOptions): Promise<AIQuickAddResult>;
  aiGetSettings(): Promise<AISettingsResult>;
  aiSetApiKey(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }>;
  aiRemoveApiKey(provider: 'openai' | 'gemini' | 'anthropic'): Promise<{ success: boolean; error?: string }>;
  aiListUsage(limit?: number): Promise<AIUsageResult>;
  aiAnalyze(options: AIAnalyzeOptions): Promise<{ success: boolean; error?: string }>;
  aiGenerateSummary(options: AIGenerateSummaryOptions): Promise<{ success: boolean; data?: any; error?: string }>;

  // Database Services (for desktop settings, stats, etc.)
  databaseGetStats(): Promise<{ success: boolean; stats?: DatabaseStats; error?: string }>;
  databaseBackup(): Promise<{ success: boolean; path?: string; error?: string }>;

  // Integration Services
  integrationAuthGoogle(): Promise<IntegrationAuthResult>;
  integrationAuthGitHub(): Promise<IntegrationAuthResult>;
  integrationSyncGoogle(): Promise<IntegrationSyncResult>;
  integrationSyncGitHub(): Promise<IntegrationSyncResult>;
}

// ============================================================================
// Helper Types
// ============================================================================

export type PlatformType = 'electron' | 'web';

export interface PlatformInfo {
  type: PlatformType;
  isElectron: boolean;
  isWeb: boolean;
  adapter: IPlatformAdapter;
}
