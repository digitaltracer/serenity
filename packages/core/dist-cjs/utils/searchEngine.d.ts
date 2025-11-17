/**
 * Advanced Search Engine for Serenity Notes
 * Provides powerful search and filtering capabilities across all content types
 */
import { Task, JournalEntry, Project } from '../types';
export interface SearchQuery {
    text: string;
    filters: SearchFilters;
    sortBy: SortOption;
    sortOrder: 'asc' | 'desc';
}
export interface SearchFilters {
    contentTypes: ContentType[];
    taskStatus?: 'completed' | 'pending' | 'all';
    priority?: 'low' | 'medium' | 'high' | 'all';
    hasSubtasks?: boolean;
    isRecurring?: boolean;
    dateRange?: DateRange;
    dueDateRange?: DateRange;
    tags: string[];
    tagMode: 'any' | 'all' | 'none';
    projectIds: string[];
    mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed' | 'all';
    isPinned?: boolean;
    hasAttachments?: boolean;
    wordCountRange?: {
        min?: number;
        max?: number;
    };
}
export interface DateRange {
    start?: Date;
    end?: Date;
}
export type ContentType = 'tasks' | 'journal' | 'projects' | 'goals';
export type SortOption = 'relevance' | 'dateCreated' | 'dateUpdated' | 'dueDate' | 'priority' | 'title' | 'wordCount';
export interface SearchResult<T = any> {
    item: T;
    type: ContentType;
    score: number;
    highlights: SearchHighlight[];
    matchedFields: string[];
}
export interface SearchHighlight {
    field: string;
    text: string;
    start: number;
    end: number;
}
export interface SearchSuggestion {
    text: string;
    type: 'recent' | 'popular' | 'tag' | 'project';
    category?: string;
    count?: number;
}
/**
 * Main search engine class
 */
export declare class SearchEngine {
    private recentQueries;
    private popularQueries;
    /**
     * Perform comprehensive search across all content types
     */
    search<T extends Task | JournalEntry | Project>(items: T[], query: SearchQuery, contentType: ContentType): SearchResult<T>[];
    /**
     * Perform full-text search with scoring
     */
    private performTextSearch;
    /**
     * Get searchable fields for an item based on its type
     */
    private getSearchableFields;
    /**
     * Score an item based on query terms
     */
    private scoreItem;
    /**
     * Score a field against query terms
     */
    private scoreField;
    /**
     * Find all matches of a term in content
     */
    private findMatches;
    /**
     * Apply filters to search results
     */
    private applyFilters;
    /**
     * Apply task-specific filters
     */
    private applyTaskFilters;
    /**
     * Apply journal-specific filters
     */
    private applyJournalFilters;
    /**
     * Apply project-specific filters
     */
    private applyProjectFilters;
    /**
     * Sort search results
     */
    private sortResults;
    /**
     * Get search suggestions based on query
     */
    getSuggestions(query: string, availableTags: string[], availableProjects: Project[]): SearchSuggestion[];
    /**
     * Utility methods
     */
    private tokenize;
    private escapeRegex;
    private isAtWordBoundary;
    private isInDateRange;
    private matchesTags;
    private getWordCount;
    private trackQuery;
}
export declare const searchEngine: SearchEngine;
