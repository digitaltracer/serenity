/**
 * Client-side encryption service using Web Crypto API
 * Provides AES-GCM encryption for sensitive user data
 */

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
  tag?: string; // Authentication tag (included in GCM mode)
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

/**
 * Data classification levels
 */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface ClassificationSettings {
  journalEntries: DataClassification;
  taskDescriptions: DataClassification;
  taskTitles: DataClassification;
  projectNames: DataClassification;
  tags: DataClassification;
  userNotes: DataClassification;
}

export const DEFAULT_CLASSIFICATION: ClassificationSettings = {
  journalEntries: 'confidential',
  taskDescriptions: 'internal',
  taskTitles: 'internal',
  projectNames: 'internal',
  tags: 'internal',
  userNotes: 'confidential',
};

/**
 * Encryption configuration based on classification level
 */
interface EncryptionConfig {
  shouldEncrypt: boolean;
  keyIterations: number;
  algorithm: string;
}

const getEncryptionConfig = (classification: DataClassification): EncryptionConfig => {
  switch (classification) {
    case 'restricted':
      return { shouldEncrypt: true, keyIterations: 500000, algorithm: 'AES-GCM' };
    case 'confidential':
      return { shouldEncrypt: true, keyIterations: 200000, algorithm: 'AES-GCM' };
    case 'internal':
      return { shouldEncrypt: true, keyIterations: 100000, algorithm: 'AES-GCM' };
    case 'public':
    default:
      return { shouldEncrypt: false, keyIterations: 0, algorithm: '' };
  }
};

