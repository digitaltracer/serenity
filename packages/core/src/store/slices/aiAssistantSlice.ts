import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AIAssistantService } from '../../services/aiAssistantService';
import { Task, JournalEntry } from '../../types';
import { logger } from '../../utils/logger';

export interface AIProvider {
  id: 'openai' | 'gemini' | 'anthropic';
  name: string;
  hasApiKey: boolean;
  lastUsed?: string;
  isActive: boolean;
  modelInfo?: {
    model: string;
    version: string;
  };
}

export interface AIInsight {
  id: string;
  type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-1 score
  createdAt: string;
  source: 'openai' | 'gemini' | 'anthropic';
  category: 'tasks' | 'journal' | 'habits' | 'goals';
  actionable?: boolean;
  metadata?: any;
}

export interface AIRecap {
  id: string;
  type: 'weekly' | 'monthly';
  title: string;
  summary: string;
  highlights: string[];
  challenges: string[];
  recommendations: string[];
  period: {
    start: string;
    end: string;
  };
  createdAt: string;
  source: 'openai' | 'gemini' | 'anthropic';
  metadata?: any;
}

export interface AnalysisTracker {
  lastTaskAnalysis?: string;
  lastJournalAnalysis?: string;
  processedTaskIds: string[];
  processedJournalIds: string[];
  totalTasksAnalyzed: number;
  totalJournalEntriesAnalyzed: number;
}

export interface AIUsageEntry {
  id: string;
  timestamp: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  operation: 'analyze' | 'recap';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  note?: string;
}

export interface AIAssistantState {
  // Provider management
  providers: AIProvider[];
  activeProvider?: 'openai' | 'gemini' | 'anthropic';
  
  // Analysis state
  isAnalyzing: boolean;
  analysisProgress: number; // 0-100
  analysisStatus: string;
  lastAnalysis?: string;
  
  // Insights and recommendations
  insights: AIInsight[];
  recaps: AIRecap[];
  
  // Analysis tracking to prevent duplicates
  analysisTracker: AnalysisTracker;
  
  // Configuration
  autoAnalyze: boolean;
  analysisFrequency: 'daily' | 'weekly' | 'manual';
  dataTypes: {
    includeTasks: boolean;
    includeJournal: boolean;
    includeProjects: boolean;
  };
  
  // Error handling
  lastError?: string;
  errors: string[];
  usage: AIUsageEntry[];
}

const loadStoredUsage = (): AIUsageEntry[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('serenity_ai_usage');
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
};

const initialState: AIAssistantState = {
  providers: [
    { id: 'openai', name: 'OpenAI', hasApiKey: false, isActive: false },
    { id: 'gemini', name: 'Google Gemini', hasApiKey: false, isActive: false },
    { id: 'anthropic', name: 'Anthropic Claude', hasApiKey: false, isActive: false },
  ],
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStatus: 'Ready',
  insights: [],
  recaps: [],
  analysisTracker: {
    processedTaskIds: [],
    processedJournalIds: [],
    totalTasksAnalyzed: 0,
    totalJournalEntriesAnalyzed: 0,
  },
  autoAnalyze: false,
  analysisFrequency: 'manual',
  dataTypes: {
    includeTasks: true,
    includeJournal: true,
    includeProjects: true,
  },
  errors: [],
  usage: loadStoredUsage(),
};

// Async thunks for AI operations
export const setApiKey = createAsyncThunk(
  'aiAssistant/setApiKey',
  async ({ provider, apiKey }: { provider: 'openai' | 'gemini' | 'anthropic'; apiKey: string }) => {
    // This will be handled by the main process for security
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.electronAPI?.aiAssistant?.setApiKey) {
      logger.info(`[aiAssistant/setApiKey] Calling main process setApiKey for ${provider}`, { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]CallingMain' });
      const result = await (globalThis as any).window.electronAPI.aiAssistant.setApiKey(provider, apiKey);
      logger.info('[aiAssistant/setApiKey] Main returned', { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]MainReturned', metadata: { result } });
      if (result.success) {
        const payload = { provider, hasKey: true, modelInfo: result.modelInfo, usage: result.usage } as any;
        logger.info('[aiAssistant/setApiKey] Fulfilled payload', { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]FulfilledPayload', metadata: { payload } });
        return payload;
      } else {
        throw new Error(result.error || 'Failed to set API key');
      }
    }
    throw new Error('AI Assistant API not available');
  }
);

export const testApiKey = createAsyncThunk(
  'aiAssistant/testApiKey',
  async (provider: 'openai' | 'gemini' | 'anthropic') => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.electronAPI?.aiAssistant?.testApiKey) {
      const result = await (globalThis as any).window.electronAPI.aiAssistant.testApiKey(provider);
      if (result.success) {
        return { provider, isValid: true };
      } else {
        throw new Error(result.error || 'API key test failed');
      }
    }
    throw new Error('AI Assistant API not available');
  }
);

