/**
 * Utility functions to manage crypto operations intelligently
 * Only performs expensive crypto when actually needed
 */
/**
 * Safely parse JSON data that might be Base64 encoded
 */
export declare const safeJsonParse: (data: string) => any;
export interface CryptoSettings {
    encryptionEnabled: boolean;
    hasEncryptedData: boolean;
    hasMasterPassword: boolean;
}
/**
 * Check if encryption features are enabled without triggering expensive crypto operations
 */
export declare const checkCryptoSettings: () => CryptoSettings;
/**
 * Determine if we need to show crypto loading screen
 */
export declare const shouldShowCryptoLoading: () => boolean;
/**
 * Progressive crypto initialization with progress callbacks
 */
export declare const initializeCrypto: (onProgress?: (progress: number, stage: string, message: string) => void) => Promise<boolean>;
//# sourceMappingURL=cryptoUtils.d.ts.map