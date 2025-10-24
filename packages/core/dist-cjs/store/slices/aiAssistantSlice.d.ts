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
    confidence: number;
    createdAt: string;
    source: 'openai' | 'gemini' | 'anthropic';
    category: 'tasks' | 'journal' | 'habits' | 'goals';
    actionable?: boolean;
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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
    providers: AIProvider[];
    activeProvider?: 'openai' | 'gemini' | 'anthropic';
    isAnalyzing: boolean;
    analysisProgress: number;
    analysisStatus: string;
    lastAnalysis?: string;
    insights: AIInsight[];
    recaps: AIRecap[];
    analysisTracker: AnalysisTracker;
    autoAnalyze: boolean;
    analysisFrequency: 'daily' | 'weekly' | 'manual';
    dataTypes: {
        includeTasks: boolean;
        includeJournal: boolean;
        includeProjects: boolean;
    };
    lastError?: string;
    errors: string[];
    usage: AIUsageEntry[];
}
export declare const setApiKey: import("@reduxjs/toolkit").AsyncThunk<any, {
    provider: "openai" | "gemini" | "anthropic";
    apiKey: string;
}, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const testApiKey: import("@reduxjs/toolkit").AsyncThunk<{
    provider: "openai" | "gemini" | "anthropic";
    isValid: boolean;
}, "openai" | "gemini" | "anthropic", {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const analyzeUserData: import("@reduxjs/toolkit").AsyncThunk<{
    insights: AIInsight[];
    processedData: any;
    usage: any;
    provider: "openai" | "gemini" | "anthropic";
    operation: "analyze";
}, {
    provider: "openai" | "gemini" | "anthropic";
    dataTypes: string[];
    forceReAnalyze?: boolean;
    tasks?: any[];
    journalEntries?: any[];
    forceLocal?: boolean;
}, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const generateRecap: import("@reduxjs/toolkit").AsyncThunk<{
    recap: any;
    usage: any;
    provider: "openai" | "gemini" | "anthropic";
    operation: "recap";
}, {
    provider: "openai" | "gemini" | "anthropic";
    type: "weekly" | "monthly";
    period: {
        start: string;
        end: string;
    };
    tasks?: any[];
    journalEntries?: any[];
}, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const setActiveProvider: import("@reduxjs/toolkit").ActionCreatorWithPayload<"openai" | "gemini" | "anthropic", "aiAssistant/setActiveProvider">, clearActiveProvider: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"aiAssistant/clearActiveProvider">, setAutoAnalyze: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "aiAssistant/setAutoAnalyze">, setAnalysisFrequency: import("@reduxjs/toolkit").ActionCreatorWithPayload<"daily" | "weekly" | "manual", "aiAssistant/setAnalysisFrequency">, setDataTypes: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    includeTasks: boolean;
    includeJournal: boolean;
    includeProjects: boolean;
}>, "aiAssistant/setDataTypes">, addInsight: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIInsight, "aiAssistant/addInsight">, removeInsight: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "aiAssistant/removeInsight">, clearInsights: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"aiAssistant/clearInsights">, restoreInsights: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIInsight[], "aiAssistant/restoreInsights">, addRecap: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIRecap, "aiAssistant/addRecap">, removeRecap: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "aiAssistant/removeRecap">, restoreRecaps: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIRecap[], "aiAssistant/restoreRecaps">, updateAnalysisTracker: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<AnalysisTracker>, "aiAssistant/updateAnalysisTracker">, clearAIError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"aiAssistant/clearAIError">, clearAllErrors: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"aiAssistant/clearAllErrors">, updateProvidersWithModelInfo: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    [key: string]: {
        model: string;
        version: string;
    };
}, "aiAssistant/updateProvidersWithModelInfo">, updateProvidersWithApiKeys: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    [key: string]: boolean;
}, "aiAssistant/updateProvidersWithApiKeys">, clearProviderModelInfo: import("@reduxjs/toolkit").ActionCreatorWithPayload<"openai" | "gemini" | "anthropic", "aiAssistant/clearProviderModelInfo">, recordUsage: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIUsageEntry, "aiAssistant/recordUsage">, clearUsage: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"aiAssistant/clearUsage">, restoreUsage: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIUsageEntry[], "aiAssistant/restoreUsage">;
export declare const selectAIProviders: (state: {
    aiAssistant: AIAssistantState;
}) => AIProvider[];
export declare const selectActiveProvider: (state: {
    aiAssistant: AIAssistantState;
}) => "openai" | "gemini" | "anthropic" | undefined;
export declare const selectIsAnalyzing: (state: {
    aiAssistant: AIAssistantState;
}) => boolean;
export declare const selectAnalysisProgress: (state: {
    aiAssistant: AIAssistantState;
}) => number;
export declare const selectAnalysisStatus: (state: {
    aiAssistant: AIAssistantState;
}) => string;
export declare const selectLastAnalysis: (state: {
    aiAssistant: AIAssistantState;
}) => string | undefined;
export declare const selectAIInsights: (state: {
    aiAssistant: AIAssistantState;
}) => AIInsight[];
export declare const selectAIRecaps: (state: {
    aiAssistant: AIAssistantState;
}) => AIRecap[];
export declare const selectAnalysisTracker: (state: {
    aiAssistant: AIAssistantState;
}) => AnalysisTracker;
export declare const selectAIConfiguration: (state: {
    aiAssistant: AIAssistantState;
}) => {
    autoAnalyze: boolean;
    analysisFrequency: "daily" | "weekly" | "manual";
    dataTypes: {
        includeTasks: boolean;
        includeJournal: boolean;
        includeProjects: boolean;
    };
};
export declare const selectAIErrors: (state: {
    aiAssistant: AIAssistantState;
}) => string[];
export declare const selectLastAIError: (state: {
    aiAssistant: AIAssistantState;
}) => string | undefined;
export declare const selectAIUsage: (state: {
    aiAssistant: AIAssistantState;
}) => AIUsageEntry[];
declare const _default: import("redux").Reducer<AIAssistantState>;
export default _default;
