"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectRecapsByType = exports.selectFavoritedRecaps = exports.selectInsightsByCategory = exports.selectNonDismissedInsights = exports.selectLastInsightsError = exports.selectInsightsErrors = exports.selectLastRefresh = exports.selectIsLoadingKPIs = exports.selectIsLoadingRecaps = exports.selectIsLoadingInsights = exports.selectIsLoadingDashboard = exports.selectRecapsFilters = exports.selectInsightsFilters = exports.selectTimeRange = exports.selectRecaps = exports.selectInsights = exports.selectKPIs = exports.restoreKPIs = exports.restoreRecaps = exports.restoreInsights = exports.clearAllErrors = exports.clearError = exports.clearAllData = exports.clearKPIs = exports.clearRecaps = exports.clearInsights = exports.setRecapsFilters = exports.setInsightsFilters = exports.setTimeRangePreset = exports.setTimeRange = exports.fetchKPIMetrics = exports.markRecapViewed = exports.toggleRecapFavorite = exports.fetchRecaps = exports.addInsightNote = exports.markInsightHelpful = exports.rateInsight = exports.dismissInsight = exports.fetchInsights = exports.fetchDashboardData = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const logger_1 = require("../../utils/logger");
/**
 * Initial state with default 7-day time range
 */
const getDefaultTimeRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
};
const initialState = {
    kpis: null,
    insights: [],
    recaps: [],
    timeRange: getDefaultTimeRange(),
    insightsFilters: {
        dismissed: false,
        limit: 50,
        offset: 0,
    },
    recapsFilters: {
        limit: 10,
        offset: 0,
    },
    isLoadingDashboard: false,
    isLoadingInsights: false,
    isLoadingRecaps: false,
    isLoadingKPIs: false,
    isLoadingVisualization: false,
    errors: [],
};
// =====================================================================
// Async Thunks
// =====================================================================
/**
 * Fetch complete dashboard data (KPIs + Insights + Recaps)
 */
