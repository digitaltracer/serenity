"use strict";
/**
 * Enhanced secure storage utilities using Electron's safeStorage API
 * Falls back to encrypted localStorage for development/non-Electron environments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePostgreSQLConfigSecure = exports.getPostgreSQLConfigSecure = exports.savePostgreSQLConfigSecure = exports.validateMasterPasswordSecure = exports.saveMasterPasswordHashSecure = exports.getPrivacySettingsSecure = exports.savePrivacySettingsSecure = exports.removeDatabaseConnectionSecure = exports.getDatabaseConnectionSecure = exports.saveDatabaseConnectionSecure = exports.SECURE_KEYS = exports.getSecureStorage = void 0;
/// <reference path="../types/electron.d.ts" />
const securityConfig_1 = require("./securityConfig");
// Ensure Web Crypto API is available in Node/Electron main by mapping Node's webcrypto
// This runs before validation below to avoid runtime errors in main process.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _global = (typeof globalThis !== 'undefined' ? globalThis : global);
if (typeof _global.crypto === 'undefined') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto = (typeof require !== 'undefined' ? require('crypto').webcrypto : undefined);
        if (nodeCrypto) {
            _global.crypto = nodeCrypto;
        }
    }
    catch {
        // ignore; validateCryptoSupport will report missing APIs
    }
}
// Validate crypto support and security policy on module load
(() => {
    const cryptoSupport = (0, securityConfig_1.validateCryptoSupport)();
    if (!cryptoSupport.supported) {
        console.error('🚨 Crypto API not supported. Missing:', cryptoSupport.missing.join(', '));
        throw new Error('Web Crypto API required for secure storage');
    }
    if (!(0, securityConfig_1.validateSecurityPolicy)(securityConfig_1.CRYPTO_CONFIG)) {
        throw new Error('Security policy validation failed');
    }
    console.log('🔒 Secure storage initialized with production-grade encryption');
})();
// Check if we're in an Electron environment
const isElectron = () => {
    return typeof window !== 'undefined' &&
        window.electronAPI !== undefined &&
        window.electronAPI.safeStorage?.encryptString !== undefined;
};
// Advanced encryption for localStorage fallback
class LocalStorageEncryption {
    /**
     * Generate a cryptographic key from a password using PBKDF2
     */
    static async deriveKey(password, salt) {
        const envConfig = (0, securityConfig_1.getEnvironmentConfig)();
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: salt,
            iterations: envConfig.pbkdf2Iterations,
            hash: this.CONFIG.HASH_ALGORITHM,
        }, passwordKey, { name: this.CONFIG.AES.ALGORITHM, length: this.CONFIG.AES.KEY_LENGTH }, false, ['encrypt', 'decrypt']);
    }
    /**
     * Encrypt data using AES-GCM
     */
    static async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const salt = (0, securityConfig_1.generateSalt)();
            const iv = (0, securityConfig_1.generateIV)();
            const key = await this.deriveKey(password, salt);
            const encodedData = encoder.encode(data);
            const encryptedData = await crypto.subtle.encrypt({ name: this.CONFIG.AES.ALGORITHM, iv }, key, encodedData);
            // Create versioned format: version + salt + iv + encrypted data
            const version = new TextEncoder().encode(this.CONFIG.VERSION);
            const combined = new Uint8Array(version.length + salt.length + iv.length + encryptedData.byteLength);
            let offset = 0;
            combined.set(version, offset);
            offset += version.length;
            combined.set(salt, offset);
            offset += salt.length;
            combined.set(iv, offset);
            offset += iv.length;
            combined.set(new Uint8Array(encryptedData), offset);
            // Add prefix and convert to base64 for storage
            return this.CONFIG.ENCRYPTED_DATA_PREFIX + btoa(String.fromCharCode.apply(null, Array.from(combined)));
        }
        catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }
    /**
     * Decrypt data using AES-GCM
     */
    static async decrypt(encryptedData, password) {
        try {
            // Check for prefix and remove it
            let dataWithoutPrefix = encryptedData;
            if (encryptedData.startsWith(this.CONFIG.ENCRYPTED_DATA_PREFIX)) {
                dataWithoutPrefix = encryptedData.slice(this.CONFIG.ENCRYPTED_DATA_PREFIX.length);
            }
            const combinedArray = Array.from(atob(dataWithoutPrefix), char => char.charCodeAt(0));
            const combined = new Uint8Array(combinedArray);
            // Parse versioned format
            const version = new TextDecoder().decode(combined.slice(0, this.CONFIG.VERSION.length));
            if (version !== this.CONFIG.VERSION) {
                console.warn(`Decrypting data with version ${version}, current version ${this.CONFIG.VERSION}`);
            }
            let offset = this.CONFIG.VERSION.length;
            // Extract salt, iv, and encrypted data
            const salt = combined.slice(offset, offset + this.CONFIG.SALT_LENGTH);
            offset += this.CONFIG.SALT_LENGTH;
            const iv = combined.slice(offset, offset + this.CONFIG.AES.IV_LENGTH);
            offset += this.CONFIG.AES.IV_LENGTH;
            const encrypted = combined.slice(offset);
            const key = await this.deriveKey(password, salt);
            const decryptedData = await crypto.subtle.decrypt({ name: this.CONFIG.AES.ALGORITHM, iv }, key, encrypted);
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        }
        catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data - possible corruption or wrong password');
        }
    }
}
LocalStorageEncryption.CONFIG = securityConfig_1.CRYPTO_CONFIG;
/**
 * Electron safeStorage implementation
 */
