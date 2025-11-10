/**
 * Rate Limiter for Brute Force Prevention
 *
 * This class implements rate limiting to prevent brute force attacks on:
 * - Password authentication attempts
 * - API calls
 * - Search queries
 * - Database operations
 *
 * Features:
 * - Per-operation rate limiting
 * - Configurable time windows
 * - Automatic cleanup of old records
 * - Progressive lockout (increasing delays)
 */

import { logger } from '@serenity/core';

interface RateLimitConfig {
  maxAttempts: number; // Maximum attempts allowed
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after exceeding limit
  progressiveDelay?: boolean; // Enable progressive delays
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private records: Map<string, AttemptRecord> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  // Default configurations for different operation types
  private readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    // Authentication: 5 attempts per 15 minutes, 5-minute block
    authentication: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 5 * 60 * 1000,
      progressiveDelay: true,
    },
    // Password reset: 3 attempts per hour, 1-hour block
    passwordReset: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000,
      progressiveDelay: false,
    },
    // API calls: 100 per minute, 1-minute block
    api: {
      maxAttempts: 100,
      windowMs: 60 * 1000,
      blockDurationMs: 60 * 1000,
      progressiveDelay: false,
    },
    // Search: 50 per minute, 30-second block
    search: {
      maxAttempts: 50,
      windowMs: 60 * 1000,
      blockDurationMs: 30 * 1000,
      progressiveDelay: false,
    },
    // Database writes: 200 per minute, 2-minute block
    databaseWrite: {
      maxAttempts: 200,
      windowMs: 60 * 1000,
      blockDurationMs: 2 * 60 * 1000,
      progressiveDelay: false,
    },
  };

  private constructor() {
    // Initialize default configs
    for (const [key, config] of Object.entries(this.DEFAULT_CONFIGS)) {
      this.configs.set(key, config);
    }

    // Cleanup old records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Set custom rate limit configuration for an operation
   */
  public setConfig(operationType: string, config: RateLimitConfig): void {
    this.configs.set(operationType, config);
  }

  /**
   * Get rate limit configuration for an operation
   */
  private getConfig(operationType: string): RateLimitConfig {
    return (
      this.configs.get(operationType) ||
      this.DEFAULT_CONFIGS.api || // Fallback to API config
      {
        maxAttempts: 100,
        windowMs: 60 * 1000,
        blockDurationMs: 60 * 1000,
        progressiveDelay: false,
      }
    );
  }

  /**
   * Get unique key for rate limiting
   */
  private getKey(operationType: string, identifier: string): string {
    return `${operationType}:${identifier}`;
  }

  /**
   * Check if operation is allowed (rate limit check)
   */
  public isAllowed(operationType: string, identifier: string = 'default'): boolean {
    const key = this.getKey(operationType, identifier);
    const config = this.getConfig(operationType);
    const now = Date.now();

    let record = this.records.get(key);

    // Create new record if doesn't exist
    if (!record) {
      record = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
      };
      this.records.set(key, record);
    }

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      logger.warn(
        `🚫 Rate limit: ${operationType} blocked for ${identifier} until ${new Date(
          record.blockedUntil
        ).toISOString()}`
      , { component: 'RateLimiter', operation: 'operation' });
      return false;
    }

    // Clear block if expired
    if (record.blockedUntil && now >= record.blockedUntil) {
      record.blockedUntil = null;
      record.count = 0;
      record.firstAttempt = now;
    }

    // Check if window has expired
    if (now - record.firstAttempt > config.windowMs) {
      // Reset the window
      record.count = 0;
      record.firstAttempt = now;
    }

    // Check if within rate limit
    if (record.count >= config.maxAttempts) {
      // Calculate block duration (progressive if enabled)
      let blockDuration = config.blockDurationMs;
      if (config.progressiveDelay) {
        // Double the block duration for each subsequent violation
        const violations = Math.floor(record.count / config.maxAttempts);
        blockDuration = config.blockDurationMs * Math.pow(2, violations - 1);
        // Cap at 1 hour
        blockDuration = Math.min(blockDuration, 60 * 60 * 1000);
      }

      record.blockedUntil = now + blockDuration;
      logger.warn(
        `⚠️ Rate limit exceeded: ${operationType} for ${identifier}. Blocked for ${
          blockDuration / 1000
        }s`
      , { component: 'RateLimiter', operation: 'operation' });
      return false;
    }

    return true;
  }

  /**
   * Record an attempt (must be called after isAllowed returns true)
   */
  public recordAttempt(operationType: string, identifier: string = 'default'): void {
    const key = this.getKey(operationType, identifier);
    const record = this.records.get(key);

    if (record) {
      record.count++;
      record.lastAttempt = Date.now();
    }
  }

  /**
   * Reset rate limit for an operation/identifier
   */
  public reset(operationType: string, identifier: string = 'default'): void {
    const key = this.getKey(operationType, identifier);
    this.records.delete(key);
    logger.info(`✅ Rate limit reset for ${operationType}:${identifier}`, { component: 'RateLimiter', operation: 'rateLimitReset' });
  }

  /**
   * Get current status for an operation/identifier
   */
  public getStatus(
    operationType: string,
    identifier: string = 'default'
  ): {
    allowed: boolean;
    attemptsRemaining: number;
    blockedUntil: number | null;
    resetAt: number;
  } {
    const key = this.getKey(operationType, identifier);
    const config = this.getConfig(operationType);
    const record = this.records.get(key);
    const now = Date.now();

    if (!record) {
      return {
        allowed: true,
        attemptsRemaining: config.maxAttempts,
        blockedUntil: null,
        resetAt: now + config.windowMs,
      };
    }

    const isBlocked = record.blockedUntil !== null && now < record.blockedUntil;
    const attemptsRemaining = Math.max(0, config.maxAttempts - record.count);
    const resetAt = record.firstAttempt + config.windowMs;

    return {
      allowed: !isBlocked && attemptsRemaining > 0,
      attemptsRemaining,
      blockedUntil: isBlocked ? record.blockedUntil : null,
      resetAt,
    };
  }

  /**
   * Cleanup old records
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.records.entries()) {
      // Extract operation type from key
      const operationType = key.split(':')[0];
      const config = this.getConfig(operationType);

      // Remove if:
      // 1. Block has expired and no recent activity (5 minutes)
      // 2. Window has expired and not blocked
      const isOld = now - record.lastAttempt > 5 * 60 * 1000;
      const blockExpired = !record.blockedUntil || now >= record.blockedUntil;
      const windowExpired = now - record.firstAttempt > config.windowMs;

      if (isOld && blockExpired && windowExpired) {
        this.records.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Cleaned ${cleaned} old rate limit records`, { component: 'RateLimiter', operation: 'cleaned${cleaned}Old' });
    }
  }

  /**
   * Get all active blocks
   */
  public getActiveBlocks(): Array<{
    operationType: string;
    identifier: string;
    blockedUntil: number;
  }> {
    const now = Date.now();
    const blocks: Array<{
      operationType: string;
      identifier: string;
      blockedUntil: number;
    }> = [];

    for (const [key, record] of this.records.entries()) {
      if (record.blockedUntil && now < record.blockedUntil) {
        const [operationType, identifier] = key.split(':');
        blocks.push({
          operationType,
          identifier,
          blockedUntil: record.blockedUntil,
        });
      }
    }

    return blocks;
  }

  /**
   * Clear all rate limit records
   */
  public clearAll(): void {
    this.records.clear();
    logger.info('🧹 All rate limit records cleared', { component: 'RateLimiter', operation: 'allRateLimit' });
  }
}

/**
 * Convenience function to check and record a rate-limited operation
 */
export async function rateLimitedOperation<T>(
  operationType: string,
  identifier: string,
  operation: () => Promise<T>
): Promise<T> {
  const rateLimiter = RateLimiter.getInstance();

  if (!rateLimiter.isAllowed(operationType, identifier)) {
    const status = rateLimiter.getStatus(operationType, identifier);
    const waitTime = status.blockedUntil
      ? Math.ceil((status.blockedUntil - Date.now()) / 1000)
      : 0;
    throw new Error(
      `Rate limit exceeded for ${operationType}. Please try again in ${waitTime} seconds.`
    );
  }

  rateLimiter.recordAttempt(operationType, identifier);

  try {
    const result = await operation();
    return result;
  } catch (error) {
    // Don't reset on error - failed attempts still count
    throw error;
  }
}
