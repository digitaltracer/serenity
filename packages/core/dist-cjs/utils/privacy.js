"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.migratePasswordHash = exports.needsPasswordMigration = exports.removeMasterPassword = exports.hasMasterPassword = exports.validateMasterPassword = exports.saveMasterPasswordHash = exports.calculatePasswordStrength = exports.resetPrivacySettings = exports.getPrivacySettings = exports.savePrivacySettings = void 0;
/**
 * Privacy and Security utilities for managing user settings and encryption
 */
const bcrypt = __importStar(require("bcryptjs"));
const encryption_1 = require("./encryption");
const logger_1 = require("./logger");
const STORAGE_KEY = 'serenity_privacy_settings';
const DEFAULT_SETTINGS = {
    masterPasswordEnabled: false,
    autoLockTimeout: 15,
    screenPrivacy: false,
    encryptJournalContent: false,
    encryptTaskContent: false,
    hideFromTaskbar: false,
};
/**
 * Simple obfuscation for privacy settings (using same method as database storage)
 */
const obfuscate = (text) => {
    return btoa(encodeURIComponent(text));
};
const deobfuscate = (encodedText) => {
    try {
        return decodeURIComponent(atob(encodedText));
    }
    catch {
        return '';
    }
};
/**
 * Save privacy and security settings
 */
const savePrivacySettings = (settings) => {
    try {
        const obfuscatedData = obfuscate(JSON.stringify(settings));
        localStorage.setItem(STORAGE_KEY, obfuscatedData);
    }
    catch (error) {
        logger_1.logger.error('Failed to save privacy settings:', { component: 'privacy', operation: 'failedSavePrivacy' }, error);
        throw new Error('Failed to save privacy settings');
    }
};
exports.savePrivacySettings = savePrivacySettings;
/**
 * Get privacy and security settings
 */
const getPrivacySettings = () => {
    try {
        const obfuscatedData = localStorage.getItem(STORAGE_KEY);
        if (!obfuscatedData)
            return DEFAULT_SETTINGS;
        const decodedData = deobfuscate(obfuscatedData);
        if (!decodedData)
            return DEFAULT_SETTINGS;
        const settings = JSON.parse(decodedData);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_SETTINGS, ...settings };
    }
    catch (error) {
        logger_1.logger.error('Failed to retrieve privacy settings:', { component: 'privacy', operation: 'failedRetrievePrivacy' }, error);
        return DEFAULT_SETTINGS;
    }
};
exports.getPrivacySettings = getPrivacySettings;
/**
 * Reset privacy settings to defaults
 */
const resetPrivacySettings = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch (error) {
        logger_1.logger.error('Failed to reset privacy settings:', { component: 'privacy', operation: 'failedResetPrivacy' }, error);
    }
};
exports.resetPrivacySettings = resetPrivacySettings;
const calculatePasswordStrength = (password) => {
    if (!password)
        return { score: 0, label: 'No password', suggestions: [] };
    let score = 0;
    const suggestions = [];
    if (password.length >= 8)
        score++;
    else
        suggestions.push('At least 8 characters');
    if (/[A-Z]/.test(password))
        score++;
    else
        suggestions.push('Include uppercase letters');
    if (/[a-z]/.test(password))
        score++;
    else
        suggestions.push('Include lowercase letters');
    if (/[0-9]/.test(password))
        score++;
    else
        suggestions.push('Include numbers');
    if (/[^A-Za-z0-9]/.test(password))
        score++;
    else
        suggestions.push('Include special characters');
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return {
        score: Math.min(score, 4),
        label: labels[Math.min(score, 4)],
        suggestions
    };
};
exports.calculatePasswordStrength = calculatePasswordStrength;
/**
 * Master password storage and validation
 * Note: In production, this should use proper password hashing (bcrypt, scrypt, etc.)
 */