class ElectronSecureStorage {
    async setItem(key, value) {
        try {
            if (window.electronAPI?.safeStorage?.encryptString) {
                const encrypted = await window.electronAPI.safeStorage.encryptString(value);
                localStorage.setItem(`secure_${key}`, encrypted);
            }
            else {
                throw new Error('Electron safeStorage not available');
            }
        }
        catch (error) {
            console.error('Failed to store secure item:', error);
            throw new Error('Failed to store secure data');
        }
    }
    async getItem(key) {
        try {
            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted)
                return null;
            if (window.electronAPI?.safeStorage?.decryptString) {
                return await window.electronAPI.safeStorage.decryptString(encrypted);
            }
            else {
                throw new Error('Electron safeStorage not available');
            }
        }
        catch (error) {
            console.error('Failed to retrieve secure item:', error);
            return null;
        }
    }
    async removeItem(key) {
        localStorage.removeItem(`secure_${key}`);
    }
    async clear() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('secure_'));
        keys.forEach(key => localStorage.removeItem(key));
    }
}
/**
 * Fallback encrypted localStorage implementation with optimized performance
 */
class EncryptedLocalStorage {
    async getMasterKey() {
        if (EncryptedLocalStorage.masterKeyString) {
            return EncryptedLocalStorage.masterKeyString;
        }
        // SECURITY FIX: Check if user has set master password first
        const userMasterPassword = await this.getUserMasterPassword();
        if (userMasterPassword) {
            EncryptedLocalStorage.masterKeyString = userMasterPassword;
            return userMasterPassword;
        }
        // Generate a cryptographically secure key for fallback
        // SECURITY FIX: Use more entropy sources and proper key generation
        let key = localStorage.getItem(EncryptedLocalStorage.MASTER_KEY);
        if (!key) {
            key = await this.generateSecureMasterKey();
            // SECURITY WARNING: This stores the key in localStorage - not ideal but needed for fallback
            // In production, this should be derived from user password or stored in secure system keychain
            localStorage.setItem(EncryptedLocalStorage.MASTER_KEY, key);
            // Log security warning
            console.warn('🔐 SECURITY: Generated fallback master key stored in localStorage. ' +
                'This is not secure for production. Please implement proper master password system.');
        }
        EncryptedLocalStorage.masterKeyString = key;
        return key;
    }
    async getUserMasterPassword() {
        // This should integrate with the auth system to get user's master password
        // For now, return null to use fallback key generation
        try {
            // Check if user has authenticated and provided master password
            if (typeof window !== 'undefined' && window.electronAPI?.auth?.getMasterPasswordHash) {
                // This would return the user's master password (hashed appropriately)
                return null; // Placeholder - implement when auth flow is complete
            }
        }
        catch (error) {
            // Silently fail and use fallback
        }
        return null;
    }
    async generateSecureMasterKey() {
        // SECURITY FIX: Use multiple entropy sources for key generation
        const keyMaterial = new Uint8Array(64); // 512 bits of entropy
        crypto.getRandomValues(keyMaterial);
        // Add timestamp and additional entropy
        const timestamp = new Uint8Array(new ArrayBuffer(8));
        const view = new DataView(timestamp.buffer);
        view.setBigUint64(0, BigInt(Date.now()), false);
        const additionalEntropy = new Uint8Array(16);
        crypto.getRandomValues(additionalEntropy);
        // Combine entropy sources
        const combined = new Uint8Array(keyMaterial.length + timestamp.length + additionalEntropy.length);
        combined.set(keyMaterial, 0);
        combined.set(timestamp, keyMaterial.length);
        combined.set(additionalEntropy, keyMaterial.length + timestamp.length);
        // Hash the combined entropy to create final key
        const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
        const hashArray = new Uint8Array(hashBuffer);
        return btoa(String.fromCharCode.apply(null, Array.from(hashArray)));
    }
    async getOrGenerateSalt() {
        // SECURITY FIX: Generate and store unique salt per installation
        const SALT_KEY = 'serenity_crypto_salt';
        const storedSalt = localStorage.getItem(SALT_KEY);
        if (storedSalt) {
            // Convert back from base64
            return new Uint8Array(atob(storedSalt).split('').map(c => c.charCodeAt(0)));
        }
        // Generate new cryptographically secure salt
        const salt = (0, securityConfig_1.generateSalt)();
        const saltB64 = btoa(String.fromCharCode.apply(null, Array.from(salt)));
        localStorage.setItem(SALT_KEY, saltB64);
        return salt;
    }
    async getDerivedKey() {
        if (EncryptedLocalStorage.derivedKeyCache) {
            return EncryptedLocalStorage.derivedKeyCache;
        }
        const masterKey = await this.getMasterKey();
        // SECURITY FIX: Use dynamic salt instead of fixed salt
        const salt = await this.getOrGenerateSalt();
        // Reduced iterations for startup performance - still secure for local storage
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(masterKey), 'PBKDF2', false, ['deriveKey']);
        const envConfig = (0, securityConfig_1.getEnvironmentConfig)();
        const derivedKey = await crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: salt,
            iterations: envConfig.pbkdf2Iterations, // Environment-aware iterations
            hash: securityConfig_1.CRYPTO_CONFIG.HASH_ALGORITHM,
        }, passwordKey, { name: securityConfig_1.CRYPTO_CONFIG.AES.ALGORITHM, length: securityConfig_1.CRYPTO_CONFIG.AES.KEY_LENGTH }, false, ['encrypt', 'decrypt']);
        EncryptedLocalStorage.derivedKeyCache = derivedKey;
        return derivedKey;
    }
    async setItem(key, value) {
        try {
            const derivedKey = await this.getDerivedKey();
            const encrypted = await this.encryptWithKey(value, derivedKey);
            localStorage.setItem(`encrypted_${key}`, encrypted);
        }
        catch (error) {
            console.error('Failed to store encrypted item:', error);
            throw new Error('Failed to store encrypted data');
        }
    }
    async getItem(key) {
        try {
            const encrypted = localStorage.getItem(`encrypted_${key}`);
            if (!encrypted)
                return null;
            const derivedKey = await this.getDerivedKey();
            return await this.decryptWithKey(encrypted, derivedKey);
        }
        catch (error) {
            console.error('Failed to retrieve encrypted item:', error);
            return null;
        }
    }
    async encryptWithKey(data, key) {
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(data));
        // Combine iv + encrypted data
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedData), iv.length);
        return btoa(String.fromCharCode.apply(null, Array.from(combined)));
    }
    async decryptWithKey(encryptedData, key) {
        const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    }
    async removeItem(key) {
        localStorage.removeItem(`encrypted_${key}`);
    }
    async clear() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('encrypted_'));
        keys.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem(EncryptedLocalStorage.MASTER_KEY);
    }
}
EncryptedLocalStorage.MASTER_KEY = 'serenity_storage_key';
EncryptedLocalStorage.derivedKeyCache = null;
EncryptedLocalStorage.masterKeyString = null;
/**
 * Get the appropriate secure storage implementation
 */
