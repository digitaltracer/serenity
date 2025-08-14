/**
 * Biometric Authentication Service
 * Handles Touch ID/Face ID authentication with encrypted master password storage
 */
export interface BiometricAuthResult {
    success: boolean;
    masterPassword?: string;
    error?: string;
    cancelled?: boolean;
}
export declare class BiometricAuthService {
    private static readonly MASTER_PASSWORD_KEY;
    /**
     * Check if biometric authentication is available on this system
     */
    static isAvailable(): Promise<{
        available: boolean;
        type: string | null;
    }>;
    /**
     * Store master password encrypted with system keychain for biometric access
     */
    static storeMasterPasswordForBiometric(masterPassword: string): Promise<boolean>;
    /**
     * Authenticate with biometrics and retrieve the master password
     * Note: This may prompt for authentication twice - once for Touch ID and once for keychain access
     */
    static authenticateAndRetrieveMasterPassword(reason?: string): Promise<BiometricAuthResult>;
    /**
     * Check if we have a master password stored for biometric authentication
     */
    static hasStoredMasterPassword(): Promise<boolean>;
    /**
     * Retrieve and decrypt the stored master password
     */
    private static retrieveStoredMasterPassword;
    /**
     * Remove stored master password (when master password is changed or disabled)
     */
    static removeStoredMasterPassword(): Promise<boolean>;
    /**
     * Update stored master password when the user changes their master password
     */
    static updateStoredMasterPassword(newMasterPassword: string): Promise<boolean>;
}
//# sourceMappingURL=biometricAuthService.d.ts.map