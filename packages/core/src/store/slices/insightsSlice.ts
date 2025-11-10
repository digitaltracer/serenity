import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';

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
  // Feedback fields
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
  // Interaction tracking
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
  // Dashboard data
  kpis: KPIMetrics | null;
  insights: AIInsightEnhanced[];
  recaps: AIRecapEnhanced[];

  // Filters
  timeRange: TimeRange;
  insightsFilters: InsightsFilters;
  recapsFilters: RecapsFilters;

  // Loading states
  isLoadingDashboard: boolean;
  isLoadingInsights: boolean;
  isLoadingRecaps: boolean;
  isLoadingKPIs: boolean;
  isLoadingVisualization: boolean;

  // Error handling
  lastError?: string;
  errors: string[];

  // Last refresh timestamp
  lastRefresh?: string;
}

/**
 * Initial state with default 7-day time range
 */
const getDefaultTimeRange = (): TimeRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const initialState: InsightsState = {
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
export const fetchDashboardData = createAsyncThunk(
  'insights/fetchDashboardData',
  async (params: {
    timeRange?: TimeRange;
    includeKPIs?: boolean;
    includeInsights?: boolean;
    includeRecaps?: boolean;
  } = {}, { getState }) => {
    const state = getState() as { insights: InsightsState };
    const timeRange = params.timeRange || state.insights.timeRange;

    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.getDashboardData) {
      logger.info('Fetching dashboard data via IPC', {
        component: 'insightsSlice',
        operation: 'fetchingDashboardData',
        metadata: { timeRange, params }
      });

      const result = await (window.electronAPI as any).insights.getDashboardData({
        timeRange,
        includeKPIs: params.includeKPIs ?? true,
        includeInsights: params.includeInsights ?? true,
        includeRecaps: params.includeRecaps ?? true,
      });

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Fetch insights with filters
 */
export const fetchInsights = createAsyncThunk(
  'insights/fetchInsights',
  async (filters: InsightsFilters | undefined, { getState }) => {
    const state = getState() as { insights: InsightsState };
    const finalFilters = filters || state.insights.insightsFilters;

    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.getInsights) {
      logger.info('Fetching insights via IPC', {
        component: 'insightsSlice',
        operation: 'fetchingInsights',
        metadata: { filters: finalFilters }
      });

      const result = await (window.electronAPI as any).insights.getInsights(finalFilters);

      if (result.success) {
        return result.insights;
      } else {
        throw new Error(result.error || 'Failed to fetch insights');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Dismiss an insight
 */
export const dismissInsight = createAsyncThunk(
  'insights/dismissInsight',
  async (id: string) => {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.dismiss) {
      logger.info('Dismissing insight', {
        component: 'insightsSlice',
        operation: 'dismissingInsight',
        metadata: { id }
      });

      const result = await (window.electronAPI as any).insights.dismiss(id);

      if (result.success) {
        return id;
      } else {
        throw new Error(result.error || 'Failed to dismiss insight');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Rate an insight
 */
export const rateInsight = createAsyncThunk(
  'insights/rateInsight',
  async ({ id, rating }: { id: string; rating: number }) => {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.updateFeedback) {
      logger.info('Rating insight', {
        component: 'insightsSlice',
        operation: 'ratingInsight',
        metadata: { id, rating }
      });

      const result = await (window.electronAPI as any).insights.updateFeedback(id, {
        userRating: rating,
      });

      if (result.success) {
        return { id, rating };
      } else {
        throw new Error(result.error || 'Failed to rate insight');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Mark insight as helpful
 */
export const markInsightHelpful = createAsyncThunk(
  'insights/markHelpful',
  async ({ id, helpful }: { id: string; helpful: boolean }) => {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.updateFeedback) {
      logger.info('Marking insight helpful', {
        component: 'insightsSlice',
        operation: 'markingInsightHelpful',
        metadata: { id, helpful }
      });

      const result = await (window.electronAPI as any).insights.updateFeedback(id, {
        markedHelpful: helpful,
      });

      if (result.success) {
        return { id, helpful };
      } else {
        throw new Error(result.error || 'Failed to mark insight as helpful');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Add note to insight
 */
export const addInsightNote = createAsyncThunk(
  'insights/addNote',
  async ({ id, note }: { id: string; note: string }) => {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.updateFeedback) {
      logger.info('Adding note to insight', {
        component: 'insightsSlice',
        operation: 'addingNoteToInsight',
        metadata: { id, noteLength: note.length }
      });

      const result = await (window.electronAPI as any).insights.updateFeedback(id, {
        userNotes: note,
      });

      if (result.success) {
        return { id, note };
      } else {
        throw new Error(result.error || 'Failed to add note to insight');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Fetch recaps with filters
 */
export const fetchRecaps = createAsyncThunk(
  'insights/fetchRecaps',
  async (filters: RecapsFilters | undefined, { getState }) => {
    const state = getState() as { insights: InsightsState };
    const finalFilters = filters || state.insights.recapsFilters;

    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.getRecaps) {
      logger.info('Fetching recaps via IPC', {
        component: 'insightsSlice',
        operation: 'fetchingRecaps',
        metadata: { filters: finalFilters }
      });

      const result = await (window.electronAPI as any).insights.getRecaps(finalFilters);

      if (result.success) {
        return result.recaps;
      } else {
        throw new Error(result.error || 'Failed to fetch recaps');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Toggle recap favorite status
 */
export const toggleRecapFavorite = createAsyncThunk(
  'insights/toggleRecapFavorite',
  async ({ id, favorited }: { id: string; favorited: boolean }) => {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.updateRecapInteraction) {
      logger.info('Toggling recap favorite', {
        component: 'insightsSlice',
        operation: 'togglingRecapFavorite',
        metadata: { id, favorited }
      });

      const result = await (window.electronAPI as any).insights.updateRecapInteraction(id, {
        favorited,
      });

      if (result.success) {
        return { id, favorited };
      } else {
        throw new Error(result.error || 'Failed to toggle recap favorite');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Mark recap as viewed
 */
export const markRecapViewed = createAsyncThunk(
  'insights/markRecapViewed',
  async (id: string) => {
    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.updateRecapInteraction) {
      logger.info('Marking recap as viewed', {
        component: 'insightsSlice',
        operation: 'markingRecapAsViewed',
        metadata: { id }
      });

      const result = await (window.electronAPI as any).insights.updateRecapInteraction(id, {
        viewed: true,
      });

      if (result.success) {
        return id;
      } else {
        throw new Error(result.error || 'Failed to mark recap as viewed');
      }
    }
    throw new Error('Insights API not available');
  }
);

/**
 * Fetch KPI metrics
 */
export const fetchKPIMetrics = createAsyncThunk(
  'insights/fetchKPIMetrics',
  async (timeRange: TimeRange | undefined, { getState }) => {
    const state = getState() as { insights: InsightsState };
    const finalTimeRange = timeRange || state.insights.timeRange;

    if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.getKPIMetrics) {
      logger.info('Fetching KPI metrics via IPC', {
        component: 'insightsSlice',
        operation: 'fetchingKpiMetrics',
        metadata: { timeRange: finalTimeRange }
      });

      const result = await (window.electronAPI as any).insights.getKPIMetrics({
        timeRange: finalTimeRange,
      });

      if (result.success) {
        return result.kpis;
      } else {
        throw new Error(result.error || 'Failed to fetch KPI metrics');
      }
    }
    throw new Error('Insights API not available');
  }
);

// =====================================================================
// Slice
// =====================================================================

const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    // Time range management
    setTimeRange: (state, action: PayloadAction<TimeRange>) => {
      state.timeRange = action.payload;
    },

    setTimeRangePreset: (state, action: PayloadAction<'7d' | '30d' | '90d' | 'year'>) => {
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
    setInsightsFilters: (state, action: PayloadAction<Partial<InsightsFilters>>) => {
      state.insightsFilters = { ...state.insightsFilters, ...action.payload };
    },

    setRecapsFilters: (state, action: PayloadAction<Partial<RecapsFilters>>) => {
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
    restoreInsights: (state, action: PayloadAction<AIInsightEnhanced[]>) => {
      state.insights = action.payload || [];
    },

    restoreRecaps: (state, action: PayloadAction<AIRecapEnhanced[]>) => {
      state.recaps = action.payload || [];
    },

    restoreKPIs: (state, action: PayloadAction<KPIMetrics>) => {
      state.kpis = action.payload;
    },
  },

  extraReducers: (builder) => {
    // ==================== Fetch Dashboard Data ====================
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoadingDashboard = true;
        state.lastError = undefined;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
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
        logger.info('Dashboard data loaded successfully', {
          component: 'insightsSlice',
          operation: 'dashboardDataLoaded'
        });
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoadingDashboard = false;
        state.lastError = action.error.message;
        state.errors.push(`Dashboard Data: ${action.error.message}`);
      });

    // ==================== Fetch Insights ====================
    builder
      .addCase(fetchInsights.pending, (state) => {
        state.isLoadingInsights = true;
        state.lastError = undefined;
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.isLoadingInsights = false;
        state.insights = action.payload;
        logger.info(`Loaded ${action.payload.length} insights`, {
          component: 'insightsSlice',
          operation: `loaded${action.payload.length}Insights`
        });
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.isLoadingInsights = false;
        state.lastError = action.error.message;
        state.errors.push(`Fetch Insights: ${action.error.message}`);
      });

    // ==================== Dismiss Insight ====================
    builder
      .addCase(dismissInsight.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(dismissInsight.fulfilled, (state, action) => {
        const insight = state.insights.find(i => i.id === action.payload);
        if (insight) {
          insight.dismissed = true;
          insight.updatedAt = new Date().toISOString();
        }
        logger.info('Insight dismissed', {
          component: 'insightsSlice',
          operation: 'insightDismissed',
          metadata: { id: action.payload }
        });
      })
      .addCase(dismissInsight.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`Dismiss Insight: ${action.error.message}`);
      });

    // ==================== Rate Insight ====================
    builder
      .addCase(rateInsight.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(rateInsight.fulfilled, (state, action) => {
        const insight = state.insights.find(i => i.id === action.payload.id);
        if (insight) {
          insight.userRating = action.payload.rating;
          insight.updatedAt = new Date().toISOString();
        }
        logger.info('Insight rated', {
          component: 'insightsSlice',
          operation: 'insightRated',
          metadata: action.payload
        });
      })
      .addCase(rateInsight.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`Rate Insight: ${action.error.message}`);
      });

    // ==================== Mark Insight Helpful ====================
    builder
      .addCase(markInsightHelpful.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(markInsightHelpful.fulfilled, (state, action) => {
        const insight = state.insights.find(i => i.id === action.payload.id);
        if (insight) {
          insight.markedHelpful = action.payload.helpful;
          insight.updatedAt = new Date().toISOString();
        }
        logger.info('Insight marked helpful', {
          component: 'insightsSlice',
          operation: 'insightMarkedHelpful',
          metadata: action.payload
        });
      })
      .addCase(markInsightHelpful.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`Mark Helpful: ${action.error.message}`);
      });

    // ==================== Add Insight Note ====================
    builder
      .addCase(addInsightNote.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(addInsightNote.fulfilled, (state, action) => {
        const insight = state.insights.find(i => i.id === action.payload.id);
        if (insight) {
          insight.userNotes = action.payload.note;
          insight.updatedAt = new Date().toISOString();
        }
        logger.info('Note added to insight', {
          component: 'insightsSlice',
          operation: 'noteAddedToInsight',
          metadata: { id: action.payload.id }
        });
      })
      .addCase(addInsightNote.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`Add Note: ${action.error.message}`);
      });

    // ==================== Fetch Recaps ====================
    builder
      .addCase(fetchRecaps.pending, (state) => {
        state.isLoadingRecaps = true;
        state.lastError = undefined;
      })
      .addCase(fetchRecaps.fulfilled, (state, action) => {
        state.isLoadingRecaps = false;
        state.recaps = action.payload;
        logger.info(`Loaded ${action.payload.length} recaps`, {
          component: 'insightsSlice',
          operation: `loaded${action.payload.length}Recaps`
        });
      })
      .addCase(fetchRecaps.rejected, (state, action) => {
        state.isLoadingRecaps = false;
        state.lastError = action.error.message;
        state.errors.push(`Fetch Recaps: ${action.error.message}`);
      });

    // ==================== Toggle Recap Favorite ====================
    builder
      .addCase(toggleRecapFavorite.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(toggleRecapFavorite.fulfilled, (state, action) => {
        const recap = state.recaps.find(r => r.id === action.payload.id);
        if (recap) {
          recap.favorited = action.payload.favorited;
        }
        logger.info('Recap favorite toggled', {
          component: 'insightsSlice',
          operation: 'recapFavoriteToggled',
          metadata: action.payload
        });
      })
      .addCase(toggleRecapFavorite.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`Toggle Favorite: ${action.error.message}`);
      });

    // ==================== Mark Recap Viewed ====================
    builder
      .addCase(markRecapViewed.pending, (state) => {
        state.lastError = undefined;
      })
      .addCase(markRecapViewed.fulfilled, (state, action) => {
        const recap = state.recaps.find(r => r.id === action.payload);
        if (recap) {
          recap.viewed = true;
        }
        logger.info('Recap marked as viewed', {
          component: 'insightsSlice',
          operation: 'recapMarkedAsViewed',
          metadata: { id: action.payload }
        });
      })
      .addCase(markRecapViewed.rejected, (state, action) => {
        state.lastError = action.error.message;
        state.errors.push(`Mark Viewed: ${action.error.message}`);
      });

    // ==================== Fetch KPI Metrics ====================
    builder
      .addCase(fetchKPIMetrics.pending, (state) => {
        state.isLoadingKPIs = true;
        state.lastError = undefined;
      })
      .addCase(fetchKPIMetrics.fulfilled, (state, action) => {
        state.isLoadingKPIs = false;
        state.kpis = action.payload;
        logger.info('KPI metrics loaded', {
          component: 'insightsSlice',
          operation: 'kpiMetricsLoaded'
        });
      })
      .addCase(fetchKPIMetrics.rejected, (state, action) => {
        state.isLoadingKPIs = false;
        state.lastError = action.error.message;
        state.errors.push(`Fetch KPIs: ${action.error.message}`);
      });
  },
});

// =====================================================================
// Export Actions
// =====================================================================

export const {
  setTimeRange,
  setTimeRangePreset,
  setInsightsFilters,
  setRecapsFilters,
  clearInsights,
  clearRecaps,
  clearKPIs,
  clearAllData,
  clearError,
  clearAllErrors,
  restoreInsights,
  restoreRecaps,
  restoreKPIs,
} = insightsSlice.actions;

// =====================================================================
// Selectors
// =====================================================================

export const selectKPIs = (state: { insights: InsightsState }) => state.insights.kpis;
export const selectInsights = (state: { insights: InsightsState }) => state.insights.insights;
export const selectRecaps = (state: { insights: InsightsState }) => state.insights.recaps;
export const selectTimeRange = (state: { insights: InsightsState }) => state.insights.timeRange;
export const selectInsightsFilters = (state: { insights: InsightsState }) => state.insights.insightsFilters;
export const selectRecapsFilters = (state: { insights: InsightsState }) => state.insights.recapsFilters;
export const selectIsLoadingDashboard = (state: { insights: InsightsState }) => state.insights.isLoadingDashboard;
export const selectIsLoadingInsights = (state: { insights: InsightsState }) => state.insights.isLoadingInsights;
export const selectIsLoadingRecaps = (state: { insights: InsightsState }) => state.insights.isLoadingRecaps;
export const selectIsLoadingKPIs = (state: { insights: InsightsState }) => state.insights.isLoadingKPIs;
export const selectLastRefresh = (state: { insights: InsightsState }) => state.insights.lastRefresh;
export const selectInsightsErrors = (state: { insights: InsightsState }) => state.insights.errors;
export const selectLastInsightsError = (state: { insights: InsightsState }) => state.insights.lastError;

// Derived selectors
export const selectNonDismissedInsights = (state: { insights: InsightsState }) =>
  state.insights.insights.filter(i => !i.dismissed);

export const selectInsightsByCategory = (category: string) => (state: { insights: InsightsState }) =>
  state.insights.insights.filter(i => i.category === category && !i.dismissed);

export const selectFavoritedRecaps = (state: { insights: InsightsState }) =>
  state.insights.recaps.filter(r => r.favorited);

export const selectRecapsByType = (type: 'weekly' | 'monthly') => (state: { insights: InsightsState }) =>
  state.insights.recaps.filter(r => r.type === type);

export default insightsSlice.reducer;
