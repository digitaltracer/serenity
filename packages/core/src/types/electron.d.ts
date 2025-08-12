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
      aiAssistant?: {
        setApiKey: (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => Promise<{ success: boolean; error?: string; modelInfo?: { model: string; version: string }; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }>;
        testApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; error?: string }>;
        analyzeData: (options: { provider: 'openai' | 'gemini' | 'anthropic'; dataTypes: string[]; forceReAnalyze?: boolean; tasks?: any[]; journalEntries?: any[]; analysisTracker?: any }) => Promise<{ success: boolean; insights?: any[]; processedData?: any; error?: string; message?: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }>;
        generateRecap: (options: { provider: 'openai' | 'gemini' | 'anthropic'; type: 'weekly' | 'monthly'; period: { start: string; end: string }; tasks?: any[]; journalEntries?: any[] }) => Promise<{ success: boolean; recap?: any; error?: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }>;
        getSettings: () => Promise<{ success: boolean; settings?: { modelInfo?: any; activeProvider?: 'openai' | 'gemini' | 'anthropic'; preferredModels?: Record<string, string>; [key: string]: any }; error?: string }>;
        saveSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
        hasApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; hasKey?: boolean; error?: string }>;
        removeApiKey: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; error?: string }>;
        listModels: (provider: 'openai' | 'gemini' | 'anthropic') => Promise<{ success: boolean; models?: { id: string; label: string }[]; error?: string }>;
      };
      onMenuAction: (callback: (event: string, data?: any) => void) => void;
      removeMenuListeners: () => void;
    };
  }
}

export {};
