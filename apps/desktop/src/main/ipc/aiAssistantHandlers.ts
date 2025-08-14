/**
 * AI Assistant IPC Handlers
 * Handles secure AI API communication from the main process
 */

import { ipcMain, safeStorage, app } from 'electron';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

interface AIApiKeyStorage {
  openai?: string;
  gemini?: string;
  anthropic?: string;
}

interface AIModelInfo {
  openai?: { model: string; version: string };
  gemini?: { model: string; version: string };
  anthropic?: { model: string; version: string };
}

interface AISettings {
  activeProvider?: 'openai' | 'gemini' | 'anthropic';
  autoAnalyze: boolean;
  analysisFrequency: 'daily' | 'weekly' | 'manual';
  dataTypes: {
    includeTasks: boolean;
    includeJournal: boolean;
    includeProjects: boolean;
  };
  preferredModels?: {
    openai?: string;
    gemini?: string;
    anthropic?: string;
  };
}

// In-memory guard to avoid repeated identical saves causing loops
let lastSavedSettingsSignature: string | null = null;
let lastSavedAtMs = 0;

// Runtime validation schemas
const ProviderSchema = z.enum(['openai', 'gemini', 'anthropic']);
const AISettingsSchema = z.object({
  activeProvider: ProviderSchema.optional(),
  autoAnalyze: z.boolean(),
  analysisFrequency: z.enum(['daily', 'weekly', 'manual']),
  dataTypes: z.object({
    includeTasks: z.boolean(),
    includeJournal: z.boolean(),
    includeProjects: z.boolean(),
  }),
  preferredModels: z
    .object({
      openai: z.string().optional(),
      gemini: z.string().optional(),
      anthropic: z.string().optional(),
    })
    .optional(),
});

const AnalyzeOptionsSchema = z.object({
  provider: ProviderSchema,
  dataTypes: z.array(z.string()),
  forceReAnalyze: z.boolean().optional(),
  tasks: z.array(z.any()).optional(),
  journalEntries: z.array(z.any()).optional(),
  analysisTracker: z.any().optional(),
});

const RecapOptionsSchema = z.object({
  provider: ProviderSchema,
  type: z.enum(['weekly', 'monthly']),
  period: z.object({ start: z.string(), end: z.string() }),
  tasks: z.array(z.any()).optional(),
  journalEntries: z.array(z.any()).optional(),
});

// In-memory storage for API keys (encrypted)
let encryptedApiKeys: Buffer | null = null;
let encryptedModelInfo: Buffer | null = null;

// File paths for persistent storage
const getApiKeysFilePath = () => path.join(app.getPath('userData'), 'ai-keys.enc');
const getModelInfoFilePath = () => path.join(app.getPath('userData'), 'ai-models.enc');
const getSettingsFilePath = () => path.join(app.getPath('userData'), 'ai-settings.json');

/**
 * Load encrypted API keys from persistent storage
 */
function loadApiKeysFromDisk(): void {
  try {
    const filePath = getApiKeysFilePath();
    if (fs.existsSync(filePath)) {
      encryptedApiKeys = fs.readFileSync(filePath);
      console.log('🔐 Loaded encrypted API keys from disk');
    }
  } catch (error) {
    console.error('❌ Failed to load API keys from disk:', error);
    encryptedApiKeys = null;
  }
}

/**
 * Encrypt and store API keys securely (both memory and disk)
 */
function storeApiKeys(keys: AIApiKeyStorage): void {
  try {
    const keysJson = JSON.stringify(keys);
    encryptedApiKeys = safeStorage.encryptString(keysJson);
    
    // Save to persistent storage
    const filePath = getApiKeysFilePath();
    fs.writeFileSync(filePath, encryptedApiKeys);
    
    console.log('🔐 AI API keys encrypted and stored securely to disk');
  } catch (error) {
    console.error('❌ Failed to encrypt and save AI API keys:', error);
    throw new Error('Failed to secure API keys');
  }
}

/**
 * Decrypt and retrieve API keys
 */
function getApiKeys(): AIApiKeyStorage {
  try {
    // Load from disk if not in memory
    if (!encryptedApiKeys) {
      loadApiKeysFromDisk();
    }
    
    if (!encryptedApiKeys) {
      return {};
    }
    
    const keysJson = safeStorage.decryptString(encryptedApiKeys);
    return JSON.parse(keysJson);
  } catch (error) {
    console.error('❌ Failed to decrypt AI API keys:', error);
    return {};
  }
}

/**
 * Load encrypted model info from persistent storage
 */
function loadModelInfoFromDisk(): void {
  try {
    const filePath = getModelInfoFilePath();
    if (fs.existsSync(filePath)) {
      encryptedModelInfo = fs.readFileSync(filePath);
      console.log('🔐 Loaded encrypted model info from disk');
    }
  } catch (error) {
    console.error('❌ Failed to load model info from disk:', error);
    encryptedModelInfo = null;
  }
}

/**
 * Encrypt and store model info securely (both memory and disk)
 */
function storeModelInfo(info: AIModelInfo): void {
  try {
    const infoJson = JSON.stringify(info);
    encryptedModelInfo = safeStorage.encryptString(infoJson);
    
    // Save to persistent storage
    const filePath = getModelInfoFilePath();
    fs.writeFileSync(filePath, encryptedModelInfo);
    
    console.log('🔐 AI model info encrypted and stored securely to disk');
  } catch (error) {
    console.error('❌ Failed to encrypt and save AI model info:', error);
    throw new Error('Failed to secure model info');
  }
}

/**
 * Decrypt and retrieve model info
 */