export const analyzeUserData = createAsyncThunk(
  'aiAssistant/analyzeUserData',
  async ({ 
    provider, 
    dataTypes,
    forceReAnalyze = false,
    tasks,
    journalEntries,
    forceLocal = false,
  }: { 
    provider: 'openai' | 'gemini' | 'anthropic';
    dataTypes: string[];
    forceReAnalyze?: boolean;
    tasks?: any[];
    journalEntries?: any[];
    forceLocal?: boolean;
  }, { getState }) => {
    const state = getState() as { aiAssistant: AIAssistantState };

    // Try Electron-backed analysis first if available
    if (!forceLocal && typeof globalThis !== 'undefined' && (globalThis as any).window?.electronAPI?.aiAssistant?.analyzeData) {
      try {
        const result = await (globalThis as any).window.electronAPI.aiAssistant.analyzeData({
          provider,
          dataTypes,
          forceReAnalyze,
          tasks,
          journalEntries,
          analysisTracker: state.aiAssistant.analysisTracker,
        });

        if (result.success && Array.isArray(result.insights) && result.insights.length > 0) {
          return {
            insights: result.insights,
            processedData: result.processedData || {},
            usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            provider,
            operation: 'analyze' as const,
          };
        }
      } catch (e) {
        // Fall back to local analysis below
      }
    }

    // Fallback: generate local insights so the user sees value without an API
    const safeTasks = (tasks as Task[] | undefined) || [];
    const safeJournal = (journalEntries as JournalEntry[] | undefined) || [];
  const local = AIAssistantService.generateLocalInsights(safeTasks, safeJournal);
  const nowIso = new Date().toISOString();
    const insights = local.map((i, idx) => ({
      id: `local_${Date.now()}_${idx}`,
      type: i.type,
      title: i.title,
      description: i.description,
      confidence: i.confidence,
      createdAt: nowIso,
      source: provider,
      category: i.category,
      actionable: i.actionable,
      metadata: { ...(i.metadata || {}), fallback: true },
    }));
  return {
    insights,
    processedData: {
      processedTaskIds: safeTasks.map(t => t.id),
      processedJournalIds: safeJournal.map(j => j.id),
      lastTaskAnalysis: safeTasks.length > 0 ? nowIso : undefined,
      lastJournalAnalysis: safeJournal.length > 0 ? nowIso : undefined,
      totalTasksAnalyzed: safeTasks.length,
      totalJournalEntriesAnalyzed: safeJournal.length,
    },
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider,
      operation: 'analyze' as const,
    };
  }
);

export const generateRecap = createAsyncThunk(
  'aiAssistant/generateRecap',
  async ({ 
    provider, 
    type, 
    period,
    tasks,
    journalEntries,
  }: { 
    provider: 'openai' | 'gemini' | 'anthropic';
    type: 'weekly' | 'monthly';
    period: { start: string; end: string };
    tasks?: any[];
    journalEntries?: any[];
  }) => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.electronAPI?.aiAssistant?.generateRecap) {
      const result = await (globalThis as any).window.electronAPI.aiAssistant.generateRecap({
        provider,
        type,
        period,
        tasks,
        journalEntries,
      });
      
      if (result.success) {
        return { recap: result.recap, usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, provider, operation: 'recap' as const };
      } else {
        throw new Error(result.error || 'Recap generation failed');
      }
    }
    throw new Error('AI Assistant API not available');
  }
);

