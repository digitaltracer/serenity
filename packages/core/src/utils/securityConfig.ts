/**
 * Security configuration constants for Serenity Notes
 * Defines cryptographic parameters and security settings
 */

// Production-ready cryptographic settings
export const CRYPTO_CONFIG = {
  // PBKDF2 iterations - balanced for security and performance
  PBKDF2_ITERATIONS: 100000, // OWASP recommended minimum
  
  // Fast iterations for non-critical operations (UI responsiveness)
  PBKDF2_FAST_ITERATIONS: 10000, // Still secure but faster
  
  // AES-GCM settings
  AES: {
    ALGORITHM: 'AES-GCM' as const,
    KEY_LENGTH: 256,
    IV_LENGTH: 12, // 96 bits for AES-GCM
  },
  
  // Salt lengths
  SALT_LENGTH: 32, // 256 bits
  
  // Key derivation
  HASH_ALGORITHM: 'SHA-256' as const,
  
  // Session and timing
  KEY_CACHE_TTL: 300000, // 5 minutes in milliseconds
  AUTH_TIMEOUT: 30000, // 30 seconds for auth operations
  
  // Security headers and validation
  ENCRYPTED_DATA_PREFIX: 'SRNT_ENC_', // Serenity encrypted data marker
  VERSION: '1.0',
} as const;

// Environment-specific settings
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    // Use faster iterations in development/test for better DX
    pbkdf2Iterations: isTest ? 1000 : isDevelopment ? 10000 : CRYPTO_CONFIG.PBKDF2_ITERATIONS,
    
    // More verbose logging in development
    verboseLogging: isDevelopment,
    
    // Shorter cache TTL in development
    keyCacheTTL: isDevelopment ? 60000 : CRYPTO_CONFIG.KEY_CACHE_TTL,
    
    // Shorter timeouts in test
    authTimeout: isTest ? 5000 : CRYPTO_CONFIG.AUTH_TIMEOUT,
  };
};

// Security policy validation
export const validateSecurityPolicy = (config: typeof CRYPTO_CONFIG): boolean => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
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

// Key management utilities
export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH));
};

export const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.AES.IV_LENGTH));
};

// Secure random string generation
export const generateSecureToken = (length: number = 32): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, byte => charset[byte % charset.length]).join('');
};

// Timing-safe comparison
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// Secure memory clearing (best effort)
export const secureClear = (buffer: ArrayBuffer | Uint8Array): void => {
  if (buffer instanceof ArrayBuffer) {
    const view = new Uint8Array(buffer);
    crypto.getRandomValues(view); // Overwrite with random data
  } else {
    crypto.getRandomValues(buffer);
  }
};

// Validate runtime crypto support
export const validateCryptoSupport = (): { supported: boolean; missing: string[] } => {
  const missing: string[] = [];
  
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