/**
 * Main encryption service class
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 96;

  /**
   * Generate a cryptographic key from a password and salt
   */
  static async deriveKey(
    password: string, 
    salt: Uint8Array, 
    iterations: number = 100000
  ): Promise<CryptoKey> {
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
        iterations: iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random salt
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generate a random IV
   */
  static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH / 8));
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encrypt(
    data: string, 
    password: string, 
    classification: DataClassification = 'confidential'
  ): Promise<EncryptedData> {
    const config = getEncryptionConfig(classification);
    
    if (!config.shouldEncrypt) {
      // Return unencrypted data for public classification
      return {
        data: btoa(data),
        iv: '',
        salt: '',
      };
    }

    try {
      const encoder = new TextEncoder();
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      const key = await this.deriveKey(password, salt, config.keyIterations);
      const encodedData = encoder.encode(data);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        encodedData
      );

      return {
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt)),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decrypt(
    encryptedData: EncryptedData, 
    password: string,
    classification: DataClassification = 'confidential'
  ): Promise<string> {
    const config = getEncryptionConfig(classification);
    
    if (!config.shouldEncrypt) {
      // Return decoded data for public classification
      return atob(encryptedData.data);
    }

    try {
      const salt = new Uint8Array(
        Array.from(atob(encryptedData.salt), char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        Array.from(atob(encryptedData.iv), char => char.charCodeAt(0))
      );
      const encrypted = new Uint8Array(
        Array.from(atob(encryptedData.data), char => char.charCodeAt(0))
      );

      const key = await this.deriveKey(password, salt, config.keyIterations);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt journal entry based on classification settings
   */
  static async encryptJournalEntry(
    content: string,
    password: string,
    settings: ClassificationSettings
  ): Promise<EncryptedData> {
    return this.encrypt(content, password, settings.journalEntries);
  }

  /**
   * Encrypt task data based on classification settings
   */
  static async encryptTaskData(
    data: { title?: string; description?: string },
    password: string,
    settings: ClassificationSettings
  ): Promise<{ title?: EncryptedData; description?: EncryptedData }> {
    const result: { title?: EncryptedData; description?: EncryptedData } = {};

    if (data.title) {
      result.title = await this.encrypt(data.title, password, settings.taskTitles);
    }

    if (data.description) {
      result.description = await this.encrypt(data.description, password, settings.taskDescriptions);
    }

    return result;
  }

  /**
   * Bulk encrypt multiple items
   */
  static async encryptBulk(
    items: Array<{ data: string; classification: DataClassification }>,
    password: string
  ): Promise<EncryptedData[]> {
    const encrypted = await Promise.all(
      items.map(item => this.encrypt(item.data, password, item.classification))
    );
    return encrypted;
  }

  /**
   * Bulk decrypt multiple items
   */
  static async decryptBulk(
    items: Array<{ data: EncryptedData; classification: DataClassification }>,
    password: string
  ): Promise<string[]> {
    const decrypted = await Promise.all(
      items.map(item => this.decrypt(item.data, password, item.classification))
    );
    return decrypted;
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  /**
   * Derive encryption key for data export
   */
  static async deriveExportKey(password: string): Promise<string> {
    const salt = new TextEncoder().encode('serenity_export_salt');
    const key = await this.deriveKey(password, salt, 200000);
    
    // Export key as JWK for serialization
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exportedKey);
  }

  /**
   * Secure data deletion (overwrite memory)
   */
  static secureDelete(data: any): void {
    if (typeof data === 'string') {
      // Overwrite string with random data (best effort in JS)
      const randomData = this.generateSecurePassword(data.length);
      data = randomData;
    } else if (data instanceof Uint8Array) {
      // Overwrite array with random values
      crypto.getRandomValues(data);
    } else if (typeof data === 'object' && data !== null) {
      // Recursively secure delete object properties
      Object.keys(data).forEach(key => {
        this.secureDelete(data[key]);
        delete data[key];
      });
    }
  }

  /**
   * Verify encrypted data integrity
   */
  static async verifyIntegrity(
    encryptedData: EncryptedData,
    password: string,
    classification: DataClassification
  ): Promise<boolean> {
    try {
      await this.decrypt(encryptedData, password, classification);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get encryption strength score (0-100)
   */
  static getEncryptionStrength(classification: DataClassification): number {
    const config = getEncryptionConfig(classification);
    if (!config.shouldEncrypt) return 0;
    
    // Score based on key iterations and algorithm
    const baseScore = config.keyIterations / 5000; // Max 100 for 500k iterations
    return Math.min(100, Math.round(baseScore));
  }
}

/**
 * Data classification manager
 */
export class DataClassificationManager {
  private settings: ClassificationSettings;

  constructor(settings: ClassificationSettings = DEFAULT_CLASSIFICATION) {
    this.settings = { ...settings };
  }

  /**
   * Update classification settings
   */
  updateSettings(newSettings: Partial<ClassificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): ClassificationSettings {
    return { ...this.settings };
  }

  /**
   * Get classification for specific data type
   */
  getClassification(dataType: keyof ClassificationSettings): DataClassification {
    return this.settings[dataType];
  }

  /**
   * Check if data type should be encrypted
   */
  shouldEncrypt(dataType: keyof ClassificationSettings): boolean {
    const classification = this.getClassification(dataType);
    return getEncryptionConfig(classification).shouldEncrypt;
  }

  /**
   * Get encryption strength for data type
   */
  getEncryptionStrength(dataType: keyof ClassificationSettings): number {
    const classification = this.getClassification(dataType);
    return EncryptionService.getEncryptionStrength(classification);
  }

  /**
   * Get security summary
   */
  getSecuritySummary(): {
    totalDataTypes: number;
    encryptedDataTypes: number;
    averageStrength: number;
    classifications: Record<DataClassification, number>;
  } {
    const dataTypes = Object.keys(this.settings) as Array<keyof ClassificationSettings>;
    const classifications = dataTypes.reduce((acc, type) => {
      const classification = this.settings[type];
      acc[classification] = (acc[classification] || 0) + 1;
      return acc;
    }, {} as Record<DataClassification, number>);

    const encryptedTypes = dataTypes.filter(type => this.shouldEncrypt(type));
    const totalStrength = dataTypes.reduce((sum, type) => {
      return sum + this.getEncryptionStrength(type);
    }, 0);

    return {
      totalDataTypes: dataTypes.length,
      encryptedDataTypes: encryptedTypes.length,
      averageStrength: Math.round(totalStrength / dataTypes.length),
      classifications,
    };
  }
}

/**
 * Export utilities
 */
export { getEncryptionConfig };