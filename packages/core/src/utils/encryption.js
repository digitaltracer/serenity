/**
 * Client-side encryption service using Web Crypto API
 * Provides AES-GCM encryption for sensitive user data
 */
import { throwEncryptionError } from './errorHandler';
import { logger } from './logger';
export const DEFAULT_KEY_ROTATION = {
    rotationIntervalDays: 90, // Rotate every 3 months
    maxKeyAge: 365, // Max 1 year
    keepOldVersions: 5, // Keep 5 old versions
    autoRotate: true,
};
export const DEFAULT_CLASSIFICATION = {
    journalEntries: 'confidential',
    taskDescriptions: 'internal',
    taskTitles: 'internal',
    projectNames: 'internal',
    tags: 'internal',
    userNotes: 'confidential',
};
const getEncryptionConfig = (classification) => {
    switch (classification) {
        case 'restricted':
            return { shouldEncrypt: true, keyIterations: 500000, algorithm: 'AES-GCM' };
        case 'confidential':
            return { shouldEncrypt: true, keyIterations: 200000, algorithm: 'AES-GCM' };
        case 'internal':
            return { shouldEncrypt: true, keyIterations: 100000, algorithm: 'AES-GCM' };
        case 'public':
        default:
            return { shouldEncrypt: false, keyIterations: 0, algorithm: '' };
    }
};
/**
 * Main encryption service class
 */