let secureStorageInstance = null;
const getSecureStorage = () => {
    if (!secureStorageInstance) {
        const electronAvailable = isElectron();
        secureStorageInstance = electronAvailable
            ? new ElectronSecureStorage()
            : new EncryptedLocalStorage();
    }
    return secureStorageInstance;
};
exports.getSecureStorage = getSecureStorage;
/**
 * Secure storage keys
 */
exports.SECURE_KEYS = {
    DATABASE_CONNECTION: 'database_connection',
    MASTER_PASSWORD_HASH: 'master_password_hash',
    PRIVACY_SETTINGS: 'privacy_settings',
    ENCRYPTION_KEYS: 'encryption_keys',
};
const saveDatabaseConnectionSecure = async (connectionUrl) => {
    try {
        console.log('🗄️ Saving database connection to secure storage:', connectionUrl);
        // Note: We always use SQLite for secure settings storage, even if the user's 
        // main application database is PostgreSQL. This solves the bootstrap problem:
        // we need somewhere reliable to store which database to connect to.
        if (!window.electronAPI?.auth?.setSecureSetting) {
            throw new Error('Secure settings API not available');
        }
        const connection = {
            url: connectionUrl,
            connected: true,
            lastConnected: new Date().toISOString(),
            encryptionEnabled: false, // Can be enabled later
        };
        // The secure_settings table is created by the main database schema
        const result = await window.electronAPI.auth.setSecureSetting('database_connection', JSON.stringify(connection));
        if (!result.success)
            throw new Error(result.error || 'Failed to save database connection');
        console.log('✅ Database connection saved successfully to database');
    }
    catch (error) {
        console.error('Failed to save database connection to database:', error);
        throw new Error('Failed to save connection details to database');
    }
};
exports.saveDatabaseConnectionSecure = saveDatabaseConnectionSecure;
const getDatabaseConnectionSecure = async () => {
    try {
        console.log('🔒 Loading database connection from secure storage...');
        // Note: We always use SQLite for secure settings storage (see comment above)
        if (!window.electronAPI?.auth?.getSecureSetting) {
            console.log('❌ Secure settings API not available');
            return null;
        }
        // Get database connection from database
        const result = await window.electronAPI.auth.getSecureSetting('database_connection');
        if (!result.success || !result.data || result.data.value == null) {
            console.log('📝 No database connection found in database');
            return null;
        }
        console.log('✅ Found database connection in database, parsing...');
        const connection = JSON.parse(result.data.value);
        console.log('🎯 Database connection loaded successfully from database');
        return connection;
    }
    catch (error) {
        console.error('Failed to retrieve database connection from database:', error);
        return null;
    }
};
exports.getDatabaseConnectionSecure = getDatabaseConnectionSecure;
const removeDatabaseConnectionSecure = async () => {
    try {
        console.log('🗑️ Removing database connection from database...');
        if (!window.electronAPI?.auth?.deleteSecureSetting) {
            console.log('❌ Secure settings API not available');
            return;
        }
        const result = await window.electronAPI.auth.deleteSecureSetting('database_connection');
        if (!result.success) {
            console.error('Failed to remove database connection:', result.error);
        }
        else {
            console.log('✅ Database connection removed successfully from database');
        }
    }
    catch (error) {
        console.error('Failed to remove database connection from database:', error);
    }
};
exports.removeDatabaseConnectionSecure = removeDatabaseConnectionSecure;
const savePrivacySettingsSecure = async (settings) => {
    try {
        console.log('🔐 Saving privacy settings to database:', settings);
        if (!window.electronAPI?.auth?.setSecureSetting) {
            throw new Error('Secure settings API not available');
        }
        // The secure_settings table is created by the main database schema
        const result = await window.electronAPI.auth.setSecureSetting('privacy_settings', JSON.stringify(settings));
        if (!result.success)
            throw new Error(result.error || 'Failed to save privacy settings to database');
        console.log('✅ Privacy settings saved successfully to database');
    }
    catch (error) {
        console.error('Failed to save privacy settings to database:', error);
        throw new Error('Failed to save privacy settings to database');
    }
};
exports.savePrivacySettingsSecure = savePrivacySettingsSecure;
const getPrivacySettingsSecure = async () => {
    try {
        console.log('🔒 Loading privacy settings from database...');
        if (!window.electronAPI?.auth?.getSecureSetting) {
            console.log('❌ Secure settings API not available');
            return null;
        }
        // Get privacy settings from database
        const result = await window.electronAPI.auth.getSecureSetting('privacy_settings');
        if (!result.success || !result.data || result.data.value == null) {
            console.log('📝 No privacy settings found in database');
            return null;
        }
        console.log('✅ Found privacy settings in database, parsing...');
        const settings = JSON.parse(result.data.value);
        console.log('🎯 Privacy settings loaded successfully from database');
        return settings;
    }
    catch (error) {
        console.error('❌ Failed to retrieve privacy settings from database:', error);
        return null;
    }
};
exports.getPrivacySettingsSecure = getPrivacySettingsSecure;
/**
 * Enhanced master password storage with better security
 */
