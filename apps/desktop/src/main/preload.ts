import { contextBridge, ipcRenderer } from 'electron';
import type { Task, Project, JournalEntry } from '@serenity/core';

type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTask = Partial<Task>;
type NewProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateProject = Partial<Project>;
type NewJournalEntry = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateJournalEntry = Partial<JournalEntry>;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations (PostgreSQL - legacy)
  database: {
    testConnection: (connectionUrl: string) => ipcRenderer.invoke('database:test-connection', connectionUrl),
  },

  // System operations (secure business logic layer)
  system: {
    // System management
    initialize: () => ipcRenderer.invoke('system:initialize'),
    testConnection: () => ipcRenderer.invoke('system:test-connection'),
    testPersistence: () => ipcRenderer.invoke('system:test-persistence'),
    verifyDataLoading: () => ipcRenderer.invoke('system:verify-data-loading'),
    getStats: () => ipcRenderer.invoke('system:get-stats'),
    backup: (backupPath?: string) => ipcRenderer.invoke('system:backup', backupPath),
    importFromLocalStorage: (data: any) => ipcRenderer.invoke('system:import-from-localstorage', data),
    exportAllData: () => ipcRenderer.invoke('system:export-all-data'),
    secureQuery: (queryType: string, params?: any[]) => ipcRenderer.invoke('system:secure-query', queryType, params),

    // Logging operations
    writeLog: (logEntry: any) => ipcRenderer.invoke('system:write-log', logEntry),
    getLogs: () => ipcRenderer.invoke('system:get-logs'),
    clearLogs: () => ipcRenderer.invoke('system:clear-logs'),
  },

  // Task operations (business logic)
  tasks: {
    get: () => ipcRenderer.invoke('tasks:get'),
    create: (task: NewTask) => ipcRenderer.invoke('tasks:create', task),
    createWithId: (task: Task) => ipcRenderer.invoke('tasks:create-with-id', task),
    update: (id: string, updates: UpdateTask) => ipcRenderer.invoke('tasks:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('tasks:delete', id),
    complete: (id: string) => ipcRenderer.invoke('tasks:complete', id),
    bulkUpdate: (taskIds: string[], updates: UpdateTask) => ipcRenderer.invoke('tasks:bulk-update', taskIds, updates),
  },

  // Project operations (business logic)
  projects: {
    get: () => ipcRenderer.invoke('projects:get'),
    getSingle: (id: string) => ipcRenderer.invoke('projects:get-single', id),
    create: (project: NewProject) => ipcRenderer.invoke('projects:create', project),
    createWithId: (project: Project) => ipcRenderer.invoke('projects:create-with-id', project),
    update: (id: string, updates: UpdateProject) => ipcRenderer.invoke('projects:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id),
    archive: (id: string) => ipcRenderer.invoke('projects:archive', id),
    unarchive: (id: string) => ipcRenderer.invoke('projects:unarchive', id),
    getStats: (id: string) => ipcRenderer.invoke('projects:get-stats', id),
  },

  // Goal operations (business logic)
  goals: {
    get: () => ipcRenderer.invoke('goals:get'),
    createWithId: (goal: any) => ipcRenderer.invoke('goals:create-with-id', goal),
    update: (id: string, updates: any) => ipcRenderer.invoke('goals:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('goals:delete', id),
  },

  // Journal operations (business logic)
  journal: {
    get: () => ipcRenderer.invoke('journal:get'),
    create: (entry: NewJournalEntry) => ipcRenderer.invoke('journal:create', entry),
    createWithId: (entry: JournalEntry) => ipcRenderer.invoke('journal:create-with-id', entry),
    update: (id: string, updates: UpdateJournalEntry) => ipcRenderer.invoke('journal:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('journal:delete', id),
    pin: (id: string) => ipcRenderer.invoke('journal:pin', id),
    unpin: (id: string) => ipcRenderer.invoke('journal:unpin', id),
    getByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('journal:get-by-date-range', startDate, endDate),
    getStats: () => ipcRenderer.invoke('journal:get-stats'),
  },

  // Analytics operations (business logic)
  analytics: {
    getProductivityInsights: () => ipcRenderer.invoke('analytics:get-productivity-insights'),
  },

  // Legacy SQLite operations (deprecated - use system/tasks/projects/journal instead)
  sqlite: {
    // Database management - DEPRECATED
    initialize: () => ipcRenderer.invoke('system:initialize'),
    testConnection: () => ipcRenderer.invoke('system:test-connection'),
    testPersistence: () => ipcRenderer.invoke('system:test-persistence'),
    verifyDataLoading: () => ipcRenderer.invoke('system:verify-data-loading'),
    getStats: () => ipcRenderer.invoke('system:get-stats'),
    backup: (backupPath?: string) => ipcRenderer.invoke('system:backup', backupPath),
    importFromLocalStorage: (data: any) => ipcRenderer.invoke('system:import-from-localstorage', data),
    exportAllData: () => ipcRenderer.invoke('system:export-all-data'),
    query: (_query: string, _params?: any[]) => {
      // Disabled for security: raw SQL queries are not allowed from renderer
      return Promise.resolve({ success: false, data: null, error: 'Raw SQL queries are disabled' });
    },

    // Task operations - DEPRECATED
    getTasks: () => ipcRenderer.invoke('tasks:get'),
    createTask: (task: any) => ipcRenderer.invoke('tasks:create', task),
    createTaskWithId: (task: any) => ipcRenderer.invoke('tasks:create-with-id', task),
    updateTask: (id: string, updates: any) => ipcRenderer.invoke('tasks:update', id, updates),
    deleteTask: (id: string) => ipcRenderer.invoke('tasks:delete', id),

    // Project operations - DEPRECATED
    getProjects: () => ipcRenderer.invoke('projects:get'),
    getProject: (id: string) => ipcRenderer.invoke('projects:get-single', id),
    createProject: (project: any) => ipcRenderer.invoke('projects:create', project),
    createProjectWithId: (project: any) => ipcRenderer.invoke('projects:create-with-id', project),
    updateProject: (id: string, updates: any) => ipcRenderer.invoke('projects:update', id, updates),
    deleteProject: (id: string) => ipcRenderer.invoke('projects:delete', id),

    // Journal operations - DEPRECATED
    getJournalEntries: () => ipcRenderer.invoke('journal:get'),
    createJournalEntry: (entry: any) => ipcRenderer.invoke('journal:create', entry),
    createJournalEntryWithId: (entry: any) => ipcRenderer.invoke('journal:create-with-id', entry),
    updateJournalEntry: (id: string, updates: any) => ipcRenderer.invoke('journal:update', id, updates),
    deleteJournalEntry: (id: string) => ipcRenderer.invoke('journal:delete', id),
  },

  // Window operations
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // Biometric authentication
  biometric: {
    isAvailable: () => ipcRenderer.invoke('biometric:isAvailable'),
    authenticate: (reason?: string) => ipcRenderer.invoke('biometric:authenticate', reason),
  },

  // Menu events
  onMenuAction: (callback: (event: string, data?: any) => void) => {
    ipcRenderer.on('menu:new-task', () => callback('new-task'));
    ipcRenderer.on('menu:new-entry', () => callback('new-entry'));
    ipcRenderer.on('menu:quick-add', () => callback('quick-add'));
    ipcRenderer.on('menu:navigate', (_, route) => callback('navigate', route));
    ipcRenderer.on('menu:lock-app', () => callback('lock-app'));
  },

  // Remove menu listeners
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu:new-task');
    ipcRenderer.removeAllListeners('menu:new-entry');
    ipcRenderer.removeAllListeners('menu:quick-add');
    ipcRenderer.removeAllListeners('menu:navigate');
    ipcRenderer.removeAllListeners('menu:lock-app');
  },

  // OAuth operations
  oauth: {
    googleStart: (clientId?: string, clientSecret?: string) => ipcRenderer.invoke('oauth:google:start', clientId, clientSecret),
    onGoogleSuccess: (callback: (authData: any) => void) => {
      ipcRenderer.on('oauth:google:success', (_, authData) => callback(authData));
    },
    onGoogleError: (callback: (error: string) => void) => {
      ipcRenderer.on('oauth:google:error', (_, error) => callback(error));
    },
    onGoogleCancelled: (callback: () => void) => {
      ipcRenderer.on('oauth:google:cancelled', () => callback());
    },
    removeOAuthListeners: () => {
      ipcRenderer.removeAllListeners('oauth:google:success');
      ipcRenderer.removeAllListeners('oauth:google:error');
      ipcRenderer.removeAllListeners('oauth:google:cancelled');
    },
  },

  // Safe storage operations for biometric authentication
  safeStorage: {
    encryptString: (plaintext: string) => ipcRenderer.invoke('safeStorage:encryptString', plaintext),
    decryptString: (encrypted: string) => ipcRenderer.invoke('safeStorage:decryptString', encrypted),
  },

  // Integration storage operations (encrypted)
  integrations: {
    initializeTable: () => ipcRenderer.invoke('integrations:initialize-table'),
    saveEncrypted: (integrationData: any) => ipcRenderer.invoke('integrations:save-encrypted', integrationData),
    loadEncrypted: () => ipcRenderer.invoke('integrations:load-encrypted'),
    hasEncrypted: () => ipcRenderer.invoke('integrations:has-encrypted'),
    clearEncrypted: () => ipcRenderer.invoke('integrations:clear-encrypted'),
    verifyTable: () => ipcRenderer.invoke('integrations:verify-table'),
    getVerification: () => ipcRenderer.invoke('integrations:get-verification'),
  },

  // Authentication and master password operations
  auth: {
    initializeSecureSettings: () => ipcRenderer.invoke('auth:initialize-secure-settings'),
    setMasterPasswordHash: (hash: string) => ipcRenderer.invoke('auth:set-master-password-hash', hash),
    getMasterPasswordHash: () => ipcRenderer.invoke('auth:get-master-password-hash'),
    hasMasterPassword: () => ipcRenderer.invoke('auth:has-master-password'),
    clearMasterPasswordHash: () => ipcRenderer.invoke('auth:clear-master-password-hash'),
    clearAllSecureSettings: () => ipcRenderer.invoke('auth:clear-all-secure-settings'),
    getSecureSetting: (key: string) => ipcRenderer.invoke('auth:get-secure-setting', key),
    setSecureSetting: (key: string, value: string) => ipcRenderer.invoke('auth:set-secure-setting', key, value),
    deleteSecureSetting: (key: string) => ipcRenderer.invoke('auth:delete-secure-setting', key),
  },

  // AI Assistant operations
  aiAssistant: {
    quickAdd: (text: string, provider?: 'openai' | 'gemini' | 'anthropic', debug?: boolean) => ipcRenderer.invoke('ai-assistant:quick-add', { text, provider, debug }),
    setApiKey: (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => ipcRenderer.invoke('ai-assistant:set-api-key', provider, apiKey),
    testApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => ipcRenderer.invoke('ai-assistant:test-api-key', provider),
    analyzeData: (options: { provider: 'openai' | 'gemini' | 'anthropic'; dataTypes: string[]; forceReAnalyze?: boolean }) => ipcRenderer.invoke('ai-assistant:analyze-data', options),
    generateRecap: (options: { provider: 'openai' | 'gemini' | 'anthropic'; type: 'weekly' | 'monthly'; period: { start: string; end: string } }) => ipcRenderer.invoke('ai-assistant:generate-recap', options),
    getSettings: () => ipcRenderer.invoke('ai-assistant:get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('ai-assistant:save-settings', settings),
    hasApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => ipcRenderer.invoke('ai-assistant:has-api-key', provider),
    removeApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => ipcRenderer.invoke('ai-assistant:remove-api-key', provider),
    listModels: (provider: 'openai' | 'gemini' | 'anthropic') => ipcRenderer.invoke('ai-assistant:list-models', provider),
    listInsights: () => ipcRenderer.invoke('ai-assistant:list-insights'),
    listRecaps: () => ipcRenderer.invoke('ai-assistant:list-recaps'),
    listUsage: () => ipcRenderer.invoke('ai-assistant:list-usage'),
    saveInsights: (provider: 'openai' | 'gemini' | 'anthropic' | 'local', insights: any[]) => ipcRenderer.invoke('ai-assistant:save-insights', { provider, insights }),
    saveUsage: (entry: { provider: 'openai' | 'gemini' | 'anthropic' | 'local'; operation: 'analyze' | 'recap' | 'quickadd'; promptTokens: number; completionTokens: number; totalTokens: number; timestamp?: string }) => ipcRenderer.invoke('ai-assistant:save-usage', entry),
  },

});

// Type definitions for the exposed API
export interface ElectronAPI {
  database: {
    testConnection: (connectionUrl: string) => Promise<{ success: boolean; error?: string }>;
  };

  // System operations (secure business logic layer)
  system: {
    initialize: () => Promise<{ success: boolean; error?: string }>;
    testConnection: () => Promise<{ success: boolean; error?: string }>;
    testPersistence: () => Promise<{ success: boolean; createdTask?: any; allTasks?: any[]; totalTasks?: number; error?: string }>;
    verifyDataLoading: () => Promise<{ success: boolean; tasks?: any[]; projects?: any[]; journal?: any[]; counts?: any; error?: string }>;
    getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
    backup: (backupPath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    importFromLocalStorage: (data: any) => Promise<{ success: boolean; result?: any; error?: string }>;
    exportAllData: () => Promise<{ success: boolean; data?: any; error?: string }>;
    secureQuery: (queryType: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // Task operations (business logic)
  tasks: {
    get: () => Promise<{ success: boolean; data?: Task[]; error?: string }>;
    create: (task: NewTask) => Promise<{ success: boolean; data?: Task; error?: string }>;
    createWithId: (task: Task) => Promise<{ success: boolean; data?: Task; error?: string }>;
    update: (id: string, updates: UpdateTask) => Promise<{ success: boolean; data?: Task; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    complete: (id: string) => Promise<{ success: boolean; data?: Task; error?: string }>;
    bulkUpdate: (taskIds: string[], updates: UpdateTask) => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // Project operations (business logic)
  projects: {
    get: () => Promise<{ success: boolean; data?: Project[]; error?: string }>;
    getSingle: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
    create: (project: NewProject) => Promise<{ success: boolean; data?: Project; error?: string }>;
    createWithId: (project: Project) => Promise<{ success: boolean; data?: Project; error?: string }>;
    update: (id: string, updates: UpdateProject) => Promise<{ success: boolean; data?: Project; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    archive: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
    unarchive: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
    getStats: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // Journal operations (business logic)
  journal: {
    get: () => Promise<{ success: boolean; data?: JournalEntry[]; error?: string }>;
    create: (entry: NewJournalEntry) => Promise<{ success: boolean; data?: JournalEntry; error?: string }>;
    createWithId: (entry: JournalEntry) => Promise<{ success: boolean; data?: JournalEntry; error?: string }>;
    update: (id: string, updates: UpdateJournalEntry) => Promise<{ success: boolean; data?: JournalEntry; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    pin: (id: string) => Promise<{ success: boolean; data?: JournalEntry; error?: string }>;
    unpin: (id: string) => Promise<{ success: boolean; data?: JournalEntry; error?: string }>;
    getByDateRange: (startDate: string, endDate: string) => Promise<{ success: boolean; data?: JournalEntry[]; error?: string }>;
    getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // Analytics operations (business logic)
  analytics: {
    getProductivityInsights: () => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // Goal operations (business logic)
  goals: {
    get: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    createWithId: (goal: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    update: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
  };

  // Legacy SQLite operations (DEPRECATED - maintained for backward compatibility)
  sqlite: {
    // Database management - DEPRECATED
    initialize: () => Promise<{ success: boolean; error?: string }>;
    testConnection: () => Promise<{ success: boolean; error?: string }>;
    testPersistence: () => Promise<{ success: boolean; createdTask?: any; allTasks?: any[]; totalTasks?: number; error?: string }>;
    verifyDataLoading: () => Promise<{ success: boolean; tasks?: any[]; projects?: any[]; journal?: any[]; counts?: any; error?: string }>;
    getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
    backup: (backupPath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    importFromLocalStorage: (data: any) => Promise<{ success: boolean; result?: any; error?: string }>;
    exportAllData: () => Promise<{ success: boolean; data?: any; error?: string }>;
    query: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;

    // Task operations - DEPRECATED
    getTasks: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    createTask: (task: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    createTaskWithId: (task: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateTask: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteTask: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;

    // Project operations - DEPRECATED
    getProjects: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getProject: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    createProject: (project: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    createProjectWithId: (project: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateProject: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteProject: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;

    // Journal operations - DEPRECATED
    getJournalEntries: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    createJournalEntry: (entry: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    createJournalEntryWithId: (entry: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateJournalEntry: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteJournalEntry: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
  };

  // AI Assistant operations (typed)
  aiAssistant: {
    setApiKey: (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => Promise<{ success: boolean; modelInfo?: any; usage?: any; error?: string }>;
    testApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; error?: string }>;
    analyzeData: (options: { provider: 'openai' | 'gemini' | 'anthropic'; dataTypes: string[]; forceReAnalyze?: boolean }) => Promise<{ success: boolean; insights?: any[]; processedData?: any; usage?: any; error?: string }>;
    generateRecap: (options: { provider: 'openai' | 'gemini' | 'anthropic'; type: 'weekly' | 'monthly'; period: { start: string; end: string } }) => Promise<{ success: boolean; recap?: any; usage?: any; error?: string }>;
    getSettings: () => Promise<{ success: boolean; settings?: any; error?: string }>;
    saveSettings: (settings: any) => Promise<{ success: boolean; skipped?: boolean; error?: string }>;
    hasApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; hasKey?: boolean; error?: string }>;
    removeApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; error?: string }>;
    listModels: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; models?: any[]; error?: string }>;
    listInsights: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    listRecaps: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    listUsage: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    saveInsights: (provider: 'openai' | 'gemini' | 'anthropic' | 'local', insights: any[]) => Promise<{ success: boolean; error?: string }>;
    saveUsage: (entry: { provider: 'openai' | 'gemini' | 'anthropic' | 'local'; operation: 'analyze' | 'recap' | 'quickadd'; promptTokens: number; completionTokens: number; totalTokens: number; timestamp?: string }) => Promise<{ success: boolean; error?: string }>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  biometric: {
    isAvailable: () => Promise<{ available: boolean; type: string | null }>;
    authenticate: (reason?: string) => Promise<{ success: boolean; error?: string | null; cancelled?: boolean }>;
  };
  onMenuAction: (callback: (event: string, data?: any) => void) => void;
  removeMenuListeners: () => void;
  oauth: {
    googleStart: (clientId?: string, clientSecret?: string) => Promise<{ success: boolean; authUrl?: string; error?: string }>;
    onGoogleSuccess: (callback: (authData: any) => void) => void;
    onGoogleError: (callback: (error: string) => void) => void;
    onGoogleCancelled: (callback: () => void) => void;
    removeOAuthListeners: () => void;
  };
  safeStorage: {
    encryptString: (plaintext: string) => Promise<string>;
    decryptString: (encrypted: string) => Promise<string>;
  };
  integrations: {
    initializeTable: () => Promise<{ success: boolean; data?: any; error?: string }>;
    saveEncrypted: (integrationData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    loadEncrypted: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    hasEncrypted: () => Promise<{ success: boolean; data?: { hasEncrypted: boolean; count: number }; error?: string }>;
    clearEncrypted: () => Promise<{ success: boolean; data?: any; error?: string }>;
    verifyTable: () => Promise<{ success: boolean; data?: { exists: boolean }; error?: string }>;
    getVerification: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  };
  auth: {
    initializeSecureSettings: () => Promise<{ success: boolean; data?: any; error?: string }>;
    setMasterPasswordHash: (hash: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getMasterPasswordHash: () => Promise<{ success: boolean; data?: { hash: string | null }; error?: string }>;
    hasMasterPassword: () => Promise<{ success: boolean; data?: { hasMasterPassword: boolean }; error?: string }>;
    clearMasterPasswordHash: () => Promise<{ success: boolean; data?: any; error?: string }>;
    clearAllSecureSettings: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getSecureSetting: (key: string) => Promise<{ success: boolean; data?: { value: string | null }; error?: string }>;
    setSecureSetting: (key: string, value: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteSecureSetting: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
