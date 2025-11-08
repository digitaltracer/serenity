/**
 * AI Credential Service
 * Manages AI provider credentials with automatic failover support
 */
export interface AIProviderCredential {
    id: string;
    provider: 'openai' | 'gemini' | 'anthropic';
    name: string;
    modelPreference?: string;
    enabled: boolean;
    priority: number;
    lastUsedAt?: string;
    totalRequests: number;
    totalTokens: number;
    successCount: number;
    errorCount: number;
    lastError?: string;
    lastErrorAt?: string;
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
export declare class AICredentialService {
    /**
     * Get all credentials, sorted by priority
     * Respects cooldown periods for recently failed credentials
     */
    static getAvailableCredentials(credentials: AIProviderCredential[]): AIProviderCredential[];
    /**
     * Get next available credential for failover
     * Skips credentials currently in cooldown
     */
    static getNextAvailableCredential(credentials: AIProviderCredential[]): AIProviderCredential | null;
    /**
     * Get credentials for a specific provider
     */
    static getCredentialsForProvider(credentials: AIProviderCredential[], provider: string): AIProviderCredential[];
    /**
     * Record successful API call
     * Clears any cooldown for this credential
     */
    static recordSuccess(credentialId: string): void;
    /**
     * Record failed API call
     * Implements cooldown logic: retry once after 30s, then skip
     */
    static recordError(credentialId: string, error: string): void;
    /**
     * Clear all cooldowns (useful for testing or manual reset)
     */
    static clearCooldowns(): void;
    /**
     * Get cooldown status for a credential
     */
    static getCooldownStatus(credentialId: string): {
        inCooldown: boolean;
        until?: Date;
        retryCount?: number;
    };
    /**
     * Validate API key format for a provider
     */
    static validateApiKeyFormat(provider: 'openai' | 'gemini' | 'anthropic', apiKey: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Generate a default name for a credential
     */
    static generateDefaultName(provider: string, existingCredentials: AIProviderCredential[]): string;
    /**
     * Calculate next priority for a new credential
     */
    static getNextPriority(existingCredentials: AIProviderCredential[]): number;
}
