export interface Summary {
    id: string;
    title: string;
    content: string;
    summaryType: 'tasks' | 'journal' | 'combined';
    startDate: string;
    endDate: string;
    generatedAt: string;
    wordCount: number;
    metadata: {
        tags?: string[];
        moodAnalysis?: {
            averageMood: number;
            dominantMood: string;
            moodTrend: 'improving' | 'stable' | 'declining';
        };
        taskStats?: {
            totalTasks: number;
            completedTasks: number;
            byPriority: Record<string, number>;
            byCategory: Record<string, number>;
        };
    };
    provider: 'openai' | 'gemini' | 'anthropic' | 'local';
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    createdAt: string;
    updatedAt: string;
}
export interface SummariesState {
    summaries: Summary[];
    loading: boolean;
    generating: boolean;
    generationProgress: number;
    error: string | null;
    filters: {
        category: 'all' | 'tasks' | 'journal' | 'combined';
        sortBy: 'recent' | 'oldest';
    };
    lastGenerated?: string;
}
/**
 * Generate a new summary
 */
export declare const generateSummary: import("@reduxjs/toolkit").AsyncThunk<any, {
    startDate: string;
    endDate: string;
    types: ("tasks" | "journal")[];
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
/**
 * Fetch all summaries
 */
export declare const fetchSummaries: import("@reduxjs/toolkit").AsyncThunk<any, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
/**
 * Delete a summary
 */
export declare const deleteSummary: import("@reduxjs/toolkit").AsyncThunk<string, string, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
/**
 * Export summary to markdown
 */
export declare const exportSummary: import("@reduxjs/toolkit").AsyncThunk<any, string, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const setFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    category?: "all" | "tasks" | "journal" | "combined";
    sortBy?: "recent" | "oldest";
}, "summaries/setFilter">, setGenerationProgress: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "summaries/setGenerationProgress">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"summaries/clearError">, setSummaries: import("@reduxjs/toolkit").ActionCreatorWithPayload<Summary[], "summaries/setSummaries">, addSummary: import("@reduxjs/toolkit").ActionCreatorWithPayload<Summary, "summaries/addSummary">, removeSummary: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "summaries/removeSummary">, setSummariesLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "summaries/setSummariesLoading">, setSummariesGenerating: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "summaries/setSummariesGenerating">, setSummariesError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "summaries/setSummariesError">;
declare const _default: import("redux").Reducer<SummariesState>;
export default _default;
export declare const selectSummaries: (state: {
    summaries: SummariesState;
}) => Summary[];
export declare const selectSummariesLoading: (state: {
    summaries: SummariesState;
}) => boolean;
export declare const selectSummariesGenerating: (state: {
    summaries: SummariesState;
}) => boolean;
export declare const selectSummariesError: (state: {
    summaries: SummariesState;
}) => string | null;
export declare const selectSummariesFilters: (state: {
    summaries: SummariesState;
}) => {
    category: "all" | "tasks" | "journal" | "combined";
    sortBy: "recent" | "oldest";
};
export declare const selectGenerationProgress: (state: {
    summaries: SummariesState;
}) => number;
export declare const selectFilteredSummaries: (state: {
    summaries: SummariesState;
}) => Summary[];
