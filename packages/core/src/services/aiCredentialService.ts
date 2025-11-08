/**
 * AI Credential Service
 * Manages AI provider credentials with automatic failover support
 */

import { logger } from '../utils/logger';

export interface AIProviderCredential {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  name: string;
  modelPreference?: string;
  enabled: boolean;
  priority: number;

  // Usage stats
  lastUsedAt?: string;
  totalRequests: number;
  totalTokens: number;
  successCount: number;
  errorCount: number;
  lastError?: string;
  lastErrorAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderCredentialInput {
  provider: 'openai' | 'gemini' | 'anthropic';
  name: string;
  apiKey: string;
  modelPreference?: string;
  priority?: number;
}

interface CredentialWithCooldown extends AIProviderCredential {
  _cooldownUntil?: number;
  _retryCount?: number;
}

/**
 * Cooldown tracking for failed credentials
 * Maps credential ID to timestamp when it can be retried
 */
const credentialCooldowns = new Map<string, { until: number; retryCount: number }>();

const RETRY_DELAY_MS = 30000; // 30 seconds
const MAX_RETRIES_BEFORE_SKIP = 1; // Retry once, then skip to next

export class AICredentialService {
  /**
   * Get all credentials, sorted by priority
   * Respects cooldown periods for recently failed credentials
   */
  static getAvailableCredentials(
    credentials: AIProviderCredential[]
  ): AIProviderCredential[] {
    const now = Date.now();

    return credentials
      .filter(cred => cred.enabled)
      .filter(cred => {
        // Check if credential is in cooldown
        const cooldown = credentialCooldowns.get(cred.id);
        if (!cooldown) return true;

        // If still in cooldown period
        if (now < cooldown.until) {
          logger.debug(`Credential ${cred.id} is in cooldown until ${new Date(cooldown.until).toISOString()}`, {
            component: 'AICredentialService',
            operation: 'getAvailableCredentials'
          });
          return false;
        }

        // Cooldown expired, clear it
        credentialCooldowns.delete(cred.id);
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get next available credential for failover
   * Skips credentials currently in cooldown
   */
  static getNextAvailableCredential(
    credentials: AIProviderCredential[]
  ): AIProviderCredential | null {
    const available = this.getAvailableCredentials(credentials);

    if (available.length === 0) {
      logger.warn('No available credentials found (all disabled or in cooldown)', {
        component: 'AICredentialService',
        operation: 'getNextAvailableCredential'
      });
      return null;
    }

    // Return the first one (highest priority)
    const credential = available[0];
    logger.info(`Selected credential: ${credential.provider}/${credential.name} (priority: ${credential.priority})`, {
      component: 'AICredentialService',
      operation: 'getNextAvailableCredential'
    });

    return credential;
  }

  /**
   * Get credentials for a specific provider
   */
  static getCredentialsForProvider(
    credentials: AIProviderCredential[],
    provider: string
  ): AIProviderCredential[] {
    return credentials
      .filter(cred => cred.provider === provider && cred.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Record successful API call
   * Clears any cooldown for this credential
   */
  static recordSuccess(credentialId: string): void {
    // Clear cooldown on success
    credentialCooldowns.delete(credentialId);

    logger.info(`✅ Recorded success for credential: ${credentialId}`, {
      component: 'AICredentialService',
      operation: 'recordSuccess'
    });
  }

  /**
   * Record failed API call
   * Implements cooldown logic: retry once after 30s, then skip
   */
  static recordError(credentialId: string, error: string): void {
    const cooldown = credentialCooldowns.get(credentialId);
    const now = Date.now();

    if (!cooldown) {
      // First failure - set cooldown for retry
      credentialCooldowns.set(credentialId, {
        until: now + RETRY_DELAY_MS,
        retryCount: 1
      });

      logger.warn(`❌ Credential ${credentialId} failed (will retry in 30s): ${error}`, {
        component: 'AICredentialService',
        operation: 'recordError'
      });
    } else if (cooldown.retryCount < MAX_RETRIES_BEFORE_SKIP) {
      // Within retry limit - extend cooldown
      cooldown.until = now + RETRY_DELAY_MS;
      cooldown.retryCount++;

      logger.warn(`❌ Credential ${credentialId} failed again (retry ${cooldown.retryCount}/${MAX_RETRIES_BEFORE_SKIP}): ${error}`, {
        component: 'AICredentialService',
        operation: 'recordError'
      });
    } else {
      // Exceeded retries - skip this credential (extend cooldown significantly)
      cooldown.until = now + (RETRY_DELAY_MS * 10); // 5 minutes
      cooldown.retryCount++;

      logger.error(`❌ Credential ${credentialId} failed ${cooldown.retryCount} times - skipping for 5 minutes: ${error}`, {
        component: 'AICredentialService',
        operation: 'recordError'
      });
    }
  }

  /**
   * Clear all cooldowns (useful for testing or manual reset)
   */
  static clearCooldowns(): void {
    credentialCooldowns.clear();
    logger.info('Cleared all credential cooldowns', {
      component: 'AICredentialService',
      operation: 'clearCooldowns'
    });
  }

  /**
   * Get cooldown status for a credential
   */
  static getCooldownStatus(credentialId: string): {
    inCooldown: boolean;
    until?: Date;
    retryCount?: number;
  } {
    const cooldown = credentialCooldowns.get(credentialId);
    if (!cooldown) {
      return { inCooldown: false };
    }

    const now = Date.now();
    if (now >= cooldown.until) {
      credentialCooldowns.delete(credentialId);
      return { inCooldown: false };
    }

    return {
      inCooldown: true,
      until: new Date(cooldown.until),
      retryCount: cooldown.retryCount
    };
  }

  /**
   * Validate API key format for a provider
   */
  static validateApiKeyFormat(
    provider: 'openai' | 'gemini' | 'anthropic',
    apiKey: string
  ): { valid: boolean; error?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: 'API key cannot be empty' };
    }

    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API keys must start with "sk-"' };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: 'OpenAI API key is too short' };
        }
        break;

      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, error: 'Anthropic API keys must start with "sk-ant-"' };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: 'Anthropic API key is too short' };
        }
        break;

      case 'gemini':
        if (apiKey.length < 10) {
          return { valid: false, error: 'Gemini API key is too short' };
        }
        break;

      default:
        return { valid: false, error: `Unknown provider: ${provider}` };
    }

    return { valid: true };
  }

  /**
   * Generate a default name for a credential
   */
  static generateDefaultName(
    provider: string,
    existingCredentials: AIProviderCredential[]
  ): string {
    const providerCredentials = existingCredentials.filter(c => c.provider === provider);
    const count = providerCredentials.length + 1;

    const providerNames: Record<string, string> = {
      openai: 'OpenAI',
      gemini: 'Gemini',
      anthropic: 'Anthropic'
    };

    return `${providerNames[provider] || provider} Key ${count}`;
  }

  /**
   * Calculate next priority for a new credential
   */
  static getNextPriority(existingCredentials: AIProviderCredential[]): number {
    if (existingCredentials.length === 0) return 0;

    const maxPriority = Math.max(...existingCredentials.map(c => c.priority));
    return maxPriority + 1;
  }
}
