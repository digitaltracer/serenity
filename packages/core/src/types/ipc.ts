/**
 * IPC Type Definitions
 * Proper types for all Electron IPC communication
 */

import { Task, Project, JournalEntry, Goal } from './index';

// Re-export DatabaseStats from database types
export type { DatabaseStats } from './database';

// Define AI types inline to avoid import path issues in generated .d.ts files
// These types mirror the definitions in aiAssistantSlice.ts and encryptedIntegrationService.ts
// but are defined here to ensure clean type definitions without source file dependencies

export interface AIInsight {
  id: string;
  type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
  source: 'openai' | 'gemini' | 'anthropic';
  category: 'tasks' | 'journal' | 'habits' | 'goals';
  actionable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIRecap {
  id: string;
  type: 'weekly' | 'monthly';
  title: string;
  summary: string;
  highlights: string[];
  challenges: string[];
  recommendations: string[];
  period: {
    start: string;
    end: string;
  };
  createdAt: string;
  source: 'openai' | 'gemini' | 'anthropic';
  metadata?: Record<string, unknown>;
}

export interface EncryptedIntegrationData {
  id: string;
  type: 'google_calendar' | 'github';
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Base Response Types
// ============================================================================

export interface BaseIPCResponse {
  success: boolean;
  error?: string;
}

export interface DataIPCResponse<T> extends BaseIPCResponse {
  data?: T;
}

export interface ListIPCResponse<T> extends BaseIPCResponse {
  data?: T[];
}

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseConnectionResponse extends BaseIPCResponse {
  // No additional data needed
}

export interface DatabaseBackupResponse extends BaseIPCResponse {
  path?: string;
}

export interface DatabaseImportResult {
  imported: number;
  errors: string[];
}

export interface DatabaseQueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  fields?: string[];
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskIPCResponse = DataIPCResponse<Task>;
export type TaskListIPCResponse = ListIPCResponse<Task>;
export type TaskDeleteIPCResponse = DataIPCResponse<boolean>;

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  completed?: boolean;
  completedAt?: Date;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId?: string;
  tags?: string[];
  updatedAt?: Date;
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    order: number;
  }>;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId?: string;
  tags?: string[];
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectIPCResponse = DataIPCResponse<Project>;
export type ProjectListIPCResponse = ListIPCResponse<Project>;
export type ProjectDeleteIPCResponse = DataIPCResponse<boolean>;

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  archived?: boolean;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

// ============================================================================
// Journal Types
// ============================================================================

export type JournalEntryIPCResponse = DataIPCResponse<JournalEntry>;
export type JournalEntryListIPCResponse = ListIPCResponse<JournalEntry>;
export type JournalEntryDeleteIPCResponse = DataIPCResponse<boolean>;

export interface JournalEntryUpdateInput {
  title?: string;
  content?: string;
  date?: Date;
  tags?: string[];
  pinned?: boolean;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed';
}

export interface JournalEntryCreateInput {
  title?: string;
  content: string;
  date: Date;
  tags?: string[];
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed';
}

// ============================================================================
// Goal Types
// ============================================================================

export type GoalIPCResponse = DataIPCResponse<Goal>;
export type GoalListIPCResponse = ListIPCResponse<Goal>;
export type GoalDeleteIPCResponse = DataIPCResponse<boolean>;

// ============================================================================
// Integration Types
// ============================================================================

export interface IntegrationVerification {
  exists: boolean;
  count: number;
  hasEncrypted: boolean;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface SecureSetting {
  key: string;
  value: string;
  createdAt: Date;
}

export interface MasterPasswordHashResponse {
  hash: string | null;
}

export interface HasMasterPasswordResponse {
  hasMasterPassword: boolean;
}

export interface SecureSettingResponse {
  value: string | null;
}

// ============================================================================
// Biometric Types
// ============================================================================

export interface BiometricAvailabilityResponse {
  available: boolean;
  type: 'touchid' | 'faceid' | 'windows-hello' | null;
}

export interface BiometricAuthResponse extends BaseIPCResponse {
  cancelled?: boolean;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthStartResponse extends BaseIPCResponse {
  authUrl?: string;
}

export interface GoogleOAuthData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// ============================================================================
// AI Assistant Types
// ============================================================================

export interface AIModelInfo {
  model: string;
  version: string;
  provider: 'openai' | 'gemini' | 'anthropic';
}

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AISetApiKeyResponse extends BaseIPCResponse {
  modelInfo?: AIModelInfo;
  usage?: AIUsageMetrics;
}

export interface AIAnalysisTracker {
  lastAnalyzedTaskIds: string[];
  lastAnalyzedJournalIds: string[];
  lastAnalysisDate: string;
}

export interface AIAnalyzeDataOptions {
  provider: 'openai' | 'gemini' | 'anthropic';
  dataTypes: string[];
  forceReAnalyze?: boolean;
  tasks?: Task[];
  journalEntries?: JournalEntry[];
  analysisTracker?: AIAnalysisTracker;
}

export interface AIAnalyzeDataResponse extends BaseIPCResponse {
  insights?: AIInsight[];
  processedData?: {
    taskIds: string[];
    journalIds: string[];
    analysisDate: string;
  };
  message?: string;
  usage?: AIUsageMetrics;
}

export interface AIGenerateRecapOptions {
  provider: 'openai' | 'gemini' | 'anthropic';
  type: 'weekly' | 'monthly';
  period: {
    start: string;
    end: string;
  };
  tasks?: Task[];
  journalEntries?: JournalEntry[];
}

export interface AIGenerateRecapResponse extends BaseIPCResponse {
  recap?: AIRecap;
  usage?: AIUsageMetrics;
}

export interface AISettings {
  modelInfo?: AIModelInfo;
  activeProvider?: 'openai' | 'gemini' | 'anthropic';
  preferredModels?: Record<string, string>;
  [key: string]: unknown;
}

export interface AISettingsResponse extends BaseIPCResponse {
  settings?: AISettings;
}

export interface AIHasApiKeyResponse extends BaseIPCResponse {
  hasKey?: boolean;
}

export interface AIModel {
  id: string;
  label: string;
}

export interface AIListModelsResponse extends BaseIPCResponse {
  models?: AIModel[];
}

// ============================================================================
// Menu Event Types
// ============================================================================

export type MenuEventType =
  | 'new-task'
  | 'new-journal-entry'
  | 'toggle-sidebar'
  | 'search'
  | 'settings'
  | 'lock-app'
  | 'unlock-app';

export interface MenuEventData {
  [key: string]: unknown;
}
