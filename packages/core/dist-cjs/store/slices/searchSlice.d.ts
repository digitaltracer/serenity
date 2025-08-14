/**
 * Search State Management Slice
 * Manages global search state, filters, and results
 */
import { SearchQuery, SearchFilters, SearchResult, SearchSuggestion, ContentType, SortOption } from '../../utils/searchEngine';
import { Task, JournalEntry, Project } from '../../types';
export interface SearchState {
    query: SearchQuery;
    results: SearchResult[];
    isSearching: boolean;
    isGlobalSearchOpen: boolean;
    isAdvancedFiltersOpen: boolean;
    suggestions: SearchSuggestion[];
    recentSearches: string[];
    searchHistory: Array<{
        query: string;
        timestamp: Date;
        resultCount: number;
    }>;
    lastSearchTime: number;
    error: string | null;
}
export declare const performSearch: import("@reduxjs/toolkit").AsyncThunk<{
    results: SearchResult<any>[];
    searchTime: number;
    resultCount: number;
}, {
    tasks: Task[];
    journalEntries: JournalEntry[];
    projects: Project[];
    query: SearchQuery;
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
export declare const loadSuggestions: import("@reduxjs/toolkit").AsyncThunk<SearchSuggestion[], {
    query: string;
    availableTags: string[];
    availableProjects: Project[];
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
export declare const setSearchText: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "search/setSearchText">, setSearchQuery: import("@reduxjs/toolkit").ActionCreatorWithPayload<SearchQuery, "search/setSearchQuery">, updateFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<SearchFilters>, "search/updateFilters">, setSortOption: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    sortBy: SortOption;
    sortOrder: "asc" | "desc";
}, "search/setSortOption">, toggleContentType: import("@reduxjs/toolkit").ActionCreatorWithPayload<ContentType, "search/toggleContentType">, setContentTypes: import("@reduxjs/toolkit").ActionCreatorWithPayload<ContentType[], "search/setContentTypes">, addTagFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "search/addTagFilter">, removeTagFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "search/removeTagFilter">, setTagFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "search/setTagFilters">, setTagMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<"all" | "any" | "none", "search/setTagMode">, addProjectFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "search/addProjectFilter">, removeProjectFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "search/removeProjectFilter">, setProjectFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "search/setProjectFilters">, setDateRange: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    start?: Date;
    end?: Date;
} | undefined, "search/setDateRange">, setDueDateRange: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    start?: Date;
    end?: Date;
} | undefined, "search/setDueDateRange">, setTaskStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<"completed" | "pending" | "all", "search/setTaskStatus">, setPriority: import("@reduxjs/toolkit").ActionCreatorWithPayload<"low" | "medium" | "high" | "all", "search/setPriority">, setHasSubtasks: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<boolean | undefined, "search/setHasSubtasks">, setIsRecurring: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<boolean | undefined, "search/setIsRecurring">, setMood: import("@reduxjs/toolkit").ActionCreatorWithPayload<"happy" | "neutral" | "sad" | "excited" | "stressed" | "all", "search/setMood">, setIsPinned: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<boolean | undefined, "search/setIsPinned">, setWordCountRange: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    min?: number;
    max?: number;
} | undefined, "search/setWordCountRange">, openGlobalSearch: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/openGlobalSearch">, closeGlobalSearch: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/closeGlobalSearch">, toggleAdvancedFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/toggleAdvancedFilters">, setAdvancedFiltersOpen: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "search/setAdvancedFiltersOpen">, clearResults: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/clearResults">, clearSearch: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/clearSearch">, resetFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/resetFilters">, resetAllFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/resetAllFilters">, addToHistory: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    query: string;
    resultCount: number;
}, "search/addToHistory">, clearHistory: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/clearHistory">, clearSearchError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"search/clearSearchError">;
declare const _default: import("redux").Reducer<SearchState>;
export default _default;
export declare const selectSearchQuery: (state: {
    search: SearchState;
}) => SearchQuery;
export declare const selectSearchText: (state: {
    search: SearchState;
}) => string;
export declare const selectSearchFilters: (state: {
    search: SearchState;
}) => SearchFilters;
export declare const selectSearchResults: (state: {
    search: SearchState;
}) => SearchResult<any>[];
export declare const selectIsSearching: (state: {
    search: SearchState;
}) => boolean;
export declare const selectIsGlobalSearchOpen: (state: {
    search: SearchState;
}) => boolean;
export declare const selectIsAdvancedFiltersOpen: (state: {
    search: SearchState;
}) => boolean;
export declare const selectSearchSuggestions: (state: {
    search: SearchState;
}) => SearchSuggestion[];
export declare const selectRecentSearches: (state: {
    search: SearchState;
}) => string[];
export declare const selectSearchHistory: (state: {
    search: SearchState;
}) => {
    query: string;
    timestamp: Date;
    resultCount: number;
}[];
export declare const selectLastSearchTime: (state: {
    search: SearchState;
}) => number;
export declare const selectSearchError: (state: {
    search: SearchState;
}) => string | null;
export declare const selectActiveFiltersCount: (state: {
    search: SearchState;
}) => number;
export declare const selectResultsByType: (state: {
    search: SearchState;
}) => {
    tasks: SearchResult<any>[];
    journal: SearchResult<any>[];
    projects: SearchResult<any>[];
};
export declare const selectHasActiveSearch: (state: {
    search: SearchState;
}) => boolean;
//# sourceMappingURL=searchSlice.d.ts.map