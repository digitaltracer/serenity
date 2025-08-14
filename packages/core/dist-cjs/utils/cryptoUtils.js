"use strict";
/**
 * Utility functions to manage crypto operations intelligently
 * Only performs expensive crypto when actually needed
 */
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
exports.initializeCrypto = exports.shouldShowCryptoLoading = exports.checkCryptoSettings = exports.safeJsonParse = void 0;
const secureStorage_1 = require("./secureStorage");
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
            console.log('🔓 Successfully decoded Base64 data');
        }
        catch (decodeError) {
            console.warn('⚠️ Base64 decode failed, treating as regular JSON:', decodeError);
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
    // Check if we have any encrypted data
    const hasEncryptedPrivacySettings = localStorage.getItem(`encrypted_${secureStorage_1.SECURE_KEYS.PRIVACY_SETTINGS}`) !== null;
    const hasEncryptedMasterPassword = localStorage.getItem(`encrypted_${secureStorage_1.SECURE_KEYS.MASTER_PASSWORD_HASH}`) !== null;
    const hasEncryptedDatabaseConnection = localStorage.getItem(`encrypted_${secureStorage_1.SECURE_KEYS.DATABASE_CONNECTION}`) !== null;
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
        const { getPrivacySettingsSecure } = await Promise.resolve().then(() => __importStar(require('./secureStorage')));
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.(60, 'deriving-key', 'Deriving encryption keys...');
        // Actually try to read encrypted data
        const privacySettings = await getPrivacySettingsSecure();
        onProgress?.(90, 'decrypting', 'Loading encrypted settings...');
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.(100, 'complete', 'Encryption initialized successfully!');
        console.log('✅ Crypto initialization completed');
        return true;
    }
    catch (error) {
        console.error('❌ Crypto initialization failed:', error);
        onProgress?.(0, 'initializing', 'Encryption initialization failed');
        return false;
    }
};
exports.initializeCrypto = initializeCrypto;