const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    setActiveProvider: (state, action: PayloadAction<'openai' | 'gemini' | 'anthropic'>) => {
      state.activeProvider = action.payload;
      // Update provider last used timestamp
      const provider = state.providers.find(p => p.id === action.payload);
      if (provider) {
        provider.lastUsed = new Date().toISOString();
        provider.isActive = true;
      }
      // Deactivate other providers
      state.providers.forEach(p => {
        if (p.id !== action.payload) {
          p.isActive = false;
        }
      });
    },
    clearActiveProvider: (state) => {
      state.activeProvider = undefined;
      state.providers.forEach(p => { p.isActive = false; });
    },
    clearProviderModelInfo: (state, action: PayloadAction<'openai' | 'gemini' | 'anthropic'>) => {
      const provider = state.providers.find(p => p.id === action.payload);
      if (provider) {
        provider.modelInfo = undefined;
      }
    },
    
    setAutoAnalyze: (state, action: PayloadAction<boolean>) => {
      state.autoAnalyze = action.payload;
    },
    
    setAnalysisFrequency: (state, action: PayloadAction<'daily' | 'weekly' | 'manual'>) => {
      state.analysisFrequency = action.payload;
    },
    
    setDataTypes: (state, action: PayloadAction<Partial<AIAssistantState['dataTypes']>>) => {
      state.dataTypes = { ...state.dataTypes, ...action.payload };
    },
    
    addInsight: (state, action: PayloadAction<AIInsight>) => {
      state.insights.unshift(action.payload);
      // Keep only last 50 insights
      if (state.insights.length > 50) {
        state.insights = state.insights.slice(0, 50);
      }
    },
    
    removeInsight: (state, action: PayloadAction<string>) => {
      state.insights = state.insights.filter(insight => insight.id !== action.payload);
    },
    
    clearInsights: (state) => {
      state.insights = [];
    },
    restoreInsights: (state, action: PayloadAction<AIInsight[]>) => {
      state.insights = action.payload || [];
    },
    
    addRecap: (state, action: PayloadAction<AIRecap>) => {
      state.recaps.unshift(action.payload);
      // Keep only last 20 recaps
      if (state.recaps.length > 20) {
        state.recaps = state.recaps.slice(0, 20);
      }
    },
    
    removeRecap: (state, action: PayloadAction<string>) => {
      state.recaps = state.recaps.filter(recap => recap.id !== action.payload);
    },
    restoreRecaps: (state, action: PayloadAction<AIRecap[]>) => {
      state.recaps = action.payload || [];
    },
    
    updateAnalysisTracker: (state, action: PayloadAction<Partial<AnalysisTracker>>) => {
      state.analysisTracker = { ...state.analysisTracker, ...action.payload };
    },
    
    clearAIError: (state) => {
      state.lastError = undefined;
    },
    
    clearAllErrors: (state) => {
      state.errors = [];
      state.lastError = undefined;
    },
    
    updateProvidersWithModelInfo: (state, action: PayloadAction<{ [key: string]: { model: string; version: string } }>) => {
      Object.entries(action.payload).forEach(([providerId, modelInfo]) => {
        const provider = state.providers.find(p => p.id === providerId);
        if (provider) {
          provider.modelInfo = modelInfo;
        }
      });
    },
    
    updateProvidersWithApiKeys: (state, action: PayloadAction<{ [key: string]: boolean }>) => {
      Object.entries(action.payload).forEach(([providerId, hasKey]) => {
        const provider = state.providers.find(p => p.id === providerId);
        if (provider) {
          provider.hasApiKey = hasKey;
        }
      });
    },
    recordUsage: (state, action: PayloadAction<AIUsageEntry>) => {
      state.usage.unshift(action.payload);
      if (state.usage.length > 500) {
        state.usage = state.usage.slice(0, 500);
      }
    },
    clearUsage: (state) => {
      state.usage = [];
    },
    restoreUsage: (state, action: PayloadAction<AIUsageEntry[]>) => {
      state.usage = action.payload || [];
    },
  },
  
  extraReducers: (builder) => {
    // Set API Key
    builder
      .addCase(setApiKey.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(setApiKey.fulfilled, (state, action) => {
        const provider = state.providers.find(p => p.id === action.payload.provider);
        if (provider) {
          provider.hasApiKey = action.payload.hasKey;
          if (action.payload.modelInfo) {
            provider.modelInfo = action.payload.modelInfo;
          }
        }
        // Record any usage returned from key setup
        const anyAction: any = action as any;
        if (anyAction.payload && anyAction.payload.usage) {
          const u = anyAction.payload.usage;
          state.usage.unshift({
            id: `usage_${Date.now()}`,
            timestamp: new Date().toISOString(),
            provider: anyAction.payload.provider,
            operation: 'analyze',
            promptTokens: Number(u.promptTokens || 0),
            completionTokens: Number(u.completionTokens || 0),
            totalTokens: Number(u.totalTokens || 0),
            note: 'API key setup verification',
          });
        }
      })
      .addCase(setApiKey.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`API Key Setup: ${action.error.message}`);
      });

    // Test API Key
    builder
      .addCase(testApiKey.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(testApiKey.fulfilled, (state, action) => {
        const provider = state.providers.find(p => p.id === action.payload.provider);
        if (provider) {
          provider.hasApiKey = action.payload.isValid;
        }
      })
      .addCase(testApiKey.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`API Key Test: ${action.error.message}`);
      });

    // Analyze User Data
    builder
      .addCase(analyzeUserData.pending, (state) => {
        state.isAnalyzing = true;
        state.analysisProgress = 0;
        state.analysisStatus = 'Analyzing your data...';
        state.lastError = undefined;
      })
      .addCase(analyzeUserData.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.analysisProgress = 100;
        state.analysisStatus = 'Analysis complete';
        state.lastAnalysis = new Date().toISOString();
        
        // Add new insights
        action.payload.insights.forEach((insight: AIInsight) => {
          state.insights.unshift(insight);
        });
        
        // Update analysis tracker
        if (action.payload.processedData) {
          state.analysisTracker = {
            ...state.analysisTracker,
            ...action.payload.processedData,
          };
        }
        // Record usage entry
        if (action.payload.usage) {
          const u = action.payload.usage as any;
          state.usage.unshift({
            id: `usage_${Date.now()}`,
            timestamp: new Date().toISOString(),
            provider: action.payload.provider,
            operation: 'analyze',
            promptTokens: Number(u.promptTokens || 0),
            completionTokens: Number(u.completionTokens || 0),
            totalTokens: Number(u.totalTokens || 0),
          });
        }
        
        // Keep only last 50 insights
        if (state.insights.length > 50) {
          state.insights = state.insights.slice(0, 50);
        }
      })
      .addCase(analyzeUserData.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.analysisProgress = 0;
        state.analysisStatus = 'Analysis failed';
        state.lastError = action.error.message;
        state.errors.push(`Data Analysis: ${action.error.message}`);
      });

    // Generate Recap
    builder
      .addCase(generateRecap.pending, (state) => {
        state.isAnalyzing = true;
        state.analysisStatus = 'Generating recap...';
        state.lastError = undefined;
      })
      .addCase(generateRecap.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.analysisStatus = 'Recap generated';
        state.recaps.unshift(action.payload.recap);
        // Record usage entry
        if (action.payload.usage) {
          const u = action.payload.usage as any;
          state.usage.unshift({
            id: `usage_${Date.now()}`,
            timestamp: new Date().toISOString(),
            provider: action.payload.provider,
            operation: 'recap',
            promptTokens: Number(u.promptTokens || 0),
            completionTokens: Number(u.completionTokens || 0),
            totalTokens: Number(u.totalTokens || 0),
          });
        }
        
        // Keep only last 20 recaps
        if (state.recaps.length > 20) {
          state.recaps = state.recaps.slice(0, 20);
        }
      })
      .addCase(generateRecap.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.analysisStatus = 'Recap generation failed';
        state.lastError = action.error.message;
        state.errors.push(`Recap Generation: ${action.error.message}`);
      });
  },
});

