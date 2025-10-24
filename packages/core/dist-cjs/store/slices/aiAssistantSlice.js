"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectAIUsage = exports.selectLastAIError = exports.selectAIErrors = exports.selectAIConfiguration = exports.selectAnalysisTracker = exports.selectAIRecaps = exports.selectAIInsights = exports.selectLastAnalysis = exports.selectAnalysisStatus = exports.selectAnalysisProgress = exports.selectIsAnalyzing = exports.selectActiveProvider = exports.selectAIProviders = exports.restoreUsage = exports.clearUsage = exports.recordUsage = exports.clearProviderModelInfo = exports.updateProvidersWithApiKeys = exports.updateProvidersWithModelInfo = exports.clearAllErrors = exports.clearAIError = exports.updateAnalysisTracker = exports.restoreRecaps = exports.removeRecap = exports.addRecap = exports.restoreInsights = exports.clearInsights = exports.removeInsight = exports.addInsight = exports.setDataTypes = exports.setAnalysisFrequency = exports.setAutoAnalyze = exports.clearActiveProvider = exports.setActiveProvider = exports.generateRecap = exports.analyzeUserData = exports.testApiKey = exports.setApiKey = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const aiAssistantService_1 = require("../../services/aiAssistantService");
const logger_1 = require("../../utils/logger");
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
exports.setApiKey = (0, toolkit_1.createAsyncThunk)('aiAssistant/setApiKey', async ({ provider, apiKey }) => {
    // This will be handled by the main process for security
    if (typeof globalThis !== 'undefined' && globalThis.window?.electronAPI?.aiAssistant?.setApiKey) {
        logger_1.logger.info(`[aiAssistant/setApiKey] Calling main process setApiKey for ${provider}`, { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]CallingMain' });
        const result = await globalThis.window.electronAPI.aiAssistant.setApiKey(provider, apiKey);
        logger_1.logger.info('[aiAssistant/setApiKey] Main returned', { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]MainReturned', metadata: { result } });
        if (result.success) {
            const payload = { provider, hasKey: true, modelInfo: result.modelInfo, usage: result.usage };
            logger_1.logger.info('[aiAssistant/setApiKey] Fulfilled payload', { component: 'aiAssistantSlice', operation: '[aiassistant/setapikey]FulfilledPayload', metadata: { payload } });
            return payload;
        }
        else {
            throw new Error(result.error || 'Failed to set API key');
        }
    }
    throw new Error('AI Assistant API not available');
});
exports.testApiKey = (0, toolkit_1.createAsyncThunk)('aiAssistant/testApiKey', async (provider) => {
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
exports.analyzeUserData = (0, toolkit_1.createAsyncThunk)('aiAssistant/analyzeUserData', async ({ provider, dataTypes, forceReAnalyze = false, tasks, journalEntries, forceLocal = false, }, { getState }) => {
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
                // Apply quality scoring to AI-generated insights as well
                const qualityInsights = aiAssistantService_1.AIAssistantService.applyQualityScoring(result.insights, {
                    previousInsights: state.aiAssistant.insights,
                    minimumQuality: 0.4,
                });
                return {
                    insights: qualityInsights,
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
    const local = aiAssistantService_1.AIAssistantService.generateLocalInsights(safeTasks, safeJournal);
    const nowIso = new Date().toISOString();
    const rawInsights = local.map((i, idx) => ({
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
    // Apply quality scoring, filtering, deduplication, and ranking
    const insights = aiAssistantService_1.AIAssistantService.applyQualityScoring(rawInsights, {
        previousInsights: state.aiAssistant.insights,
        minimumQuality: 0.4,
    });
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
exports.generateRecap = (0, toolkit_1.createAsyncThunk)('aiAssistant/generateRecap', async ({ provider, type, period, tasks, journalEntries, }) => {
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
const aiAssistantSlice = (0, toolkit_1.createSlice)({
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
            .addCase(exports.setApiKey.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.setApiKey.fulfilled, (state, action) => {
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
            .addCase(exports.setApiKey.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`API Key Setup: ${action.error.message}`);
        });
        // Test API Key
        builder
            .addCase(exports.testApiKey.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.testApiKey.fulfilled, (state, action) => {
            const provider = state.providers.find(p => p.id === action.payload.provider);
            if (provider) {
                provider.hasApiKey = action.payload.isValid;
            }
        })
            .addCase(exports.testApiKey.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`API Key Test: ${action.error.message}`);
        });
        // Analyze User Data
        builder
            .addCase(exports.analyzeUserData.pending, (state) => {
            state.isAnalyzing = true;
            state.analysisProgress = 0;
            state.analysisStatus = 'Analyzing your data...';
            state.lastError = undefined;
        })
            .addCase(exports.analyzeUserData.fulfilled, (state, action) => {
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
            .addCase(exports.analyzeUserData.rejected, (state, action) => {
            state.isAnalyzing = false;
            state.analysisProgress = 0;
            state.analysisStatus = 'Analysis failed';
            state.lastError = action.error.message;
            state.errors.push(`Data Analysis: ${action.error.message}`);
        });
        // Generate Recap
        builder
            .addCase(exports.generateRecap.pending, (state) => {
            state.isAnalyzing = true;
            state.analysisStatus = 'Generating recap...';
            state.lastError = undefined;
        })
            .addCase(exports.generateRecap.fulfilled, (state, action) => {
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
            .addCase(exports.generateRecap.rejected, (state, action) => {
            state.isAnalyzing = false;
            state.analysisStatus = 'Recap generation failed';
            state.lastError = action.error.message;
            state.errors.push(`Recap Generation: ${action.error.message}`);
        });
    },
});
_a = aiAssistantSlice.actions, exports.setActiveProvider = _a.setActiveProvider, exports.clearActiveProvider = _a.clearActiveProvider, exports.setAutoAnalyze = _a.setAutoAnalyze, exports.setAnalysisFrequency = _a.setAnalysisFrequency, exports.setDataTypes = _a.setDataTypes, exports.addInsight = _a.addInsight, exports.removeInsight = _a.removeInsight, exports.clearInsights = _a.clearInsights, exports.restoreInsights = _a.restoreInsights, exports.addRecap = _a.addRecap, exports.removeRecap = _a.removeRecap, exports.restoreRecaps = _a.restoreRecaps, exports.updateAnalysisTracker = _a.updateAnalysisTracker, exports.clearAIError = _a.clearAIError, exports.clearAllErrors = _a.clearAllErrors, exports.updateProvidersWithModelInfo = _a.updateProvidersWithModelInfo, exports.updateProvidersWithApiKeys = _a.updateProvidersWithApiKeys, exports.clearProviderModelInfo = _a.clearProviderModelInfo, exports.recordUsage = _a.recordUsage, exports.clearUsage = _a.clearUsage, exports.restoreUsage = _a.restoreUsage;
// Selectors
const selectAIProviders = (state) => state.aiAssistant.providers;
exports.selectAIProviders = selectAIProviders;
const selectActiveProvider = (state) => state.aiAssistant.activeProvider;
exports.selectActiveProvider = selectActiveProvider;
const selectIsAnalyzing = (state) => state.aiAssistant.isAnalyzing;
exports.selectIsAnalyzing = selectIsAnalyzing;
const selectAnalysisProgress = (state) => state.aiAssistant.analysisProgress;
exports.selectAnalysisProgress = selectAnalysisProgress;
const selectAnalysisStatus = (state) => state.aiAssistant.analysisStatus;
exports.selectAnalysisStatus = selectAnalysisStatus;
const selectLastAnalysis = (state) => state.aiAssistant.lastAnalysis;
exports.selectLastAnalysis = selectLastAnalysis;
const selectAIInsights = (state) => state.aiAssistant.insights;
exports.selectAIInsights = selectAIInsights;
const selectAIRecaps = (state) => state.aiAssistant.recaps;
exports.selectAIRecaps = selectAIRecaps;
const selectAnalysisTracker = (state) => state.aiAssistant.analysisTracker;
exports.selectAnalysisTracker = selectAnalysisTracker;
const selectAIConfiguration = (state) => ({
    autoAnalyze: state.aiAssistant.autoAnalyze,
    analysisFrequency: state.aiAssistant.analysisFrequency,
    dataTypes: state.aiAssistant.dataTypes,
});
exports.selectAIConfiguration = selectAIConfiguration;
const selectAIErrors = (state) => state.aiAssistant.errors;
exports.selectAIErrors = selectAIErrors;
const selectLastAIError = (state) => state.aiAssistant.lastError;
exports.selectLastAIError = selectLastAIError;
const selectAIUsage = (state) => state.aiAssistant.usage;
exports.selectAIUsage = selectAIUsage;
exports.default = aiAssistantSlice.reducer;