function getModelInfo(): AIModelInfo {
  try {
    // Load from disk if not in memory
    if (!encryptedModelInfo) {
      loadModelInfoFromDisk();
    }
    
    if (!encryptedModelInfo) {
      return {};
    }
    
    const infoJson = safeStorage.decryptString(encryptedModelInfo);
    return JSON.parse(infoJson);
  } catch (error) {
    console.error('❌ Failed to decrypt AI model info:', error);
    return {};
  }
}

/**
 * Load AI settings from persistent storage
 */
function loadAISettings(): AISettings {
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const settingsJson = fs.readFileSync(filePath, 'utf8');
      const settings = JSON.parse(settingsJson);
      console.log('⚙️ Loaded AI settings from disk');
      return settings;
    }
  } catch (error) {
    console.error('❌ Failed to load AI settings from disk:', error);
  }
  
  // Return default settings
  return {
    autoAnalyze: false,
    analysisFrequency: 'manual',
    dataTypes: {
      includeTasks: true,
      includeJournal: true,
      includeProjects: true,
    },
  };
}

/**
 * Save AI settings to persistent storage
 */
function saveAISettings(settings: AISettings): void {
  try {
    const filePath = getSettingsFilePath();
    const settingsJson = JSON.stringify(settings, null, 2);
    fs.writeFileSync(filePath, settingsJson, 'utf8');
    console.log('⚙️ AI settings saved to disk');
  } catch (error) {
    console.error('❌ Failed to save AI settings to disk:', error);
    throw new Error('Failed to save AI settings');
  }
}

/**
 * Persist AI settings to SQLite secure_settings table
 */
