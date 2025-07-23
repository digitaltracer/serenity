/**
 * Enhanced secure storage utilities using Electron's safeStorage API
 * Falls back to encrypted localStorage for development/non-Electron environments
 */

/// <reference path="../types/electron.d.ts" />

// Check if we're in an Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined && 
         window.electronAPI.safeStorage?.encryptString !== undefined;
};

// Advanced encryption for localStorage fallback
class LocalStorageEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 96;

  /**
   * Generate a cryptographic key from a password using PBKDF2
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH / 8));
      
      const key = await this.deriveKey(password, salt);
      const encodedData = encoder.encode(data);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        encodedData
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const combined = new Uint8Array(
        Array.from(atob(encryptedData), char => char.charCodeAt(0))
      );

      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 16 + this.IV_LENGTH / 8);
      const encrypted = combined.slice(16 + this.IV_LENGTH / 8);

      const key = await this.deriveKey(password, salt);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

/**
 * Secure storage interface
 */
export interface SecureStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Electron safeStorage implementation
 */
class ElectronSecureStorage implements SecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (window.electronAPI?.safeStorage?.encryptString) {
        const encrypted = await window.electronAPI.safeStorage.encryptString(value);
        localStorage.setItem(`secure_${key}`, encrypted);
      } else {
        throw new Error('Electron safeStorage not available');
      }
    } catch (error) {
      console.error('Failed to store secure item:', error);
      throw new Error('Failed to store secure data');
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;

      if (window.electronAPI?.safeStorage?.decryptString) {
        return await window.electronAPI.safeStorage.decryptString(encrypted);
      } else {
        throw new Error('Electron safeStorage not available');
      }
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(`secure_${key}`);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('secure_'));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Fallback encrypted localStorage implementation
 */
class EncryptedLocalStorage implements SecureStorage {
  private static readonly MASTER_KEY = 'serenity_storage_key';

  private async getMasterKey(): Promise<string> {
    // In a real app, this should be derived from user's master password
    // For now, use a generated key stored in regular localStorage
    let key = localStorage.getItem(EncryptedLocalStorage.MASTER_KEY);
    if (!key) {
      // Generate a random key
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      key = btoa(String.fromCharCode(...array));
      localStorage.setItem(EncryptedLocalStorage.MASTER_KEY, key);
    }
    return key;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const masterKey = await this.getMasterKey();
      const encrypted = await LocalStorageEncryption.encrypt(value, masterKey);
      localStorage.setItem(`encrypted_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted item:', error);
      throw new Error('Failed to store encrypted data');
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(`encrypted_${key}`);
      if (!encrypted) return null;

      const masterKey = await this.getMasterKey();
      return await LocalStorageEncryption.decrypt(encrypted, masterKey);
    } catch (error) {
      console.error('Failed to retrieve encrypted item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(`encrypted_${key}`);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('encrypted_'));
    keys.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(EncryptedLocalStorage.MASTER_KEY);
  }
}

/**
 * Get the appropriate secure storage implementation
 */
let secureStorageInstance: SecureStorage | null = null;

export const getSecureStorage = (): SecureStorage => {
  if (!secureStorageInstance) {
    secureStorageInstance = isElectron() 
      ? new ElectronSecureStorage()
      : new EncryptedLocalStorage();
  }
  return secureStorageInstance;
};

/**
 * Secure storage keys
 */
export const SECURE_KEYS = {
  DATABASE_CONNECTION: 'database_connection',
  MASTER_PASSWORD_HASH: 'master_password_hash',
  PRIVACY_SETTINGS: 'privacy_settings',
  ENCRYPTION_KEYS: 'encryption_keys',
} as const;

/**
 * Enhanced database connection storage
 */
export interface SecureDatabaseConnection {
  url: string;
  connected: boolean;
  lastConnected?: string;
  encryptionEnabled: boolean;
}

export const saveDatabaseConnectionSecure = async (connectionUrl: string): Promise<void> => {
  try {
    const storage = getSecureStorage();
    const connection: SecureDatabaseConnection = {
      url: connectionUrl,
      connected: true,
      lastConnected: new Date().toISOString(),
      encryptionEnabled: false, // Can be enabled later
    };
    
    await storage.setItem(SECURE_KEYS.DATABASE_CONNECTION, JSON.stringify(connection));
  } catch (error) {
    console.error('Failed to save database connection securely:', error);
    throw new Error('Failed to save connection details');
  }
};

export const getDatabaseConnectionSecure = async (): Promise<SecureDatabaseConnection | null> => {
  try {
    const storage = getSecureStorage();
    const data = await storage.getItem(SECURE_KEYS.DATABASE_CONNECTION);
    if (!data) return null;
    
    return JSON.parse(data) as SecureDatabaseConnection;
  } catch (error) {
    console.error('Failed to retrieve database connection:', error);
    return null;
  }
};

export const removeDatabaseConnectionSecure = async (): Promise<void> => {
  try {
    const storage = getSecureStorage();
    await storage.removeItem(SECURE_KEYS.DATABASE_CONNECTION);
  } catch (error) {
    console.error('Failed to remove database connection:', error);
  }
};

/**
 * Enhanced privacy settings storage
 */
export interface EnhancedPrivacySettings {
  masterPasswordEnabled: boolean;
  autoLockTimeout: number;
  screenPrivacy: boolean;
  encryptJournalContent: boolean;
  encryptTaskContent: boolean;
  hideFromTaskbar: boolean;
  // New Phase 2 settings
  dataRetentionDays: number; // 0 = keep forever
  localOnlyMode: boolean;
  encryptionLevel: 'basic' | 'enhanced' | 'maximum';
  secureDelete: boolean;
  biometricAuth: boolean;
}

export const savePrivacySettingsSecure = async (settings: EnhancedPrivacySettings): Promise<void> => {
  try {
    const storage = getSecureStorage();
    await storage.setItem(SECURE_KEYS.PRIVACY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save privacy settings securely:', error);
    throw new Error('Failed to save privacy settings');
  }
};

export const getPrivacySettingsSecure = async (): Promise<EnhancedPrivacySettings | null> => {
  try {
    const storage = getSecureStorage();
    const data = await storage.getItem(SECURE_KEYS.PRIVACY_SETTINGS);
    if (!data) return null;
    
    return JSON.parse(data) as EnhancedPrivacySettings;
  } catch (error) {
    console.error('Failed to retrieve privacy settings:', error);
    return null;
  }
};

/**
 * Enhanced master password storage with better security
 */
export const saveMasterPasswordHashSecure = async (password: string): Promise<void> => {
  try {
    const storage = getSecureStorage();
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    
    // Use PBKDF2 for password hashing
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      256
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const passwordData = {
      hash: hashHex,
      salt: saltBase64,
      iterations: 100000,
      created: new Date().toISOString(),
    };

    await storage.setItem(SECURE_KEYS.MASTER_PASSWORD_HASH, JSON.stringify(passwordData));
  } catch (error) {
    console.error('Failed to save master password hash securely:', error);
    throw new Error('Failed to save master password');
  }
};

export const validateMasterPasswordSecure = async (password: string): Promise<boolean> => {
  try {
    const storage = getSecureStorage();
    const data = await storage.getItem(SECURE_KEYS.MASTER_PASSWORD_HASH);
    if (!data) return false;

    const passwordData = JSON.parse(data);
    const salt = new Uint8Array(Array.from(atob(passwordData.salt), c => c.charCodeAt(0)));
    
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: passwordData.iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      256
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === passwordData.hash;
  } catch (error) {
    console.error('Failed to validate master password:', error);
    return false;
  }
};

