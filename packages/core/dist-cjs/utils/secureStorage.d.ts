/**
 * Enhanced secure storage utilities using Electron's safeStorage API
 * Falls back to encrypted localStorage for development/non-Electron environments
 */
/**
 * Secure storage interface
 */
export interface SecureStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare const getSecureStorage: () => SecureStorage;
/**
 * Secure storage keys
 */
export declare const SECURE_KEYS: {
    readonly DATABASE_CONNECTION: "database_connection";
    readonly MASTER_PASSWORD_HASH: "master_password_hash";
    readonly PRIVACY_SETTINGS: "privacy_settings";
    readonly ENCRYPTION_KEYS: "encryption_keys";
};
/**
 * Enhanced database connection storage
 */
export interface SecureDatabaseConnection {
    url: string;
    connected: boolean;
    lastConnected?: string;
    encryptionEnabled: boolean;
}
export declare const saveDatabaseConnectionSecure: (connectionUrl: string) => Promise<void>;
export declare const getDatabaseConnectionSecure: () => Promise<SecureDatabaseConnection | null>;
export declare const removeDatabaseConnectionSecure: () => Promise<void>;
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
    dataRetentionDays: number;
    localOnlyMode: boolean;
    encryptionLevel: 'basic' | 'enhanced' | 'maximum';
    secureDelete: boolean;
    biometricAuth: boolean;
}
export declare const savePrivacySettingsSecure: (settings: EnhancedPrivacySettings) => Promise<void>;
export declare const getPrivacySettingsSecure: () => Promise<EnhancedPrivacySettings | null>;
/**
 * Enhanced master password storage with better security
 */
export declare const saveMasterPasswordHashSecure: (password: string) => Promise<void>;
export declare const validateMasterPasswordSecure: (password: string) => Promise<boolean>;
/**
 * Secure PostgreSQL credentials storage
 * SECURITY FIX: Store PostgreSQL passwords securely instead of plain text
 */
export interface SecurePostgreSQLConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    ssl?: boolean;
}
export interface PostgreSQLCredentials {
    password: string;
    created: string;
    lastUsed?: string;
}
/**
 * Save PostgreSQL configuration with secure password storage
 */
export declare const savePostgreSQLConfigSecure: (config: SecurePostgreSQLConfig, password: string) => Promise<void>;
/**
 * Retrieve PostgreSQL configuration with decrypted password
 */
export declare const getPostgreSQLConfigSecure: () => Promise<{
    config: SecurePostgreSQLConfig;
    password: string;
} | null>;
/**
 * Remove PostgreSQL configuration and credentials
 */
export declare const removePostgreSQLConfigSecure: () => Promise<void>;