exports.fetchDashboardData = (0, toolkit_1.createAsyncThunk)('insights/fetchDashboardData', async (params = {}, { getState }) => {
    const state = getState();
    const timeRange = params.timeRange || state.insights.timeRange;
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.getDashboardData) {
        logger_1.logger.info('Fetching dashboard data via IPC', {
            component: 'insightsSlice',
            operation: 'fetchingDashboardData',
            metadata: { timeRange, params }
        });
        const result = await window.electronAPI.insights.getDashboardData({
            timeRange,
            includeKPIs: params.includeKPIs ?? true,
            includeInsights: params.includeInsights ?? true,
            includeRecaps: params.includeRecaps ?? true,
        });
        if (result.success) {
            return result.data;
        }
        else {
            throw new Error(result.error || 'Failed to fetch dashboard data');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Fetch insights with filters
 */
exports.fetchInsights = (0, toolkit_1.createAsyncThunk)('insights/fetchInsights', async (filters, { getState }) => {
    const state = getState();
    const finalFilters = filters || state.insights.insightsFilters;
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.getInsights) {
        logger_1.logger.info('Fetching insights via IPC', {
            component: 'insightsSlice',
            operation: 'fetchingInsights',
            metadata: { filters: finalFilters }
        });
        const result = await window.electronAPI.insights.getInsights(finalFilters);
        if (result.success) {
            return result.insights;
        }
        else {
            throw new Error(result.error || 'Failed to fetch insights');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Dismiss an insight
 */
exports.dismissInsight = (0, toolkit_1.createAsyncThunk)('insights/dismissInsight', async (id) => {
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.dismiss) {
        logger_1.logger.info('Dismissing insight', {
            component: 'insightsSlice',
            operation: 'dismissingInsight',
            metadata: { id }
        });
        const result = await window.electronAPI.insights.dismiss(id);
        if (result.success) {
            return id;
        }
        else {
            throw new Error(result.error || 'Failed to dismiss insight');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Rate an insight
 */
exports.rateInsight = (0, toolkit_1.createAsyncThunk)('insights/rateInsight', async ({ id, rating }) => {
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.updateFeedback) {
        logger_1.logger.info('Rating insight', {
            component: 'insightsSlice',
            operation: 'ratingInsight',
            metadata: { id, rating }
        });
        const result = await window.electronAPI.insights.updateFeedback(id, {
            userRating: rating,
        });
        if (result.success) {
            return { id, rating };
        }
        else {
            throw new Error(result.error || 'Failed to rate insight');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Mark insight as helpful
 */
exports.markInsightHelpful = (0, toolkit_1.createAsyncThunk)('insights/markHelpful', async ({ id, helpful }) => {
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.updateFeedback) {
        logger_1.logger.info('Marking insight helpful', {
            component: 'insightsSlice',
            operation: 'markingInsightHelpful',
            metadata: { id, helpful }
        });
        const result = await window.electronAPI.insights.updateFeedback(id, {
            markedHelpful: helpful,
        });
        if (result.success) {
            return { id, helpful };
        }
        else {
            throw new Error(result.error || 'Failed to mark insight as helpful');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Add note to insight
 */
exports.addInsightNote = (0, toolkit_1.createAsyncThunk)('insights/addNote', async ({ id, note }) => {
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.updateFeedback) {
        logger_1.logger.info('Adding note to insight', {
            component: 'insightsSlice',
            operation: 'addingNoteToInsight',
            metadata: { id, noteLength: note.length }
        });
        const result = await window.electronAPI.insights.updateFeedback(id, {
            userNotes: note,
        });
        if (result.success) {
            return { id, note };
        }
        else {
            throw new Error(result.error || 'Failed to add note to insight');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Fetch recaps with filters
 */
exports.fetchRecaps = (0, toolkit_1.createAsyncThunk)('insights/fetchRecaps', async (filters, { getState }) => {
    const state = getState();
    const finalFilters = filters || state.insights.recapsFilters;
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.getRecaps) {
        logger_1.logger.info('Fetching recaps via IPC', {
            component: 'insightsSlice',
            operation: 'fetchingRecaps',
            metadata: { filters: finalFilters }
        });
        const result = await window.electronAPI.insights.getRecaps(finalFilters);
        if (result.success) {
            return result.recaps;
        }
        else {
            throw new Error(result.error || 'Failed to fetch recaps');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Toggle recap favorite status
 */
exports.toggleRecapFavorite = (0, toolkit_1.createAsyncThunk)('insights/toggleRecapFavorite', async ({ id, favorited }) => {
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.updateRecapInteraction) {
        logger_1.logger.info('Toggling recap favorite', {
            component: 'insightsSlice',
            operation: 'togglingRecapFavorite',
            metadata: { id, favorited }
        });
        const result = await window.electronAPI.insights.updateRecapInteraction(id, {
            favorited,
        });
        if (result.success) {
            return { id, favorited };
        }
        else {
            throw new Error(result.error || 'Failed to toggle recap favorite');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Mark recap as viewed
 */
exports.markRecapViewed = (0, toolkit_1.createAsyncThunk)('insights/markRecapViewed', async (id) => {
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.updateRecapInteraction) {
        logger_1.logger.info('Marking recap as viewed', {
            component: 'insightsSlice',
            operation: 'markingRecapAsViewed',
            metadata: { id }
        });
        const result = await window.electronAPI.insights.updateRecapInteraction(id, {
            viewed: true,
        });
        if (result.success) {
            return id;
        }
        else {
            throw new Error(result.error || 'Failed to mark recap as viewed');
        }
    }
    throw new Error('Insights API not available');
});
/**
 * Fetch KPI metrics
 */
exports.fetchKPIMetrics = (0, toolkit_1.createAsyncThunk)('insights/fetchKPIMetrics', async (timeRange, { getState }) => {
    const state = getState();
    const finalTimeRange = timeRange || state.insights.timeRange;
    if (typeof window !== 'undefined' && window.electronAPI?.insights?.getKPIMetrics) {
        logger_1.logger.info('Fetching KPI metrics via IPC', {
            component: 'insightsSlice',
            operation: 'fetchingKpiMetrics',
            metadata: { timeRange: finalTimeRange }
        });
        const result = await window.electronAPI.insights.getKPIMetrics({
            timeRange: finalTimeRange,
        });
        if (result.success) {
            return result.kpis;
        }
        else {
            throw new Error(result.error || 'Failed to fetch KPI metrics');
        }
    }
    throw new Error('Insights API not available');
});
// =====================================================================
// Slice
// =====================================================================
const insightsSlice = (0, toolkit_1.createSlice)({
    name: 'insights',
    initialState,
    reducers: {
        // Time range management
        setTimeRange: (state, action) => {
            state.timeRange = action.payload;
        },
        setTimeRangePreset: (state, action) => {
            const end = new Date();
            const start = new Date();
            switch (action.payload) {
                case '7d':
                    start.setDate(start.getDate() - 7);
                    break;
                case '30d':
                    start.setDate(start.getDate() - 30);
                    break;
                case '90d':
                    start.setDate(start.getDate() - 90);
                    break;
                case 'year':
                    start.setFullYear(start.getFullYear() - 1);
                    break;
            }
            state.timeRange = {
                start: start.toISOString(),
                end: end.toISOString(),
            };
        },
        // Filters management
        setInsightsFilters: (state, action) => {
            state.insightsFilters = { ...state.insightsFilters, ...action.payload };
        },
        setRecapsFilters: (state, action) => {
            state.recapsFilters = { ...state.recapsFilters, ...action.payload };
        },
        // Local state management
        clearInsights: (state) => {
            state.insights = [];
        },
        clearRecaps: (state) => {
            state.recaps = [];
        },
        clearKPIs: (state) => {
            state.kpis = null;
        },
        clearAllData: (state) => {
            state.insights = [];
            state.recaps = [];
            state.kpis = null;
        },
        // Error management
        clearError: (state) => {
            state.lastError = undefined;
        },
        clearAllErrors: (state) => {
            state.errors = [];
            state.lastError = undefined;
        },
        // Restore data (used during store initialization)
        restoreInsights: (state, action) => {
            state.insights = action.payload || [];
        },
        restoreRecaps: (state, action) => {
            state.recaps = action.payload || [];
        },
        restoreKPIs: (state, action) => {
            state.kpis = action.payload;
        },
    },
    extraReducers: (builder) => {
        // ==================== Fetch Dashboard Data ====================
        builder
            .addCase(exports.fetchDashboardData.pending, (state) => {
            state.isLoadingDashboard = true;
            state.lastError = undefined;
        })
            .addCase(exports.fetchDashboardData.fulfilled, (state, action) => {
            state.isLoadingDashboard = false;
            if (action.payload.kpis) {
                state.kpis = action.payload.kpis;
            }
            if (action.payload.insights) {
                state.insights = action.payload.insights;
            }
            if (action.payload.recaps) {
                state.recaps = action.payload.recaps;
            }
            state.lastRefresh = new Date().toISOString();
            logger_1.logger.info('Dashboard data loaded successfully', {
                component: 'insightsSlice',
                operation: 'dashboardDataLoaded'
            });
        })
            .addCase(exports.fetchDashboardData.rejected, (state, action) => {
            state.isLoadingDashboard = false;
            state.lastError = action.error.message;
            state.errors.push(`Dashboard Data: ${action.error.message}`);
        });
        // ==================== Fetch Insights ====================
        builder
            .addCase(exports.fetchInsights.pending, (state) => {
            state.isLoadingInsights = true;
            state.lastError = undefined;
        })
            .addCase(exports.fetchInsights.fulfilled, (state, action) => {
            state.isLoadingInsights = false;
            state.insights = action.payload;
            logger_1.logger.info(`Loaded ${action.payload.length} insights`, {
                component: 'insightsSlice',
                operation: `loaded${action.payload.length}Insights`
            });
        })
            .addCase(exports.fetchInsights.rejected, (state, action) => {
            state.isLoadingInsights = false;
            state.lastError = action.error.message;
            state.errors.push(`Fetch Insights: ${action.error.message}`);
        });
        // ==================== Dismiss Insight ====================
        builder
            .addCase(exports.dismissInsight.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.dismissInsight.fulfilled, (state, action) => {
            const insight = state.insights.find(i => i.id === action.payload);
            if (insight) {
                insight.dismissed = true;
                insight.updatedAt = new Date().toISOString();
            }
            logger_1.logger.info('Insight dismissed', {
                component: 'insightsSlice',
                operation: 'insightDismissed',
                metadata: { id: action.payload }
            });
        })
            .addCase(exports.dismissInsight.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`Dismiss Insight: ${action.error.message}`);
        });
        // ==================== Rate Insight ====================
        builder
            .addCase(exports.rateInsight.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.rateInsight.fulfilled, (state, action) => {
            const insight = state.insights.find(i => i.id === action.payload.id);
            if (insight) {
                insight.userRating = action.payload.rating;
                insight.updatedAt = new Date().toISOString();
            }
            logger_1.logger.info('Insight rated', {
                component: 'insightsSlice',
                operation: 'insightRated',
                metadata: action.payload
            });
        })
            .addCase(exports.rateInsight.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`Rate Insight: ${action.error.message}`);
        });
        // ==================== Mark Insight Helpful ====================
        builder
            .addCase(exports.markInsightHelpful.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.markInsightHelpful.fulfilled, (state, action) => {
            const insight = state.insights.find(i => i.id === action.payload.id);
            if (insight) {
                insight.markedHelpful = action.payload.helpful;
                insight.updatedAt = new Date().toISOString();
            }
            logger_1.logger.info('Insight marked helpful', {
                component: 'insightsSlice',
                operation: 'insightMarkedHelpful',
                metadata: action.payload
            });
        })
            .addCase(exports.markInsightHelpful.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`Mark Helpful: ${action.error.message}`);
        });
        // ==================== Add Insight Note ====================
        builder
            .addCase(exports.addInsightNote.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.addInsightNote.fulfilled, (state, action) => {
            const insight = state.insights.find(i => i.id === action.payload.id);
            if (insight) {
                insight.userNotes = action.payload.note;
                insight.updatedAt = new Date().toISOString();
            }
            logger_1.logger.info('Note added to insight', {
                component: 'insightsSlice',
                operation: 'noteAddedToInsight',
                metadata: { id: action.payload.id }
            });
        })
            .addCase(exports.addInsightNote.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`Add Note: ${action.error.message}`);
        });
        // ==================== Fetch Recaps ====================
        builder
            .addCase(exports.fetchRecaps.pending, (state) => {
            state.isLoadingRecaps = true;
            state.lastError = undefined;
        })
            .addCase(exports.fetchRecaps.fulfilled, (state, action) => {
            state.isLoadingRecaps = false;
            state.recaps = action.payload;
            logger_1.logger.info(`Loaded ${action.payload.length} recaps`, {
                component: 'insightsSlice',
                operation: `loaded${action.payload.length}Recaps`
            });
        })
            .addCase(exports.fetchRecaps.rejected, (state, action) => {
            state.isLoadingRecaps = false;
            state.lastError = action.error.message;
            state.errors.push(`Fetch Recaps: ${action.error.message}`);
        });
        // ==================== Toggle Recap Favorite ====================
        builder
            .addCase(exports.toggleRecapFavorite.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.toggleRecapFavorite.fulfilled, (state, action) => {
            const recap = state.recaps.find(r => r.id === action.payload.id);
            if (recap) {
                recap.favorited = action.payload.favorited;
            }
            logger_1.logger.info('Recap favorite toggled', {
                component: 'insightsSlice',
                operation: 'recapFavoriteToggled',
                metadata: action.payload
            });
        })
            .addCase(exports.toggleRecapFavorite.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`Toggle Favorite: ${action.error.message}`);
        });
        // ==================== Mark Recap Viewed ====================
        builder
            .addCase(exports.markRecapViewed.pending, (state) => {
            state.lastError = undefined;
        })
            .addCase(exports.markRecapViewed.fulfilled, (state, action) => {
            const recap = state.recaps.find(r => r.id === action.payload);
            if (recap) {
                recap.viewed = true;
            }
            logger_1.logger.info('Recap marked as viewed', {
                component: 'insightsSlice',
                operation: 'recapMarkedAsViewed',
                metadata: { id: action.payload }
            });
        })
            .addCase(exports.markRecapViewed.rejected, (state, action) => {
            state.lastError = action.error.message;
            state.errors.push(`Mark Viewed: ${action.error.message}`);
        });
        // ==================== Fetch KPI Metrics ====================
        builder
            .addCase(exports.fetchKPIMetrics.pending, (state) => {
            state.isLoadingKPIs = true;
            state.lastError = undefined;
        })
            .addCase(exports.fetchKPIMetrics.fulfilled, (state, action) => {
            state.isLoadingKPIs = false;
            state.kpis = action.payload;
            logger_1.logger.info('KPI metrics loaded', {
                component: 'insightsSlice',
                operation: 'kpiMetricsLoaded'
            });
        })
            .addCase(exports.fetchKPIMetrics.rejected, (state, action) => {
            state.isLoadingKPIs = false;
            state.lastError = action.error.message;
            state.errors.push(`Fetch KPIs: ${action.error.message}`);
        });
    },
});
// =====================================================================
// Export Actions
// =====================================================================
_a = insightsSlice.actions, exports.setTimeRange = _a.setTimeRange, exports.setTimeRangePreset = _a.setTimeRangePreset, exports.setInsightsFilters = _a.setInsightsFilters, exports.setRecapsFilters = _a.setRecapsFilters, exports.clearInsights = _a.clearInsights, exports.clearRecaps = _a.clearRecaps, exports.clearKPIs = _a.clearKPIs, exports.clearAllData = _a.clearAllData, exports.clearError = _a.clearError, exports.clearAllErrors = _a.clearAllErrors, exports.restoreInsights = _a.restoreInsights, exports.restoreRecaps = _a.restoreRecaps, exports.restoreKPIs = _a.restoreKPIs;
// =====================================================================
// Selectors
// =====================================================================
const selectKPIs = (state) => state.insights.kpis;
exports.selectKPIs = selectKPIs;
const selectInsights = (state) => state.insights.insights;
exports.selectInsights = selectInsights;
const selectRecaps = (state) => state.insights.recaps;
exports.selectRecaps = selectRecaps;
const selectTimeRange = (state) => state.insights.timeRange;
exports.selectTimeRange = selectTimeRange;
const selectInsightsFilters = (state) => state.insights.insightsFilters;
exports.selectInsightsFilters = selectInsightsFilters;
const selectRecapsFilters = (state) => state.insights.recapsFilters;
exports.selectRecapsFilters = selectRecapsFilters;
const selectIsLoadingDashboard = (state) => state.insights.isLoadingDashboard;
exports.selectIsLoadingDashboard = selectIsLoadingDashboard;
const selectIsLoadingInsights = (state) => state.insights.isLoadingInsights;
exports.selectIsLoadingInsights = selectIsLoadingInsights;
const selectIsLoadingRecaps = (state) => state.insights.isLoadingRecaps;
exports.selectIsLoadingRecaps = selectIsLoadingRecaps;
const selectIsLoadingKPIs = (state) => state.insights.isLoadingKPIs;
exports.selectIsLoadingKPIs = selectIsLoadingKPIs;
const selectLastRefresh = (state) => state.insights.lastRefresh;
exports.selectLastRefresh = selectLastRefresh;
const selectInsightsErrors = (state) => state.insights.errors;
exports.selectInsightsErrors = selectInsightsErrors;
const selectLastInsightsError = (state) => state.insights.lastError;
exports.selectLastInsightsError = selectLastInsightsError;
// Derived selectors
const selectNonDismissedInsights = (state) => state.insights.insights.filter(i => !i.dismissed);
exports.selectNonDismissedInsights = selectNonDismissedInsights;
const selectInsightsByCategory = (category) => (state) => state.insights.insights.filter(i => i.category === category && !i.dismissed);
exports.selectInsightsByCategory = selectInsightsByCategory;
const selectFavoritedRecaps = (state) => state.insights.recaps.filter(r => r.favorited);
exports.selectFavoritedRecaps = selectFavoritedRecaps;
const selectRecapsByType = (type) => (state) => state.insights.recaps.filter(r => r.type === type);
exports.selectRecapsByType = selectRecapsByType;
exports.default = insightsSlice.reducer;
