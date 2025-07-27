// Electron API type definitions for renderer process
declare global {
  interface Window {
    electronAPI?: {
      database: {
        testConnection: (connectionUrl: string) => Promise<{ success: boolean; error?: string }>;
      };
      sqlite?: {
        // Database management
        initialize: () => Promise<{ success: boolean; error?: string }>;
        testConnection: () => Promise<{ success: boolean; error?: string }>;
        getStats: () => Promise<{ success: boolean; data?: any; error?: string }>;
        backup: (backupPath?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
        importFromLocalStorage: (data: any) => Promise<{ success: boolean; result?: any; error?: string }>;
        exportAllData: () => Promise<{ success: boolean; data?: any; error?: string }>;

        // Task operations
        getTasks: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
        createTask: (task: any) => Promise<{ success: boolean; data?: any; error?: string }>;
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
      safeStorage?: {
        encryptString: (plaintext: string) => Promise<string>;
        decryptString: (encrypted: string) => Promise<string>;
      };
      onMenuAction: (callback: (event: string, data?: any) => void) => void;
      removeMenuListeners: () => void;
    };
  }
}

export {};