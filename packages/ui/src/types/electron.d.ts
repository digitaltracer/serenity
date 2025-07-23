// Electron API types for UI package
declare global {
  interface Window {
    electronAPI?: {
      database: {
        testConnection: (config: any) => Promise<{ success: boolean }>;
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