export class EncryptionService {
    /**
     * Generate a cryptographic key from a password and salt
     */
    static async deriveKey(password, salt, iterations = 100000) {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256',
        }, passwordKey, { name: this.ALGORITHM, length: this.KEY_LENGTH }, false, ['encrypt', 'decrypt']);
    }
    /**
     * Generate a random salt
     */
    static generateSalt() {
        return crypto.getRandomValues(new Uint8Array(16));
    }
    /**
     * Generate a random IV
     */
    static generateIV() {
        return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH / 8));
    }
    /**
     * Encrypt data using AES-GCM
     */
    static async encrypt(data, password, classification = 'confidential', keyVersion) {
        const config = getEncryptionConfig(classification);
        if (!config.shouldEncrypt) {
            // Return unencrypted data for public classification
            return {
                data: btoa(data),
                iv: '',
                salt: '',
                keyVersion: keyVersion || 1,
                timestamp: new Date().toISOString(),
            };
        }
        try {
            const encoder = new TextEncoder();
            const salt = this.generateSalt();
            const iv = this.generateIV();
            const key = await this.deriveKey(password, salt, config.keyIterations);
            const encodedData = encoder.encode(data);
            const encryptedBuffer = await crypto.subtle.encrypt({ name: this.ALGORITHM, iv }, key, encodedData);
            return {
                data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
                iv: btoa(String.fromCharCode(...iv)),
                salt: btoa(String.fromCharCode(...salt)),
                keyVersion: keyVersion || 1,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throwEncryptionError('CRYPTO_ENCRYPTION_FAILED', error instanceof Error ? error : new Error(String(error)), { classification, keyVersion });
        }
    }
    /**
     * Decrypt data using AES-GCM
     */
    static async decrypt(encryptedData, password, classification = 'confidential') {
        const config = getEncryptionConfig(classification);
        if (!config.shouldEncrypt) {
            // Return decoded data for public classification
            return atob(encryptedData.data);
        }
        try {
            const salt = new Uint8Array(Array.from(atob(encryptedData.salt), char => char.charCodeAt(0)));
            const iv = new Uint8Array(Array.from(atob(encryptedData.iv), char => char.charCodeAt(0)));
            const encrypted = new Uint8Array(Array.from(atob(encryptedData.data), char => char.charCodeAt(0)));
            const key = await this.deriveKey(password, salt, config.keyIterations);
            const decryptedBuffer = await crypto.subtle.decrypt({ name: this.ALGORITHM, iv }, key, encrypted);
            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        }
        catch (error) {
            throwEncryptionError('CRYPTO_DECRYPTION_FAILED', error instanceof Error ? error : new Error(String(error)), { classification });
        }
    }
    /**
     * Encrypt journal entry based on classification settings
     */
    static async encryptJournalEntry(content, password, settings) {
        return this.encrypt(content, password, settings.journalEntries);
    }
    /**
     * Encrypt task data based on classification settings
     */
    static async encryptTaskData(data, password, settings) {
        const result = {};
        if (data.title) {
            result.title = await this.encrypt(data.title, password, settings.taskTitles);
        }
        if (data.description) {
            result.description = await this.encrypt(data.description, password, settings.taskDescriptions);
        }
        return result;
    }
    /**
     * Bulk encrypt multiple items
     */
    static async encryptBulk(items, password) {
        const encrypted = await Promise.all(items.map(item => this.encrypt(item.data, password, item.classification)));
        return encrypted;
    }
    /**
     * Bulk decrypt multiple items
     */
    static async decryptBulk(items, password) {
        const decrypted = await Promise.all(items.map(item => this.decrypt(item.data, password, item.classification)));
        return decrypted;
    }
    /**
     * Generate a secure random password
     */
    static generateSecurePassword(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => charset[byte % charset.length]).join('');
    }
    /**
     * Derive encryption key for data export
     * SECURITY FIX: Use random salt instead of fixed salt
     */
    static async deriveExportKey(password, providedSalt) {
        // Use provided salt or generate new random salt
        const salt = providedSalt || this.generateSalt();
        const key = await this.deriveKey(password, salt, 200000);
        // Export key as JWK for serialization
        const exportedKey = await crypto.subtle.exportKey('jwk', key);
        return {
            key: JSON.stringify(exportedKey),
            salt: btoa(String.fromCharCode(...salt)) // Return salt for storage
        };
    }
    /**
     * Secure data deletion (overwrite memory)
     * Enhanced to handle passwords and sensitive strings
     */
    static secureDelete(data) {
        if (typeof data === 'string') {
            // JavaScript strings are immutable, but we can try to minimize references
            // and create noise in memory to make recovery harder
            const length = data.length;
            // Create multiple random strings to overwrite memory locations
            for (let i = 0; i < 5; i++) {
                const noise = this.generateSecurePassword(length);
                // Force string operations to potentially overwrite memory
                noise.split('').reverse().join('');
            }
            // Clear the reference
            data = '';
        }
        else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
            // Overwrite array with random values multiple times
            const view = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
            for (let pass = 0; pass < 3; pass++) {
                crypto.getRandomValues(view);
            }
            // Final overwrite with zeros
            view.fill(0);
        }
        else if (typeof data === 'object' && data !== null) {
            // Recursively secure delete object properties
            Object.keys(data).forEach(key => {
                this.secureDelete(data[key]);
                delete data[key];
            });
        }
    }
    /**
     * Secure clear password from memory (best effort in JavaScript)
     */
    static secureDeletePassword(password) {
        if (!password || typeof password !== 'string')
            return;
        const length = password.length;
        // Create noise patterns to overwrite potential memory locations
        const patterns = [
            '\x00'.repeat(length), // Null bytes
            '\xFF'.repeat(length), // All ones
            this.generateSecurePassword(length), // Random data
            'A'.repeat(length), // Pattern
            '0'.repeat(length), // Zeros
        ];
        // Execute multiple overwrites
        patterns.forEach(pattern => {
            try {
                // Force string operations that might affect memory
                pattern.split('').sort().join('');
                pattern.toLowerCase().toUpperCase();
            }
            catch (e) {
                // Ignore errors, continue with secure deletion
            }
        });
        // Try to force garbage collection if available
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        }
    }
    /**
     * Verify encrypted data integrity
     */
    static async verifyIntegrity(encryptedData, password, classification) {
        try {
            await this.decrypt(encryptedData, password, classification);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get encryption strength score (0-100)
     */
    static getEncryptionStrength(classification) {
        const config = getEncryptionConfig(classification);
        if (!config.shouldEncrypt)
            return 0;
        // Score based on key iterations and algorithm
        const baseScore = config.keyIterations / 5000; // Max 100 for 500k iterations
        return Math.min(100, Math.round(baseScore));
    }
}
EncryptionService.ALGORITHM = 'AES-GCM';
EncryptionService.KEY_LENGTH = 256;
EncryptionService.IV_LENGTH = 96;
/**
 * Key Rotation Manager
 * Handles encryption key lifecycle and rotation
 */
export class KeyRotationManager {
    constructor(config = DEFAULT_KEY_ROTATION) {
        this.config = { ...config };
        this.keyVersions = new Map();
        this.currentVersion = 1;
        // Initialize with version 1 if no versions exist
        if (this.keyVersions.size === 0) {
            this.initializeFirstVersion();
        }
    }
    /**
     * Initialize the first key version
     */
    initializeFirstVersion() {
        const salt = EncryptionService.generateSalt();
        const now = new Date().toISOString();
        this.keyVersions.set(1, {
            version: 1,
            createdAt: now,
            salt: btoa(String.fromCharCode(...salt)),
            iterations: 200000, // Default for confidential
            status: 'active',
        });
    }
    /**
     * Get current active key version
     */
    getCurrentVersion() {
        return this.currentVersion;
    }
    /**
     * Get key version info
     */
    getKeyVersionInfo(version) {
        return this.keyVersions.get(version);
    }
    /**
     * Get all key versions
     */
    getAllVersions() {
        return Array.from(this.keyVersions.values()).sort((a, b) => b.version - a.version);
    }
    /**
     * Check if key rotation is needed
     */
    isRotationNeeded() {
        if (!this.config.autoRotate)
            return false;
        const currentVersionInfo = this.keyVersions.get(this.currentVersion);
        if (!currentVersionInfo)
            return true;
        const now = new Date();
        const createdAt = new Date(currentVersionInfo.createdAt);
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreation >= this.config.rotationIntervalDays;
    }
    /**
     * Check if key version is expired
     */
    isKeyExpired(version) {
        const versionInfo = this.keyVersions.get(version);
        if (!versionInfo)
            return true;
        const now = new Date();
        const createdAt = new Date(versionInfo.createdAt);
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreation >= this.config.maxKeyAge;
    }
    /**
     * Rotate to a new key version
     */
    async rotateKey(classification = 'confidential') {
        const config = getEncryptionConfig(classification);
        const newVersion = this.currentVersion + 1;
        const salt = EncryptionService.generateSalt();
        const now = new Date().toISOString();
        // Mark current version as deprecated
        const currentVersionInfo = this.keyVersions.get(this.currentVersion);
        if (currentVersionInfo) {
            currentVersionInfo.status = 'deprecated';
            currentVersionInfo.rotatedAt = now;
        }
        // Create new version
        this.keyVersions.set(newVersion, {
            version: newVersion,
            createdAt: now,
            salt: btoa(String.fromCharCode(...salt)),
            iterations: config.keyIterations,
            status: 'active',
        });
        this.currentVersion = newVersion;
        // Clean up old versions if needed
        await this.cleanupOldVersions();
        logger.info(`🔄 Key rotated to version ${newVersion}`, { component: 'encryption', operation: 'keyRotatedVersion' });
        return newVersion;
    }
    /**
     * Clean up old key versions
     */
    async cleanupOldVersions() {
        const versions = Array.from(this.keyVersions.keys()).sort((a, b) => b - a);
        const versionsToKeep = Math.max(this.config.keepOldVersions, 1); // Always keep at least 1
        // Mark expired versions
        versions.forEach(version => {
            if (this.isKeyExpired(version) && version !== this.currentVersion) {
                const versionInfo = this.keyVersions.get(version);
                if (versionInfo) {
                    versionInfo.status = 'expired';
                }
            }
        });
        // Remove excess versions (keep only the most recent)
        const versionsToRemove = versions.slice(versionsToKeep);
        versionsToRemove.forEach(version => {
            if (version !== this.currentVersion) {
                logger.info(`🗑️ Removing old key version ${version}`, { component: 'encryption', operation: '🗑️RemovingOld' });
                this.keyVersions.delete(version);
            }
        });
    }
    /**
     * Encrypt data with current key version
     */
    async encryptWithCurrentKey(data, password, classification = 'confidential') {
        // Check if rotation is needed
        if (this.isRotationNeeded()) {
            await this.rotateKey(classification);
        }
        return EncryptionService.encrypt(data, password, classification, this.currentVersion);
    }
    /**
     * Decrypt data with appropriate key version
     */
    async decryptWithKeyVersion(encryptedData, password, classification = 'confidential') {
        const keyVersion = encryptedData.keyVersion || 1;
        const versionInfo = this.keyVersions.get(keyVersion);
        if (!versionInfo) {
            throw new Error(`Key version ${keyVersion} not found`);
        }
        if (versionInfo.status === 'expired') {
            logger.warn(`⚠️ Decrypting with expired key version ${keyVersion}`, { component: 'encryption', operation: 'decryptingWithExpired' });
        }
        return EncryptionService.decrypt(encryptedData, password, classification);
    }
    /**
     * Re-encrypt data with current key version
     */
    async reencryptData(encryptedData, password, classification = 'confidential') {
        // First decrypt with old key
        const decryptedData = await this.decryptWithKeyVersion(encryptedData, password, classification);
        // Then encrypt with current key
        return this.encryptWithCurrentKey(decryptedData, password, classification);
    }
    /**
     * Bulk re-encrypt multiple items to current key version
     */
    async bulkReencrypt(items, password, onProgress) {
        const results = [];
        const total = items.length;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Only re-encrypt if not already using current version
            if (item.data.keyVersion !== this.currentVersion) {
                try {
                    const reencrypted = await this.reencryptData(item.data, password, item.classification);
                    results.push(reencrypted);
                    logger.info(`🔄 Re-encrypted item ${i + 1}/${total} to version ${this.currentVersion}`, { component: 'encryption', operation: 're-encryptedItem${i' });
                }
                catch (error) {
                    logger.error(`❌ Failed to re-encrypt item ${i + 1}:`, { component: 'encryption', operation: 'failedRe-encryptItem' }, error);
                    // Keep original if re-encryption fails
                    results.push(item.data);
                }
            }
            else {
                // Already current version
                results.push(item.data);
            }
            // Report progress
            if (onProgress) {
                onProgress(i + 1, total);
            }
        }
        return results;
    }
    /**
     * Get rotation status and recommendations
     */
    getRotationStatus() {
        const currentVersionInfo = this.keyVersions.get(this.currentVersion);
        const now = new Date();
        let daysSinceLastRotation = 0;
        if (currentVersionInfo) {
            const createdAt = new Date(currentVersionInfo.createdAt);
            daysSinceLastRotation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        }
        const expiredVersions = Array.from(this.keyVersions.keys()).filter(v => this.isKeyExpired(v));
        const recommendations = [];
        if (this.isRotationNeeded()) {
            recommendations.push('Key rotation is recommended due to age');
        }
        if (expiredVersions.length > 0) {
            recommendations.push(`${expiredVersions.length} expired key versions should be cleaned up`);
        }
        if (this.keyVersions.size > this.config.keepOldVersions + 2) {
            recommendations.push('Consider cleaning up old key versions to improve performance');
        }
        return {
            currentVersion: this.currentVersion,
            rotationNeeded: this.isRotationNeeded(),
            daysSinceLastRotation,
            expiredVersions,
            totalVersions: this.keyVersions.size,
            recommendations,
        };
    }
    /**
     * Update rotation configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Export key version metadata for backup
     */
    exportKeyVersions() {
        const data = {
            currentVersion: this.currentVersion,
            config: this.config,
            versions: Array.from(this.keyVersions.entries()),
        };
        return JSON.stringify(data);
    }
    /**
     * Import key version metadata from backup
     */
    importKeyVersions(jsonData) {
        const data = JSON.parse(jsonData);
        this.currentVersion = data.currentVersion;
        this.config = { ...this.config, ...data.config };
        this.keyVersions = new Map(data.versions);
    }
}
/**
 * Data classification manager
 */
