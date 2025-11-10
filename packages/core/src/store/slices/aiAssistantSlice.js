import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AIAssistantService } from '../../services/aiAssistantService';
import { logger } from '../../utils/logger';
const loadStoredUsage = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('serenity_ai_usage');
            if (raw)
                return JSON.parse(raw);
        }
    }
    catch { }
    return [];
};
const initialState = {
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
export const setApiKey = createAsyncThunk('aiAssistant/setApiKey', async ({ provider, apiKey }) => {
    // This will be handled by the main process for security
    if (typeof globalThis !== 'undefined' && globalThis.window?.electronAPI?.aiAssistant?.setApiKey) {
        logger.info(`[aiAssistant/setApiKey] Calling main process setApiKey for ${provider}`, { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]CallingMain' });
        const result = await globalThis.window.electronAPI.aiAssistant.setApiKey(provider, apiKey);
        logger.info('[aiAssistant/setApiKey] Main returned', { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]MainReturned', metadata: { result } });
        if (result.success) {
            const payload = { provider, hasKey: true, modelInfo: result.modelInfo, usage: result.usage };
            logger.info('[aiAssistant/setApiKey] Fulfilled payload', { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]FulfilledPayload', metadata: { payload } });
            return payload;
        }
        else {
            throw new Error(result.error || 'Failed to set API key');
        }
    }
    throw new Error('AI Assistant API not available');
});
export const testApiKey = createAsyncThunk('aiAssistant/testApiKey', async (provider) => {
    if (typeof globalThis !== 'undefined' && globalThis.window?.electronAPI?.aiAssistant?.testApiKey) {
        const result = await globalThis.window.electronAPI.aiAssistant.testApiKey(provider);
        if (result.success) {
            return { provider, isValid: true };
        }
        else {
            throw new Error(result.error || 'API key test failed');
        }
    }
    throw new Error('AI Assistant API not available');
});
export const analyzeUserData = createAsyncThunk('aiAssistant/analyzeUserData', async ({ provider, dataTypes, forceReAnalyze = false, tasks, journalEntries, forceLocal = false, }, { getState }) => {
    const state = getState();
    // Try Electron-backed analysis first if available
    if (!forceLocal && typeof globalThis !== 'undefined' && globalThis.window?.electronAPI?.aiAssistant?.analyzeData) {
        try {
            const result = await globalThis.window.electronAPI.aiAssistant.analyzeData({
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
                    operation: 'analyze',
                };
            }
        }
        catch (e) {
            // Fall back to local analysis below
        }
    }
    // Fallback: generate local insights so the user sees value without an API
    const safeTasks = tasks || [];
    const safeJournal = journalEntries || [];
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
        operation: 'analyze',
    };
});
export const generateRecap = createAsyncThunk('aiAssistant/generateRecap', async ({ provider, type, period, tasks, journalEntries, }) => {
    if (typeof globalThis !== 'undefined' && globalThis.window?.electronAPI?.aiAssistant?.generateRecap) {
        const result = await globalThis.window.electronAPI.aiAssistant.generateRecap({
            provider,
            type,
            period,
            tasks,
            journalEntries,
        });
        if (result.success) {
            return { recap: result.recap, usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, provider, operation: 'recap' };
        }
        else {
            throw new Error(result.error || 'Recap generation failed');
        }
    }
    throw new Error('AI Assistant API not available');
});
const aiAssistantSlice = createSlice({
    name: 'aiAssistant',
    initialState,
    reducers: {
        setActiveProvider: (state, action) => {
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
        clearProviderModelInfo: (state, action) => {
            const provider = state.providers.find(p => p.id === action.payload);
            if (provider) {
                provider.modelInfo = undefined;
            }
        },
        setAutoAnalyze: (state, action) => {
            state.autoAnalyze = action.payload;
        },
        setAnalysisFrequency: (state, action) => {
            state.analysisFrequency = action.payload;
        },
        setDataTypes: (state, action) => {
            state.dataTypes = { ...state.dataTypes, ...action.payload };
        },
        addInsight: (state, action) => {
            state.insights.unshift(action.payload);
            // Keep only last 50 insights
            if (state.insights.length > 50) {
                state.insights = state.insights.slice(0, 50);
            }
        },
        removeInsight: (state, action) => {
            state.insights = state.insights.filter(insight => insight.id !== action.payload);
        },
        clearInsights: (state) => {
            state.insights = [];
        },
        restoreInsights: (state, action) => {
            state.insights = action.payload || [];
        },
        addRecap: (state, action) => {
            state.recaps.unshift(action.payload);
            // Keep only last 20 recaps
            if (state.recaps.length > 20) {
                state.recaps = state.recaps.slice(0, 20);
            }
        },
        removeRecap: (state, action) => {
            state.recaps = state.recaps.filter(recap => recap.id !== action.payload);
        },
        restoreRecaps: (state, action) => {
            state.recaps = action.payload || [];
        },
        updateAnalysisTracker: (state, action) => {
            state.analysisTracker = { ...state.analysisTracker, ...action.payload };
        },
        clearAIError: (state) => {
            state.lastError = undefined;
        },
        clearAllErrors: (state) => {
            state.errors = [];
            state.lastError = undefined;
        },
        updateProvidersWithModelInfo: (state, action) => {
            Object.entries(action.payload).forEach(([providerId, modelInfo]) => {
                const provider = state.providers.find(p => p.id === providerId);
                if (provider) {
                    provider.modelInfo = modelInfo;
                }
            });
        },
        updateProvidersWithApiKeys: (state, action) => {
            Object.entries(action.payload).forEach(([providerId, hasKey]) => {
                const provider = state.providers.find(p => p.id === providerId);
                if (provider) {
                    provider.hasApiKey = hasKey;
                }
            });
        },
        recordUsage: (state, action) => {
            state.usage.unshift(action.payload);
            if (state.usage.length > 500) {
                state.usage = state.usage.slice(0, 500);
            }
        },
        clearUsage: (state) => {
            state.usage = [];
        },
        restoreUsage: (state, action) => {
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
            const anyAction = action;
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
            action.payload.insights.forEach((insight) => {
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
                const u = action.payload.usage;
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
                const u = action.payload.usage;
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
export const { setActiveProvider, clearActiveProvider, setAutoAnalyze, setAnalysisFrequency, setDataTypes, addInsight, removeInsight, clearInsights, restoreInsights, addRecap, removeRecap, restoreRecaps, updateAnalysisTracker, clearAIError, clearAllErrors, updateProvidersWithModelInfo, updateProvidersWithApiKeys, clearProviderModelInfo, recordUsage, clearUsage, restoreUsage, } = aiAssistantSlice.actions;
// Selectors
export const selectAIProviders = (state) => state.aiAssistant.providers;
export const selectActiveProvider = (state) => state.aiAssistant.activeProvider;
export const selectIsAnalyzing = (state) => state.aiAssistant.isAnalyzing;
export const selectAnalysisProgress = (state) => state.aiAssistant.analysisProgress;
export const selectAnalysisStatus = (state) => state.aiAssistant.analysisStatus;
export const selectLastAnalysis = (state) => state.aiAssistant.lastAnalysis;
export const selectAIInsights = (state) => state.aiAssistant.insights;
export const selectAIRecaps = (state) => state.aiAssistant.recaps;
export const selectAnalysisTracker = (state) => state.aiAssistant.analysisTracker;
export const selectAIConfiguration = (state) => ({
    autoAnalyze: state.aiAssistant.autoAnalyze,
    analysisFrequency: state.aiAssistant.analysisFrequency,
    dataTypes: state.aiAssistant.dataTypes,
});
export const selectAIErrors = (state) => state.aiAssistant.errors;
export const selectLastAIError = (state) => state.aiAssistant.lastError;
export const selectAIUsage = (state) => state.aiAssistant.usage;
export default aiAssistantSlice.reducer;
