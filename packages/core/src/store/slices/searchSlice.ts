/**
 * Search State Management Slice
 * Manages global search state, filters, and results
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  SearchQuery, 
  SearchFilters, 
  SearchResult, 
  SearchSuggestion,
  ContentType,
  SortOption,
  searchEngine
} from '../../utils/searchEngine';
import { Task, JournalEntry, Project } from '../../types';

export interface SearchState {
  // Current search
  query: SearchQuery;
  results: SearchResult[];
  isSearching: boolean;
  
  // UI state
  isGlobalSearchOpen: boolean;
  isAdvancedFiltersOpen: boolean;
  
  // Suggestions
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  
  // Search history
  searchHistory: Array<{
    query: string;
    timestamp: Date;
    resultCount: number;
  }>;
  
  // Performance
  lastSearchTime: number;
  
  // Error handling
  error: string | null;
}

const defaultFilters: SearchFilters = {
  contentTypes: ['tasks', 'journal', 'projects'],
  taskStatus: 'all',
  priority: 'all',
  tags: [],
  tagMode: 'any',
  projectIds: [],
  mood: 'all',
};

const initialState: SearchState = {
  query: {
    text: '',
    filters: defaultFilters,
    sortBy: 'relevance',
    sortOrder: 'desc',
  },
  results: [],
  isSearching: false,
  isGlobalSearchOpen: false,
  isAdvancedFiltersOpen: false,
  suggestions: [],
  recentSearches: [],
  searchHistory: [],
  lastSearchTime: 0,
  error: null,
};

// Async thunks
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (
    {
      tasks,
      journalEntries,
      projects,
      query
    }: {
      tasks: Task[];
      journalEntries: JournalEntry[];
      projects: Project[];
      query: SearchQuery;
    },
    { rejectWithValue }
  ) => {
    try {
      const startTime = performance.now();

      // Check if we're in web environment (no window.electronAPI)
      const isWeb = typeof window !== 'undefined' && !(window as any).electronAPI;

      if (isWeb && query.text.trim()) {
        // Use API for web environment
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.text)}&types=${query.filters.contentTypes.join(',')}&limit=50`
        );

        if (!response.ok) {
          throw new Error('Search API failed');
        }

        const data = await response.json();
        const searchTime = performance.now() - startTime;

        // Transform API results to match SearchResult format
        const transformedResults: SearchResult[] = data.results.map((item: any) => ({
          item,
          type: item.type,
          score: item.score || 1.0,
          highlights: [],
          matchedFields: item.matchedFields || []
        }));

        return {
          results: transformedResults,
          searchTime,
          resultCount: transformedResults.length,
        };
      }

      // Desktop environment or empty query - use local search
      const allResults: SearchResult[] = [];

      // Search tasks
      if (query.filters.contentTypes.includes('tasks')) {
        const taskResults = searchEngine.search(tasks, query, 'tasks');
        allResults.push(...taskResults);
      }

      // Search journal entries
      if (query.filters.contentTypes.includes('journal')) {
        const journalResults = searchEngine.search(journalEntries, query, 'journal');
        allResults.push(...journalResults);
      }

      // Search projects
      if (query.filters.contentTypes.includes('projects')) {
        const projectResults = searchEngine.search(projects, query, 'projects');
        allResults.push(...projectResults);
      }

      // Sort combined results by relevance
      const sortedResults = allResults.sort((a, b) => {
        if (query.sortBy === 'relevance') {
          return b.score - a.score;
        }
        // Other sorting handled within individual searches
        return 0;
      });

      const searchTime = performance.now() - startTime;

      return {
        results: sortedResults,
        searchTime,
        resultCount: sortedResults.length,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Search failed');
    }
  }
);

export const loadSuggestions = createAsyncThunk(
  'search/loadSuggestions',
  async (
    {
      query,
      availableTags,
      availableProjects,
    }: {
      query: string;
      availableTags: string[];
      availableProjects: Project[];
    }
  ) => {
    const suggestions = searchEngine.getSuggestions(query, availableTags, availableProjects);
    return suggestions;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Query management
    setSearchText: (state, action: PayloadAction<string>) => {
      state.query.text = action.payload;
    },
    
    setSearchQuery: (state, action: PayloadAction<SearchQuery>) => {
      state.query = action.payload;
    },
    
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.query.filters = { ...state.query.filters, ...action.payload };
    },
    
    setSortOption: (state, action: PayloadAction<{ sortBy: SortOption; sortOrder: 'asc' | 'desc' }>) => {
      const { sortBy, sortOrder } = action.payload;
      state.query.sortBy = sortBy;
      state.query.sortOrder = sortOrder;
    },
    
    // Content type filters
    toggleContentType: (state, action: PayloadAction<ContentType>) => {
      const contentType = action.payload;
      const currentTypes = state.query.filters.contentTypes;
      
      if (currentTypes.includes(contentType)) {
        state.query.filters.contentTypes = currentTypes.filter(type => type !== contentType);
      } else {
        state.query.filters.contentTypes.push(contentType);
      }
    },
    
    setContentTypes: (state, action: PayloadAction<ContentType[]>) => {
      state.query.filters.contentTypes = action.payload;
    },
    
    // Tag filters
    addTagFilter: (state, action: PayloadAction<string>) => {
      const tag = action.payload;
      if (!state.query.filters.tags.includes(tag)) {
        state.query.filters.tags.push(tag);
      }
    },
    
    removeTagFilter: (state, action: PayloadAction<string>) => {
      const tag = action.payload;
      state.query.filters.tags = state.query.filters.tags.filter(t => t !== tag);
    },
    
    setTagFilters: (state, action: PayloadAction<string[]>) => {
      state.query.filters.tags = action.payload;
    },
    
    setTagMode: (state, action: PayloadAction<'any' | 'all' | 'none'>) => {
      state.query.filters.tagMode = action.payload;
    },
    
    // Project filters
    addProjectFilter: (state, action: PayloadAction<string>) => {
      const projectId = action.payload;
      if (!state.query.filters.projectIds.includes(projectId)) {
        state.query.filters.projectIds.push(projectId);
      }
    },
    
    removeProjectFilter: (state, action: PayloadAction<string>) => {
      const projectId = action.payload;
      state.query.filters.projectIds = state.query.filters.projectIds.filter(id => id !== projectId);
    },
    
    setProjectFilters: (state, action: PayloadAction<string[]>) => {
      state.query.filters.projectIds = action.payload;
    },
    
    // Date filters
    setDateRange: (state, action: PayloadAction<{ start?: Date; end?: Date } | undefined>) => {
      state.query.filters.dateRange = action.payload;
    },
    
    setDueDateRange: (state, action: PayloadAction<{ start?: Date; end?: Date } | undefined>) => {
      state.query.filters.dueDateRange = action.payload;
    },
    
    // Task-specific filters
    setTaskStatus: (state, action: PayloadAction<'completed' | 'pending' | 'all'>) => {
      state.query.filters.taskStatus = action.payload;
    },
    
    setPriority: (state, action: PayloadAction<'low' | 'medium' | 'high' | 'all'>) => {
      state.query.filters.priority = action.payload;
    },
    
    setHasSubtasks: (state, action: PayloadAction<boolean | undefined>) => {
      state.query.filters.hasSubtasks = action.payload;
    },
    
    setIsRecurring: (state, action: PayloadAction<boolean | undefined>) => {
      state.query.filters.isRecurring = action.payload;
    },
    
    // Journal-specific filters
    setMood: (state, action: PayloadAction<'happy' | 'neutral' | 'sad' | 'excited' | 'stressed' | 'all'>) => {
      state.query.filters.mood = action.payload;
    },
    
    setIsPinned: (state, action: PayloadAction<boolean | undefined>) => {
      state.query.filters.isPinned = action.payload;
    },
    
    setWordCountRange: (state, action: PayloadAction<{ min?: number; max?: number } | undefined>) => {
      state.query.filters.wordCountRange = action.payload;
    },
    
    // UI state
    openGlobalSearch: (state) => {
      state.isGlobalSearchOpen = true;
    },
    
    closeGlobalSearch: (state) => {
      state.isGlobalSearchOpen = false;
    },
    
    toggleAdvancedFilters: (state) => {
      state.isAdvancedFiltersOpen = !state.isAdvancedFiltersOpen;
    },
    
    setAdvancedFiltersOpen: (state, action: PayloadAction<boolean>) => {
      state.isAdvancedFiltersOpen = action.payload;
    },
    
    // Results management
    clearResults: (state) => {
      state.results = [];
      state.error = null;
    },
    
    clearSearch: (state) => {
      state.query.text = '';
      state.results = [];
      state.suggestions = [];
      state.error = null;
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.query.filters = defaultFilters;
    },
    
    resetAllFilters: (state) => {
      state.query = {
        text: '',
        filters: defaultFilters,
        sortBy: 'relevance',
        sortOrder: 'desc',
      };
      state.results = [];
      state.suggestions = [];
      state.error = null;
    },
    
    // Search history
    addToHistory: (state, action: PayloadAction<{ query: string; resultCount: number }>) => {
      const { query, resultCount } = action.payload;
      if (!query.trim()) return;
      
      // Remove existing entry if it exists
      state.searchHistory = state.searchHistory.filter(item => item.query !== query);
      
      // Add new entry at the beginning
      state.searchHistory.unshift({
        query,
        timestamp: new Date(),
        resultCount,
      });
      
      // Keep only last 50 searches
      state.searchHistory = state.searchHistory.slice(0, 50);
      
      // Update recent searches
      state.recentSearches = [query, ...state.recentSearches.filter(q => q !== query)].slice(0, 10);
    },
    
    clearHistory: (state) => {
      state.searchHistory = [];
      state.recentSearches = [];
    },
    
    // Error handling
    clearSearchError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Perform search
    builder
      .addCase(performSearch.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.results;
        state.lastSearchTime = action.payload.searchTime;
        
        // Add to history
        if (state.query.text.trim()) {
          const historyEntry = {
            query: state.query.text,
            resultCount: action.payload.resultCount,
          };
          searchSlice.caseReducers.addToHistory(state, { 
            payload: historyEntry, 
            type: 'search/addToHistory' 
          });
        }
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
        state.results = [];
      });
    
    // Load suggestions
    builder
      .addCase(loadSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      });
  },
});

export const {
  setSearchText,
  setSearchQuery,
  updateFilters,
  setSortOption,
  toggleContentType,
  setContentTypes,
  addTagFilter,
  removeTagFilter,
  setTagFilters,
  setTagMode,
  addProjectFilter,
  removeProjectFilter,
  setProjectFilters,
  setDateRange,
  setDueDateRange,
  setTaskStatus,
  setPriority,
  setHasSubtasks,
  setIsRecurring,
  setMood,
  setIsPinned,
  setWordCountRange,
  openGlobalSearch,
  closeGlobalSearch,
  toggleAdvancedFilters,
  setAdvancedFiltersOpen,
  clearResults,
  clearSearch,
  resetFilters,
  resetAllFilters,
  addToHistory,
  clearHistory,
  clearSearchError,
} = searchSlice.actions;

export default searchSlice.reducer;

// Selectors
export const selectSearchQuery = (state: { search: SearchState }) => state.search.query;
export const selectSearchText = (state: { search: SearchState }) => state.search.query.text;
export const selectSearchFilters = (state: { search: SearchState }) => state.search.query.filters;
export const selectSearchResults = (state: { search: SearchState }) => state.search.results;
export const selectIsSearching = (state: { search: SearchState }) => state.search.isSearching;
export const selectIsGlobalSearchOpen = (state: { search: SearchState }) => state.search.isGlobalSearchOpen;
export const selectIsAdvancedFiltersOpen = (state: { search: SearchState }) => state.search.isAdvancedFiltersOpen;
export const selectSearchSuggestions = (state: { search: SearchState }) => state.search.suggestions;
export const selectRecentSearches = (state: { search: SearchState }) => state.search.recentSearches;
export const selectSearchHistory = (state: { search: SearchState }) => state.search.searchHistory;
export const selectLastSearchTime = (state: { search: SearchState }) => state.search.lastSearchTime;
export const selectSearchError = (state: { search: SearchState }) => state.search.error;

// Complex selectors
export const selectActiveFiltersCount = (state: { search: SearchState }) => {
  const filters = state.search.query.filters;
  let count = 0;
  
  if (filters.taskStatus !== 'all') count++;
  if (filters.priority !== 'all') count++;
  if (filters.mood !== 'all') count++;
  if (filters.tags.length > 0) count++;
  if (filters.projectIds.length > 0) count++;
  if (filters.dateRange) count++;
  if (filters.dueDateRange) count++;
  if (filters.hasSubtasks !== undefined) count++;
  if (filters.isRecurring !== undefined) count++;
  if (filters.isPinned !== undefined) count++;
  if (filters.wordCountRange) count++;
  if (filters.contentTypes.length < 3) count++; // Less than all content types
  
  return count;
};

export const selectResultsByType = (state: { search: SearchState }) => {
  const results = state.search.results;
  return {
    tasks: results.filter(r => r.type === 'tasks'),
    journal: results.filter(r => r.type === 'journal'),
    projects: results.filter(r => r.type === 'projects'),
  };
};

export const selectHasActiveSearch = (state: { search: SearchState }) => {
  return state.search.query.text.trim().length > 0 || 
         selectActiveFiltersCount(state) > 0;
};