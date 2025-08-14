/**
 * Secure Session Manager
 * Handles master password in memory without storing in Redux state
 * Provides automatic cleanup and session expiration
 */
export declare class SecureSessionManager {
    private static instance;
    private masterPassword;
    private sessionStartTime;
    private sessionTimeout;
    private cleanupTimer;
    private constructor();
    static getInstance(): SecureSessionManager;
    /**
     * Store master password securely in memory
     * SECURITY: Password is never persisted, only held in memory
     */
    setMasterPassword(password: string): void;
    /**
     * Get master password if session is still active
     * SECURITY: Returns null if session expired or password not set
     */
    getMasterPassword(): string | null;
    /**
     * Check if session is currently active
     */
    isSessionActive(): boolean;
    /**
     * Set session timeout in milliseconds
     */
    setSessionTimeout(timeoutMs: number): void;
    /**
     * Extend current session by resetting the timer
     */
    extendSession(): void;
    /**
     * Clear master password from memory immediately
     * SECURITY: Overwrites memory location for better security
     */
    clearMasterPassword(): void;
    /**
     * Get remaining session time in milliseconds
     */
    getRemainingTime(): number;
    /**
     * Setup automatic cleanup when session expires
     */
    private setupAutoCleanup;
    /**
     * Reset the cleanup timer
     */
    private resetCleanupTimer;
    /**
     * Force destroy the session manager (for testing/cleanup)
     */
    static destroy(): void;
}
export declare const secureSessionManager: SecureSessionManager;
//# sourceMappingURL=secureSessionManager.d.ts.map