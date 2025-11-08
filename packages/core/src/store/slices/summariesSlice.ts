import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';

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
  generationProgress: number; // 0-100
  error: string | null;
  filters: {
    category: 'all' | 'tasks' | 'journal' | 'combined';
    sortBy: 'recent' | 'oldest';
  };
  lastGenerated?: string;
}

const initialState: SummariesState = {
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
export const generateSummary = createAsyncThunk(
  'summaries/generate',
  async (params: {
    startDate: string;
    endDate: string;
    types: ('tasks' | 'journal')[];
  }) => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.api?.summary?.generate) {
      logger.info('[summaries/generate] Generating summary', {
        component: 'summariesSlice',
        operation: 'generateSummary',
        metadata: params,
      });

      const result = await (globalThis as any).window.api.summary.generate(params);

      if (result.success) {
        logger.info('[summaries/generate] Summary generated successfully', {
          component: 'summariesSlice',
          operation: 'generateSummary',
          metadata: { id: result.summary.id },
        });
        return result.summary;
      } else {
        throw new Error(result.error || 'Failed to generate summary');
      }
    }
    throw new Error('Summary API not available');
  }
);

/**
 * Fetch all summaries
 */
export const fetchSummaries = createAsyncThunk(
  'summaries/fetchAll',
  async () => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.api?.summary?.getAll) {
      logger.info('[summaries/fetchAll] Fetching all summaries', {
        component: 'summariesSlice',
        operation: 'fetchSummaries',
      });

      const result = await (globalThis as any).window.api.summary.getAll();

      if (result.success) {
        logger.info('[summaries/fetchAll] Summaries fetched successfully', {
          component: 'summariesSlice',
          operation: 'fetchSummaries',
          metadata: { count: result.summaries.length },
        });
        return result.summaries;
      } else {
        throw new Error(result.error || 'Failed to fetch summaries');
      }
    }
    throw new Error('Summary API not available');
  }
);

/**
 * Delete a summary
 */
export const deleteSummary = createAsyncThunk(
  'summaries/delete',
  async (id: string) => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.api?.summary?.delete) {
      logger.info('[summaries/delete] Deleting summary', {
        component: 'summariesSlice',
        operation: 'deleteSummary',
        metadata: { id },
      });

      const result = await (globalThis as any).window.api.summary.delete(id);

      if (result.success) {
        logger.info('[summaries/delete] Summary deleted successfully', {
          component: 'summariesSlice',
          operation: 'deleteSummary',
          metadata: { id },
        });
        return id;
      } else {
        throw new Error(result.error || 'Failed to delete summary');
      }
    }
    throw new Error('Summary API not available');
  }
);

/**
 * Export summary to markdown
 */
export const exportSummary = createAsyncThunk(
  'summaries/export',
  async (id: string) => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).window?.api?.summary?.export) {
      logger.info('[summaries/export] Exporting summary', {
        component: 'summariesSlice',
        operation: 'exportSummary',
        metadata: { id },
      });

      const result = await (globalThis as any).window.api.summary.export(id, 'markdown');

      if (result.success) {
        logger.info('[summaries/export] Summary exported successfully', {
          component: 'summariesSlice',
          operation: 'exportSummary',
          metadata: { id, path: result.path },
        });
        return result.path;
      } else {
        throw new Error(result.error || 'Failed to export summary');
      }
    }
    throw new Error('Summary API not available');
  }
);

// Slice
const summariesSlice = createSlice({
  name: 'summaries',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<{ category?: 'all' | 'tasks' | 'journal' | 'combined'; sortBy?: 'recent' | 'oldest' }>) => {
      if (action.payload.category) {
        state.filters.category = action.payload.category;
      }
      if (action.payload.sortBy) {
        state.filters.sortBy = action.payload.sortBy;
      }
    },

    setGenerationProgress: (state, action: PayloadAction<number>) => {
      state.generationProgress = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate summary
      .addCase(generateSummary.pending, (state) => {
        state.generating = true;
        state.generationProgress = 0;
        state.error = null;
      })
      .addCase(generateSummary.fulfilled, (state, action) => {
        state.generating = false;
        state.generationProgress = 100;
        state.summaries.unshift(action.payload);
        state.lastGenerated = new Date().toISOString();
      })
      .addCase(generateSummary.rejected, (state, action) => {
        state.generating = false;
        state.generationProgress = 0;
        state.error = action.error.message || 'Failed to generate summary';
        logger.error('[summaries/generate] Generation failed', {
          component: 'summariesSlice',
          operation: 'generateSummary',
        }, action.error as Error);
      })

      // Fetch summaries
      .addCase(fetchSummaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSummaries.fulfilled, (state, action) => {
        state.loading = false;
        state.summaries = action.payload;
      })
      .addCase(fetchSummaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch summaries';
        logger.error('[summaries/fetchAll] Fetch failed', {
          component: 'summariesSlice',
          operation: 'fetchSummaries',
        }, action.error as Error);
      })

      // Delete summary
      .addCase(deleteSummary.fulfilled, (state, action) => {
        state.summaries = state.summaries.filter(s => s.id !== action.payload);
      })
      .addCase(deleteSummary.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete summary';
        logger.error('[summaries/delete] Deletion failed', {
          component: 'summariesSlice',
          operation: 'deleteSummary',
        }, action.error as Error);
      })

      // Export summary
      .addCase(exportSummary.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to export summary';
        logger.error('[summaries/export] Export failed', {
          component: 'summariesSlice',
          operation: 'exportSummary',
        }, action.error as Error);
      });
  },
});

export const { setFilter, setGenerationProgress, clearError } = summariesSlice.actions;
export default summariesSlice.reducer;

// Selectors
export const selectSummaries = (state: { summaries: SummariesState }) => state.summaries.summaries;
export const selectSummariesLoading = (state: { summaries: SummariesState }) => state.summaries.loading;
export const selectSummariesGenerating = (state: { summaries: SummariesState }) => state.summaries.generating;
export const selectSummariesError = (state: { summaries: SummariesState }) => state.summaries.error;
export const selectSummariesFilters = (state: { summaries: SummariesState }) => state.summaries.filters;
export const selectGenerationProgress = (state: { summaries: SummariesState }) => state.summaries.generationProgress;

export const selectFilteredSummaries = (state: { summaries: SummariesState }) => {
  const { summaries, filters } = state.summaries;

  // Filter by category
  let filtered = summaries;
  if (filters.category !== 'all') {
    filtered = filtered.filter(s => s.summaryType === filters.category);
  }

  // Sort
  if (filters.sortBy === 'recent') {
    filtered = [...filtered].sort((a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  } else {
    filtered = [...filtered].sort((a, b) =>
      new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
    );
  }

  return filtered;
};
