/**
 * Authentication Middleware for IPC Handlers
 *
 * This middleware provides session validation and authentication checks
 * for sensitive IPC operations. It ensures that:
 * 1. Sessions are active and valid
 * 2. Sessions haven't expired due to inactivity
 * 3. Sensitive operations require authentication
 * 4. Failed authentication attempts are tracked
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { logger } from '@serenity/core';

interface SessionData {
  isActive: boolean;
  lastActivity: number;
  failedAttempts: number;
  lockoutUntil: number | null;
}

export class AuthMiddleware {
  private static instance: AuthMiddleware;
  private session: SessionData = {
    isActive: false,
    lastActivity: 0,
    failedAttempts: 0,
    lockoutUntil: null,
  };

  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes (default)
  private sessionTimeoutMs: number = this.SESSION_TIMEOUT;

  private constructor() {
    // Session timeout can be configured via setSessionTimeout method
  }

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  /**
   * Set session timeout (called from IPC handler or config)
   */
  public setSessionTimeout(timeoutMinutes: number): void {
    this.sessionTimeoutMs = timeoutMinutes * 60 * 1000;
    logger.info(`🔐 Session timeout set to ${timeoutMinutes} minutes`, { component: 'AuthMiddleware', operation: 'sessionTimeoutSet' });
  }

  /**
   * Create a new session (called after successful authentication)
   */
  public createSession(): void {
    this.session = {
      isActive: true,
      lastActivity: Date.now(),
      failedAttempts: 0,
      lockoutUntil: null,
    };
    logger.info(`✅ Session created at ${new Date().toISOString()}`, { component: 'AuthMiddleware', operation: 'sessionCreated' });
  }

  /**
   * Destroy the current session (called on lock/logout)
   */
  public destroySession(): void {
    this.session = {
      isActive: false,
      lastActivity: 0,
      failedAttempts: 0,
      lockoutUntil: null,
    };
    logger.info('🔒 Session destroyed', { component: 'AuthMiddleware', operation: 'sessionDestroyed' });
  }

  /**
   * Update last activity timestamp
   */
  public updateActivity(): void {
    if (this.session.isActive) {
      this.session.lastActivity = Date.now();
    }
  }

  /**
   * Record a failed authentication attempt
   */
  public recordFailedAttempt(): void {
    this.session.failedAttempts++;

    if (this.session.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      this.session.lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
      logger.warn(`⚠️ Account locked due to ${this.MAX_FAILED_ATTEMPTS} failed attempts`, { component: 'AuthMiddleware', operation: 'accountLockedDue' });
    }
  }

  /**
   * Reset failed attempts (called after successful authentication)
   */
  public resetFailedAttempts(): void {
    this.session.failedAttempts = 0;
    this.session.lockoutUntil = null;
  }

  /**
   * Check if session is valid
   */
  public isSessionValid(): boolean {
    // Check if session exists
    if (!this.session.isActive) {
      return false;
    }

    // Check if in lockout period
    if (this.session.lockoutUntil && Date.now() < this.session.lockoutUntil) {
      return false;
    }

    // Check if session has expired due to inactivity
    const timeSinceActivity = Date.now() - this.session.lastActivity;
    if (timeSinceActivity > this.sessionTimeoutMs) {
      logger.info('⏰ Session expired due to inactivity', { component: 'AuthMiddleware', operation: 'sessionExpiredDue' });
      this.destroySession();
      return false;
    }

    return true;
  }

  /**
   * Get session status
   */
  public getSessionStatus(): SessionData & {
    timeUntilExpiry: number;
    isLocked: boolean;
  } {
    const timeUntilExpiry = this.session.isActive
      ? Math.max(0, this.sessionTimeoutMs - (Date.now() - this.session.lastActivity))
      : 0;

    const isLocked = Boolean(
      this.session.lockoutUntil && Date.now() < this.session.lockoutUntil
    );

    return {
      ...this.session,
      timeUntilExpiry,
      isLocked,
    };
  }

  /**
   * Middleware wrapper for IPC handlers that require authentication
   */
  public requireAuth<T extends any[], R>(
    handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>
  ): (event: IpcMainInvokeEvent, ...args: T) => Promise<R> {
    return async (event: IpcMainInvokeEvent, ...args: T): Promise<R> => {
      // Check if session is valid
      if (!this.isSessionValid()) {
        throw new Error('Session expired or invalid. Please authenticate again.');
      }

      // Update activity timestamp
      this.updateActivity();

      // Execute the handler
      return handler(event, ...args);
    };
  }

  /**
   * Middleware wrapper for IPC handlers that are sensitive but optional
   * (will work with or without auth, but updates activity if authenticated)
   */
  public optionalAuth<T extends any[], R>(
    handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>
  ): (event: IpcMainInvokeEvent, ...args: T) => Promise<R> {
    return async (event: IpcMainInvokeEvent, ...args: T): Promise<R> => {
      // Update activity if session is active (but don't require it)
      if (this.session.isActive) {
        this.updateActivity();
      }

      // Execute the handler
      return handler(event, ...args);
    };
  }

  /**
   * Register IPC handlers with authentication middleware
   */
  public static registerHandler<T extends any[], R>(
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>,
    options: {
      requireAuth?: boolean;
      optionalAuth?: boolean;
    } = {}
  ): void {
    const middleware = AuthMiddleware.getInstance();

    let wrappedHandler = handler;

    if (options.requireAuth) {
      wrappedHandler = middleware.requireAuth(handler);
    } else if (options.optionalAuth) {
      wrappedHandler = middleware.optionalAuth(handler);
    }

    ipcMain.handle(channel, wrappedHandler as any);
  }
}

/**
 * Convenience function to register authenticated IPC handlers
 */
export function registerAuthHandler<T extends any[], R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>
): void {
  AuthMiddleware.registerHandler(channel, handler, { requireAuth: true });
}

/**
 * Convenience function to register optionally authenticated IPC handlers
 */
export function registerOptionalAuthHandler<T extends any[], R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: T) => Promise<R>
): void {
  AuthMiddleware.registerHandler(channel, handler, { optionalAuth: true });
}
