/**
 * Client-side encryption service using Web Crypto API
 * Provides AES-GCM encryption for sensitive user data
 */
export interface EncryptedData {
    data: string;
    iv: string;
    salt: string;
    tag?: string;
    keyVersion?: number;
    timestamp?: string;
}
export interface EncryptionKey {
    key: CryptoKey;
    salt: Uint8Array;
}
/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
    rotationIntervalDays: number;
    maxKeyAge: number;
    keepOldVersions: number;
    autoRotate: boolean;
}
export declare const DEFAULT_KEY_ROTATION: KeyRotationConfig;
/**
 * Key version metadata
 */
export interface KeyVersionInfo {
    version: number;
    createdAt: string;
    rotatedAt?: string;
    salt: string;
    iterations: number;
    status: 'active' | 'deprecated' | 'expired';
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
export declare const DEFAULT_CLASSIFICATION: ClassificationSettings;
/**
 * Encryption configuration based on classification level
 */
interface EncryptionConfig {
    shouldEncrypt: boolean;
    keyIterations: number;
    algorithm: string;
}
declare const getEncryptionConfig: (classification: DataClassification) => EncryptionConfig;
/**
 * Main encryption service class
 */
export declare class EncryptionService {
    private static readonly ALGORITHM;
    private static readonly KEY_LENGTH;
    private static readonly IV_LENGTH;
    /**
     * Generate a cryptographic key from a password and salt
     */
    static deriveKey(password: string, salt: Uint8Array, iterations?: number): Promise<CryptoKey>;
    /**
     * Generate a random salt
     */
    static generateSalt(): Uint8Array;
    /**
     * Generate a random IV
     */
    static generateIV(): Uint8Array;
    /**
     * Encrypt data using AES-GCM
     */
    static encrypt(data: string, password: string, classification?: DataClassification, keyVersion?: number): Promise<EncryptedData>;
    /**
     * Decrypt data using AES-GCM
     */
    static decrypt(encryptedData: EncryptedData, password: string, classification?: DataClassification): Promise<string>;
    /**
     * Encrypt journal entry based on classification settings
     */
    static encryptJournalEntry(content: string, password: string, settings: ClassificationSettings): Promise<EncryptedData>;
    /**
     * Encrypt task data based on classification settings
     */
    static encryptTaskData(data: {
        title?: string;
        description?: string;
    }, password: string, settings: ClassificationSettings): Promise<{
        title?: EncryptedData;
        description?: EncryptedData;
    }>;
    /**
     * Bulk encrypt multiple items
     */
    static encryptBulk(items: Array<{
        data: string;
        classification: DataClassification;
    }>, password: string): Promise<EncryptedData[]>;
    /**
     * Bulk decrypt multiple items
     */
    static decryptBulk(items: Array<{
        data: EncryptedData;
        classification: DataClassification;
    }>, password: string): Promise<string[]>;
    /**
     * Generate a secure random password
     */
    static generateSecurePassword(length?: number): string;
    /**
     * Derive encryption key for data export
     * SECURITY FIX: Use random salt instead of fixed salt
     */
    static deriveExportKey(password: string, providedSalt?: Uint8Array): Promise<{
        key: string;
        salt: string;
    }>;
    /**
     * Secure data deletion (overwrite memory)
     * Enhanced to handle passwords and sensitive strings
     */
    static secureDelete(data: any): void;
    /**
     * Secure clear password from memory (best effort in JavaScript)
     */
    static secureDeletePassword(password: string): void;
    /**
     * Verify encrypted data integrity
     */
    static verifyIntegrity(encryptedData: EncryptedData, password: string, classification: DataClassification): Promise<boolean>;
    /**
     * Get encryption strength score (0-100)
     */
    static getEncryptionStrength(classification: DataClassification): number;
}
/**
 * Key Rotation Manager
 * Handles encryption key lifecycle and rotation
 */
export declare class KeyRotationManager {
    private config;
    private keyVersions;
    private currentVersion;
    constructor(config?: KeyRotationConfig);
    /**
     * Initialize the first key version
     */
    private initializeFirstVersion;
    /**
     * Get current active key version
     */
    getCurrentVersion(): number;
    /**
     * Get key version info
     */
    getKeyVersionInfo(version: number): KeyVersionInfo | undefined;
    /**
     * Get all key versions
     */
    getAllVersions(): KeyVersionInfo[];
    /**
     * Check if key rotation is needed
     */
    isRotationNeeded(): boolean;
    /**
     * Check if key version is expired
     */
    isKeyExpired(version: number): boolean;
    /**
     * Rotate to a new key version
     */
    rotateKey(classification?: DataClassification): Promise<number>;
    /**
     * Clean up old key versions
     */
    private cleanupOldVersions;
    /**
     * Encrypt data with current key version
     */
    encryptWithCurrentKey(data: string, password: string, classification?: DataClassification): Promise<EncryptedData>;
    /**
     * Decrypt data with appropriate key version
     */
    decryptWithKeyVersion(encryptedData: EncryptedData, password: string, classification?: DataClassification): Promise<string>;
    /**
     * Re-encrypt data with current key version
     */
    reencryptData(encryptedData: EncryptedData, password: string, classification?: DataClassification): Promise<EncryptedData>;
    /**
     * Bulk re-encrypt multiple items to current key version
     */
    bulkReencrypt(items: Array<{
        data: EncryptedData;
        classification: DataClassification;
    }>, password: string, onProgress?: (completed: number, total: number) => void): Promise<EncryptedData[]>;
    /**
     * Get rotation status and recommendations
     */
    getRotationStatus(): {
        currentVersion: number;
        rotationNeeded: boolean;
        daysSinceLastRotation: number;
        expiredVersions: number[];
        totalVersions: number;
        recommendations: string[];
    };
    /**
     * Update rotation configuration
     */
    updateConfig(newConfig: Partial<KeyRotationConfig>): void;
    /**
     * Export key version metadata for backup
     */
    exportKeyVersions(): string;
    /**
     * Import key version metadata from backup
     */
    importKeyVersions(jsonData: string): void;
}
/**
 * Data classification manager
 */
export declare class DataClassificationManager {
    private settings;
    constructor(settings?: ClassificationSettings);
    /**
     * Update classification settings
     */
    updateSettings(newSettings: Partial<ClassificationSettings>): void;
    /**
     * Get current settings
     */
    getSettings(): ClassificationSettings;
    /**
     * Get classification for specific data type
     */
    getClassification(dataType: keyof ClassificationSettings): DataClassification;
    /**
     * Check if data type should be encrypted
     */
    shouldEncrypt(dataType: keyof ClassificationSettings): boolean;
    /**
     * Get encryption strength for data type
     */
    getEncryptionStrength(dataType: keyof ClassificationSettings): number;
    /**
     * Get security summary
     */
    getSecuritySummary(): {
        totalDataTypes: number;
        encryptedDataTypes: number;
        averageStrength: number;
        classifications: Record<DataClassification, number>;
    };
}
/**
 * Export utilities
 */
export { getEncryptionConfig };
//# sourceMappingURL=encryption.d.ts.map