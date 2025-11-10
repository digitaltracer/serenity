/**
 * Biometric Authentication Service
 * Handles Touch ID/Face ID authentication with encrypted master password storage
 */

import { logger } from '../utils/logger';

export interface BiometricAuthResult {
  success: boolean;
  masterPassword?: string;
  error?: string;
  cancelled?: boolean;
}

export class BiometricAuthService {
  private static readonly MASTER_PASSWORD_KEY = 'serenity_master_password_encrypted';

  /**
   * Check if biometric authentication is available on this system
   */
  static async isAvailable(): Promise<{ available: boolean; type: string | null }> {
    try {
      if (window.electronAPI?.biometric?.isAvailable) {
        return await window.electronAPI.biometric.isAvailable();
      }
      return { available: false, type: null };
    } catch (error) {
      logger.error('Failed to check biometric availability:', { component: 'biometricAuthService', operation: 'failedCheckBiometric' }, error as Error);
      return { available: false, type: null };
    }
  }

  /**
   * Store master password encrypted with system keychain for biometric access
   */
  static async storeMasterPasswordForBiometric(masterPassword: string): Promise<boolean> {
    try {
      if (!window.electronAPI?.safeStorage?.encryptString) {
        logger.warn('Safe storage not available - cannot store master password for biometric auth', { component: 'biometricAuthService', operation: 'safeStorageNot' });
        return false;
      }

      logger.info('🔐 Storing master password for biometric authentication...', { component: 'biometricAuthService', operation: 'storingMasterPassword' });
      
      // Encrypt the master password using system keychain
      const encryptedPassword = await window.electronAPI.safeStorage.encryptString(masterPassword);
      
      // Store the encrypted password using secure settings API
      if (window.electronAPI?.auth?.setSecureSetting) {
        const res = await window.electronAPI.auth.setSecureSetting(this.MASTER_PASSWORD_KEY, encryptedPassword);
        if (res.success) {
          logger.info('✅ Master password stored for biometric authentication', { component: 'biometricAuthService', operation: 'masterPasswordStored' });
          return true;
        }
        logger.error('❌ Failed to store encrypted master password:', { component: 'biometricAuthService', operation: 'failedStoreEncrypted' }, new Error(res.error));
        return false;
      }
      logger.warn('Secure settings API not available - cannot store encrypted master password', { component: 'biometricAuthService', operation: 'secureSettingsApi' });
      return false;
    } catch (error) {
      logger.error('❌ Failed to store master password for biometric auth:', { component: 'biometricAuthService', operation: 'failedStoreMaster' }, error as Error);
      return false;
    }
  }

  /**
   * Authenticate with biometrics and retrieve the master password
   * Note: This may prompt for authentication twice - once for Touch ID and once for keychain access
   */
  static async authenticateAndRetrieveMasterPassword(reason?: string): Promise<BiometricAuthResult> {
    try {
      // Check if biometric auth is available
      const availability = await this.isAvailable();
      if (!availability.available) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this system'
        };
      }

      // Check if we have a stored encrypted master password
      const hasStoredPassword = await this.hasStoredMasterPassword();
      if (!hasStoredPassword) {
        return {
          success: false,
          error: 'No master password stored for biometric authentication. Please authenticate with your master password first.'
        };
      }

      logger.info('🔒 Starting biometric authentication via keychain access...', { component: 'biometricAuthService', operation: 'startingBiometricAuthentication' });
      
      // Use only safeStorage decryption - no separate Touch ID prompt needed
      // The safeStorage.decryptString call will trigger the system authentication (Touch ID/Face ID)
      logger.info('🔓 Accessing encrypted master password from secure keychain...', { component: 'biometricAuthService', operation: 'accessingEncryptedMaster' });

      // Retrieve and decrypt the master password (this will trigger biometric authentication)
      const masterPassword = await this.retrieveStoredMasterPassword();
      if (!masterPassword) {
        return {
          success: false,
          error: 'Failed to retrieve stored master password from keychain'
        };
      }

      logger.info('✅ Successfully retrieved master password via biometric keychain authentication', { component: 'biometricAuthService', operation: 'successfullyRetrievedMaster' });
      return {
        success: true,
        masterPassword
      };

    } catch (error) {
      logger.error('❌ Biometric authentication error:', { component: 'biometricAuthService', operation: 'biometricAuthenticationError:' }, error as Error);
      return {
        success: false,
        error: `Biometric authentication failed: ${error}`
      };
    }
  }

  /**
   * Check if we have a master password stored for biometric authentication
   */
  static async hasStoredMasterPassword(): Promise<boolean> {
    try {
      if (!window.electronAPI?.auth?.getSecureSetting) {
        return false;
      }

      const result = await window.electronAPI.auth.getSecureSetting(this.MASTER_PASSWORD_KEY);
      return result.success && !!result.data && result.data.value != null;
    } catch (error) {
      logger.error('Failed to check for stored master password:', { component: 'biometricAuthService', operation: 'failedCheckFor' }, error as Error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt the stored master password
   */
  private static async retrieveStoredMasterPassword(): Promise<string | null> {
    try {
      if (!window.electronAPI?.auth?.getSecureSetting || !window.electronAPI?.safeStorage?.decryptString) {
        return null;
      }

      // Get encrypted password from secure settings
      const result = await window.electronAPI.auth.getSecureSetting(this.MASTER_PASSWORD_KEY);

      if (!result.success || !result.data || result.data.value == null) {
        logger.warn('No encrypted master password found in database', { component: 'biometricAuthService', operation: 'encryptedMasterPassword' });
        return null;
      }

      const encryptedPassword = result.data.value as string;
      
      // Decrypt the password using system keychain
      const decryptedPassword = await window.electronAPI.safeStorage.decryptString(encryptedPassword);

      return decryptedPassword;
    } catch (error) {
      logger.error('Failed to retrieve stored master password:', { component: 'biometricAuthService', operation: 'failedRetrieveStored' }, error as Error);
      return null;
    }
  }

  /**
   * Remove stored master password (when master password is changed or disabled)
   */
  static async removeStoredMasterPassword(): Promise<boolean> {
    try {
      if (!window.electronAPI?.auth?.deleteSecureSetting) {
        return false;
      }

      const result = await window.electronAPI.auth.deleteSecureSetting(this.MASTER_PASSWORD_KEY);
      if (result.success) {
        logger.info('✅ Removed stored master password for biometric authentication', { component: 'biometricAuthService', operation: 'removedStoredMaster' });
        return true;
      } else {
        logger.error('❌ Failed to remove stored master password:', { component: 'biometricAuthService', operation: 'failedRemoveStored' }, new Error(result.error));
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to remove stored master password:', { component: 'biometricAuthService', operation: 'failedRemoveStored' }, error as Error);
      return false;
    }
  }

  /**
   * Update stored master password when the user changes their master password
   */
  static async updateStoredMasterPassword(newMasterPassword: string): Promise<boolean> {
    // Remove old stored password and store new one
    await this.removeStoredMasterPassword();
    return await this.storeMasterPasswordForBiometric(newMasterPassword);
  }
}
