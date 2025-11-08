/**
 * AI Credential Handlers
 * Manages AI provider credentials with encryption and validation
 */

import { ipcMain, safeStorage } from 'electron';
import { logger, AICredentialService, type AIProviderCredential, type AIProviderCredentialInput } from '@serenity/core';
import { sqliteService, type AIProviderCredentialRow } from '@serenity/database';

/**
 * Register all AI credential IPC handlers
 */
export function registerAICredentialHandlers(): void {
  logger.info('🔐 Registering AI credential handlers...', {
    component: 'aiCredentialHandlers',
    operation: 'registeringHandlers'
  });

  // List all credentials
  ipcMain.handle('ai-credentials:list', async (_event, enabledOnly: boolean = false) => {
    try {
      await sqliteService.initialize();
      const rows = await sqliteService.ai!.listCredentials(enabledOnly);

      // Convert DB rows to credential objects (without encrypted keys)
      const credentials: AIProviderCredential[] = rows.map((row: AIProviderCredentialRow) => ({
        id: row.id,
        provider: row.provider as any,
        name: row.name,
        modelPreference: row.model_preference || undefined,
        enabled: row.enabled === 1,
        priority: row.priority,
        lastUsedAt: row.last_used_at || undefined,
        totalRequests: row.total_requests,
        totalTokens: row.total_tokens,
        successCount: row.success_count,
        errorCount: row.error_count,
        lastError: row.last_error || undefined,
        lastErrorAt: row.last_error_at || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      logger.info(`✅ Listed ${credentials.length} credentials`, {
        component: 'aiCredentialHandlers',
        operation: 'listCredentials'
      });

      return { success: true, credentials };
    } catch (error: any) {
      logger.error('❌ Failed to list credentials:', {
        component: 'aiCredentialHandlers',
        operation: 'listCredentials'
      }, error);
      return { success: false, error: error.message };
    }
  });

  // Add new credential
  ipcMain.handle('ai-credentials:add', async (_event, input: AIProviderCredentialInput) => {
    try {
      // Validate API key format
      const validation = AICredentialService.validateApiKeyFormat(input.provider, input.apiKey);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Test API key with provider (this will be implemented in analyze-data handler updates)
      const testResult = await testApiKeyWithProvider(input.provider, input.apiKey);
      if (!testResult.valid) {
        return { success: false, error: testResult.error || 'API key validation failed' };
      }

      // Encrypt API key
      if (!safeStorage.isEncryptionAvailable()) {
        return { success: false, error: 'Encryption not available on this system' };
      }

      const apiKeyEncrypted = safeStorage.encryptString(input.apiKey).toString('base64');

      // Generate ID and defaults
      await sqliteService.initialize();
      const existingCredentials: AIProviderCredential[] = (await sqliteService.ai!.listCredentials()).map((row: AIProviderCredentialRow) => ({
        id: row.id,
        provider: row.provider as any,
        name: row.name,
        modelPreference: row.model_preference || undefined,
        enabled: row.enabled === 1,
        priority: row.priority,
        totalRequests: row.total_requests,
        totalTokens: row.total_tokens,
        successCount: row.success_count,
        errorCount: row.error_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      const id = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const priority = input.priority !== undefined
        ? input.priority
        : AICredentialService.getNextPriority(existingCredentials);

      // Create credential in database
      await sqliteService.ai!.createCredential({
        id,
        provider: input.provider,
        name: input.name,
        apiKeyEncrypted,
        modelPreference: input.modelPreference || testResult.modelInfo?.model,
        priority,
        metadata: {
          modelInfo: testResult.modelInfo
        }
      });

      // Return credential (without encrypted key)
      const credential: AIProviderCredential = {
        id,
        provider: input.provider,
        name: input.name,
        modelPreference: input.modelPreference || testResult.modelInfo?.model,
        enabled: true,
        priority,
        totalRequests: 0,
        totalTokens: 0,
        successCount: 0,
        errorCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logger.info(`✅ Added credential: ${input.provider}/${input.name}`, {
        component: 'aiCredentialHandlers',
        operation: 'addCredential'
      });

      return { success: true, credential };
    } catch (error: any) {
      logger.error('❌ Failed to add credential:', {
        component: 'aiCredentialHandlers',
        operation: 'addCredential'
      }, error);
      return { success: false, error: error.message };
    }
  });

  // Update credential
  ipcMain.handle('ai-credentials:update', async (_event, id: string, updates: {
    name?: string;
    modelPreference?: string;
    enabled?: boolean;
    priority?: number;
  }) => {
    try {
      await sqliteService.initialize();
      await sqliteService.ai!.updateCredential(id, {
        name: updates.name,
        modelPreference: updates.modelPreference,
        enabled: updates.enabled,
        priority: updates.priority
      });

      logger.info(`✅ Updated credential: ${id}`, {
        component: 'aiCredentialHandlers',
        operation: 'updateCredential'
      });

      return { success: true };
    } catch (error: any) {
      logger.error('❌ Failed to update credential:', {
        component: 'aiCredentialHandlers',
        operation: 'updateCredential'
      }, error);
      return { success: false, error: error.message };
    }
  });

  // Delete credential
  ipcMain.handle('ai-credentials:delete', async (_event, id: string) => {
    try {
      await sqliteService.initialize();
      const deleted = await sqliteService.ai!.deleteCredential(id);

      if (!deleted) {
        return { success: false, error: 'Credential not found' };
      }

      logger.info(`✅ Deleted credential: ${id}`, {
        component: 'aiCredentialHandlers',
        operation: 'deleteCredential'
      });

      return { success: true };
    } catch (error: any) {
      logger.error('❌ Failed to delete credential:', {
        component: 'aiCredentialHandlers',
        operation: 'deleteCredential'
      }, error);
      return { success: false, error: error.message };
    }
  });

  // Test new credential (before saving)
  ipcMain.handle('ai-credentials:test-new', async (_event, provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => {
    try {
      const testResult = await testApiKeyWithProvider(provider, apiKey);

      if (!testResult.valid) {
        return { valid: false, error: testResult.error };
      }

      logger.info(`✅ Tested new ${provider} credential - Valid`, {
        component: 'aiCredentialHandlers',
        operation: 'testNewCredential'
      });

      return { valid: true, modelInfo: testResult.modelInfo };
    } catch (error: any) {
      logger.error('❌ Failed to test new credential:', {
        component: 'aiCredentialHandlers',
        operation: 'testNewCredential'
      }, error);
      return { valid: false, error: error.message };
    }
  });

  // Test credential
  ipcMain.handle('ai-credentials:test', async (_event, id: string) => {
    try {
      await sqliteService.initialize();
      const row = await sqliteService.ai!.getCredentialById(id);

      if (!row) {
        return { success: false, error: 'Credential not found' };
      }

      // Decrypt API key
      const apiKeyBuffer = Buffer.from(row.api_key_encrypted, 'base64');
      const apiKey = safeStorage.decryptString(apiKeyBuffer);

      // Test with provider
      const testResult = await testApiKeyWithProvider(row.provider as any, apiKey);

      if (!testResult.valid) {
        return { success: false, error: testResult.error };
      }

      logger.info(`✅ Tested credential: ${id} - Valid`, {
        component: 'aiCredentialHandlers',
        operation: 'testCredential'
      });

      return { success: true, modelInfo: testResult.modelInfo };
    } catch (error: any) {
      logger.error('❌ Failed to test credential:', {
        component: 'aiCredentialHandlers',
        operation: 'testCredential'
      }, error);
      return { success: false, error: error.message };
    }
  });

  // Reorder credentials (bulk priority update)
  ipcMain.handle('ai-credentials:reorder', async (_event, priorities: Array<{ id: string; priority: number }>) => {
    try {
      await sqliteService.initialize();
      await sqliteService.ai!.updateCredentialPriorities(priorities);

      logger.info(`✅ Reordered ${priorities.length} credentials`, {
        component: 'aiCredentialHandlers',
        operation: 'reorderCredentials'
      });

      return { success: true };
    } catch (error: any) {
      logger.error('❌ Failed to reorder credentials:', {
        component: 'aiCredentialHandlers',
        operation: 'reorderCredentials'
      }, error);
      return { success: false, error: error.message };
    }
  });

  logger.info('✅ AI credential handlers registered', {
    component: 'aiCredentialHandlers',
    operation: 'handlersRegistered'
  });
}

/**
 * Test API key with provider
 * Makes a minimal API call to verify the key works
 */
async function testApiKeyWithProvider(
  provider: 'openai' | 'gemini' | 'anthropic',
  apiKey: string
): Promise<{ valid: boolean; error?: string; modelInfo?: any }> {
  try {
    switch (provider) {
      case 'openai':
        return await testOpenAIKey(apiKey);
      case 'gemini':
        return await testGeminiKey(apiKey);
      case 'anthropic':
        return await testAnthropicKey(apiKey);
      default:
        return { valid: false, error: `Unknown provider: ${provider}` };
    }
  } catch (error: any) {
    logger.error(`❌ API key test failed for ${provider}:`, {
      component: 'aiCredentialHandlers',
      operation: 'testApiKeyWith'
    }, error);
    return { valid: false, error: error.message };
  }
}

/**
 * Test OpenAI API key
 */
async function testOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string; modelInfo?: any }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error: any = await response.json();
      return { valid: false, error: error.error?.message || 'Invalid API key' };
    }

    const data: any = await response.json();
    const availableModels = data.data?.map((m: any) => m.id) || [];

    logger.debug(`Found ${availableModels.length} OpenAI models`, {
      component: 'aiCredentialHandlers',
      operation: 'testOpenAIKey'
    });

    return {
      valid: true,
      modelInfo: {
        model: availableModels[0] || 'gpt-4o-mini', // Use first model as default
        availableModels
      }
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Test Gemini API key
 */
async function testGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string; modelInfo?: any }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (!response.ok) {
      const error: any = await response.json();
      return { valid: false, error: error.error?.message || 'Invalid API key' };
    }

    const data: any = await response.json();
    const availableModels = data.models?.map((m: any) => m.name.replace('models/', '')) || [];

    logger.debug(`Found ${availableModels.length} Gemini models`, {
      component: 'aiCredentialHandlers',
      operation: 'testGeminiKey'
    });

    return {
      valid: true,
      modelInfo: {
        model: availableModels[0] || 'gemini-1.5-flash', // Use first model as default
        availableModels
      }
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Test Anthropic API key
 */
async function testAnthropicKey(apiKey: string): Promise<{ valid: boolean; error?: string; modelInfo?: any }> {
  try {
    // Try to fetch models list from Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If models endpoint doesn't exist, fall back to testing with a minimal message
      const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (!testResponse.ok) {
        const error: any = await testResponse.json();
        return { valid: false, error: error.error?.message || 'Invalid API key' };
      }

      // Key is valid but no models endpoint - return empty list
      logger.debug('Anthropic models endpoint not available, using minimal validation', {
        component: 'aiCredentialHandlers',
        operation: 'testAnthropicKey'
      });

      return {
        valid: true,
        modelInfo: {
          model: 'claude-3-5-sonnet-20241022',
          availableModels: [] // Let user manually specify model
        }
      };
    }

    const data: any = await response.json();
    const availableModels = data.data?.map((m: any) => m.id || m.name) || [];

    logger.debug(`Found ${availableModels.length} Anthropic models`, {
      component: 'aiCredentialHandlers',
      operation: 'testAnthropicKey'
    });

    return {
      valid: true,
      modelInfo: {
        model: availableModels[0] || 'claude-3-5-sonnet-20241022', // Use first model as default
        availableModels
      }
    };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get decrypted API key for a credential
 * Internal helper for analyze-data handler
 */
export async function getDecryptedApiKey(credentialId: string): Promise<string | null> {
  try {
    await sqliteService.initialize();
    const row = await sqliteService.ai!.getCredentialById(credentialId);

    if (!row) {
      logger.error(`Credential not found: ${credentialId}`, {
        component: 'aiCredentialHandlers',
        operation: 'getDecryptedApiKey'
      });
      return null;
    }

    const apiKeyBuffer = Buffer.from(row.api_key_encrypted, 'base64');
    return safeStorage.decryptString(apiKeyBuffer);
  } catch (error: any) {
    logger.error(`Failed to decrypt API key for ${credentialId}:`, {
      component: 'aiCredentialHandlers',
      operation: 'getDecryptedApiKey'
    }, error);
    return null;
  }
}