async function persistAISettingsToDatabase(settings: AISettings): Promise<void> {
  try {
    const { sqliteService } = await import('@serenity/database');
    await sqliteService.initialize();
    await sqliteService.executeRawQuery(
      `INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      [
        'ai_settings',
        JSON.stringify(settings),
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    console.log('💾 AI settings saved to database (secure_settings)');
  } catch (error) {
    console.warn('⚠️ Failed to persist AI settings to database:', error);
  }
}

/**
 * Load AI settings from SQLite secure_settings table (if present)
 */
async function loadAISettingsFromDatabase(): Promise<AISettings | null> {
  try {
    const { sqliteService } = await import('@serenity/database');
    await sqliteService.initialize();
    const result = await sqliteService.executeRawQuery(
      `SELECT value FROM secure_settings WHERE key = ? ORDER BY updated_at DESC LIMIT 1`,
      ['ai_settings']
    );
    const row = Array.isArray(result) ? result[0] : (result && (result as any)[0]);
    if (row && (row.value || row["value"])) {
      const value = row.value ?? row["value"];
      const parsed = JSON.parse(value);
      console.log('💾 Loaded AI settings from database');
      return parsed;
    }
  } catch (error) {
    console.warn('⚠️ Failed to load AI settings from database:', error);
  }
  return null;
}

/**
 * Get current AI settings from DB or file (DB preferred)
 */
async function getCurrentAISettings(): Promise<AISettings> {
  const db = await loadAISettingsFromDatabase();
  return db || loadAISettings();
}

/**
 * Utility to choose model for a provider
 */
async function resolveModelForProvider(provider: 'openai' | 'gemini' | 'anthropic', fallbackModel: string): Promise<string> {
  try {
    const settings = await getCurrentAISettings();
    const preferred = settings.preferredModels?.[provider];
    if (preferred && typeof preferred === 'string' && preferred.trim().length > 0) {
      return preferred.trim();
    }
    // Fall back to stored detected model
    const info = getModelInfo();
    const stored = (info as any)[provider]?.model;
    if (stored) return stored;
  } catch {}
  return fallbackModel;
}

/**
 * List available models for a provider using the stored API key
 */
async function verifyModelUsable(provider: 'openai' | 'gemini' | 'anthropic', apiKey: string, model: string): Promise<boolean> {
  try {
    if (provider === 'openai') {
      // Try Chat Completions first
      let r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'test' }], max_tokens: 1, temperature: 0 }),
      });
      if (r.ok) return true;
      // Some newer models are Responses API only; try that as well
      r = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: 'test', max_output_tokens: 1 }),
      });
      return r.ok;
    }
    if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } })
      });
      return r.ok;
    }
    // anthropic
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 1, temperature: 0, messages: [{ role: 'user', content: 'test' }] })
    });
    return r.ok;
  } catch { return false; }
}

// Simple in-memory cache to avoid repeated model discovery (and network loops)
const modelListCache: Record<string, { models: { id: string; label: string; verified: boolean }[]; fetchedAt: number; failUntil?: number }> = {};

// Node/Electron main doesn't have DOM lib types; use broad types to avoid TS errors
async function fetchWithTimeout(input: string | URL, init: { timeoutMs?: number } & Record<string, any> = {}): Promise<any> {
  const { timeoutMs = 8000, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function listAvailableModels(provider: 'openai' | 'gemini' | 'anthropic'): Promise<{ id: string; label: string; verified: boolean }[]> {
  const keys = getApiKeys();
  const apiKey = (keys as any)[provider];
  if (!apiKey) return [];

  // Serve from cache if within 15 minutes
  const cacheKey = provider;
  const now = Date.now();
  const cached = modelListCache[cacheKey];
  if (cached && now - cached.fetchedAt < 15 * 60 * 1000) {
    return cached.models;
  }
  // If previous failure set a cooldown, honor it
  if (cached?.failUntil && now < cached.failUntil) {
    return cached.models || [];
  }

  try {
    switch (provider) {
      case 'openai': {
        const r = await fetchWithTimeout('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeoutMs: 8000,
        });
        if (!r.ok) return [];
        const data = await r.json() as { data?: Array<{ id: string }> };
        const ids = Array.from(new Set((data.data || []).map(m => m.id)));
        const results: { id: string; label: string; verified: boolean }[] = [];
        for (const id of ids) {
          const ok = await verifyModelUsable('openai', apiKey, id);
          // Include all but mark whether verified with our calling flow
          results.push({ id, label: id, verified: ok });
        }
        return results.sort((a,b) => b.id.localeCompare(a.id));
      }
      case 'gemini': {
        const r = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, { timeoutMs: 8000 });
        if (!r.ok) return [];
        const data = await r.json() as { models?: Array<{ name: string; displayName?: string }> };
        const names = Array.from(new Set((data.models || []).map(m => (m.name || '').replace(/^models\//, ''))));
        const results: { id: string; label: string; verified: boolean }[] = [];
        for (const id of names) {
          if (!id) continue;
          const ok = await verifyModelUsable('gemini', apiKey, id);
          results.push({ id, label: id, verified: ok });
        }
        modelListCache[cacheKey] = { models: results, fetchedAt: now };
        return results;
      }
      case 'anthropic': {
        const r = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'anthropic-version': '2023-06-01',
          },
          timeoutMs: 8000,
        });
        if (!r.ok) return [];
        const data = await r.json() as { data?: Array<{ id: string }> };
        const ids = Array.from(new Set((data.data || []).map(m => m.id)));
        const results: { id: string; label: string; verified: boolean }[] = [];
        for (const id of ids) {
          const ok = await verifyModelUsable('anthropic', apiKey, id);
          results.push({ id, label: id, verified: ok });
        }
        modelListCache[cacheKey] = { models: results, fetchedAt: now };
        return results;
      }
      default:
        return [];
    }
  } catch (e) {
    console.warn('Failed to list models for', provider, e);
    // set cooldown to prevent tight retry loops
    const previous = modelListCache[cacheKey]?.models || [];
    modelListCache[cacheKey] = { models: previous, fetchedAt: now, failUntil: now + 2 * 60 * 1000 };
    return previous; // return last known cache (or empty) without failing
  }
}

/**
 * Enhanced API key validation
 */
function validateApiKey(provider: 'openai' | 'gemini' | 'anthropic', apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  const trimmedKey = apiKey.trim();

  switch (provider) {
    case 'openai':
      if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI API keys must start with "sk-"' };
      }
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'OpenAI API key appears to be too short' };
      }
      // OpenAI keys have a specific pattern: sk-[48 characters]
      if (!/^sk-[A-Za-z0-9]{48,}$/.test(trimmedKey)) {
        return { valid: false, error: 'OpenAI API key format appears invalid' };
      }
      break;

    case 'anthropic':
      if (!trimmedKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Anthropic API keys must start with "sk-ant-"' };
      }
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'Anthropic API key appears to be too short' };
      }
      // Anthropic keys: sk-ant-[base64-like characters]
      if (!/^sk-ant-[A-Za-z0-9\-_]{32,}$/.test(trimmedKey)) {
        return { valid: false, error: 'Anthropic API key format appears invalid' };
      }
      break;

    case 'gemini':
      if (trimmedKey.length < 10) {
        return { valid: false, error: 'Google Gemini API key appears to be too short' };
      }
      // Gemini keys are typically 39 characters of alphanumeric + underscores/hyphens
      if (!/^[A-Za-z0-9\-_]{20,50}$/.test(trimmedKey)) {
        return { valid: false, error: 'Google Gemini API key format appears invalid' };
      }
      break;

    default:
      return { valid: false, error: `Unsupported provider: ${provider}` };
  }

  return { valid: true };
}

/**
 * Check if API key has proper permissions by making a minimal test call
 */
async function validateApiKeyPermissions(provider: 'openai' | 'gemini' | 'anthropic', apiKey: string): Promise<{ valid: boolean; error?: string; modelInfo?: { model: string; version: string } }> {
  try {
    const testMessages = {
      openai: 'Respond with only: {"test": "success"}',
      gemini: 'Respond with only: {"test": "success"}',
      anthropic: 'Respond with only: {"test": "success"}'
    };

    let response: Response;
    
    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: testMessages.openai }],
            max_tokens: 10,
            temperature: 0,
          }),
        });
        break;

      case 'gemini':
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testMessages.gemini }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0 },
          }),
        });
        break;

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 10,
            temperature: 0,
            messages: [{ role: 'user', content: testMessages.anthropic }],
          }),
        });
        break;

      default:
        return { valid: false, error: `Unsupported provider: ${provider}` };
    }

    if (response.ok) {
      // For OpenAI, detect best available chat model by probing a short list
      if (provider === 'openai') {
        const preferredModels = [
          'gpt-4o-mini',
          'gpt-4o',
          'gpt-4.1-mini',
          'gpt-4.1',
          'gpt-3.5-turbo'
        ];

        for (const modelName of preferredModels) {
          try {
            const r = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1,
                temperature: 0,
              }),
            });
            if (r.ok) {
              const versionName =
                modelName.includes('4o-mini') ? 'GPT-4o mini' :
                modelName === 'gpt-4o' ? 'GPT-4o' :
                modelName.includes('4.1-mini') ? 'GPT-4.1 mini' :
                modelName === 'gpt-4.1' ? 'GPT-4.1' :
                'GPT-3.5 Turbo';

              return { valid: true, modelInfo: { model: modelName, version: versionName } };
            }
          } catch (_) {
            continue;
          }
        }
        // Fallback
        return { valid: true, modelInfo: { model: 'gpt-4o-mini', version: 'GPT-4o mini (fallback)' } };
      }

      // For Gemini, detect available models and return the best one
      if (provider === 'gemini') {
        // Prefer dynamic discovery from the models endpoint to avoid stale names
        try {
          const list = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (list.ok) {
            const data = await list.json() as { models?: Array<{ name: string }> };
            const names = (data.models || [])
              .map(m => (m.name || '').replace(/^models\//, ''))
              .filter(Boolean);
            // Score models to prioritize 2.5 flash/pro (latest first), then 2.0, then 1.5
            const score = (id: string) => {
              let s = 0;
              if (/-latest$/.test(id)) s += 5;
              if (id.includes('2.5')) s += 50;
              else if (id.includes('2.0')) s += 30;
              else if (id.includes('1.5')) s += 10;
              if (id.includes('flash')) s += 3;
              if (id.includes('pro')) s += 2;
              if (id.includes('exp')) s -= 1; // prefer non-exp if both exist
              return s;
            };
            const candidates = Array.from(new Set(names))
              .filter(id => id.startsWith('gemini-'))
              .sort((a, b) => score(b) - score(a));

            for (const modelName of candidates) {
              try {
                const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: 'test' }] }],
                    generationConfig: { maxOutputTokens: 1, temperature: 0 },
                  }),
                });
                if (testResponse.ok) {
                  const versionName = modelName.includes('2.5')
                    ? (modelName.includes('flash') ? '2.5 Flash' : modelName.includes('pro') ? '2.5 Pro' : '2.5')
                    : modelName.includes('2.0')
                      ? (modelName.includes('flash') ? '2.0 Flash' : '2.0')
                      : modelName.includes('1.5')
                        ? (modelName.includes('flash') ? '1.5 Flash' : modelName.includes('pro') ? '1.5 Pro' : '1.5')
                        : modelName;
                  console.log(`🔍 Detected working Gemini model: ${modelName} (${versionName})`);
                  return { valid: true, modelInfo: { model: modelName, version: versionName } };
                }
              } catch {}
            }
          }
        } catch {}

        // As a fallback, try a small prioritized static list including '-latest' variants
        const fallbackModels = [
          'gemini-2.5-flash-latest', 'gemini-2.5-flash',
          'gemini-2.5-pro-latest', 'gemini-2.5-pro',
          'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'
        ];
        for (const modelName of fallbackModels) {
          try {
            const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: 'test' }] }], generationConfig: { maxOutputTokens: 1, temperature: 0 } })
            });
            if (testResponse.ok) {
              const versionName = modelName.includes('2.5')
                ? (modelName.includes('flash') ? '2.5 Flash' : modelName.includes('pro') ? '2.5 Pro' : '2.5')
                : modelName.includes('2.0')
                  ? (modelName.includes('flash') ? '2.0 Flash' : '2.0')
                  : modelName.includes('1.5')
                    ? (modelName.includes('flash') ? '1.5 Flash' : modelName.includes('pro') ? '1.5 Pro' : '1.5')
                    : modelName;
              return { valid: true, modelInfo: { model: modelName, version: versionName } };
            }
          } catch {}
        }

        // Fallback
        return { valid: true, modelInfo: { model: 'gemini-2.5-flash', version: '2.5 Flash (fallback)' } };
      }

      // For Anthropic, detect best Claude model by probing a short list
      if (provider === 'anthropic') {
        const preferredModels = [
          'claude-3-5-sonnet-latest',
          'claude-3-5-haiku-latest',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ];

        for (const modelName of preferredModels) {
          try {
            const r = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: modelName,
                max_tokens: 1,
                temperature: 0,
                messages: [{ role: 'user', content: 'test' }],
              }),
            });
            if (r.ok) {
              const versionName =
                modelName.includes('3-5-sonnet') ? 'Claude 3.5 Sonnet' :
                modelName.includes('3-5-haiku') ? 'Claude 3.5 Haiku' :
                modelName.includes('opus') ? 'Claude 3 Opus' :
                modelName.includes('sonnet') ? 'Claude 3 Sonnet' :
                'Claude 3 Haiku';

              return { valid: true, modelInfo: { model: modelName, version: versionName } };
            }
          } catch (_) {
            continue;
          }
        }
        // Fallback
        return { valid: true, modelInfo: { model: 'claude-3-5-sonnet-latest', version: 'Claude 3.5 Sonnet (fallback)' } };
      }

      return { valid: true };
    } else {
      const errorData = await response.json().catch(() => ({})) as any;
      const errorMessage = errorData.error?.message || errorData.error?.type || `HTTP ${response.status}`;
      
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key or insufficient permissions' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded - key is valid but quota reached' };
      } else {
        return { valid: false, error: `API error: ${errorMessage}` };
      }
    }
  } catch (error) {
    return { 
      valid: false, 
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Make API request to OpenAI
 */
async function callOpenAI(apiKey: string, prompt: string): Promise<any> {
  try {
    const modelName = await resolveModelForProvider('openai', 'gpt-4o-mini');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a productivity and well-being assistant. Analyze user data and provide helpful, actionable insights in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as any;
    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
    };
  } catch (error) {
    console.error('❌ OpenAI API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OpenAI API call failed',
    };
  }
}

/**
 * Normalize provider-specific usage objects to a common shape
 */
function normalizeUsage(raw: any): { promptTokens: number; completionTokens: number; totalTokens: number } {
  try {
    if (!raw) return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    // OpenAI: { prompt_tokens, completion_tokens, total_tokens }
    if (typeof raw.prompt_tokens === 'number' || typeof raw.completion_tokens === 'number' || typeof raw.total_tokens === 'number') {
      const prompt = Number(raw.prompt_tokens || 0);
      const completion = Number(raw.completion_tokens || 0);
      const total = Number(raw.total_tokens || prompt + completion);
      return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
    }
    // Anthropic: { input_tokens, output_tokens }
    if (typeof raw.input_tokens === 'number' || typeof raw.output_tokens === 'number') {
      const prompt = Number(raw.input_tokens || 0);
      const completion = Number(raw.output_tokens || 0);
      const total = prompt + completion;
      return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
    }
    // Already normalized
    if (typeof raw.promptTokens === 'number' || typeof raw.completionTokens === 'number' || typeof raw.totalTokens === 'number') {
      const prompt = Number(raw.promptTokens || 0);
      const completion = Number(raw.completionTokens || 0);
      const total = Number(raw.totalTokens || prompt + completion);
      return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
    }
  } catch {}
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

/**
 * Make API request to Google Gemini
 */
async function callGemini(apiKey: string, prompt: string): Promise<any> {
  try {
    // For production calls, we'll use the stored model info or fall back to gemini-2.5-flash
    // We don't want to detect on every call to avoid extra API requests
    const modelInfo = getModelInfo();
    const geminiModelInfo = modelInfo.gemini;
    const detected = geminiModelInfo ? geminiModelInfo.model : 'gemini-2.5-flash';
    const modelName = await resolveModelForProvider('gemini', detected);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a productivity and well-being assistant. Analyze user data and provide helpful, actionable insights in JSON format.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      success: true,
      content,
      usage: {
        promptTokens: 0, // Gemini doesn't provide detailed usage stats
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  } catch (error) {
    console.error('❌ Gemini API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gemini API call failed',
    };
  }
}

/**
 * Make API request to Anthropic Claude
 */
async function callAnthropic(apiKey: string, prompt: string): Promise<any> {
  try {
    const modelName = await resolveModelForProvider('anthropic', 'claude-3-5-sonnet-latest');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 1500,
        temperature: 0.7,
        system: 'You are a productivity and well-being assistant. Analyze user data and provide helpful, actionable insights in JSON format.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text || '';
    
    return {
      success: true,
      content,
      usage: data.usage || {
        input_tokens: 0,
        output_tokens: 0,
      },
    };
  } catch (error) {
    console.error('❌ Anthropic API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anthropic API call failed',
    };
  }
}

/**
 * Make API call to the specified provider
 */
async function makeAIApiCall(provider: 'openai' | 'gemini' | 'anthropic', prompt: string): Promise<any> {
  const apiKeys = getApiKeys();
  const apiKey = apiKeys[provider];

  if (!apiKey) {
    return {
      success: false,
      error: `No API key found for ${provider}`,
    };
  }

  console.log(`🤖 Making ${provider} API call...`);

  switch (provider) {
    case 'openai':
      return await callOpenAI(apiKey, prompt);
    case 'gemini':
      return await callGemini(apiKey, prompt);
    case 'anthropic':
      return await callAnthropic(apiKey, prompt);
    default:
      return {
        success: false,
        error: `Unsupported AI provider: ${provider}`,
      };
  }
}

/**
 * Register AI Assistant IPC handlers
 */
export function registerAIAssistantHandlers(): void {
  console.log('🧠 Registering AI Assistant IPC handlers...');

  // Set API Key
  ipcMain.handle('ai-assistant:set-api-key', async (event, provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => {
    try {
      const p = ProviderSchema.safeParse(provider);
      if (!p.success) {
        return { success: false, error: 'Invalid provider' };
      }
      if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        return { success: false, error: 'API key must be a non-empty string' };
      }
      console.log(`🔑 Setting API key for ${provider}...`);
      
      // Enhanced format validation
      const formatValidation = validateApiKey(provider, apiKey);
      if (!formatValidation.valid) {
        return { success: false, error: formatValidation.error };
      }

      const trimmedKey = apiKey.trim();

      // Test API key permissions
      console.log(`🧪 Testing API key permissions for ${provider}...`);
      const permissionValidation = await validateApiKeyPermissions(provider, trimmedKey);
      if (!permissionValidation.valid) {
        return { success: false, error: permissionValidation.error };
      }

      // Get existing keys and update
      const existingKeys = getApiKeys();
      existingKeys[provider] = trimmedKey;
      
      // Store encrypted
      storeApiKeys(existingKeys);

      // Ensure active provider is persisted (renderer may also do this, but we persist here for reliability)
      try {
        const current = await getCurrentAISettings();
        const updated: AISettings = {
          ...current,
          activeProvider: provider,
        };
        saveAISettings(updated);
        await persistAISettingsToDatabase(updated);
        console.log('⚙️ Active provider persisted during set-api-key:', provider);
      } catch (e) {
        console.warn('⚠️ Failed to persist activeProvider during set-api-key:', e);
      }

      // Store model info if detected for any provider
      if (permissionValidation.modelInfo) {
        const existingModelInfo = getModelInfo();
        existingModelInfo[provider] = permissionValidation.modelInfo;
        storeModelInfo(existingModelInfo);
        console.log(`🔍 Detected ${provider} model: ${permissionValidation.modelInfo.version}`);
        // Make a tiny usage-capturing call to surface token usage on setup
        const testPrompt = 'Respond with only: {"setup":"ok"}';
        const testResult = await makeAIApiCall(provider, testPrompt);
        console.log('📊 Setup usage (with model info):', testResult.usage);
        console.log(`✅ API key for ${provider} set and validated successfully`);
        return { success: true, modelInfo: permissionValidation.modelInfo, usage: normalizeUsage(testResult.usage) };
      }

      // Even if no model info, still do a tiny usage-capturing call
      const testPrompt = 'Respond with only: {"setup":"ok"}';
      const testResult = await makeAIApiCall(provider, testPrompt);
      console.log('📊 Setup usage (no model info):', testResult.usage);
      console.log(`✅ API key for ${provider} set and validated successfully`);
      return { success: true, usage: normalizeUsage(testResult.usage) };
    } catch (error) {
      console.error(`❌ Failed to set API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set API key' 
      };
    }
  });

  // Test API Key
  ipcMain.handle('ai-assistant:test-api-key', async (event, provider: 'openai' | 'gemini' | 'anthropic') => {
    try {
      const p = ProviderSchema.safeParse(provider);
      if (!p.success) return { success: false, error: 'Invalid provider' };
      console.log(`🧪 Testing API key for ${provider}...`);
      
      // Make a simple test call
      const testPrompt = 'Say "Hello, this is a test" in JSON format: {"message": "Hello, this is a test"}';
      const result = await makeAIApiCall(provider, testPrompt);

      if (result.success) {
        console.log(`✅ API key for ${provider} is valid`);
        return { success: true };
      } else {
        console.log(`❌ API key for ${provider} test failed:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`❌ API key test failed for ${provider}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API key test failed' 
      };
    }
  });

  // Analyze Data
  ipcMain.handle('ai-assistant:analyze-data', async (event, options: {
    provider: 'openai' | 'gemini' | 'anthropic';
    dataTypes: string[];
    forceReAnalyze?: boolean;
    tasks?: any[];
    journalEntries?: any[];
    analysisTracker?: any;
  }) => {
    try {
      const valid = AnalyzeOptionsSchema.safeParse(options);
      if (!valid.success) {
        return { success: false, error: 'Invalid analyze-data options' };
      }
      console.log(`🔍 Analyzing data with ${options.provider}...`);
      
      // Import AI Assistant Service (use package export to support both CJS and ESM)
      const { AIAssistantService } = await import('@serenity/core');
      
      // Get data from options or fetch from database
      let tasks = options.tasks || [];
      let journalEntries = options.journalEntries || [];
      
      // If no data provided, fetch from database
      if (tasks.length === 0 || journalEntries.length === 0) {
        try {
          if (options.dataTypes.includes('tasks')) {
            const { queryTasksIPC } = await import('./taskHandlers');
            const taskResult = await queryTasksIPC();
            if (taskResult.success) {
              tasks = taskResult.data || [];
              console.log(`📊 Fetched ${tasks.length} tasks from database`);
            }
          }
          
          if (options.dataTypes.includes('journal')) {
            const { queryJournalEntriesIPC } = await import('./journalHandlers');
            const journalResult = await queryJournalEntriesIPC();
            if (journalResult.success) {
              journalEntries = journalResult.data || [];
              console.log(`📝 Fetched ${journalEntries.length} journal entries from database`);
            }
          }
        } catch (dbError) {
          console.warn('⚠️ Failed to fetch data from database:', dbError);
        }
      }
      
      // Filter unanalyzed data if not forcing re-analysis
      let analyzeTasks = tasks;
      let analyzeJournalEntries = journalEntries;
      
      if (!options.forceReAnalyze && options.analysisTracker) {
        console.log(`🔍 Filtering data based on analysis tracker...`);
        const filtered = AIAssistantService.filterUnanalyzedData(
          tasks,
          journalEntries,
          options.analysisTracker
        );
        analyzeTasks = filtered.newTasks;
        analyzeJournalEntries = filtered.newJournalEntries;
        
        console.log(`📊 After filtering: ${analyzeTasks.length} new tasks, ${analyzeJournalEntries.length} new journal entries`);
        console.log(`📈 Previously analyzed: ${options.analysisTracker.totalTasksAnalyzed} tasks, ${options.analysisTracker.totalJournalEntriesAnalyzed} journal entries`);
      } else if (options.forceReAnalyze) {
        console.log(`🔄 Force re-analysis enabled, analyzing all ${tasks.length} tasks and ${journalEntries.length} journal entries`);
      }
      
      // Check if we have data to analyze
      if (analyzeTasks.length === 0 && analyzeJournalEntries.length === 0) {
        console.log(`✅ No new data to analyze - all data has been processed`);
        return {
          success: true,
          insights: [],
          processedData: options.analysisTracker || {},
          message: 'No new data to analyze'
        };
      }
      
      // Preprocess data for AI analysis
      const preprocessedTasks = AIAssistantService.preprocessTasks(analyzeTasks);
      const preprocessedJournalEntries = AIAssistantService.preprocessJournalEntries(analyzeJournalEntries);
      
      // Generate prompts
      const prompts = AIAssistantService.generateInsightPrompts({
        tasks: preprocessedTasks,
        journalEntries: preprocessedJournalEntries,
        dataTypes: options.dataTypes,
      });
      // Instruct providers explicitly to return ONLY JSON to avoid code fences/prose
      Object.keys(prompts).forEach((k) => {
        prompts[k] = `${prompts[k]}\n\nRespond with ONLY valid JSON. Do not include code fences, markdown, or any explanatory text.`;
      });
      
      // Analyze with AI provider
      const allInsights = [];
      let usageTotals = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      
      for (const [promptType, prompt] of Object.entries(prompts)) {
        console.log(`🤖 Running ${promptType} analysis...`);
        const result = await makeAIApiCall(options.provider, prompt);
        
        if (result.success && result.content) {
          // Debug: log raw provider content to aid parsing issues (remove later)
          try { console.error(`[AI][${options.provider}] Raw ${String(promptType)} content:`, result.content); } catch {}
          const insights = AIAssistantService.parseInsightsResponse(result.content);
          // Set correct source provider
          insights.forEach(insight => {
            insight.source = options.provider;
          });
          allInsights.push(...insights);
          console.log(`✅ Generated ${insights.length} insights from ${promptType}`);
          const u = normalizeUsage(result.usage);
          usageTotals.promptTokens += u.promptTokens;
          usageTotals.completionTokens += u.completionTokens;
          usageTotals.totalTokens += u.totalTokens;
        } else {
          try { console.error(`[AI][${options.provider}] ${String(promptType)} call failed. Raw result:`, result); } catch {}
          console.warn(`⚠️ ${promptType} analysis failed:`, result.error);
        }
      }
      
      // Create analysis summary for tracking
      const analysisSummary = AIAssistantService.createAnalysisSummary(
        analyzeTasks,
        analyzeJournalEntries
      );
      
      console.log(`✅ Analysis complete: ${allInsights.length} insights generated`);
      
      return {
        success: true,
        insights: allInsights,
        processedData: analysisSummary,
        usage: usageTotals,
      };
    } catch (error) {
      console.error('❌ Data analysis failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Data analysis failed' 
      };
    }
  });

  // Generate Recap
  ipcMain.handle('ai-assistant:generate-recap', async (event, options: {
    provider: 'openai' | 'gemini' | 'anthropic';
    type: 'weekly' | 'monthly';
    period: { start: string; end: string };
    tasks?: any[];
    journalEntries?: any[];
  }) => {
    try {
      const valid = RecapOptionsSchema.safeParse(options);
      if (!valid.success) return { success: false, error: 'Invalid recap options' };
      console.log(`📝 Generating ${options.type} recap with ${options.provider}...`);
      
      // Import AI Assistant Service (use package export to support both CJS and ESM)
      const { AIAssistantService } = await import('@serenity/core');
      
      // Get data from options or fetch from database
      let tasks = options.tasks || [];
      let journalEntries = options.journalEntries || [];
      
      // If no data provided, fetch from database for the specified period
      if (tasks.length === 0 || journalEntries.length === 0) {
        try {
          // Fetch tasks
          const { queryTasksIPC } = await import('./taskHandlers');
          const taskResult = await queryTasksIPC();
          if (taskResult.success) {
            tasks = (taskResult.data || []).filter((task: any) => {
              const taskDate = new Date(task.createdAt || task.updatedAt);
              const startDate = new Date(options.period.start);
              const endDate = new Date(options.period.end);
              return taskDate >= startDate && taskDate <= endDate;
            });
          }
          
          // Fetch journal entries
          const { queryJournalEntriesIPC } = await import('./journalHandlers');
          const journalResult = await queryJournalEntriesIPC();
          if (journalResult.success) {
            journalEntries = (journalResult.data || []).filter((entry: any) => {
              const entryDate = new Date(entry.createdAt);
              const startDate = new Date(options.period.start);
              const endDate = new Date(options.period.end);
              return entryDate >= startDate && entryDate <= endDate;
            });
          }
        } catch (dbError) {
          console.warn('⚠️ Failed to fetch data from database for recap:', dbError);
        }
      }
      
      // Check if we have data for the period
      if (tasks.length === 0 && journalEntries.length === 0) {
        return {
          success: false,
          error: `No data found for the ${options.type} period from ${options.period.start} to ${options.period.end}`
        };
      }
      
      // Preprocess data for AI analysis
      const preprocessedTasks = AIAssistantService.preprocessTasks(tasks);
      const preprocessedJournalEntries = AIAssistantService.preprocessJournalEntries(journalEntries);
      
      // Generate recap prompt
      const prompt = AIAssistantService.generateRecapPrompts({
        type: options.type,
        period: options.period,
        tasks: preprocessedTasks,
        journalEntries: preprocessedJournalEntries,
      });
      
      // Generate recap with AI provider
      console.log(`🤖 Generating ${options.type} recap with ${options.provider}...`);
      const result = await makeAIApiCall(options.provider, prompt);
      
      if (result.success && result.content) {
        const recap = AIAssistantService.parseRecapResponse(
          result.content,
          options.type,
          options.period
        );
        
        if (recap) {
          // Set correct source provider
          recap.source = options.provider;
          
          console.log(`✅ ${options.type} recap generated successfully`);
          return {
            success: true,
            recap,
            usage: normalizeUsage(result.usage),
          };
        } else {
          console.error('❌ Failed to parse recap response');
          return {
            success: false,
            error: 'Failed to parse AI response for recap'
          };
        }
      } else {
        console.error('❌ AI recap generation failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Recap generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Recap generation failed' 
      };
    }
  });

  // Get AI Settings
  ipcMain.handle('ai-assistant:get-settings', async (event) => {
    try {
      console.log('⚙️ Loading AI Assistant settings...');
      // Prefer DB if present, fallback to file defaults
      const dbSettings = await loadAISettingsFromDatabase();
      const settings = dbSettings || loadAISettings();
      const apiKeys = getApiKeys();
      let modelInfo = getModelInfo();
      console.log('⚙️ get-settings current persisted settings:', settings);
      
      // Check which providers have API keys without exposing the keys
      const providersWithKeys = {
        openai: !!apiKeys.openai,
        gemini: !!apiKeys.gemini,
        anthropic: !!apiKeys.anthropic,
      };

      // Backfill model info if missing but API key exists (runs only on settings load)
      try {
        const providers: Array<'openai' | 'gemini' | 'anthropic'> = ['openai', 'gemini', 'anthropic'];
        for (const p of providers) {
          if (providersWithKeys[p] && (!modelInfo || !modelInfo[p])) {
            const key = (apiKeys as any)[p];
            const r = await validateApiKeyPermissions(p, key as string);
            if (r.valid && r.modelInfo) {
              const existing = getModelInfo();
              existing[p] = r.modelInfo;
              storeModelInfo(existing);
              modelInfo = existing;
              console.log(`🔍 Backfilled ${p} model info: ${r.modelInfo.version}`);
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Model info backfill failed:', e);
      }

      console.log('✅ AI Assistant settings loaded successfully');
      return { 
        success: true, 
        settings: {
          ...settings,
          providersWithKeys,
          modelInfo,
        }
      };
    } catch (error) {
      console.error('❌ Failed to load AI Assistant settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load settings' 
      };
    }
  });

  // Save AI Settings
  ipcMain.handle('ai-assistant:save-settings', async (event, settings: AISettings) => {
    try {
      const valid = AISettingsSchema.safeParse(settings);
      if (!valid.success) return { success: false, error: 'Invalid AI settings' };
      console.log('⚙️ Saving AI Assistant settings...');
      // Merge with currently persisted settings to avoid wiping fields (e.g., activeProvider)
      const current = await getCurrentAISettings();
      const merged: AISettings = {
        ...current,
        ...settings,
      };
      // Loop guard: skip if content unchanged in last 5s
      const signature = JSON.stringify(merged);
      const now = Date.now();
      if (lastSavedSettingsSignature === signature && now - lastSavedAtMs < 5000) {
        return { success: true, skipped: true };
      }
      console.log('⚙️ Merged settings to persist:', merged);
      saveAISettings(merged);
      await persistAISettingsToDatabase(merged);
      lastSavedSettingsSignature = signature;
      lastSavedAtMs = now;
      console.log('✅ AI Assistant settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save AI Assistant settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save settings' 
      };
    }
  });

  // List available models for a provider
  ipcMain.handle('ai-assistant:list-models', async (event, provider: 'openai' | 'gemini' | 'anthropic') => {
    try {
      const p = ProviderSchema.safeParse(provider);
      if (!p.success) return { success: false, error: 'Invalid provider' };
      const list = await listAvailableModels(provider);
      return { success: true, models: list };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list models' };
    }
  });

  // Check if provider has API key
  ipcMain.handle('ai-assistant:has-api-key', async (event, provider: 'openai' | 'gemini' | 'anthropic') => {
    try {
      const p = ProviderSchema.safeParse(provider);
      if (!p.success) return { success: false, error: 'Invalid provider' };
      const apiKeys = getApiKeys();
      const hasKey = !!apiKeys[provider];
      console.log(`🔍 Provider ${provider} has API key: ${hasKey}`);
      return { success: true, hasKey };
    } catch (error) {
      console.error(`❌ Failed to check API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check API key' 
      };
    }
  });

  // Remove API Key
  ipcMain.handle('ai-assistant:remove-api-key', async (event, provider: 'openai' | 'gemini' | 'anthropic') => {
    try {
      const p = ProviderSchema.safeParse(provider);
      if (!p.success) return { success: false, error: 'Invalid provider' };
      console.log(`🗑️ Removing API key for ${provider}...`);
      
      const existingKeys = getApiKeys();
      delete existingKeys[provider];
      storeApiKeys(existingKeys);

      // Also clear stored model info for this provider
      const existingModelInfo = getModelInfo();
      if (existingModelInfo && existingModelInfo[provider]) {
        delete existingModelInfo[provider];
        storeModelInfo(existingModelInfo);
        console.log(`🧹 Cleared stored model info for ${provider}`);
      }

      // If this provider was active, clear selection in settings and persist
      const currentSettings = await getCurrentAISettings();
      if (currentSettings.activeProvider === provider) {
        const updated = { ...currentSettings, activeProvider: undefined };
        saveAISettings(updated);
        await persistAISettingsToDatabase(updated);
        console.log(`🔄 Cleared active provider selection (${provider})`);
      }

      console.log(`✅ API key for ${provider} removed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to remove API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove API key' 
      };
    }
  });

  console.log('✅ AI Assistant IPC handlers registered successfully');
}

/**
 * Unregister AI Assistant IPC handlers
 */
export function unregisterAIAssistantHandlers(): void {
  console.log('🧠 Unregistering AI Assistant IPC handlers...');
  
  ipcMain.removeHandler('ai-assistant:set-api-key');
  ipcMain.removeHandler('ai-assistant:test-api-key');
  ipcMain.removeHandler('ai-assistant:analyze-data');
  ipcMain.removeHandler('ai-assistant:generate-recap');
  ipcMain.removeHandler('ai-assistant:get-settings');
  ipcMain.removeHandler('ai-assistant:save-settings');
  ipcMain.removeHandler('ai-assistant:has-api-key');
  ipcMain.removeHandler('ai-assistant:remove-api-key');
  
  // Clear encrypted keys from memory
  encryptedApiKeys = null;
  encryptedModelInfo = null;
  
  console.log('✅ AI Assistant IPC handlers unregistered');
}
