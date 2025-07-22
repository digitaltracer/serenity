import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  database: {
    testConnection: (config: any) => ipcRenderer.invoke('database:test-connection', config),
  },

  // Window operations
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
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
});

// Type definitions for the exposed API
export interface ElectronAPI {
  database: {
    testConnection: (config: any) => Promise<{ success: boolean }>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  onMenuAction: (callback: (event: string, data?: any) => void) => void;
  removeMenuListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}