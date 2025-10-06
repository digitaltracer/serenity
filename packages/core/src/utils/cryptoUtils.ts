/**
 * Utility functions to manage crypto operations intelligently
 * Only performs expensive crypto when actually needed
 */

import { getPrivacySettingsSecure } from './secureStorage';
import { logger } from './logger';

/**
 * Safely parse JSON data that might be Base64 encoded
 */
export const safeJsonParse = (data: string): any => {
  if (!data) return null;
  
  let jsonData = data;
  
  // Check if the data is Base64 encoded (basic check)
  if (/^[A-Za-z0-9+/=]+$/.test(data) && data.length % 4 === 0) {
    try {
      // Try to decode as Base64
      const decodedData = atob(data);
      // Check if decoded data is URL encoded
      if (decodedData.includes('%')) {
        jsonData = decodeURIComponent(decodedData);
      } else {
        jsonData = decodedData;
      }
      logger.info('🔓 Successfully decoded Base64 data', { component: 'cryptoUtils', operation: 'successfullyDecodedBase64' });
    } catch (decodeError) {
      logger.warn('⚠️ Base64 decode failed, treating as regular JSON', { component: 'cryptoUtils', operation: 'base64DecodeFallback' });
      // Fall back to using original data
    }
  }
  
  return JSON.parse(jsonData);
};

export interface CryptoSettings {
  encryptionEnabled: boolean;
  hasEncryptedData: boolean;
  hasMasterPassword: boolean;
}

/**
 * Check if encryption features are enabled without triggering expensive crypto operations
 */
export const checkCryptoSettings = (): CryptoSettings => {
  // Check if we have any encrypted data (using hardcoded keys to avoid circular imports)
  const hasEncryptedPrivacySettings = localStorage.getItem('encrypted_privacy_settings') !== null;
  const hasEncryptedMasterPassword = localStorage.getItem('encrypted_master_password_hash') !== null;
  const hasEncryptedDatabaseConnection = localStorage.getItem('encrypted_database_connection') !== null;
  
  const hasEncryptedData = hasEncryptedPrivacySettings || hasEncryptedMasterPassword || hasEncryptedDatabaseConnection;
  
  // Check if master password is enabled (from regular privacy settings)
  let hasMasterPassword = false;
  try {
    const regularSettings = localStorage.getItem('serenity_privacy_settings');
    if (regularSettings) {
      const settings = safeJsonParse(regularSettings);
      hasMasterPassword = settings.masterPasswordEnabled || false;
    }
  } catch (error) {
    logger.error('Failed to check master password status:', { component: 'cryptoUtils', operation: 'failedCheckMaster' }, error as Error);
  }
  
  // Encryption is considered enabled if we have encrypted data OR master password is enabled
  const encryptionEnabled = hasEncryptedData || hasMasterPassword;
  
  logger.info('🔐 Crypto settings check', { component: 'cryptoUtils', operation: 'cryptoSettingsCheck', metadata: { encryptionEnabled, hasEncryptedData, hasMasterPassword } });
  
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
      logger.info('⚡ No encryption needed, skipping crypto initialization', { component: 'cryptoUtils', operation: 'operation' });
      onProgress?.(100, 'complete', 'No encryption needed');
      return true;
    }
    
    logger.info('🔐 Starting crypto initialization...', { component: 'cryptoUtils', operation: 'startingCryptoInitialization...' });
    onProgress?.(10, 'initializing', 'Checking encryption requirements...');
    
    // Simulate progressive loading stages
    await new Promise(resolve => setTimeout(resolve, 100));
    onProgress?.(30, 'deriving-key', 'Preparing security keys...');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    onProgress?.(60, 'deriving-key', 'Deriving encryption keys...');
    
    // Actually try to read encrypted data
    const privacySettings = await getPrivacySettingsSecure();
    
    onProgress?.(90, 'decrypting', 'Loading encrypted settings...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onProgress?.(100, 'complete', 'Encryption initialized successfully!');
    logger.info('✅ Crypto initialization completed', { component: 'cryptoUtils', operation: 'cryptoInitializationCompleted' });
    
    return true;
  } catch (error) {
    logger.error('❌ Crypto initialization failed:', { component: 'cryptoUtils', operation: 'cryptoInitializationFailed:' }, error as Error);
    onProgress?.(0, 'initializing', 'Encryption initialization failed');
    return false;
  }
};