/**
 * Security configuration constants for Serenity Notes
 * Defines cryptographic parameters and security settings
 */
export declare const CRYPTO_CONFIG: {
    readonly PBKDF2_ITERATIONS: 100000;
    readonly PBKDF2_FAST_ITERATIONS: 10000;
    readonly AES: {
        readonly ALGORITHM: "AES-GCM";
        readonly KEY_LENGTH: 256;
        readonly IV_LENGTH: 12;
    };
    readonly SALT_LENGTH: 32;
    readonly HASH_ALGORITHM: "SHA-256";
    readonly KEY_CACHE_TTL: 300000;
    readonly AUTH_TIMEOUT: 30000;
    readonly ENCRYPTED_DATA_PREFIX: "SRNT_ENC_";
    readonly VERSION: "1.0";
};
export declare const getEnvironmentConfig: () => {
    pbkdf2Iterations: number;
    verboseLogging: boolean;
    keyCacheTTL: number;
    authTimeout: number;
};
export declare const validateSecurityPolicy: (config: typeof CRYPTO_CONFIG) => boolean;
export declare const generateSalt: () => Uint8Array;
export declare const generateIV: () => Uint8Array;
export declare const generateSecureToken: (length?: number) => string;
export declare const constantTimeCompare: (a: string, b: string) => boolean;
export declare const secureClear: (buffer: ArrayBuffer | Uint8Array) => void;
export declare const validateCryptoSupport: () => {
    supported: boolean;
    missing: string[];
};
//# sourceMappingURL=securityConfig.d.ts.map