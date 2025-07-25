/**
 * Utility functions to manage crypto operations intelligently
 * Only performs expensive crypto when actually needed
 */

import { SECURE_KEYS } from './secureStorage';

export interface CryptoSettings {
  encryptionEnabled: boolean;
  hasEncryptedData: boolean;
  hasMasterPassword: boolean;
}

/**
 * Check if encryption features are enabled without triggering expensive crypto operations
 */
export const checkCryptoSettings = (): CryptoSettings => {
  // Check if we have any encrypted data
  const hasEncryptedPrivacySettings = localStorage.getItem(`encrypted_${SECURE_KEYS.PRIVACY_SETTINGS}`) !== null;
  const hasEncryptedMasterPassword = localStorage.getItem(`encrypted_${SECURE_KEYS.MASTER_PASSWORD_HASH}`) !== null;
  const hasEncryptedDatabaseConnection = localStorage.getItem(`encrypted_${SECURE_KEYS.DATABASE_CONNECTION}`) !== null;
  
  const hasEncryptedData = hasEncryptedPrivacySettings || hasEncryptedMasterPassword || hasEncryptedDatabaseConnection;
  
  // Check if master password is enabled (from regular privacy settings)
  let hasMasterPassword = false;
  try {
    const regularSettings = localStorage.getItem('serenity_privacy_settings');
    if (regularSettings) {
      const settings = JSON.parse(regularSettings);
      hasMasterPassword = settings.masterPasswordEnabled || false;
    }
  } catch (error) {
    console.error('Failed to check master password status:', error);
  }
  
  // Encryption is considered enabled if we have encrypted data OR master password is enabled
  const encryptionEnabled = hasEncryptedData || hasMasterPassword;
  
  console.log('🔐 Crypto settings check:', { encryptionEnabled, hasEncryptedData, hasMasterPassword });
  
  return {
    encryptionEnabled,
    hasEncryptedData,
    hasMasterPassword
  };
};

/**
 * Determine if we need to show crypto loading screen
 */
export const shouldShowCryptoLoading = (): boolean => {
  const settings = checkCryptoSettings();
  return settings.encryptionEnabled;
};

/**
 * Progressive crypto initialization with progress callbacks
 */
export const initializeCrypto = async (
  onProgress?: (progress: number, stage: string, message: string) => void
): Promise<boolean> => {
  try {
    const settings = checkCryptoSettings();
    
    if (!settings.encryptionEnabled) {
      console.log('⚡ No encryption needed, skipping crypto initialization');
      onProgress?.(100, 'complete', 'No encryption needed');
      return true;
    }
    
    console.log('🔐 Starting crypto initialization...');
    onProgress?.(10, 'initializing', 'Checking encryption requirements...');
    
    // Simulate progressive loading stages
    await new Promise(resolve => setTimeout(resolve, 100));
    onProgress?.(30, 'deriving-key', 'Preparing security keys...');
    
    // Import crypto functions only when needed
    const { getPrivacySettingsSecure } = await import('./secureStorage');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    onProgress?.(60, 'deriving-key', 'Deriving encryption keys...');
    
    // Actually try to read encrypted data
    const privacySettings = await getPrivacySettingsSecure();
    
    onProgress?.(90, 'decrypting', 'Loading encrypted settings...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onProgress?.(100, 'complete', 'Encryption initialized successfully!');
    console.log('✅ Crypto initialization completed');
    
    return true;
  } catch (error) {
    console.error('❌ Crypto initialization failed:', error);
    onProgress?.(0, 'initializing', 'Encryption initialization failed');
    return false;
  }
};