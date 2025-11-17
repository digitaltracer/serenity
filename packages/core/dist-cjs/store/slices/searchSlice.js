"use strict";
/**
 * Search State Management Slice
 * Manages global search state, filters, and results
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectHasActiveSearch = exports.selectResultsByType = exports.selectActiveFiltersCount = exports.selectSearchError = exports.selectLastSearchTime = exports.selectSearchHistory = exports.selectRecentSearches = exports.selectSearchSuggestions = exports.selectIsAdvancedFiltersOpen = exports.selectIsGlobalSearchOpen = exports.selectIsSearching = exports.selectSearchResults = exports.selectSearchFilters = exports.selectSearchText = exports.selectSearchQuery = exports.clearSearchError = exports.clearHistory = exports.addToHistory = exports.resetAllFilters = exports.resetFilters = exports.clearSearch = exports.clearResults = exports.setAdvancedFiltersOpen = exports.toggleAdvancedFilters = exports.closeGlobalSearch = exports.openGlobalSearch = exports.setWordCountRange = exports.setIsPinned = exports.setMood = exports.setIsRecurring = exports.setHasSubtasks = exports.setPriority = exports.setTaskStatus = exports.setDueDateRange = exports.setDateRange = exports.setProjectFilters = exports.removeProjectFilter = exports.addProjectFilter = exports.setTagMode = exports.setTagFilters = exports.removeTagFilter = exports.addTagFilter = exports.setContentTypes = exports.toggleContentType = exports.setSortOption = exports.updateFilters = exports.setSearchQuery = exports.setSearchText = exports.loadSuggestions = exports.performSearch = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const searchEngine_1 = require("../../utils/searchEngine");
const defaultFilters = {
    contentTypes: ['tasks', 'journal', 'projects'],
    taskStatus: 'all',
    priority: 'all',
    tags: [],
    tagMode: 'any',
    projectIds: [],
    mood: 'all',
};
const initialState = {
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
exports.performSearch = (0, toolkit_1.createAsyncThunk)('search/performSearch', async ({ tasks, journalEntries, projects, query }, { rejectWithValue }) => {
    try {
        const startTime = performance.now();
        // Check if we're in web environment (no window.electronAPI)
        const isWeb = typeof window !== 'undefined' && !window.electronAPI;
        if (isWeb && query.text.trim()) {
            // Use API for web environment
            const response = await fetch(`/api/search?q=${encodeURIComponent(query.text)}&types=${query.filters.contentTypes.join(',')}&limit=50`);
            if (!response.ok) {
                throw new Error('Search API failed');
            }
            const data = await response.json();
            const searchTime = performance.now() - startTime;
            // Transform API results to match SearchResult format
            const transformedResults = data.results.map((item) => ({
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
        const allResults = [];
        // Search tasks
        if (query.filters.contentTypes.includes('tasks')) {
            const taskResults = searchEngine_1.searchEngine.search(tasks, query, 'tasks');
            allResults.push(...taskResults);
        }
        // Search journal entries
        if (query.filters.contentTypes.includes('journal')) {
            const journalResults = searchEngine_1.searchEngine.search(journalEntries, query, 'journal');
            allResults.push(...journalResults);
        }
        // Search projects
        if (query.filters.contentTypes.includes('projects')) {
            const projectResults = searchEngine_1.searchEngine.search(projects, query, 'projects');
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
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Search failed');
    }
});
exports.loadSuggestions = (0, toolkit_1.createAsyncThunk)('search/loadSuggestions', async ({ query, availableTags, availableProjects, }) => {
    const suggestions = searchEngine_1.searchEngine.getSuggestions(query, availableTags, availableProjects);
    return suggestions;
});
const searchSlice = (0, toolkit_1.createSlice)({
    name: 'search',
    initialState,
    reducers: {
        // Query management
        setSearchText: (state, action) => {
            state.query.text = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.query = action.payload;
        },
        updateFilters: (state, action) => {
            state.query.filters = { ...state.query.filters, ...action.payload };
        },
        setSortOption: (state, action) => {
            const { sortBy, sortOrder } = action.payload;
            state.query.sortBy = sortBy;
            state.query.sortOrder = sortOrder;
        },
        // Content type filters
        toggleContentType: (state, action) => {
            const contentType = action.payload;
            const currentTypes = state.query.filters.contentTypes;
            if (currentTypes.includes(contentType)) {
                state.query.filters.contentTypes = currentTypes.filter(type => type !== contentType);
            }
            else {
                state.query.filters.contentTypes.push(contentType);
            }
        },
        setContentTypes: (state, action) => {
            state.query.filters.contentTypes = action.payload;
        },
        // Tag filters
        addTagFilter: (state, action) => {
            const tag = action.payload;
            if (!state.query.filters.tags.includes(tag)) {
                state.query.filters.tags.push(tag);
            }
        },
        removeTagFilter: (state, action) => {
            const tag = action.payload;
            state.query.filters.tags = state.query.filters.tags.filter(t => t !== tag);
        },
        setTagFilters: (state, action) => {
            state.query.filters.tags = action.payload;
        },
        setTagMode: (state, action) => {
            state.query.filters.tagMode = action.payload;
        },
        // Project filters
        addProjectFilter: (state, action) => {
            const projectId = action.payload;
            if (!state.query.filters.projectIds.includes(projectId)) {
                state.query.filters.projectIds.push(projectId);
            }
        },
        removeProjectFilter: (state, action) => {
            const projectId = action.payload;
            state.query.filters.projectIds = state.query.filters.projectIds.filter(id => id !== projectId);
        },
        setProjectFilters: (state, action) => {
            state.query.filters.projectIds = action.payload;
        },
        // Date filters
        setDateRange: (state, action) => {
            state.query.filters.dateRange = action.payload;
        },
        setDueDateRange: (state, action) => {
            state.query.filters.dueDateRange = action.payload;
        },
        // Task-specific filters
        setTaskStatus: (state, action) => {
            state.query.filters.taskStatus = action.payload;
        },
        setPriority: (state, action) => {
            state.query.filters.priority = action.payload;
        },
        setHasSubtasks: (state, action) => {
            state.query.filters.hasSubtasks = action.payload;
        },
        setIsRecurring: (state, action) => {
            state.query.filters.isRecurring = action.payload;
        },
        // Journal-specific filters
        setMood: (state, action) => {
            state.query.filters.mood = action.payload;
        },
        setIsPinned: (state, action) => {
            state.query.filters.isPinned = action.payload;
        },
        setWordCountRange: (state, action) => {
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
        setAdvancedFiltersOpen: (state, action) => {
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
        addToHistory: (state, action) => {
            const { query, resultCount } = action.payload;
            if (!query.trim())
                return;
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
            .addCase(exports.performSearch.pending, (state) => {
            state.isSearching = true;
            state.error = null;
        })
            .addCase(exports.performSearch.fulfilled, (state, action) => {
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
            .addCase(exports.performSearch.rejected, (state, action) => {
            state.isSearching = false;
            state.error = action.payload;
            state.results = [];
        });
        // Load suggestions
        builder
            .addCase(exports.loadSuggestions.fulfilled, (state, action) => {
            state.suggestions = action.payload;
        });
    },
});
_a = searchSlice.actions, exports.setSearchText = _a.setSearchText, exports.setSearchQuery = _a.setSearchQuery, exports.updateFilters = _a.updateFilters, exports.setSortOption = _a.setSortOption, exports.toggleContentType = _a.toggleContentType, exports.setContentTypes = _a.setContentTypes, exports.addTagFilter = _a.addTagFilter, exports.removeTagFilter = _a.removeTagFilter, exports.setTagFilters = _a.setTagFilters, exports.setTagMode = _a.setTagMode, exports.addProjectFilter = _a.addProjectFilter, exports.removeProjectFilter = _a.removeProjectFilter, exports.setProjectFilters = _a.setProjectFilters, exports.setDateRange = _a.setDateRange, exports.setDueDateRange = _a.setDueDateRange, exports.setTaskStatus = _a.setTaskStatus, exports.setPriority = _a.setPriority, exports.setHasSubtasks = _a.setHasSubtasks, exports.setIsRecurring = _a.setIsRecurring, exports.setMood = _a.setMood, exports.setIsPinned = _a.setIsPinned, exports.setWordCountRange = _a.setWordCountRange, exports.openGlobalSearch = _a.openGlobalSearch, exports.closeGlobalSearch = _a.closeGlobalSearch, exports.toggleAdvancedFilters = _a.toggleAdvancedFilters, exports.setAdvancedFiltersOpen = _a.setAdvancedFiltersOpen, exports.clearResults = _a.clearResults, exports.clearSearch = _a.clearSearch, exports.resetFilters = _a.resetFilters, exports.resetAllFilters = _a.resetAllFilters, exports.addToHistory = _a.addToHistory, exports.clearHistory = _a.clearHistory, exports.clearSearchError = _a.clearSearchError;
exports.default = searchSlice.reducer;
// Selectors
const selectSearchQuery = (state) => state.search.query;
exports.selectSearchQuery = selectSearchQuery;
const selectSearchText = (state) => state.search.query.text;
exports.selectSearchText = selectSearchText;
const selectSearchFilters = (state) => state.search.query.filters;
exports.selectSearchFilters = selectSearchFilters;
const selectSearchResults = (state) => state.search.results;
exports.selectSearchResults = selectSearchResults;
const selectIsSearching = (state) => state.search.isSearching;
exports.selectIsSearching = selectIsSearching;
const selectIsGlobalSearchOpen = (state) => state.search.isGlobalSearchOpen;
exports.selectIsGlobalSearchOpen = selectIsGlobalSearchOpen;
const selectIsAdvancedFiltersOpen = (state) => state.search.isAdvancedFiltersOpen;
exports.selectIsAdvancedFiltersOpen = selectIsAdvancedFiltersOpen;
const selectSearchSuggestions = (state) => state.search.suggestions;
exports.selectSearchSuggestions = selectSearchSuggestions;
const selectRecentSearches = (state) => state.search.recentSearches;
exports.selectRecentSearches = selectRecentSearches;
const selectSearchHistory = (state) => state.search.searchHistory;
exports.selectSearchHistory = selectSearchHistory;
const selectLastSearchTime = (state) => state.search.lastSearchTime;
exports.selectLastSearchTime = selectLastSearchTime;
const selectSearchError = (state) => state.search.error;
exports.selectSearchError = selectSearchError;
// Complex selectors
const selectActiveFiltersCount = (state) => {
    const filters = state.search.query.filters;
    let count = 0;
    if (filters.taskStatus !== 'all')
        count++;
    if (filters.priority !== 'all')
        count++;
    if (filters.mood !== 'all')
        count++;
    if (filters.tags.length > 0)
        count++;
    if (filters.projectIds.length > 0)
        count++;
    if (filters.dateRange)
        count++;
    if (filters.dueDateRange)
        count++;
    if (filters.hasSubtasks !== undefined)
        count++;
    if (filters.isRecurring !== undefined)
        count++;
    if (filters.isPinned !== undefined)
        count++;
    if (filters.wordCountRange)
        count++;
    if (filters.contentTypes.length < 3)
        count++; // Less than all content types
    return count;
};
exports.selectActiveFiltersCount = selectActiveFiltersCount;
const selectResultsByType = (state) => {
    const results = state.search.results;
    return {
        tasks: results.filter(r => r.type === 'tasks'),
        journal: results.filter(r => r.type === 'journal'),
        projects: results.filter(r => r.type === 'projects'),
    };
};
exports.selectResultsByType = selectResultsByType;
const selectHasActiveSearch = (state) => {
    return state.search.query.text.trim().length > 0 ||
        (0, exports.selectActiveFiltersCount)(state) > 0;
};
exports.selectHasActiveSearch = selectHasActiveSearch;