const saveMasterPasswordHashSecure = async (password) => {
    try {
        console.log('🔑 Saving master password hash to database...');
        // Generate a random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const saltBase64 = btoa(String.fromCharCode.apply(null, Array.from(salt)));
        // Use PBKDF2 for password hashing
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
        const envConfig = (0, securityConfig_1.getEnvironmentConfig)();
        const hashBuffer = await crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt: salt,
            iterations: envConfig.pbkdf2Iterations,
            hash: securityConfig_1.CRYPTO_CONFIG.HASH_ALGORITHM,
        }, passwordKey, securityConfig_1.CRYPTO_CONFIG.AES.KEY_LENGTH);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const passwordData = {
            hash: hashHex,
            salt: saltBase64,
            iterations: envConfig.pbkdf2Iterations,
            created: new Date().toISOString(),
        };
        // Store in database using secure settings API
        if (window.electronAPI?.auth?.setSecureSetting) {
            console.log('💾 Storing master password hash in database...');
            const result = await window.electronAPI.auth.setSecureSetting('master_password_hash', JSON.stringify(passwordData));
            if (!result.success)
                throw new Error(result.error || 'Failed to save to database');
            console.log('✅ Master password hash saved successfully to database');
        }
        else {
            throw new Error('Database API not available');
        }
    }
    catch (error) {
        console.error('Failed to save master password hash to database:', error);
        throw new Error('Failed to save master password to database');
    }
};
exports.saveMasterPasswordHashSecure = saveMasterPasswordHashSecure;
const validateMasterPasswordSecure = async (password) => {
    try {
        console.log('🔐 Validating master password from database...');
        if (!window.electronAPI?.auth?.getSecureSetting) {
            console.log('❌ Secure settings API not available');
            return false;
        }
        // Get password hash from database
        const result = await window.electronAPI.auth.getSecureSetting('master_password_hash');
        if (!result.success || !result.data || result.data.value == null) {
            console.log('❌ No stored password hash found in database');
            return false;
        }
        console.log('✅ Found stored password hash in database, validating...');
        let stored = result.data.value;
        // Support both JSON (salted) and legacy plain hash
        let passwordData;
        try {
            passwordData = JSON.parse(stored);
        }
        catch {
            passwordData = { hash: stored, salt: null, iterations: (0, securityConfig_1.getEnvironmentConfig)().pbkdf2Iterations };
        }
        const salt = new Uint8Array(Array.from(atob(passwordData.salt), c => c.charCodeAt(0)));
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
        const hashBuffer = await crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt: salt,
            iterations: passwordData.iterations,
            hash: 'SHA-256',
        }, passwordKey, 256);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const isValid = hashHex === passwordData.hash;
        console.log('🔍 Password validation result:', isValid);
        return isValid;
    }
    catch (error) {
        console.error('Failed to validate master password from database:', error);
        return false;
    }
};
exports.validateMasterPasswordSecure = validateMasterPasswordSecure;
/**
 * Save PostgreSQL configuration with secure password storage
 */
