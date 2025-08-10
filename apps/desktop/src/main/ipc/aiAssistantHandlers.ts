/**
 * AI Assistant IPC Handlers
 * Handles secure AI API communication from the main process
 */

import { ipcMain, safeStorage, app } from 'electron';
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
}

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
      // For Gemini, detect available models and return the best one
      if (provider === 'gemini') {
        // Try to detect which model works by making a test call to different models
        // Order by newest/best models first
        const availableModels = [
          'gemini-2.5-flash', 
          'gemini-2.5-pro', 
          'gemini-2.0-flash-exp', 
          'gemini-1.5-flash', 
          'gemini-1.5-pro'
        ];
        
        for (const modelName of availableModels) {
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
              const versionName = modelName.includes('2.5-flash') ? '2.5 Flash' :
                                  modelName.includes('2.5-pro') ? '2.5 Pro' :
                                  modelName.includes('2.0') ? '2.0 Flash Exp' : 
                                  modelName.includes('1.5-flash') ? '1.5 Flash' :
                                  modelName.includes('1.5-pro') ? '1.5 Pro' : modelName;
              
              console.log(`🔍 Detected working Gemini model: ${modelName} (${versionName})`);
              return { 
                valid: true, 
                modelInfo: { 
                  model: modelName, 
                  version: versionName
                } 
              };
            }
          } catch (e) {
            // Continue to next model
            continue;
          }
        }
        
        // Fallback if no model detection worked
        return { 
          valid: true, 
          modelInfo: { 
            model: 'gemini-2.5-flash', 
            version: '2.5 Flash (fallback)' 
          } 
        };
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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
 * Make API request to Google Gemini
 */
async function callGemini(apiKey: string, prompt: string): Promise<any> {
  try {
    // For production calls, we'll use the stored model info or fall back to gemini-2.5-flash
    // We don't want to detect on every call to avoid extra API requests
    const modelInfo = getModelInfo();
    const geminiModelInfo = modelInfo.gemini;
    const modelName = geminiModelInfo ? geminiModelInfo.model : 'gemini-2.5-flash'; // fallback to newest model
    
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
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

      // Store model info if detected (only for Gemini currently)
      if (provider === 'gemini' && permissionValidation.modelInfo) {
        const existingModelInfo = getModelInfo();
        existingModelInfo[provider] = permissionValidation.modelInfo;
        storeModelInfo(existingModelInfo);
        console.log(`🔍 Detected ${provider} model: ${permissionValidation.modelInfo.version}`);
        
        console.log(`✅ API key for ${provider} set and validated successfully`);
        return { success: true, modelInfo: permissionValidation.modelInfo };
      }

      console.log(`✅ API key for ${provider} set and validated successfully`);
      return { success: true };
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
      console.log(`🔍 Analyzing data with ${options.provider}...`);
      
      // Import AI Assistant Service
      const { AIAssistantService } = await import('@serenity/core/src/services/aiAssistantService');
      
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
      
      // Analyze with AI provider
      const allInsights = [];
      
      for (const [promptType, prompt] of Object.entries(prompts)) {
        console.log(`🤖 Running ${promptType} analysis...`);
        const result = await makeAIApiCall(options.provider, prompt);
        
        if (result.success && result.content) {
          const insights = AIAssistantService.parseInsightsResponse(result.content);
          // Set correct source provider
          insights.forEach(insight => {
            insight.source = options.provider;
          });
          allInsights.push(...insights);
          console.log(`✅ Generated ${insights.length} insights from ${promptType}`);
        } else {
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
      console.log(`📝 Generating ${options.type} recap with ${options.provider}...`);
      
      // Import AI Assistant Service
      const { AIAssistantService } = await import('@serenity/core/src/services/aiAssistantService');
      
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
      const settings = loadAISettings();
      const apiKeys = getApiKeys();
      const modelInfo = getModelInfo();
      
      // Check which providers have API keys without exposing the keys
      const providersWithKeys = {
        openai: !!apiKeys.openai,
        gemini: !!apiKeys.gemini,
        anthropic: !!apiKeys.anthropic,
      };

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
      console.log('⚙️ Saving AI Assistant settings...');
      saveAISettings(settings);
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

  // Check if provider has API key
  ipcMain.handle('ai-assistant:has-api-key', async (event, provider: 'openai' | 'gemini' | 'anthropic') => {
    try {
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
      console.log(`🗑️ Removing API key for ${provider}...`);
      
      const existingKeys = getApiKeys();
      delete existingKeys[provider];
      storeApiKeys(existingKeys);

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