const MASTER_PASSWORD_KEY = 'serenity_master_password';
const saveMasterPasswordHash = async (password) => {
    try {
        // Simple hash for demo - use bcrypt/scrypt in production
        const hash = await hashPassword(password);
        const obfuscatedHash = obfuscate(hash);
        localStorage.setItem(MASTER_PASSWORD_KEY, obfuscatedHash);
    }
    catch (error) {
        logger_1.logger.error('Failed to save master password:', { component: 'privacy', operation: 'failedSaveMaster' }, error);
        throw new Error('Failed to save master password');
    }
};
exports.saveMasterPasswordHash = saveMasterPasswordHash;
const validateMasterPassword = async (password) => {
    try {
        const obfuscatedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
        if (!obfuscatedHash)
            return false;
        const hash = deobfuscate(obfuscatedHash);
        if (!hash)
            return false;
        return await verifyPassword(password, hash);
    }
    catch (error) {
        logger_1.logger.error('Failed to validate master password:', { component: 'privacy', operation: 'failedValidateMaster' }, error);
        return false;
    }
};
exports.validateMasterPassword = validateMasterPassword;
const hasMasterPassword = () => {
    return !!localStorage.getItem(MASTER_PASSWORD_KEY);
};
exports.hasMasterPassword = hasMasterPassword;
const removeMasterPassword = () => {
    try {
        localStorage.removeItem(MASTER_PASSWORD_KEY);
    }
    catch (error) {
        logger_1.logger.error('Failed to remove master password:', { component: 'privacy', operation: 'failedRemoveMaster' }, error);
    }
};
exports.removeMasterPassword = removeMasterPassword;
/**
 * Check if stored password hash needs migration from old SHA-256 format
 */
const needsPasswordMigration = () => {
    try {
        const obfuscatedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
        if (!obfuscatedHash)
            return false;
        const hash = deobfuscate(obfuscatedHash);
        if (!hash)
            return false;
        // bcrypt hashes start with $2a$, $2b$, or $2y$
        // SHA-256 hashes are 64 character hex strings
        return !hash.startsWith('$2') && /^[a-f0-9]{64}$/i.test(hash);
    }
    catch (error) {
        logger_1.logger.error('Failed to check password migration status:', { component: 'privacy', operation: 'failedCheckPassword' }, error);
        return false;
    }
};
exports.needsPasswordMigration = needsPasswordMigration;
/**
 * Migrate password from old SHA-256 format to bcrypt
 * This requires the user to re-enter their password
 */
const migratePasswordHash = async (password) => {
    try {
        // First verify with old method
        const isValidOldPassword = await validateMasterPasswordLegacy(password);
        if (!isValidOldPassword) {
            return false;
        }
        // Hash with new secure method
        await (0, exports.saveMasterPasswordHash)(password);
        logger_1.logger.info('✅ Password successfully migrated to bcrypt', { component: 'privacy', operation: 'passwordSuccessfullyMigrated' });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Password migration failed:', { component: 'privacy', operation: 'passwordMigrationFailed:' }, error);
        return false;
    }
};
exports.migratePasswordHash = migratePasswordHash;
/**
 * Legacy SHA-256 password validation for migration purposes only
 */
async function validateMasterPasswordLegacy(password) {
    try {
        const obfuscatedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
        if (!obfuscatedHash)
            return false;
        const hash = deobfuscate(obfuscatedHash);
        if (!hash)
            return false;
        // Use old SHA-256 method for comparison
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'serenity_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return passwordHash === hash;
    }
    catch (error) {
        logger_1.logger.error('Legacy password validation failed:', { component: 'privacy', operation: 'legacyPasswordValidation' }, error);
        return false;
    }
}
/**
 * Secure password hashing using bcrypt
 * Provides proper salt generation and resistance to timing attacks
 */
const BCRYPT_ROUNDS = 12; // High security level
async function hashPassword(password) {
    try {
        // Generate random salt and hash password
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        // Securely clear password from memory
        encryption_1.EncryptionService.secureDeletePassword(password);
        return hash;
    }
    catch (error) {
        logger_1.logger.error('Password hashing failed:', { component: 'privacy', operation: 'passwordHashingFailed:' }, error);
        // Still clear password even on error
        encryption_1.EncryptionService.secureDeletePassword(password);
        throw new Error('Failed to hash password');
    }
}
async function verifyPassword(password, hash) {
    try {
        // Use bcrypt's built-in verification which is timing-attack resistant
        const isValid = await bcrypt.compare(password, hash);
        // Securely clear password from memory regardless of result
        encryption_1.EncryptionService.secureDeletePassword(password);
        return isValid;
    }
    catch (error) {
        logger_1.logger.error('Password verification failed:', { component: 'privacy', operation: 'passwordVerificationFailed:' }, error);
        // Still clear password even on error
        encryption_1.EncryptionService.secureDeletePassword(password);
        return false; // Fail securely
    }
}
// App lock state management is now handled by Redux authSlice
// This file keeps the utility functions but removes the global state management
