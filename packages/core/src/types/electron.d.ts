// Electron API type definitions for renderer process
import {
  // Database types
  DatabaseStats,
  DatabaseConnectionResponse,
  DatabaseBackupResponse,
  DatabaseImportResult,
  DatabaseQueryResult,
  DataIPCResponse,
  // Task types
  TaskIPCResponse,
  TaskListIPCResponse,
  TaskDeleteIPCResponse,
  TaskCreateInput,
  TaskUpdateInput,
  // Project types
  ProjectIPCResponse,
  ProjectListIPCResponse,
  ProjectDeleteIPCResponse,
  ProjectCreateInput,
  ProjectUpdateInput,
  // Journal types
  JournalEntryIPCResponse,
  JournalEntryListIPCResponse,
  JournalEntryDeleteIPCResponse,
  JournalEntryCreateInput,
  JournalEntryUpdateInput,
  // Integration types
  EncryptedIntegrationData,
  IntegrationVerification,
  ListIPCResponse,
  BaseIPCResponse,
  // Auth types
  MasterPasswordHashResponse,
  HasMasterPasswordResponse,
  SecureSettingResponse,
  // Biometric types
  BiometricAvailabilityResponse,
  BiometricAuthResponse,
  // OAuth types
  OAuthStartResponse,
  GoogleOAuthData,
  // AI types
  AISetApiKeyResponse,
  AIAnalyzeDataOptions,
  AIAnalyzeDataResponse,
  AIGenerateRecapOptions,
  AIGenerateRecapResponse,
  AISettingsResponse,
  AISettings,
  AIHasApiKeyResponse,
  AIListModelsResponse,
  // Menu types
  MenuEventType,
  MenuEventData,
} from './ipc';

declare global {
  interface Window {
    electronAPI?: {
      database: {
        testConnection: (connectionUrl: string) => Promise<DatabaseConnectionResponse>;
      };
      sqlite?: {
        // Database management
        initialize: () => Promise<BaseIPCResponse>;
        testConnection: () => Promise<BaseIPCResponse>;
        getStats: () => Promise<DataIPCResponse<DatabaseStats>>;
        backup: (backupPath?: string) => Promise<DatabaseBackupResponse>;
        importFromLocalStorage: (data: unknown) => Promise<DataIPCResponse<DatabaseImportResult>>;
        exportAllData: () => Promise<DataIPCResponse<Record<string, unknown>>>;
        query: (query: string, params?: unknown[]) => Promise<DataIPCResponse<DatabaseQueryResult>>;

        // Task operations
        getTasks: () => Promise<TaskListIPCResponse>;
        createTask: (task: TaskCreateInput) => Promise<TaskIPCResponse>;
        updateTask: (id: string, updates: TaskUpdateInput) => Promise<TaskIPCResponse>;
        deleteTask: (id: string) => Promise<TaskDeleteIPCResponse>;

        // Project operations
        getProjects: () => Promise<ProjectListIPCResponse>;
        createProject: (project: ProjectCreateInput) => Promise<ProjectIPCResponse>;
        updateProject: (id: string, updates: ProjectUpdateInput) => Promise<ProjectIPCResponse>;
        deleteProject: (id: string) => Promise<ProjectDeleteIPCResponse>;

        // Journal operations
        getJournalEntries: () => Promise<JournalEntryListIPCResponse>;
        createJournalEntry: (entry: JournalEntryCreateInput) => Promise<JournalEntryIPCResponse>;
        updateJournalEntry: (id: string, updates: JournalEntryUpdateInput) => Promise<JournalEntryIPCResponse>;
        deleteJournalEntry: (id: string) => Promise<JournalEntryDeleteIPCResponse>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      biometric: {
        isAvailable: () => Promise<BiometricAvailabilityResponse>;
        authenticate: (reason?: string) => Promise<BiometricAuthResponse>;
      };
      safeStorage?: {
        encryptString: (plaintext: string) => Promise<string>;
        decryptString: (encrypted: string) => Promise<string>;
      };
      oauth?: {
        googleStart: (clientId: string, clientSecret: string) => Promise<OAuthStartResponse>;
        onGoogleSuccess: (callback: (authData: GoogleOAuthData) => void) => void;
        onGoogleError: (callback: (error: string) => void) => void;
        onGoogleCancelled: (callback: () => void) => void;
        removeOAuthListeners: () => void;
      };
      integrations?: {
        initializeTable: () => Promise<BaseIPCResponse>;
        saveEncrypted: (integrationData: EncryptedIntegrationData) => Promise<DataIPCResponse<EncryptedIntegrationData>>;
        loadEncrypted: () => Promise<ListIPCResponse<EncryptedIntegrationData>>;
        hasEncrypted: () => Promise<DataIPCResponse<{ hasEncrypted: boolean; count: number }>>;
        clearEncrypted: () => Promise<BaseIPCResponse>;
        verifyTable: () => Promise<DataIPCResponse<{ exists: boolean }>>;
        getVerification: () => Promise<ListIPCResponse<IntegrationVerification>>;
      };
      auth?: {
        initializeSecureSettings: () => Promise<BaseIPCResponse>;
        setMasterPasswordHash: (hash: string) => Promise<BaseIPCResponse>;
        getMasterPasswordHash: () => Promise<DataIPCResponse<MasterPasswordHashResponse>>;
        hasMasterPassword: () => Promise<DataIPCResponse<HasMasterPasswordResponse>>;
        clearMasterPasswordHash: () => Promise<BaseIPCResponse>;
        clearAllSecureSettings: () => Promise<BaseIPCResponse>;
        getSecureSetting: (key: string) => Promise<DataIPCResponse<SecureSettingResponse>>;
        setSecureSetting: (key: string, value: string) => Promise<BaseIPCResponse>;
        deleteSecureSetting: (key: string) => Promise<BaseIPCResponse>;
      };
      aiAssistant?: {
        setApiKey: (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => Promise<AISetApiKeyResponse>;
        testApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<BaseIPCResponse>;
        analyzeData: (options: AIAnalyzeDataOptions) => Promise<AIAnalyzeDataResponse>;
        generateRecap: (options: AIGenerateRecapOptions) => Promise<AIGenerateRecapResponse>;
        getSettings: () => Promise<AISettingsResponse>;
        saveSettings: (settings: AISettings) => Promise<BaseIPCResponse>;
        hasApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<AIHasApiKeyResponse>;
        removeApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<BaseIPCResponse>;
        listModels: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<AIListModelsResponse>;
      };
      onMenuAction: (callback: (event: MenuEventType, data?: MenuEventData) => void) => void;
      removeMenuListeners: () => void;
    };
  }
}

export {};
