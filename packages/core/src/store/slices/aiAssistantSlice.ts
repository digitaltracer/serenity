import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

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
}

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
};

// Async thunks for AI operations
export const setApiKey = createAsyncThunk(
  'aiAssistant/setApiKey',
  async ({ provider, apiKey }: { provider: 'openai' | 'gemini' | 'anthropic'; apiKey: string }) => {
    // This will be handled by the main process for security
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.electronAPI?.aiAssistant?.setApiKey) {
      const result = await (globalThis as any).window.electronAPI.aiAssistant.setApiKey(provider, apiKey);
      if (result.success) {
        return { provider, hasKey: true, modelInfo: result.modelInfo };
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
  }: { 
    provider: 'openai' | 'gemini' | 'anthropic';
    dataTypes: string[];
    forceReAnalyze?: boolean;
    tasks?: any[];
    journalEntries?: any[];
  }, { getState }) => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.electronAPI?.aiAssistant?.analyzeData) {
      const state = getState() as { aiAssistant: AIAssistantState };
      
      const result = await (globalThis as any).window.electronAPI.aiAssistant.analyzeData({
        provider,
        dataTypes,
        forceReAnalyze,
        tasks,
        journalEntries,
        analysisTracker: state.aiAssistant.analysisTracker,
      });
      
      if (result.success) {
        return {
          insights: result.insights || [],
          processedData: result.processedData || {},
        };
      } else {
        throw new Error(result.error || 'Data analysis failed');
      }
    }
    throw new Error('AI Assistant API not available');
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
        return result.recap;
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
        state.recaps.unshift(action.payload);
        
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
  setAutoAnalyze,
  setAnalysisFrequency,
  setDataTypes,
  addInsight,
  removeInsight,
  clearInsights,
  addRecap,
  removeRecap,
  updateAnalysisTracker,
  clearAIError,
  clearAllErrors,
  updateProvidersWithModelInfo,
  updateProvidersWithApiKeys,
} = aiAssistantSlice.actions;

// Selectors
export const selectAIProviders = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.providers;
export const selectActiveProvider = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.activeProvider;
export const selectIsAnalyzing = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.isAnalyzing;
export const selectAnalysisProgress = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.analysisProgress;
export const selectAnalysisStatus = (state: { aiAssistant: AIAssistantState }) => state.aiAssistant.analysisStatus;
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

export default aiAssistantSlice.reducer;