"use strict";
/**
 * Utility functions to manage crypto operations intelligently
 * Only performs expensive crypto when actually needed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCrypto = exports.shouldShowCryptoLoading = exports.checkCryptoSettings = exports.safeJsonParse = void 0;
const secureStorage_1 = require("./secureStorage");
const logger_1 = require("./logger");
/**
 * Safely parse JSON data that might be Base64 encoded
 */
const safeJsonParse = (data) => {
    if (!data)
        return null;
    let jsonData = data;
    // Check if the data is Base64 encoded (basic check)
    if (/^[A-Za-z0-9+/=]+$/.test(data) && data.length % 4 === 0) {
        try {
            // Try to decode as Base64
            const decodedData = atob(data);
            // Check if decoded data is URL encoded
            if (decodedData.includes('%')) {
                jsonData = decodeURIComponent(decodedData);
            }
            else {
                jsonData = decodedData;
            }
            logger_1.logger.info('🔓 Successfully decoded Base64 data', { component: 'cryptoUtils', operation: 'successfullyDecodedBase64' });
        }
        catch (decodeError) {
            logger_1.logger.warn('⚠️ Base64 decode failed, treating as regular JSON', { component: 'cryptoUtils', operation: 'base64DecodeFallback' });
            // Fall back to using original data
        }
    }
    return JSON.parse(jsonData);
};
exports.safeJsonParse = safeJsonParse;
/**
 * Check if encryption features are enabled without triggering expensive crypto operations
 */
const checkCryptoSettings = () => {
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
            const settings = (0, exports.safeJsonParse)(regularSettings);
            hasMasterPassword = settings.masterPasswordEnabled || false;
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to check master password status:', { component: 'cryptoUtils', operation: 'failedCheckMaster' }, error);
    }
    // Encryption is considered enabled if we have encrypted data OR master password is enabled
    const encryptionEnabled = hasEncryptedData || hasMasterPassword;
    logger_1.logger.info('🔐 Crypto settings check', { component: 'cryptoUtils', operation: 'cryptoSettingsCheck', metadata: { encryptionEnabled, hasEncryptedData, hasMasterPassword } });
    return {
        encryptionEnabled,
        hasEncryptedData,
        hasMasterPassword
    };
};
exports.checkCryptoSettings = checkCryptoSettings;
/**
 * Determine if we need to show crypto loading screen
 */
const shouldShowCryptoLoading = () => {
    const settings = (0, exports.checkCryptoSettings)();
    return settings.encryptionEnabled;
};
exports.shouldShowCryptoLoading = shouldShowCryptoLoading;
/**
 * Progressive crypto initialization with progress callbacks
 */
const initializeCrypto = async (onProgress) => {
    try {
        const settings = (0, exports.checkCryptoSettings)();
        if (!settings.encryptionEnabled) {
            logger_1.logger.info('⚡ No encryption needed, skipping crypto initialization', { component: 'cryptoUtils', operation: 'operation' });
            onProgress?.(100, 'complete', 'No encryption needed');
            return true;
        }
        logger_1.logger.info('🔐 Starting crypto initialization...', { component: 'cryptoUtils', operation: 'startingCryptoInitialization...' });
        onProgress?.(10, 'initializing', 'Checking encryption requirements...');
        // Simulate progressive loading stages
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.(30, 'deriving-key', 'Preparing security keys...');
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.(60, 'deriving-key', 'Deriving encryption keys...');
        // Actually try to read encrypted data
        const privacySettings = await (0, secureStorage_1.getPrivacySettingsSecure)();
        onProgress?.(90, 'decrypting', 'Loading encrypted settings...');
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.(100, 'complete', 'Encryption initialized successfully!');
        logger_1.logger.info('✅ Crypto initialization completed', { component: 'cryptoUtils', operation: 'cryptoInitializationCompleted' });
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Crypto initialization failed:', { component: 'cryptoUtils', operation: 'cryptoInitializationFailed:' }, error);
        onProgress?.(0, 'initializing', 'Encryption initialization failed');
        return false;
    }
};
exports.initializeCrypto = initializeCrypto;