export class DataClassificationManager {
    constructor(settings = DEFAULT_CLASSIFICATION) {
        this.settings = { ...settings };
    }
    /**
     * Update classification settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Get classification for specific data type
     */
    getClassification(dataType) {
        return this.settings[dataType];
    }
    /**
     * Check if data type should be encrypted
     */
    shouldEncrypt(dataType) {
        const classification = this.getClassification(dataType);
        return getEncryptionConfig(classification).shouldEncrypt;
    }
    /**
     * Get encryption strength for data type
     */
    getEncryptionStrength(dataType) {
        const classification = this.getClassification(dataType);
        return EncryptionService.getEncryptionStrength(classification);
    }
    /**
     * Get security summary
     */
    getSecuritySummary() {
        const dataTypes = Object.keys(this.settings);
        const classifications = dataTypes.reduce((acc, type) => {
            const classification = this.settings[type];
            acc[classification] = (acc[classification] || 0) + 1;
            return acc;
        }, {});
        const encryptedTypes = dataTypes.filter(type => this.shouldEncrypt(type));
        const totalStrength = dataTypes.reduce((sum, type) => {
            return sum + this.getEncryptionStrength(type);
        }, 0);
        return {
            totalDataTypes: dataTypes.length,
            encryptedDataTypes: encryptedTypes.length,
            averageStrength: Math.round(totalStrength / dataTypes.length),
            classifications,
        };
    }
}
/**
 * Export utilities
 */
export { getEncryptionConfig };
