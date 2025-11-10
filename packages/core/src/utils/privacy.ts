/**
 * Privacy and Security utilities for managing user settings and encryption
 */
import * as bcrypt from 'bcryptjs';
import { EncryptionService } from './encryption';
import { logger } from './logger';

export interface PrivacySecuritySettings {
  masterPasswordEnabled: boolean;
  autoLockTimeout: number; // minutes, 0 = never
  screenPrivacy: boolean;
  encryptJournalContent: boolean;
  encryptTaskContent: boolean;
  hideFromTaskbar: boolean;
}

const STORAGE_KEY = 'serenity_privacy_settings';

const DEFAULT_SETTINGS: PrivacySecuritySettings = {
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
const obfuscate = (text: string): string => {
  return btoa(encodeURIComponent(text));
};

const deobfuscate = (encodedText: string): string => {
  try {
    return decodeURIComponent(atob(encodedText));
  } catch {
    return '';
  }
};

/**
 * Save privacy and security settings
 */
export const savePrivacySettings = (settings: PrivacySecuritySettings): void => {
  try {
    const obfuscatedData = obfuscate(JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEY, obfuscatedData);
  } catch (error) {
    logger.error('Failed to save privacy settings:', { component: 'privacy', operation: 'failedSavePrivacy' }, error as Error);
    throw new Error('Failed to save privacy settings');
  }
};

/**
 * Get privacy and security settings
 */
export const getPrivacySettings = (): PrivacySecuritySettings => {
  try {
    const obfuscatedData = localStorage.getItem(STORAGE_KEY);
    if (!obfuscatedData) return DEFAULT_SETTINGS;
    
    const decodedData = deobfuscate(obfuscatedData);
    if (!decodedData) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(decodedData) as PrivacySecuritySettings;
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    logger.error('Failed to retrieve privacy settings:', { component: 'privacy', operation: 'failedRetrievePrivacy' }, error as Error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Reset privacy settings to defaults
 */
export const resetPrivacySettings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to reset privacy settings:', { component: 'privacy', operation: 'failedResetPrivacy' }, error as Error);
  }
};

/**
 * Password strength calculation
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  suggestions: string[];
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: 'No password', suggestions: [] };
  
  let score = 0;
  const suggestions: string[] = [];
  
  if (password.length >= 8) score++;
  else suggestions.push('At least 8 characters');
  
  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Include uppercase letters');
  
  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Include lowercase letters');
  
  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Include numbers');
  
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Include special characters');
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    suggestions
  };
};

/**
 * Master password storage and validation
 * Note: In production, this should use proper password hashing (bcrypt, scrypt, etc.)
 */
const MASTER_PASSWORD_KEY = 'serenity_master_password';

export const saveMasterPasswordHash = async (password: string): Promise<void> => {
  try {
    // Simple hash for demo - use bcrypt/scrypt in production
    const hash = await hashPassword(password);
    const obfuscatedHash = obfuscate(hash);
    localStorage.setItem(MASTER_PASSWORD_KEY, obfuscatedHash);
  } catch (error) {
    logger.error('Failed to save master password:', { component: 'privacy', operation: 'failedSaveMaster' }, error as Error);
    throw new Error('Failed to save master password');
  }
};

export const validateMasterPassword = async (password: string): Promise<boolean> => {
  try {
    const obfuscatedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
    if (!obfuscatedHash) return false;
    
    const hash = deobfuscate(obfuscatedHash);
    if (!hash) return false;
    
    return await verifyPassword(password, hash);
  } catch (error) {
    logger.error('Failed to validate master password:', { component: 'privacy', operation: 'failedValidateMaster' }, error as Error);
    return false;
  }
};

export const hasMasterPassword = (): boolean => {
  return !!localStorage.getItem(MASTER_PASSWORD_KEY);
};

export const removeMasterPassword = (): void => {
  try {
    localStorage.removeItem(MASTER_PASSWORD_KEY);
  } catch (error) {
    logger.error('Failed to remove master password:', { component: 'privacy', operation: 'failedRemoveMaster' }, error as Error);
  }
};

/**
 * Check if stored password hash needs migration from old SHA-256 format
 */
export const needsPasswordMigration = (): boolean => {
  try {
    const obfuscatedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
    if (!obfuscatedHash) return false;
    
    const hash = deobfuscate(obfuscatedHash);
    if (!hash) return false;
    
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    // SHA-256 hashes are 64 character hex strings
    return !hash.startsWith('$2') && /^[a-f0-9]{64}$/i.test(hash);
  } catch (error) {
    logger.error('Failed to check password migration status:', { component: 'privacy', operation: 'failedCheckPassword' }, error as Error);
    return false;
  }
};

/**
 * Migrate password from old SHA-256 format to bcrypt
 * This requires the user to re-enter their password
 */
export const migratePasswordHash = async (password: string): Promise<boolean> => {
  try {
    // First verify with old method
    const isValidOldPassword = await validateMasterPasswordLegacy(password);
    if (!isValidOldPassword) {
      return false;
    }
    
    // Hash with new secure method
    await saveMasterPasswordHash(password);
    logger.info('✅ Password successfully migrated to bcrypt', { component: 'privacy', operation: 'passwordSuccessfullyMigrated' });
    return true;
  } catch (error) {
    logger.error('Password migration failed:', { component: 'privacy', operation: 'passwordMigrationFailed:' }, error as Error);
    return false;
  }
};

/**
 * Legacy SHA-256 password validation for migration purposes only
 */
async function validateMasterPasswordLegacy(password: string): Promise<boolean> {
  try {
    const obfuscatedHash = localStorage.getItem(MASTER_PASSWORD_KEY);
    if (!obfuscatedHash) return false;
    
    const hash = deobfuscate(obfuscatedHash);
    if (!hash) return false;
    
    // Use old SHA-256 method for comparison
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'serenity_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return passwordHash === hash;
  } catch (error) {
    logger.error('Legacy password validation failed:', { component: 'privacy', operation: 'legacyPasswordValidation' }, error as Error);
    return false;
  }
}

/**
 * Secure password hashing using bcrypt
 * Provides proper salt generation and resistance to timing attacks
 */
const BCRYPT_ROUNDS = 12; // High security level

async function hashPassword(password: string): Promise<string> {
  try {
    // Generate random salt and hash password
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    
    // Securely clear password from memory
    EncryptionService.secureDeletePassword(password);
    
    return hash;
  } catch (error) {
    logger.error('Password hashing failed:', { component: 'privacy', operation: 'passwordHashingFailed:' }, error as Error);
    // Still clear password even on error
    EncryptionService.secureDeletePassword(password);
    throw new Error('Failed to hash password');
  }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Use bcrypt's built-in verification which is timing-attack resistant
    const isValid = await bcrypt.compare(password, hash);
    
    // Securely clear password from memory regardless of result
    EncryptionService.secureDeletePassword(password);
    
    return isValid;
  } catch (error) {
    logger.error('Password verification failed:', { component: 'privacy', operation: 'passwordVerificationFailed:' }, error as Error);
    // Still clear password even on error
    EncryptionService.secureDeletePassword(password);
    return false; // Fail securely
  }
}

// App lock state management is now handled by Redux authSlice
// This file keeps the utility functions but removes the global state management