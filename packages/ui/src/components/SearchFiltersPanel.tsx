/**
 * Search Filters Panel
 * Advanced filtering interface for search results
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FilterIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  StarIcon,
  CheckSquareIcon,
  XIcon,
  RotateCcwIcon
} from 'lucide-react';
import {
  RootState,
  AppDispatch,
  selectSearchFilters,
  selectAllProjects,
  selectAllTags,
  updateFilters,
  setTaskStatus,
  setPriority,
  setMood,
  addTagFilter,
  removeTagFilter,
  setTagMode,
  addProjectFilter,
  removeProjectFilter,
  setDateRange,
  setDueDateRange,
  setHasSubtasks,
  setIsRecurring,
  setIsPinned,
  resetFilters,
  SearchFilters
} from '@serenity/core';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { Toggle } from './Toggle';
import { DatePicker } from './DatePicker';

interface SearchFiltersPanelProps {
  className?: string;
  compact?: boolean;
}

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
  className = '',
  compact = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const filters = useSelector((state: RootState) => selectSearchFilters(state));
  const allProjects = useSelector((state: RootState) => selectAllProjects(state));
  const allTags = useSelector((state: RootState) => selectAllTags(state));

  const FilterSection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
    collapsible?: boolean;
  }> = ({ title, icon, children, collapsible = false }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {title}
            </h3>
          </div>
          {collapsible && (
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <ChevronIcon className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="space-y-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  const ChevronIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FilterIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Search Filters
          </h2>
        </div>
        
        <Button
          onClick={() => dispatch(resetFilters())}
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1"
        >
          <RotateCcwIcon className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Content Types */}
      <FilterSection
        title="Content Types"
        icon={<CheckSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
      >
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'tasks', label: 'Tasks', icon: CheckSquareIcon },
            { value: 'journal', label: 'Journal', icon: ClockIcon },
            { value: 'projects', label: 'Projects', icon: FolderIcon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                const currentTypes = filters.contentTypes;
                const newTypes = currentTypes.includes(value as any)
                  ? currentTypes.filter(type => type !== value)
                  : [...currentTypes, value as any];
                dispatch(updateFilters({ contentTypes: newTypes }));
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                filters.contentTypes.includes(value as any)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Task Filters */}
      {filters.contentTypes.includes('tasks') && (
        <FilterSection
          title="Task Filters"
          icon={<CheckSquareIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
        >
          {/* Task Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Status
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => dispatch(setTaskStatus(value as any))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.taskStatus === value
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Priority
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'high', label: 'High', color: 'red' },
                { value: 'medium', label: 'Medium', color: 'yellow' },
                { value: 'low', label: 'Low', color: 'green' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => dispatch(setPriority(value as any))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.priority === value
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {color && (
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 bg-${color}-500`} />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Task Attributes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Has Subtasks
              </label>
              <Toggle
                checked={filters.hasSubtasks || false}
                onChange={(checked) => dispatch(setHasSubtasks(checked))}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Is Recurring
              </label>
              <Toggle
                checked={filters.isRecurring || false}
                onChange={(checked) => dispatch(setIsRecurring(checked))}
                size="sm"
              />
            </div>
          </div>
        </FilterSection>
      )}

      {/* Journal Filters */}
      {filters.contentTypes.includes('journal') && (
        <FilterSection
          title="Journal Filters"
          icon={<ClockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
        >
          {/* Mood */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Mood
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { value: 'all', label: 'All', emoji: '' },
                { value: 'happy', label: 'Happy', emoji: '😊' },
                { value: 'neutral', label: 'Neutral', emoji: '😐' },
                { value: 'sad', label: 'Sad', emoji: '😢' },
                { value: 'excited', label: 'Excited', emoji: '🤩' },
                { value: 'stressed', label: 'Stressed', emoji: '😰' },
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => dispatch(setMood(value as any))}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                    filters.mood === value
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {emoji && <span>{emoji}</span>}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pinned */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Pinned Only
            </label>
            <Toggle
              checked={filters.isPinned || false}
              onChange={(checked) => dispatch(setIsPinned(checked))}
              size="sm"
            />
          </div>
        </FilterSection>
      )}

      {/* Tags */}
      <FilterSection
        title="Tags"
        icon={<TagIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
      >
        {/* Tag Mode */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Match Mode
          </label>
          <div className="flex space-x-2">
            {[
              { value: 'any', label: 'Any' },
              { value: 'all', label: 'All' },
              { value: 'none', label: 'None' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => dispatch(setTagMode(value as any))}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filters.tagMode === value
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Tags */}
        {filters.tags.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Selected Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {filters.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => dispatch(removeTagFilter(tag))}
                    className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Available Tags
          </label>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {allTags
              .filter((tag: string) => !filters.tags.includes(tag))
              .slice(0, 10)
              .map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => dispatch(addTagFilter(tag))}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-900 dark:hover:text-blue-200 rounded transition-colors"
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>
      </FilterSection>

      {/* Projects */}
      <FilterSection
        title="Projects"
        icon={<FolderIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
      >
        {/* Selected Projects */}
        {filters.projectIds.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Selected Projects
            </label>
            <div className="space-y-1">
              {filters.projectIds.map(projectId => {
                const project = allProjects.find(p => p.id === projectId);
                return project ? (
                  <div
                    key={projectId}
                    className="flex items-center justify-between px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded"
                  >
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      {project.name}
                    </span>
                    <button
                      onClick={() => dispatch(removeProjectFilter(projectId))}
                      className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Available Projects */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Available Projects
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {allProjects
              .filter(project => !filters.projectIds.includes(project.id))
              .map(project => (
                <button
                  key={project.id}
                  onClick={() => dispatch(addProjectFilter(project.id))}
                  className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-left bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900 rounded transition-colors"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                </button>
              ))}
          </div>
        </div>
      </FilterSection>

      {/* Date Ranges */}
      <FilterSection
        title="Date Ranges"
        icon={<CalendarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Created Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                value={filters.dateRange?.start}
                onChange={(date) => dispatch(setDateRange({
                  ...filters.dateRange,
                  start: date || undefined
                }))}
                placeholder="Start date"
                className="text-sm"
              />
              <DatePicker
                value={filters.dateRange?.end}
                onChange={(date) => dispatch(setDateRange({
                  ...filters.dateRange,
                  end: date || undefined
                }))}
                placeholder="End date"
                className="text-sm"
              />
            </div>
          </div>

          {filters.contentTypes.includes('tasks') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Due Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={filters.dueDateRange?.start}
                  onChange={(date) => dispatch(setDueDateRange({
                    ...filters.dueDateRange,
                    start: date || undefined
                  }))}
                  placeholder="Start date"
                  className="text-sm"
                />
                <DatePicker
                  value={filters.dueDateRange?.end}
                  onChange={(date) => dispatch(setDueDateRange({
                    ...filters.dueDateRange,
                    end: date || undefined
                  }))}
                  placeholder="End date"
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </FilterSection>
    </div>
  );
};