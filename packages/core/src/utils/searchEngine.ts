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
  // Content type filters
  contentTypes: ContentType[];
  
  // Task-specific filters
  taskStatus?: 'completed' | 'pending' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'all';
  hasSubtasks?: boolean;
  isRecurring?: boolean;
  
  // Date filters
  dateRange?: DateRange;
  dueDateRange?: DateRange;
  
  // Tag filters
  tags: string[];
  tagMode: 'any' | 'all' | 'none';
  
  // Project filters
  projectIds: string[];
  
  // Journal-specific filters
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed' | 'all';
  isPinned?: boolean;
  
  // General filters
  hasAttachments?: boolean;
  wordCountRange?: { min?: number; max?: number };
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export type ContentType = 'tasks' | 'journal' | 'projects';

export type SortOption = 
  | 'relevance'
  | 'dateCreated'
  | 'dateUpdated'
  | 'dueDate'
  | 'priority'
  | 'title'
  | 'wordCount';

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
export class SearchEngine {
  private recentQueries: string[] = [];
  private popularQueries: Map<string, number> = new Map();

  /**
   * Perform comprehensive search across all content types
   */
  search<T extends Task | JournalEntry | Project>(
    items: T[],
    query: SearchQuery,
    contentType: ContentType
  ): SearchResult<T>[] {
    const { text, filters, sortBy, sortOrder } = query;
    
    // Apply content type filter
    if (!filters.contentTypes.includes(contentType)) {
      return [];
    }
    
    let results: SearchResult<T>[] = [];
    
    // Full-text search
    if (text.trim()) {
      results = this.performTextSearch(items, text, contentType);
    } else {
      // No text query, return all items as results with score 0
      results = items.map(item => ({
        item,
        type: contentType,
        score: 0,
        highlights: [],
        matchedFields: [],
      }));
    }
    
    // Apply filters
    results = this.applyFilters(results, filters, contentType);
    
    // Sort results
    results = this.sortResults(results, sortBy, sortOrder);
    
    // Track query
    this.trackQuery(text);
    
    return results;
  }

  /**
   * Perform full-text search with scoring
   */
  private performTextSearch<T>(
    items: T[],
    query: string,
    contentType: ContentType
  ): SearchResult<T>[] {
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = this.tokenize(normalizedQuery);
    
    if (queryTerms.length === 0) return [];
    
    const results: SearchResult<T>[] = [];
    
    for (const item of items) {
      const searchableFields = this.getSearchableFields(item, contentType);
      const itemResult = this.scoreItem(item, searchableFields, queryTerms, contentType);
      
      if (itemResult.score > 0) {
        results.push(itemResult);
      }
    }
    
    return results;
  }

  /**
   * Get searchable fields for an item based on its type
   */
  private getSearchableFields(item: any, contentType: ContentType): Record<string, string> {
    const fields: Record<string, string> = {};
    
    switch (contentType) {
      case 'tasks':
        const task = item as Task;
        fields.title = task.title || '';
        fields.description = task.description || '';
        fields.tags = task.tags.join(' ');
        break;
        
      case 'journal':
        const journal = item as JournalEntry;
        fields.title = journal.title || '';
        fields.content = journal.content || '';
        fields.tags = journal.tags.join(' ');
        break;
        
      case 'projects':
        const project = item as Project;
        fields.name = project.name || '';
        fields.description = project.description || '';
        break;
    }
    
    return fields;
  }

  /**
   * Score an item based on query terms
   */
  private scoreItem<T>(
    item: T,
    fields: Record<string, string>,
    queryTerms: string[],
    contentType: ContentType
  ): SearchResult<T> {
    let totalScore = 0;
    const highlights: SearchHighlight[] = [];
    const matchedFields: string[] = [];
    
    // Field weights
    const fieldWeights: Record<string, number> = {
      title: 3,
      name: 3,
      content: 1,
      description: 1,
      tags: 2,
    };
    
    for (const [fieldName, fieldContent] of Object.entries(fields)) {
      const fieldScore = this.scoreField(
        fieldContent,
        queryTerms,
        fieldWeights[fieldName] || 1
      );
      
      if (fieldScore.score > 0) {
        totalScore += fieldScore.score;
        matchedFields.push(fieldName);
        highlights.push(...fieldScore.highlights.map(h => ({
          ...h,
          field: fieldName,
        })));
      }
    }
    
    return {
      item,
      type: contentType,
      score: totalScore,
      highlights,
      matchedFields,
    };
  }

