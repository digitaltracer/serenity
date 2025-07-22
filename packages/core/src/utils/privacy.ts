/**
 * Privacy and Security utilities for managing user settings and encryption
 */

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
    console.error('Failed to save privacy settings:', error);
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
    console.error('Failed to retrieve privacy settings:', error);
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
    console.error('Failed to reset privacy settings:', error);
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
    console.error('Failed to save master password:', error);
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
    console.error('Failed to validate master password:', error);
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
    console.error('Failed to remove master password:', error);
  }
};

/**
 * Simple password hashing using Web Crypto API
 * In production, use a proper password hashing library
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'serenity_salt'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// App lock state management is now handled by Redux authSlice
// This file keeps the utility functions but removes the global state management