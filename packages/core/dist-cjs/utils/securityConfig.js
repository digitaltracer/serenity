"use strict";
/**
 * Security configuration constants for Serenity Notes
 * Defines cryptographic parameters and security settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCryptoSupport = exports.secureClear = exports.constantTimeCompare = exports.generateSecureToken = exports.generateIV = exports.generateSalt = exports.validateSecurityPolicy = exports.getEnvironmentConfig = exports.CRYPTO_CONFIG = void 0;
// Production-ready cryptographic settings
exports.CRYPTO_CONFIG = {
    // PBKDF2 iterations - balanced for security and performance
    PBKDF2_ITERATIONS: 100000, // OWASP recommended minimum
    // Fast iterations for non-critical operations (UI responsiveness)
    PBKDF2_FAST_ITERATIONS: 10000, // Still secure but faster
    // AES-GCM settings
    AES: {
        ALGORITHM: 'AES-GCM',
        KEY_LENGTH: 256,
        IV_LENGTH: 12, // 96 bits for AES-GCM
    },
    // Salt lengths
    SALT_LENGTH: 32, // 256 bits
    // Key derivation
    HASH_ALGORITHM: 'SHA-256',
    // Session and timing
    KEY_CACHE_TTL: 300000, // 5 minutes in milliseconds
    AUTH_TIMEOUT: 30000, // 30 seconds for auth operations
    // Security headers and validation
    ENCRYPTED_DATA_PREFIX: 'SRNT_ENC_', // Serenity encrypted data marker
    VERSION: '1.0',
};
// Environment-specific settings
const getEnvironmentConfig = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    return {
        // Use faster iterations in development/test for better DX
        pbkdf2Iterations: isTest ? 1000 : isDevelopment ? 10000 : exports.CRYPTO_CONFIG.PBKDF2_ITERATIONS,
        // More verbose logging in development
        verboseLogging: isDevelopment,
        // Shorter cache TTL in development
        keyCacheTTL: isDevelopment ? 60000 : exports.CRYPTO_CONFIG.KEY_CACHE_TTL,
        // Shorter timeouts in test
        authTimeout: isTest ? 5000 : exports.CRYPTO_CONFIG.AUTH_TIMEOUT,
    };
};
exports.getEnvironmentConfig = getEnvironmentConfig;
// Security policy validation
const validateSecurityPolicy = (config) => {
    const warnings = [];
    const errors = [];
    // Check PBKDF2 iterations
    if (config.PBKDF2_ITERATIONS < 100000) {
        warnings.push(`PBKDF2 iterations (${config.PBKDF2_ITERATIONS}) below OWASP recommended minimum (100,000)`);
    }
    if (config.PBKDF2_ITERATIONS < 10000) {
        errors.push(`PBKDF2 iterations (${config.PBKDF2_ITERATIONS}) critically low - minimum 10,000 required`);
    }
    // Check key length
    if (config.AES.KEY_LENGTH < 256) {
        errors.push(`AES key length (${config.AES.KEY_LENGTH}) insufficient - 256 bits required`);
    }
    // Check salt length
    if (config.SALT_LENGTH < 16) {
        errors.push(`Salt length (${config.SALT_LENGTH}) insufficient - minimum 16 bytes required`);
    }
    if (warnings.length > 0) {
        console.warn('🔒 Security warnings:', warnings);
    }
    if (errors.length > 0) {
        console.error('🚨 Security policy violations:', errors);
        return false;
    }
    console.log('✅ Security policy validation passed');
    return true;
};
exports.validateSecurityPolicy = validateSecurityPolicy;
// Key management utilities
const generateSalt = () => {
    return crypto.getRandomValues(new Uint8Array(exports.CRYPTO_CONFIG.SALT_LENGTH));
};
exports.generateSalt = generateSalt;
const generateIV = () => {
    return crypto.getRandomValues(new Uint8Array(exports.CRYPTO_CONFIG.AES.IV_LENGTH));
};
exports.generateIV = generateIV;
// Secure random string generation
const generateSecureToken = (length = 32) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, byte => charset[byte % charset.length]).join('');
};
exports.generateSecureToken = generateSecureToken;
// Timing-safe comparison
const constantTimeCompare = (a, b) => {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
};
exports.constantTimeCompare = constantTimeCompare;
// Secure memory clearing (best effort)
const secureClear = (buffer) => {
    if (buffer instanceof ArrayBuffer) {
        const view = new Uint8Array(buffer);
        crypto.getRandomValues(view); // Overwrite with random data
    }
    else {
        crypto.getRandomValues(buffer);
    }
};
exports.secureClear = secureClear;
// Validate runtime crypto support
const validateCryptoSupport = () => {
    const missing = [];
    if (typeof crypto === 'undefined') {
        missing.push('crypto global');
    }
    if (typeof crypto?.subtle === 'undefined') {
        missing.push('crypto.subtle (Web Crypto API)');
    }
    if (typeof crypto?.getRandomValues === 'undefined') {
        missing.push('crypto.getRandomValues');
    }
    // Check for required algorithms
    const requiredAlgorithms = ['PBKDF2', 'AES-GCM', 'SHA-256'];
    // Note: We can't easily test algorithm support without actually using them
    return {
        supported: missing.length === 0,
        missing,
    };
};
exports.validateCryptoSupport = validateCryptoSupport;