  /**
   * Score a field against query terms
   */
  private scoreField(
    fieldContent: string,
    queryTerms: string[],
    weight: number
  ): { score: number; highlights: SearchHighlight[] } {
    const normalizedContent = fieldContent.toLowerCase();
    let score = 0;
    const highlights: SearchHighlight[] = [];
    
    for (const term of queryTerms) {
      const matches = this.findMatches(normalizedContent, term);
      
      for (const match of matches) {
        // Exact match gets higher score
        const exactMatch = match.text === term;
        const baseScore = exactMatch ? 10 : 5;
        
        // Boost score for matches at word boundaries
        const atWordBoundary = this.isAtWordBoundary(normalizedContent, match.start);
        const wordBoundaryBoost = atWordBoundary ? 2 : 1;
        
        score += baseScore * weight * wordBoundaryBoost;
        
        highlights.push({
          field: '',
          text: match.text,
          start: match.start,
          end: match.end,
        });
      }
    }
    
    return { score, highlights };
  }

  /**
   * Find all matches of a term in content
   */
  private findMatches(content: string, term: string): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];
    const regex = new RegExp(this.escapeRegex(term), 'gi');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    
    return matches;
  }

  /**
   * Apply filters to search results
   */
  private applyFilters<T>(
    results: SearchResult<T>[],
    filters: SearchFilters,
    contentType: ContentType
  ): SearchResult<T>[] {
    return results.filter(result => {
      const item = result.item as any;
      
      // Date range filter
      if (filters.dateRange && !this.isInDateRange(item.createdAt, filters.dateRange)) {
        return false;
      }
      
      // Tag filters
      if (filters.tags.length > 0 && !this.matchesTags(item.tags || [], filters.tags, filters.tagMode)) {
        return false;
      }
      
      // Project filter
      if (filters.projectIds.length > 0 && !filters.projectIds.includes(item.projectId || '')) {
        return false;
      }
      
      // Content-specific filters
      switch (contentType) {
        case 'tasks':
          return this.applyTaskFilters(item as Task, filters);
        case 'journal':
          return this.applyJournalFilters(item as JournalEntry, filters);
        case 'projects':
          return this.applyProjectFilters(item as Project, filters);
        default:
          return true;
      }
    });
  }

  /**
   * Apply task-specific filters
   */
  private applyTaskFilters(task: Task, filters: SearchFilters): boolean {
    if (filters.taskStatus === 'completed' && !task.completed) return false;
    if (filters.taskStatus === 'pending' && task.completed) return false;
    
    if (filters.priority !== 'all' && filters.priority && task.priority !== filters.priority) return false;
    
    if (filters.hasSubtasks !== undefined) {
      const hasSubtasks = (task.subtasks?.length || 0) > 0;
      if (filters.hasSubtasks !== hasSubtasks) return false;
    }
    
    if (filters.isRecurring !== undefined) {
      const isRecurring = !!task.recurring;
      if (filters.isRecurring !== isRecurring) return false;
    }
    
    if (filters.dueDateRange && task.dueDate && !this.isInDateRange(task.dueDate, filters.dueDateRange)) {
      return false;
    }
    
    return true;
  }

  /**
   * Apply journal-specific filters
   */
  private applyJournalFilters(entry: JournalEntry, filters: SearchFilters): boolean {
    if (filters.mood !== 'all' && filters.mood && entry.mood !== filters.mood) return false;
    
    if (filters.isPinned !== undefined && entry.pinned !== filters.isPinned) return false;
    
    if (filters.wordCountRange) {
      const wordCount = this.getWordCount(entry.content);
      if (filters.wordCountRange.min && wordCount < filters.wordCountRange.min) return false;
      if (filters.wordCountRange.max && wordCount > filters.wordCountRange.max) return false;
    }
    
    return true;
  }

  /**
   * Apply project-specific filters
   */
  private applyProjectFilters(project: Project, filters: SearchFilters): boolean {
    // Project-specific filters can be added here
    return true;
  }

  /**
   * Sort search results
   */
  private sortResults<T>(
    results: SearchResult<T>[],
    sortBy: SortOption,
    sortOrder: 'asc' | 'desc'
  ): SearchResult<T>[] {
    const sorted = [...results].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score;
          break;
        case 'dateCreated':
          comparison = new Date((a.item as any).createdAt).getTime() - 
                      new Date((b.item as any).createdAt).getTime();
          break;
        case 'dateUpdated':
          comparison = new Date((a.item as any).updatedAt).getTime() - 
                      new Date((b.item as any).updatedAt).getTime();
          break;
        case 'dueDate':
          const aDue = (a.item as any).dueDate;
          const bDue = (b.item as any).dueDate;
          if (!aDue && !bDue) comparison = 0;
          else if (!aDue) comparison = 1;
          else if (!bDue) comparison = -1;
          else comparison = new Date(aDue).getTime() - new Date(bDue).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          const aPriority = (a.item as any).priority;
          const bPriority = (b.item as any).priority;
          comparison = (priorityOrder[bPriority] || 0) - (priorityOrder[aPriority] || 0);
          break;
        case 'title':
          const aTitle = (a.item as any).title || (a.item as any).name || '';
          const bTitle = (b.item as any).title || (b.item as any).name || '';
          comparison = aTitle.localeCompare(bTitle);
          break;
        case 'wordCount':
          const aWords = this.getWordCount((a.item as any).content || (a.item as any).description || '');
          const bWords = this.getWordCount((b.item as any).content || (b.item as any).description || '');
          comparison = aWords - bWords;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(
    query: string,
    availableTags: string[],
    availableProjects: Project[]
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // Recent queries
    this.recentQueries
      .filter(q => q.toLowerCase().includes(normalizedQuery))
      .slice(0, 3)
      .forEach(q => {
        suggestions.push({
          text: q,
          type: 'recent',
          category: 'Recent Searches',
        });
      });
    
    // Popular queries
    Array.from(this.popularQueries.entries())
      .filter(([q]) => q.toLowerCase().includes(normalizedQuery))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([q, count]) => {
        suggestions.push({
          text: q,
          type: 'popular',
          category: 'Popular Searches',
          count,
        });
      });
    
    // Tag suggestions
    availableTags
      .filter(tag => tag.toLowerCase().includes(normalizedQuery))
      .slice(0, 5)
      .forEach(tag => {
        suggestions.push({
          text: `tag:${tag}`,
          type: 'tag',
          category: 'Tags',
        });
      });
    
    // Project suggestions
    availableProjects
      .filter(project => project.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 3)
      .forEach(project => {
        suggestions.push({
          text: `project:${project.name}`,
          type: 'project',
          category: 'Projects',
        });
      });
    
    return suggestions;
  }

  /**
   * Utility methods
   */
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(term => term.length > 0);
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isAtWordBoundary(content: string, index: number): boolean {
    if (index === 0) return true;
    const prevChar = content[index - 1];
    return /\s/.test(prevChar);
  }

  private isInDateRange(date: Date, range: DateRange): boolean {
    const dateTime = new Date(date).getTime();
    if (range.start && dateTime < new Date(range.start).getTime()) return false;
    if (range.end && dateTime > new Date(range.end).getTime()) return false;
    return true;
  }

  private matchesTags(itemTags: string[], filterTags: string[], mode: 'any' | 'all' | 'none'): boolean {
    switch (mode) {
      case 'any':
        return filterTags.some(tag => itemTags.includes(tag));
      case 'all':
        return filterTags.every(tag => itemTags.includes(tag));
      case 'none':
        return !filterTags.some(tag => itemTags.includes(tag));
      default:
        return true;
    }
  }

  private getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private trackQuery(query: string): void {
    if (!query.trim()) return;
    
    // Add to recent queries
    this.recentQueries = [query, ...this.recentQueries.filter(q => q !== query)].slice(0, 10);
    
    // Track popularity
    this.popularQueries.set(query, (this.popularQueries.get(query) || 0) + 1);
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();