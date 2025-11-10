export interface PrivacySecuritySettings {
    masterPasswordEnabled: boolean;
    autoLockTimeout: number;
    screenPrivacy: boolean;
    encryptJournalContent: boolean;
    encryptTaskContent: boolean;
    hideFromTaskbar: boolean;
}
/**
 * Save privacy and security settings
 */
export declare const savePrivacySettings: (settings: PrivacySecuritySettings) => void;
/**
 * Get privacy and security settings
 */
export declare const getPrivacySettings: () => PrivacySecuritySettings;
/**
 * Reset privacy settings to defaults
 */
export declare const resetPrivacySettings: () => void;
/**
 * Password strength calculation
 */
export interface PasswordStrength {
    score: number;
    label: string;
    suggestions: string[];
}
export declare const calculatePasswordStrength: (password: string) => PasswordStrength;
export declare const saveMasterPasswordHash: (password: string) => Promise<void>;
export declare const validateMasterPassword: (password: string) => Promise<boolean>;
export declare const hasMasterPassword: () => boolean;
export declare const removeMasterPassword: () => void;
/**
 * Check if stored password hash needs migration from old SHA-256 format
 */
export declare const needsPasswordMigration: () => boolean;
/**
 * Migrate password from old SHA-256 format to bcrypt
 * This requires the user to re-enter their password
 */
export declare const migratePasswordHash: (password: string) => Promise<boolean>;
