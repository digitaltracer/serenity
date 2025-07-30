import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations (PostgreSQL - legacy)
  database: {
    testConnection: (connectionUrl: string) => ipcRenderer.invoke('database:test-connection', connectionUrl),
  },

  // SQLite operations (new)
  sqlite: {
    // Database management
    initialize: () => ipcRenderer.invoke('sqlite:initialize'),
    testConnection: () => ipcRenderer.invoke('sqlite:test-connection'),
    testPersistence: () => ipcRenderer.invoke('sqlite:test-persistence'),
    verifyDataLoading: () => ipcRenderer.invoke('sqlite:verify-data-loading'),
    getStats: () => ipcRenderer.invoke('sqlite:get-stats'),
    backup: (backupPath?: string) => ipcRenderer.invoke('sqlite:backup', backupPath),
    importFromLocalStorage: (data: any) => ipcRenderer.invoke('sqlite:import-from-localstorage', data),
    exportAllData: () => ipcRenderer.invoke('sqlite:export-all-data'),
    query: (query: string, params?: any[]) => ipcRenderer.invoke('sqlite:query', query, params),

    // Task operations
    getTasks: () => ipcRenderer.invoke('sqlite:get-tasks'),
    createTask: (task: any) => ipcRenderer.invoke('sqlite:create-task', task),
    createTaskWithId: (task: any) => ipcRenderer.invoke('sqlite:create-task-with-id', task),
    updateTask: (id: string, updates: any) => ipcRenderer.invoke('sqlite:update-task', id, updates),
    deleteTask: (id: string) => ipcRenderer.invoke('sqlite:delete-task', id),

    // Project operations
    getProjects: () => ipcRenderer.invoke('sqlite:get-projects'),
    getProject: (id: string) => ipcRenderer.invoke('sqlite:get-project', id),
    createProject: (project: any) => ipcRenderer.invoke('sqlite:create-project', project),
    createProjectWithId: (project: any) => ipcRenderer.invoke('sqlite:create-project-with-id', project),
    updateProject: (id: string, updates: any) => ipcRenderer.invoke('sqlite:update-project', id, updates),
    deleteProject: (id: string) => ipcRenderer.invoke('sqlite:delete-project', id),

    // Journal operations
    getJournalEntries: () => ipcRenderer.invoke('sqlite:get-journal-entries'),
    createJournalEntry: (entry: any) => ipcRenderer.invoke('sqlite:create-journal-entry', entry),
    createJournalEntryWithId: (entry: any) => ipcRenderer.invoke('sqlite:create-journal-entry-with-id', entry),
    updateJournalEntry: (id: string, updates: any) => ipcRenderer.invoke('sqlite:update-journal-entry', id, updates),
    deleteJournalEntry: (id: string) => ipcRenderer.invoke('sqlite:delete-journal-entry', id),
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
    googleStart: (clientId: string, clientSecret: string) => ipcRenderer.invoke('oauth:google:start', clientId, clientSecret),
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
});

// Type definitions for the exposed API
export interface ElectronAPI {
  database: {
    testConnection: (connectionUrl: string) => Promise<{ success: boolean; error?: string }>;
  };
  sqlite: {
    // Database management
    initialize: () => Promise<{ success: boolean; error?: string }>;
    testConnection: () => Promise<{ success: boolean; error?: string }>;
    testPersistence: () => Promise<{ success: boolean; createdTask?: any; allTasks?: any[]; totalTasks?: number; error?: string }>;
    verifyDataLoading: () => Promise<{ success: boolean; tasks?: any[]; projects?: any[]; journal?: any[]; counts?: any; error?: string }>;
    getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
    backup: (backupPath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    importFromLocalStorage: (data: any) => Promise<{ success: boolean; result?: any; error?: string }>;
    exportAllData: () => Promise<{ success: boolean; data?: any; error?: string }>;
    query: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;

    // Task operations
    getTasks: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    createTask: (task: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    createTaskWithId: (task: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateTask: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteTask: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;

    // Project operations
    getProjects: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    createProject: (project: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateProject: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteProject: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;

    // Journal operations
    getJournalEntries: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    createJournalEntry: (entry: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateJournalEntry: (id: string, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    deleteJournalEntry: (id: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
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
    googleStart: (clientId: string, clientSecret: string) => Promise<{ success: boolean; authUrl?: string; error?: string }>;
    onGoogleSuccess: (callback: (authData: any) => void) => void;
    onGoogleError: (callback: (error: string) => void) => void;
    onGoogleCancelled: (callback: () => void) => void;
    removeOAuthListeners: () => void;
  };
  safeStorage: {
    encryptString: (plaintext: string) => Promise<string>;
    decryptString: (encrypted: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}