const savePostgreSQLConfigSecure = async (config, password) => {
    try {
        console.log('🗄️ Saving PostgreSQL config to secure storage...');
        if (!window.electronAPI?.auth?.setSecureSetting) {
            throw new Error('Secure settings API not available');
        }
        // Store config (without password) and encrypted credentials separately
        const configWithoutPassword = { ...config };
        const credentials = {
            password,
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
        };
        // Generate encryption key from master password if available, otherwise use random key
        const encryptionKey = await generateEncryptionKey();
        const encryptedCredentials = await encryptData(JSON.stringify(credentials), encryptionKey);
        // Save config and encrypted credentials
        const [configResult, credentialsResult] = await Promise.all([
            window.electronAPI.auth.setSecureSetting('postgresql_config', JSON.stringify(configWithoutPassword)),
            window.electronAPI.auth.setSecureSetting('postgresql_credentials', encryptedCredentials),
        ]);
        if (configResult.success && credentialsResult.success) {
            console.log('✅ PostgreSQL config and credentials saved securely');
        }
        else {
            throw new Error('Failed to save PostgreSQL configuration');
        }
    }
    catch (error) {
        console.error('Failed to save PostgreSQL config securely:', error);
        throw new Error('Failed to save database configuration securely');
    }
};
exports.savePostgreSQLConfigSecure = savePostgreSQLConfigSecure;
/**
 * Retrieve PostgreSQL configuration with decrypted password
 */
