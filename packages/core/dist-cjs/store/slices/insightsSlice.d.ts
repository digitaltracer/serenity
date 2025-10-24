/**
 * Enhanced AI Insight interface with feedback fields
 */
export interface AIInsightEnhanced {
    id: string;
    type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
    title: string;
    description: string;
    confidence: number;
    createdAt: string;
    updatedAt?: string;
    source: 'openai' | 'gemini' | 'anthropic' | 'local';
    category: 'tasks' | 'journal' | 'habits' | 'goals';
    actionable?: boolean;
    metadata?: {
        sourceIds?: string[];
        tags?: string[];
        priority?: 'high' | 'medium' | 'low';
        [key: string]: unknown;
    };
    visualizationData?: number[];
    actionabilitySuggestions?: Array<{
        action: string;
        description: string;
        type: 'task' | 'goal' | 'habit';
    }>;
    userRating?: number;
    dismissed?: boolean;
    markedHelpful?: boolean;
    userNotes?: string;
}
/**
 * Recap with interaction tracking
 */
export interface AIRecapEnhanced {
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
    source: 'openai' | 'gemini' | 'anthropic' | 'local';
    metadata?: Record<string, unknown>;
    viewed?: boolean;
    favorited?: boolean;
    exported?: boolean;
}
/**
 * KPI Metrics structure
 */
export interface KPIMetrics {
    weeklyTasksCompleted: {
        value: number;
        change: number;
        sparkline: number[];
    };
    averageMood: {
        value: number;
        change: number;
        sparkline: number[];
    };
    productivityScore: {
        value: number;
        change: number;
        sparkline: number[];
    };
    activeStreak: {
        value: number;
        change: number;
    };
}
/**
 * Time range filter
 */
export interface TimeRange {
    start: string;
    end: string;
}
/**
 * Insights filters
 */
export interface InsightsFilters {
    category?: 'tasks' | 'journal' | 'habits' | 'goals';
    type?: 'productivity' | 'behavior' | 'recommendation' | 'warning';
    dismissed?: boolean;
    limit?: number;
    offset?: number;
}
/**
 * Recaps filters
 */
export interface RecapsFilters {
    type?: 'weekly' | 'monthly';
    favorited?: boolean;
    limit?: number;
    offset?: number;
}
/**
 * Insights Hub State
 */
export interface InsightsState {
    kpis: KPIMetrics | null;
    insights: AIInsightEnhanced[];
    recaps: AIRecapEnhanced[];
    timeRange: TimeRange;
    insightsFilters: InsightsFilters;
    recapsFilters: RecapsFilters;
    isLoadingDashboard: boolean;
    isLoadingInsights: boolean;
    isLoadingRecaps: boolean;
    isLoadingKPIs: boolean;
    isLoadingVisualization: boolean;
    lastError?: string;
    errors: string[];
    lastRefresh?: string;
}
/**
 * Fetch complete dashboard data (KPIs + Insights + Recaps)
 */
