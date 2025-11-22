"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectFilteredSummaries = exports.selectGenerationProgress = exports.selectSummariesFilters = exports.selectSummariesError = exports.selectSummariesGenerating = exports.selectSummariesLoading = exports.selectSummaries = exports.setSummariesError = exports.setSummariesGenerating = exports.setSummariesLoading = exports.removeSummary = exports.addSummary = exports.setSummaries = exports.clearError = exports.setGenerationProgress = exports.setFilter = exports.exportSummary = exports.deleteSummary = exports.fetchSummaries = exports.generateSummary = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const logger_1 = require("../../utils/logger");
const initialState = {
    summaries: [],
    loading: false,
    generating: false,
    generationProgress: 0,
    error: null,
    filters: {
        category: 'all',
        sortBy: 'recent',
    },
};
// Async thunks for summary operations
/**
 * Generate a new summary
 */
exports.generateSummary = (0, toolkit_1.createAsyncThunk)('summaries/generate', async (params) => {
    if (typeof globalThis !== 'undefined' && globalThis.window?.api?.summary?.generate) {
        logger_1.logger.info('[summaries/generate] Generating summary', {
            component: 'summariesSlice',
            operation: 'generateSummary',
            metadata: params,
        });
        const result = await globalThis.window.api.summary.generate(params);
        if (result.success) {
            logger_1.logger.info('[summaries/generate] Summary generated successfully', {
                component: 'summariesSlice',
                operation: 'generateSummary',
                metadata: { id: result.summary.id },
            });
            return result.summary;
        }
        else {
            throw new Error(result.error || 'Failed to generate summary');
        }
    }
    throw new Error('Summary API not available');
});
/**
 * Fetch all summaries
 */
exports.fetchSummaries = (0, toolkit_1.createAsyncThunk)('summaries/fetchAll', async () => {
    if (typeof globalThis !== 'undefined' && globalThis.window?.api?.summary?.getAll) {
        logger_1.logger.info('[summaries/fetchAll] Fetching all summaries', {
            component: 'summariesSlice',
            operation: 'fetchSummaries',
        });
        const result = await globalThis.window.api.summary.getAll();
        if (result.success) {
            logger_1.logger.info('[summaries/fetchAll] Summaries fetched successfully', {
                component: 'summariesSlice',
                operation: 'fetchSummaries',
                metadata: { count: result.summaries.length },
            });
            return result.summaries;
        }
        else {
            throw new Error(result.error || 'Failed to fetch summaries');
        }
    }
    throw new Error('Summary API not available');
});
/**
 * Delete a summary
 */
exports.deleteSummary = (0, toolkit_1.createAsyncThunk)('summaries/delete', async (id) => {
    if (typeof globalThis !== 'undefined' && globalThis.window?.api?.summary?.delete) {
        logger_1.logger.info('[summaries/delete] Deleting summary', {
            component: 'summariesSlice',
            operation: 'deleteSummary',
            metadata: { id },
        });
        const result = await globalThis.window.api.summary.delete(id);
        if (result.success) {
            logger_1.logger.info('[summaries/delete] Summary deleted successfully', {
                component: 'summariesSlice',
                operation: 'deleteSummary',
                metadata: { id },
            });
            return id;
        }
        else {
            throw new Error(result.error || 'Failed to delete summary');
        }
    }
    throw new Error('Summary API not available');
});
/**
 * Export summary to markdown
 */