const getPostgreSQLConfigSecure = async () => {
    try {
        console.log('🔒 Loading PostgreSQL config from secure storage...');
        if (!window.electronAPI?.auth?.getSecureSetting) {
            console.log('❌ Secure settings API not available');
            return null;
        }
        // Get config and encrypted credentials
        const [configResult, credentialsResult] = await Promise.all([
            window.electronAPI.auth.getSecureSetting('postgresql_config'),
            window.electronAPI.auth.getSecureSetting('postgresql_credentials'),
        ]);
        if (!configResult.success || !configResult.data || configResult.data.value == null ||
            !credentialsResult.success || !credentialsResult.data || credentialsResult.data.value == null) {
            console.log('📝 No PostgreSQL configuration found');
            return null;
        }
        const config = JSON.parse(configResult.data.value);
        const encryptedCredentials = credentialsResult.data.value;
        // Decrypt credentials
        const encryptionKey = await generateEncryptionKey();
        const decryptedCredentialsJson = await decryptData(encryptedCredentials, encryptionKey);
        const credentials = JSON.parse(decryptedCredentialsJson);
        console.log('✅ PostgreSQL config loaded and decrypted successfully');
        return {
            config,
            password: credentials.password,
        };
    }
    catch (error) {
        console.error('Failed to retrieve PostgreSQL config securely:', error);
        return null;
    }
};
exports.getPostgreSQLConfigSecure = getPostgreSQLConfigSecure;
/**
 * Remove PostgreSQL configuration and credentials
 */
const removePostgreSQLConfigSecure = async () => {
    try {
        console.log('🗑️ Removing PostgreSQL config from secure storage...');
        if (!window.electronAPI?.auth?.deleteSecureSetting) {
            console.log('❌ Secure settings API not available');
            return;
        }
        await Promise.all([
            window.electronAPI.auth.deleteSecureSetting('postgresql_config'),
            window.electronAPI.auth.deleteSecureSetting('postgresql_credentials'),
        ]);
        console.log('✅ PostgreSQL config removed successfully');
    }
    catch (error) {
        console.error('Failed to remove PostgreSQL config:', error);
    }
};
exports.removePostgreSQLConfigSecure = removePostgreSQLConfigSecure;
/**
 * Generate encryption key for credential storage
 * Uses master password if available, otherwise generates random key
 */
async function generateEncryptionKey() {
    try {
        // Try to use master password for key derivation
        if (window.electronAPI?.auth?.getSecureSetting) {
            const result = await window.electronAPI.auth.getSecureSetting('master_password_hash');
            if (result.success && result.data && result.data.value != null) {
                let stored = result.data.value;
                try {
                    const passwordData = JSON.parse(stored);
                    return passwordData.hash.substring(0, 32);
                }
                catch {
                    return stored.substring(0, 32);
                }
            }
        }
    }
    catch (error) {
        console.log('Master password not available, using random key');
    }
    // Fallback: generate or retrieve random encryption key
    const storage = (0, exports.getSecureStorage)();
    let key = await storage.getItem('credential_encryption_key');
    if (!key) {
        // Generate new random key
        const keyArray = new Uint8Array(32);
        crypto.getRandomValues(keyArray);
        key = btoa(String.fromCharCode.apply(null, Array.from(keyArray)));
        await storage.setItem('credential_encryption_key', key);
    }
    return key;
}
/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data, keyString) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    // Import key
    const keyData = new Uint8Array(atob(keyString).split('').map(c => c.charCodeAt(0)));
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt']);
    const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(data));
    // Combine iv + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}
/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encryptedData, keyString) {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    // Import key
    const keyData = new Uint8Array(atob(keyString).split('').map(c => c.charCodeAt(0)));
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['decrypt']);
    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}