export const {
  setActiveProvider,
  clearActiveProvider,
  setAutoAnalyze,
  setAnalysisFrequency,
  setDataTypes,
  addInsight,
  removeInsight,
  clearInsights,
  restoreInsights,
  addRecap,
  removeRecap,
  restoreRecaps,
  updateAnalysisTracker,
  clearAIError,
  clearAllErrors,
  updateProvidersWithModelInfo,
  updateProvidersWithApiKeys,
  clearProviderModelInfo,
  recordUsage,
  clearUsage,
  restoreUsage,
} = aiAssistantSlice.actions;

// Selectors
export const selectAIProviders = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.providers;
export const selectActiveProvider = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.activeProvider;
export const selectIsAnalyzing = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.isAnalyzing;
export const selectAnalysisProgress = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.analysisProgress;
export const selectAnalysisStatus = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.analysisStatus;
export const selectLastAnalysis = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.lastAnalysis;
export const selectAIInsights = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.insights;
export const selectAIRecaps = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.recaps;
export const selectAnalysisTracker = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.analysisTracker;
export const selectAIConfiguration = (state: { aiAssistant: AIAssistantState }) => ({
  autoAnalyze: state.aiAssistant.autoAnalyze,
  analysisFrequency: state.aiAssistant.analysisFrequency,
  dataTypes: state.aiAssistant.dataTypes,
});
export const selectAIErrors = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.errors;
export const selectLastAIError = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.lastError;
export const selectAIUsage = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.usage;

export default aiAssistantSlice.reducer;
