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
        query: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;

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
      oauth?: {
        googleStart: (clientId: string, clientSecret: string) => Promise<{ success: boolean; authUrl?: string; error?: string }>;
        onGoogleSuccess: (callback: (authData: any) => void) => void;
        onGoogleError: (callback: (error: string) => void) => void;
        onGoogleCancelled: (callback: () => void) => void;
        removeOAuthListeners: () => void;
      };
      integrations?: {
        initializeTable: () => Promise<{ success: boolean; data?: any; error?: string }>;
        saveEncrypted: (integrationData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
        loadEncrypted: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
        hasEncrypted: () => Promise<{ success: boolean; data?: { hasEncrypted: boolean; count: number }; error?: string }>;
        clearEncrypted: () => Promise<{ success: boolean; data?: any; error?: string }>;
        verifyTable: () => Promise<{ success: boolean; data?: { exists: boolean }; error?: string }>;
        getVerification: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
      auth?: {
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
      onMenuAction: (callback: (event: string, data?: any) => void) => void;
      removeMenuListeners: () => void;
    };
  }
}

export {};