export declare const fetchDashboardData: import("@reduxjs/toolkit").AsyncThunk<any, {
    timeRange?: TimeRange;
    includeKPIs?: boolean;
    includeInsights?: boolean;
    includeRecaps?: boolean;
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
 * Fetch insights with filters
 */
export declare const fetchInsights: import("@reduxjs/toolkit").AsyncThunk<any, InsightsFilters | undefined, {
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
 * Dismiss an insight
 */
export declare const dismissInsight: import("@reduxjs/toolkit").AsyncThunk<string, string, {
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
 * Rate an insight
 */
export declare const rateInsight: import("@reduxjs/toolkit").AsyncThunk<{
    id: string;
    rating: number;
}, {
    id: string;
    rating: number;
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
 * Mark insight as helpful
 */
export declare const markInsightHelpful: import("@reduxjs/toolkit").AsyncThunk<{
    id: string;
    helpful: boolean;
}, {
    id: string;
    helpful: boolean;
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
 * Add note to insight
 */
export declare const addInsightNote: import("@reduxjs/toolkit").AsyncThunk<{
    id: string;
    note: string;
}, {
    id: string;
    note: string;
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
 * Fetch recaps with filters
 */
export declare const fetchRecaps: import("@reduxjs/toolkit").AsyncThunk<any, RecapsFilters | undefined, {
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
 * Toggle recap favorite status
 */
export declare const toggleRecapFavorite: import("@reduxjs/toolkit").AsyncThunk<{
    id: string;
    favorited: boolean;
}, {
    id: string;
    favorited: boolean;
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
 * Mark recap as viewed
 */
export declare const markRecapViewed: import("@reduxjs/toolkit").AsyncThunk<string, string, {
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
 * Fetch KPI metrics
 */
export declare const fetchKPIMetrics: import("@reduxjs/toolkit").AsyncThunk<any, TimeRange | undefined, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const setTimeRange: import("@reduxjs/toolkit").ActionCreatorWithPayload<TimeRange, "insights/setTimeRange">, setTimeRangePreset: import("@reduxjs/toolkit").ActionCreatorWithPayload<"7d" | "30d" | "90d" | "year", "insights/setTimeRangePreset">, setInsightsFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<InsightsFilters>, "insights/setInsightsFilters">, setRecapsFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<RecapsFilters>, "insights/setRecapsFilters">, clearInsights: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"insights/clearInsights">, clearRecaps: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"insights/clearRecaps">, clearKPIs: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"insights/clearKPIs">, clearAllData: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"insights/clearAllData">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"insights/clearError">, clearAllErrors: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"insights/clearAllErrors">, restoreInsights: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIInsightEnhanced[], "insights/restoreInsights">, restoreRecaps: import("@reduxjs/toolkit").ActionCreatorWithPayload<AIRecapEnhanced[], "insights/restoreRecaps">, restoreKPIs: import("@reduxjs/toolkit").ActionCreatorWithPayload<KPIMetrics, "insights/restoreKPIs">;
export declare const selectKPIs: (state: {
    insights: InsightsState;
}) => KPIMetrics | null;
export declare const selectInsights: (state: {
    insights: InsightsState;
}) => AIInsightEnhanced[];
export declare const selectRecaps: (state: {
    insights: InsightsState;
}) => AIRecapEnhanced[];
export declare const selectTimeRange: (state: {
    insights: InsightsState;
}) => TimeRange;
export declare const selectInsightsFilters: (state: {
    insights: InsightsState;
}) => InsightsFilters;
export declare const selectRecapsFilters: (state: {
    insights: InsightsState;
}) => RecapsFilters;
export declare const selectIsLoadingDashboard: (state: {
    insights: InsightsState;
}) => boolean;
export declare const selectIsLoadingInsights: (state: {
    insights: InsightsState;
}) => boolean;
export declare const selectIsLoadingRecaps: (state: {
    insights: InsightsState;
}) => boolean;
export declare const selectIsLoadingKPIs: (state: {
    insights: InsightsState;
}) => boolean;
export declare const selectLastRefresh: (state: {
    insights: InsightsState;
}) => string | undefined;
export declare const selectInsightsErrors: (state: {
    insights: InsightsState;
}) => string[];
export declare const selectLastInsightsError: (state: {
    insights: InsightsState;
}) => string | undefined;
export declare const selectNonDismissedInsights: (state: {
    insights: InsightsState;
}) => AIInsightEnhanced[];
export declare const selectInsightsByCategory: (category: string) => (state: {
    insights: InsightsState;
}) => AIInsightEnhanced[];
export declare const selectFavoritedRecaps: (state: {
    insights: InsightsState;
}) => AIRecapEnhanced[];
export declare const selectRecapsByType: (type: "weekly" | "monthly") => (state: {
    insights: InsightsState;
}) => AIRecapEnhanced[];
declare const _default: import("redux").Reducer<InsightsState>;
export default _default;
