/**
 * Secure Session Manager
 * Handles master password in memory without storing in Redux state
 * Provides automatic cleanup and session expiration
 */

export class SecureSessionManager {
  private static instance: SecureSessionManager | null = null;
  private masterPassword: string | null = null;
  private sessionStartTime: number | null = null;
  private sessionTimeout: number = 15 * 60 * 1000; // 15 minutes default
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
    this.setupAutoCleanup();
  }

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager();
    }
    return SecureSessionManager.instance;
  }

  /**
   * Store master password securely in memory
   * SECURITY: Password is never persisted, only held in memory
   */
  setMasterPassword(password: string): void {
    // Clear any existing password first
    this.clearMasterPassword();
    
    this.masterPassword = password;
    this.sessionStartTime = Date.now();
    this.resetCleanupTimer();
  }

  /**
   * Get master password if session is still active
   * SECURITY: Returns null if session expired or password not set
   */
  getMasterPassword(): string | null {
    if (!this.masterPassword || !this.sessionStartTime) {
      return null;
    }

    const now = Date.now();
    if (now - this.sessionStartTime > this.sessionTimeout) {
      // Session expired, clear password
      this.clearMasterPassword();
      return null;
    }

    // Update last access time
    this.sessionStartTime = now;
    this.resetCleanupTimer();
    
    return this.masterPassword;
  }

  /**
   * Check if session is currently active
   */
  isSessionActive(): boolean {
    return this.getMasterPassword() !== null;
  }

  /**
   * Set session timeout in milliseconds
   */
  setSessionTimeout(timeoutMs: number): void {
    this.sessionTimeout = timeoutMs;
    if (this.isSessionActive()) {
      this.resetCleanupTimer();
    }
  }

  /**
   * Extend current session by resetting the timer
   */
  extendSession(): void {
    if (this.isSessionActive()) {
      this.sessionStartTime = Date.now();
      this.resetCleanupTimer();
    }
  }

  /**
   * Clear master password from memory immediately
   * SECURITY: Overwrites memory location for better security
   */
  clearMasterPassword(): void {
    if (this.masterPassword) {
      // Overwrite memory location with random data for security
      const originalLength = this.masterPassword.length;
      this.masterPassword = crypto.getRandomValues(new Uint8Array(originalLength))
        .reduce((str, byte) => str + String.fromCharCode(byte), '');
      this.masterPassword = null;
    }
    
    this.sessionStartTime = null;
    
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingTime(): number {
    if (!this.sessionStartTime) {
      return 0;
    }

    const elapsed = Date.now() - this.sessionStartTime;
    const remaining = this.sessionTimeout - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Setup automatic cleanup when session expires
   */
  private setupAutoCleanup(): void {
    // Clean up when page/process is unloaded
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearMasterPassword();
      });

      window.addEventListener('unload', () => {
        this.clearMasterPassword();
      });
    }

    // Clean up on process exit (Node.js/Electron main process)
    if (typeof process !== 'undefined') {
      process.on('exit', () => {
        this.clearMasterPassword();
      });

      process.on('SIGINT', () => {
        this.clearMasterPassword();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        this.clearMasterPassword();
        process.exit(0);
      });
    }
  }

  /**
   * Reset the cleanup timer
   */
  private resetCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }

    this.cleanupTimer = setTimeout(() => {
      this.clearMasterPassword();
    }, this.sessionTimeout);
  }

  /**
   * Force destroy the session manager (for testing/cleanup)
   */
  static destroy(): void {
    if (SecureSessionManager.instance) {
      SecureSessionManager.instance.clearMasterPassword();
      SecureSessionManager.instance = null;
    }
  }
}

// Export singleton instance
export const secureSessionManager = SecureSessionManager.getInstance();