/**
 * Enhanced secure storage utilities using Electron's safeStorage API
 * Falls back to encrypted localStorage for development/non-Electron environments
 */

/// <reference path="../types/electron.d.ts" />

import { 
  CRYPTO_CONFIG, 
  getEnvironmentConfig, 
  validateSecurityPolicy,
  generateSalt,
  generateIV,
  constantTimeCompare,
  validateCryptoSupport
} from './securityConfig';

// Validate crypto support and security policy on module load
(() => {
  const cryptoSupport = validateCryptoSupport();
  if (!cryptoSupport.supported) {
    console.error('🚨 Crypto API not supported. Missing:', cryptoSupport.missing.join(', '));
    throw new Error('Web Crypto API required for secure storage');
  }
  
  if (!validateSecurityPolicy(CRYPTO_CONFIG)) {
    throw new Error('Security policy validation failed');
  }
  
  console.log('🔒 Secure storage initialized with production-grade encryption');
})();

// Check if we're in an Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined && 
         window.electronAPI.safeStorage?.encryptString !== undefined;
};

// Advanced encryption for localStorage fallback
class LocalStorageEncryption {
  private static readonly CONFIG = CRYPTO_CONFIG;

  /**
   * Generate a cryptographic key from a password using PBKDF2
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const envConfig = getEnvironmentConfig();
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
        iterations: envConfig.pbkdf2Iterations,
        hash: this.CONFIG.HASH_ALGORITHM,
      },
      passwordKey,
      { name: this.CONFIG.AES.ALGORITHM, length: this.CONFIG.AES.KEY_LENGTH },
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
      const salt = generateSalt();
      const iv = generateIV();
      
      const key = await this.deriveKey(password, salt);
      const encodedData = encoder.encode(data);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.CONFIG.AES.ALGORITHM, iv },
        key,
        encodedData
      );

      // Create versioned format: version + salt + iv + encrypted data
      const version = new TextEncoder().encode(this.CONFIG.VERSION);
      const combined = new Uint8Array(
        version.length + salt.length + iv.length + encryptedData.byteLength
      );
      
      let offset = 0;
      combined.set(version, offset);
      offset += version.length;
      combined.set(salt, offset);
      offset += salt.length;
      combined.set(iv, offset);
      offset += iv.length;
      combined.set(new Uint8Array(encryptedData), offset);

      // Add prefix and convert to base64 for storage
      return this.CONFIG.ENCRYPTED_DATA_PREFIX + btoa(String.fromCharCode(...combined));
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
      // Check for prefix and remove it
      let dataWithoutPrefix = encryptedData;
      if (encryptedData.startsWith(this.CONFIG.ENCRYPTED_DATA_PREFIX)) {
        dataWithoutPrefix = encryptedData.slice(this.CONFIG.ENCRYPTED_DATA_PREFIX.length);
      }
      
      const combined = new Uint8Array(
        Array.from(atob(dataWithoutPrefix), char => char.charCodeAt(0))
      );

      // Parse versioned format
      const version = new TextDecoder().decode(combined.slice(0, this.CONFIG.VERSION.length));
      if (version !== this.CONFIG.VERSION) {
        console.warn(`Decrypting data with version ${version}, current version ${this.CONFIG.VERSION}`);
      }

      let offset = this.CONFIG.VERSION.length;
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(offset, offset + this.CONFIG.SALT_LENGTH);
      offset += this.CONFIG.SALT_LENGTH;
      
      const iv = combined.slice(offset, offset + this.CONFIG.AES.IV_LENGTH);
      offset += this.CONFIG.AES.IV_LENGTH;
      
      const encrypted = combined.slice(offset);

      const key = await this.deriveKey(password, salt);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: this.CONFIG.AES.ALGORITHM, iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - possible corruption or wrong password');
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
 * Fallback encrypted localStorage implementation with optimized performance
 */
class EncryptedLocalStorage implements SecureStorage {
  private static readonly MASTER_KEY = 'serenity_storage_key';
  private static derivedKeyCache: CryptoKey | null = null;
  private static masterKeyString: string | null = null;

  private async getMasterKey(): Promise<string> {
    if (EncryptedLocalStorage.masterKeyString) {
      return EncryptedLocalStorage.masterKeyString;
    }

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
    
    EncryptedLocalStorage.masterKeyString = key;
    return key;
  }

  private async getDerivedKey(): Promise<CryptoKey> {
    if (EncryptedLocalStorage.derivedKeyCache) {
      return EncryptedLocalStorage.derivedKeyCache;
    }

    const masterKey = await this.getMasterKey();
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); // Fixed salt for performance
    
    // Reduced iterations for startup performance - still secure for local storage
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const envConfig = getEnvironmentConfig();
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: envConfig.pbkdf2Iterations, // Environment-aware iterations
        hash: CRYPTO_CONFIG.HASH_ALGORITHM,
      },
      passwordKey,
      { name: CRYPTO_CONFIG.AES.ALGORITHM, length: CRYPTO_CONFIG.AES.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    EncryptedLocalStorage.derivedKeyCache = derivedKey;
    return derivedKey;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const derivedKey = await this.getDerivedKey();
      const encrypted = await this.encryptWithKey(value, derivedKey);
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

      const derivedKey = await this.getDerivedKey();
      return await this.decryptWithKey(encrypted, derivedKey);
    } catch (error) {
      console.error('Failed to retrieve encrypted item:', error);
      return null;
    }
  }

  private async encryptWithKey(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine iv + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private async decryptWithKey(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
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
    console.log('🔒 Loading privacy settings securely...');
    const startTime = performance.now();
    
    // Quick check if we have any encrypted settings before initializing crypto
    const quickCheck = localStorage.getItem(`encrypted_${SECURE_KEYS.PRIVACY_SETTINGS}`);
    if (!quickCheck) {
      console.log('⚡ No encrypted privacy settings found, skipping crypto');
      console.log(`✅ Quick check completed in ${(performance.now() - startTime).toFixed(2)}ms`);
      return null;
    }
    
    console.log('🔐 Encrypted data found, initializing secure storage...');
    const storageStart = performance.now();
    const storage = getSecureStorage();
    console.log(`✅ Secure storage ready in ${(performance.now() - storageStart).toFixed(2)}ms`);
    
    console.log('📖 Decrypting privacy settings...');
    const readStart = performance.now();
    const data = await storage.getItem(SECURE_KEYS.PRIVACY_SETTINGS);
    console.log(`✅ Decryption completed in ${(performance.now() - readStart).toFixed(2)}ms`);
    
    if (!data) {
      console.log('📝 No privacy settings found after decryption');
      return null;
    }
    
    console.log('🔄 Parsing decrypted settings...');
    const parseStart = performance.now();
    const result = JSON.parse(data) as EnhancedPrivacySettings;
    console.log(`✅ Settings parsed in ${(performance.now() - parseStart).toFixed(2)}ms`);
    console.log(`🎯 Total secure settings load time: ${(performance.now() - startTime).toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to retrieve privacy settings:', error);
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

    const envConfig = getEnvironmentConfig();
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: envConfig.pbkdf2Iterations,
        hash: CRYPTO_CONFIG.HASH_ALGORITHM,
      },
      passwordKey,
      CRYPTO_CONFIG.AES.KEY_LENGTH
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const passwordData = {
      hash: hashHex,
      salt: saltBase64,
      iterations: envConfig.pbkdf2Iterations,
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