exports.exportSummary = (0, toolkit_1.createAsyncThunk)('summaries/export', async (id) => {
    if (typeof globalThis !== 'undefined' && globalThis.window?.api?.summary?.export) {
        logger_1.logger.info('[summaries/export] Exporting summary', {
            component: 'summariesSlice',
            operation: 'exportSummary',
            metadata: { id },
        });
        const result = await globalThis.window.api.summary.export(id, 'markdown');
        if (result.success) {
            logger_1.logger.info('[summaries/export] Summary exported successfully', {
                component: 'summariesSlice',
                operation: 'exportSummary',
                metadata: { id, path: result.path },
            });
            return result.path;
        }
        else {
            throw new Error(result.error || 'Failed to export summary');
        }
    }
    throw new Error('Summary API not available');
});
// Slice
const summariesSlice = (0, toolkit_1.createSlice)({
    name: 'summaries',
    initialState,
    reducers: {
        setFilter: (state, action) => {
            if (action.payload.category) {
                state.filters.category = action.payload.category;
            }
            if (action.payload.sortBy) {
                state.filters.sortBy = action.payload.sortBy;
            }
        },
        setGenerationProgress: (state, action) => {
            state.generationProgress = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        // Sync actions for web app API integration
        setSummaries: (state, action) => {
            state.summaries = action.payload;
        },
        addSummary: (state, action) => {
            state.summaries.unshift(action.payload);
            state.lastGenerated = new Date().toISOString();
        },
        removeSummary: (state, action) => {
            state.summaries = state.summaries.filter(s => s.id !== action.payload);
        },
        setSummariesLoading: (state, action) => {
            state.loading = action.payload;
        },
        setSummariesGenerating: (state, action) => {
            state.generating = action.payload;
            if (!action.payload) {
                state.generationProgress = 0;
            }
        },
        setSummariesError: (state, action) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Generate summary
            .addCase(exports.generateSummary.pending, (state) => {
            state.generating = true;
            state.generationProgress = 0;
            state.error = null;
        })
            .addCase(exports.generateSummary.fulfilled, (state, action) => {
            state.generating = false;
            state.generationProgress = 100;
            state.summaries.unshift(action.payload);
            state.lastGenerated = new Date().toISOString();
        })
            .addCase(exports.generateSummary.rejected, (state, action) => {
            state.generating = false;
            state.generationProgress = 0;
            state.error = action.error.message || 'Failed to generate summary';
            logger_1.logger.error('[summaries/generate] Generation failed', {
                component: 'summariesSlice',
                operation: 'generateSummary',
            }, action.error);
        })
            // Fetch summaries
            .addCase(exports.fetchSummaries.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(exports.fetchSummaries.fulfilled, (state, action) => {
            state.loading = false;
            state.summaries = action.payload;
        })
            .addCase(exports.fetchSummaries.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch summaries';
            logger_1.logger.error('[summaries/fetchAll] Fetch failed', {
                component: 'summariesSlice',
                operation: 'fetchSummaries',
            }, action.error);
        })
            // Delete summary
            .addCase(exports.deleteSummary.fulfilled, (state, action) => {
            state.summaries = state.summaries.filter(s => s.id !== action.payload);
        })
            .addCase(exports.deleteSummary.rejected, (state, action) => {
            state.error = action.error.message || 'Failed to delete summary';
            logger_1.logger.error('[summaries/delete] Deletion failed', {
                component: 'summariesSlice',
                operation: 'deleteSummary',
            }, action.error);
        })
            // Export summary
            .addCase(exports.exportSummary.rejected, (state, action) => {
            state.error = action.error.message || 'Failed to export summary';
            logger_1.logger.error('[summaries/export] Export failed', {
                component: 'summariesSlice',
                operation: 'exportSummary',
            }, action.error);
        });
    },
});
_a = summariesSlice.actions, exports.setFilter = _a.setFilter, exports.setGenerationProgress = _a.setGenerationProgress, exports.clearError = _a.clearError, exports.setSummaries = _a.setSummaries, exports.addSummary = _a.addSummary, exports.removeSummary = _a.removeSummary, exports.setSummariesLoading = _a.setSummariesLoading, exports.setSummariesGenerating = _a.setSummariesGenerating, exports.setSummariesError = _a.setSummariesError;
exports.default = summariesSlice.reducer;
// Selectors
const selectSummaries = (state) => state.summaries.summaries;
exports.selectSummaries = selectSummaries;
const selectSummariesLoading = (state) => state.summaries.loading;
exports.selectSummariesLoading = selectSummariesLoading;
const selectSummariesGenerating = (state) => state.summaries.generating;
exports.selectSummariesGenerating = selectSummariesGenerating;
const selectSummariesError = (state) => state.summaries.error;
exports.selectSummariesError = selectSummariesError;
const selectSummariesFilters = (state) => state.summaries.filters;
exports.selectSummariesFilters = selectSummariesFilters;
const selectGenerationProgress = (state) => state.summaries.generationProgress;
exports.selectGenerationProgress = selectGenerationProgress;
const selectFilteredSummaries = (state) => {
    const { summaries, filters } = state.summaries;
    // Filter by category
    let filtered = summaries;
    if (filters.category !== 'all') {
        filtered = filtered.filter(s => s.summaryType === filters.category);
    }
    // Sort
    if (filters.sortBy === 'recent') {
        filtered = [...filtered].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }
    else {
        filtered = [...filtered].sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
    }
    return filtered;
};
exports.selectFilteredSummaries = selectFilteredSummaries;
