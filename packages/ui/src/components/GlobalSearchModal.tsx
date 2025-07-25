/**
 * Global Search Modal
 * Comprehensive search interface for all content types
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  ClockIcon,
  TagIcon,
  FolderIcon,
  SortAscIcon,
  SortDescIcon,
  CheckSquareIcon,
  BookOpenIcon,
  TrendingUpIcon,
  CalendarIcon,
  StarIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import {
  RootState,
  AppDispatch,
  selectSearchQuery,
  selectSearchResults,
  selectIsSearching,
  selectSearchSuggestions,
  selectRecentSearches,
  selectIsAdvancedFiltersOpen,
  selectActiveFiltersCount,
  selectResultsByType,
  selectLastSearchTime,
  performSearch,
  loadSuggestions,
  setSearchText,
  toggleAdvancedFilters,
  updateFilters,
  setSortOption,
  clearSearch,
  resetFilters,
  selectAllTasks,
  selectAllEntries,
  selectAllProjects,
  selectAllTags,
  SearchResult,
  ContentType,
  SortOption
} from '@serenity/core';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
}

const contentTypeIcons = {
  tasks: CheckSquareIcon,
  journal: BookOpenIcon,
  projects: FolderIcon,
};

const contentTypeLabels = {
  tasks: 'Tasks',
  journal: 'Journal',
  projects: 'Projects',
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  
  // Selectors
  const query = useSelector((state: RootState) => selectSearchQuery(state));
  const results = useSelector((state: RootState) => selectSearchResults(state));
  const isSearching = useSelector((state: RootState) => selectIsSearching(state));
  const suggestions = useSelector((state: RootState) => selectSearchSuggestions(state));
  const recentSearches = useSelector((state: RootState) => selectRecentSearches(state));
  const isAdvancedOpen = useSelector((state: RootState) => selectIsAdvancedFiltersOpen(state));
  const activeFiltersCount = useSelector((state: RootState) => selectActiveFiltersCount(state));
  const resultsByType = useSelector((state: RootState) => selectResultsByType(state));
  const searchTime = useSelector((state: RootState) => selectLastSearchTime(state));
  
  // Data for search
  const tasks = useSelector((state: RootState) => selectAllTasks(state));
  const journalEntries = useSelector((state: RootState) => selectAllEntries(state));
  const projects = useSelector((state: RootState) => selectAllProjects(state));
  const allTags = useSelector((state: RootState) => selectAllTags(state));

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    if (query.text.trim() || activeFiltersCount > 0) {
      const searchData = {
        tasks,
        journalEntries,
        projects,
        query,
      };
      dispatch(performSearch(searchData));
    }
  }, [query, tasks, journalEntries, projects, activeFiltersCount, dispatch]);

  // Load suggestions when text changes
  useEffect(() => {
    if (query.text.length > 0) {
      dispatch(loadSuggestions({
        query: query.text,
        availableTags: allTags,
        availableProjects: projects,
      }));
    }
  }, [query.text, allTags, projects, dispatch]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    dispatch(setSearchText(value));
    setSelectedResultIndex(0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedResultIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedResultIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedResultIndex]) {
          handleSelectResult(results[selectedResultIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    onClose();
  };

  // Handle clear search
  const handleClear = () => {
    dispatch(clearSearch());
    setSelectedResultIndex(0);
  };

  // Render search result
  const renderResult = (result: SearchResult, index: number) => {
    const Icon = contentTypeIcons[result.type];
    const isSelected = index === selectedResultIndex;
    const item = result.item as any;
    
    return (
      <div
        key={`${result.type}-${item.id}`}
        className={`p-3 cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        onClick={() => handleSelectResult(result)}
      >
        <div className="flex items-start space-x-3">
          <div className={`mt-0.5 p-1 rounded ${
            isSelected 
              ? 'bg-blue-100 dark:bg-blue-800' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {item.title || item.name}
              </h4>
              <Badge variant="secondary" size="sm">
                {contentTypeLabels[result.type]}
              </Badge>
              {result.score > 0 && (
                <Badge variant="outline" size="sm">
                  {Math.round(result.score)}% match
                </Badge>
              )}
            </div>
            
            {(item.description || item.content) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {item.description || item.content}
              </p>
            )}
            
            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <TagIcon className="w-3 h-3" />
                  <span>{item.tags.slice(0, 2).join(', ')}</span>
                  {item.tags.length > 2 && <span>+{item.tags.length - 2}</span>}
                </div>
              )}
              
              {item.createdAt && (
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              
              {item.priority && result.type === 'tasks' && (
                <Badge 
                  variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'warning' : 'secondary'}
                  size="sm"
                >
                  {item.priority}
                </Badge>
              )}
              
              {item.pinned && result.type === 'journal' && (
                <div className="flex items-center space-x-1">
                  <StarIcon className="w-3 h-3 text-yellow-500" />
                  <span>Pinned</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="max-h-[80vh]"
    >
      <div className="space-y-4">
        {/* Search Header */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks, journal entries, and projects..."
              value={query.text}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 text-lg"
            />
            {query.text && (
              <Button
                onClick={handleClear}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <Button
            onClick={() => dispatch(toggleAdvancedFilters())}
            variant={isAdvancedOpen ? 'primary' : 'secondary'}
            size="sm"
            className="flex items-center space-x-2"
          >
            <FilterIcon className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" size="sm" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Advanced Filters</h3>
              <Button
                onClick={() => dispatch(resetFilters())}
                variant="ghost"
                size="sm"
              >
                Reset
              </Button>
            </div>
            
            {/* Content Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Types
              </label>
              <div className="flex space-x-2">
                {(['tasks', 'journal', 'projects'] as ContentType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const currentTypes = query.filters.contentTypes;
                      const newTypes = currentTypes.includes(type)
                        ? currentTypes.filter(t => t !== type)
                        : [...currentTypes, type];
                      dispatch(updateFilters({ contentTypes: newTypes }));
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      query.filters.contentTypes.includes(type)
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {contentTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={query.sortBy}
                  onChange={(e) => dispatch(setSortOption({ 
                    sortBy: e.target.value as SortOption, 
                    sortOrder: query.sortOrder 
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="relevance">Relevance</option>
                  <option value="dateCreated">Date Created</option>
                  <option value="dateUpdated">Date Updated</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <button
                  onClick={() => dispatch(setSortOption({ 
                    sortBy: query.sortBy, 
                    sortOrder: query.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 flex items-center justify-center space-x-2"
                >
                  {query.sortOrder === 'asc' ? (
                    <SortAscIcon className="w-4 h-4" />
                  ) : (
                    <SortDescIcon className="w-4 h-4" />
                  )}
                  <span>{query.sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Stats */}
        {(results.length > 0 || isSearching) && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>
                {isSearching ? 'Searching...' : `${results.length} results`}
              </span>
              {searchTime > 0 && (
                <span className="flex items-center space-x-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{searchTime.toFixed(1)}ms</span>
                </span>
              )}
            </div>
            
            {results.length > 0 && (
              <div className="flex items-center space-x-3">
                {resultsByType.tasks.length > 0 && (
                  <span>{resultsByType.tasks.length} tasks</span>
                )}
                {resultsByType.journal.length > 0 && (
                  <span>{resultsByType.journal.length} journal</span>
                )}
                {resultsByType.projects.length > 0 && (
                  <span>{resultsByType.projects.length} projects</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => renderResult(result, index))}
            </div>
          ) : query.text.trim() || activeFiltersCount > 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No results found</p>
              <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map(search => (
                      <button
                        key={search}
                        onClick={() => handleSearchChange(search)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center space-x-2"
                      >
                        <ClockIcon className="w-4 h-4" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search Tips */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Search Tips
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Use quotes for exact phrases: "important task"</p>
                  <p>• Search by tag: tag:work</p>
                  <p>• Search by project: project:Personal</p>
                  <p>• Use filters to narrow down results</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};