"use strict";
/**
 * Biometric Authentication Service
 * Handles Touch ID/Face ID authentication with encrypted master password storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricAuthService = void 0;
class BiometricAuthService {
    /**
     * Check if biometric authentication is available on this system
     */
    static async isAvailable() {
        try {
            if (window.electronAPI?.biometric?.isAvailable) {
                return await window.electronAPI.biometric.isAvailable();
            }
            return { available: false, type: null };
        }
        catch (error) {
            console.error('Failed to check biometric availability:', error);
            return { available: false, type: null };
        }
    }
    /**
     * Store master password encrypted with system keychain for biometric access
     */
    static async storeMasterPasswordForBiometric(masterPassword) {
        try {
            if (!window.electronAPI?.safeStorage?.encryptString) {
                console.warn('Safe storage not available - cannot store master password for biometric auth');
                return false;
            }
            console.log('🔐 Storing master password for biometric authentication...');
            // Encrypt the master password using system keychain
            const encryptedPassword = await window.electronAPI.safeStorage.encryptString(masterPassword);
            // Store the encrypted password using secure settings API
            if (window.electronAPI?.auth?.setSecureSetting) {
                const res = await window.electronAPI.auth.setSecureSetting(this.MASTER_PASSWORD_KEY, encryptedPassword);
                if (res.success) {
                    console.log('✅ Master password stored for biometric authentication');
                    return true;
                }
                console.error('❌ Failed to store encrypted master password:', res.error);
                return false;
            }
            console.warn('Secure settings API not available - cannot store encrypted master password');
            return false;
        }
        catch (error) {
            console.error('❌ Failed to store master password for biometric auth:', error);
            return false;
        }
    }
    /**
     * Authenticate with biometrics and retrieve the master password
     * Note: This may prompt for authentication twice - once for Touch ID and once for keychain access
     */
    static async authenticateAndRetrieveMasterPassword(reason) {
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
            console.log('🔒 Starting biometric authentication via keychain access...');
            // Use only safeStorage decryption - no separate Touch ID prompt needed
            // The safeStorage.decryptString call will trigger the system authentication (Touch ID/Face ID)
            console.log('🔓 Accessing encrypted master password from secure keychain...');
            // Retrieve and decrypt the master password (this will trigger biometric authentication)
            const masterPassword = await this.retrieveStoredMasterPassword();
            if (!masterPassword) {
                return {
                    success: false,
                    error: 'Failed to retrieve stored master password from keychain'
                };
            }
            console.log('✅ Successfully retrieved master password via biometric keychain authentication');
            return {
                success: true,
                masterPassword
            };
        }
        catch (error) {
            console.error('❌ Biometric authentication error:', error);
            return {
                success: false,
                error: `Biometric authentication failed: ${error}`
            };
        }
    }
    /**
     * Check if we have a master password stored for biometric authentication
     */
    static async hasStoredMasterPassword() {
        try {
            if (!window.electronAPI?.auth?.getSecureSetting) {
                return false;
            }
            const result = await window.electronAPI.auth.getSecureSetting(this.MASTER_PASSWORD_KEY);
            return result.success && !!result.data && result.data.value != null;
        }
        catch (error) {
            console.error('Failed to check for stored master password:', error);
            return false;
        }
    }
    /**
     * Retrieve and decrypt the stored master password
     */
    static async retrieveStoredMasterPassword() {
        try {
            if (!window.electronAPI?.auth?.getSecureSetting || !window.electronAPI?.safeStorage?.decryptString) {
                return null;
            }
            // Get encrypted password from secure settings
            const result = await window.electronAPI.auth.getSecureSetting(this.MASTER_PASSWORD_KEY);
            if (!result.success || !result.data || result.data.value == null) {
                console.warn('No encrypted master password found in database');
                return null;
            }
            const encryptedPassword = result.data.value;
            // Decrypt the password using system keychain
            const decryptedPassword = await window.electronAPI.safeStorage.decryptString(encryptedPassword);
            return decryptedPassword;
        }
        catch (error) {
            console.error('Failed to retrieve stored master password:', error);
            return null;
        }
    }
    /**
     * Remove stored master password (when master password is changed or disabled)
     */
    static async removeStoredMasterPassword() {
        try {
            if (!window.electronAPI?.auth?.deleteSecureSetting) {
                return false;
            }
            const result = await window.electronAPI.auth.deleteSecureSetting(this.MASTER_PASSWORD_KEY);
            if (result.success) {
                console.log('✅ Removed stored master password for biometric authentication');
                return true;
            }
            else {
                console.error('❌ Failed to remove stored master password:', result.error);
                return false;
            }
        }
        catch (error) {
            console.error('❌ Failed to remove stored master password:', error);
            return false;
        }
    }
    /**
     * Update stored master password when the user changes their master password
     */
    static async updateStoredMasterPassword(newMasterPassword) {
        // Remove old stored password and store new one
        await this.removeStoredMasterPassword();
        return await this.storeMasterPasswordForBiometric(newMasterPassword);
    }
}
exports.BiometricAuthService = BiometricAuthService;
BiometricAuthService.MASTER_PASSWORD_KEY = 'serenity_master_password_encrypted';
