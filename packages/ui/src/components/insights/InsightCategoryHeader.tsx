/**
 * Insight Category Header Component
 * Header for categorized insight sections with expand/collapse and sorting
 */

import React, { useState } from 'react';
import {
  Target,
  Heart,
  RefreshCw,
  Flag,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  BookOpen,
} from 'lucide-react';

export type InsightCategory = 'tasks' | 'journal' | 'habits' | 'goals';

export type SortOption = 'newest' | 'oldest' | 'highest-rated' | 'most-helpful';

export interface InsightCategoryHeaderProps {
  category: InsightCategory;
  count: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showSortOptions?: boolean;
}

const categoryConfig = {
  tasks: {
    title: 'Tasks & Productivity',
    icon: CheckSquare,
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Task completion, velocity, focus patterns',
  },
  journal: {
    title: 'Well-being & Journaling',
    icon: Heart,
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Mood, balance, stress indicators',
  },
  habits: {
    title: 'Habits & Patterns',
    icon: RefreshCw,
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Recurring patterns, consistency',
  },
  goals: {
    title: 'Goals & Achievements',
    icon: Flag,
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
    description: 'Progress, milestones, achievements',
  },
};

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'most-helpful', label: 'Most Helpful' },
];

export const InsightCategoryHeader: React.FC<InsightCategoryHeaderProps> = ({
  category,
  count,
  isExpanded,
  onToggleExpand,
  sortBy,
  onSortChange,
  showSortOptions = true,
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const config = categoryConfig[category];
  const IconComponent = config.icon;

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-4 mb-4`}>
      <div className="flex items-center justify-between">
        {/* Left Side: Icon, Title, Count */}
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-3 flex-1 text-left group"
        >
          <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${config.borderColor} border`}>
            <IconComponent className={`w-5 h-5 ${config.textColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${config.textColor}`}>
                {config.title}
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-600">
                {count} {count === 1 ? 'insight' : 'insights'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {config.description}
            </p>
          </div>

          {/* Expand/Collapse Icon */}
          <div className={`transition-transform ${isExpanded ? 'rotate-0' : 'rotate-0'}`}>
            {isExpanded ? (
              <ChevronUp className={`w-5 h-5 ${config.textColor} group-hover:opacity-70 transition-opacity`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${config.textColor} group-hover:opacity-70 transition-opacity`} />
            )}
          </div>
        </button>

        {/* Right Side: Sort Options */}
        {showSortOptions && isExpanded && count > 0 && (
          <div className="relative ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSortMenu(!showSortMenu);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sort: {sortOptions.find(o => o.value === sortBy)?.label}
            </button>

            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                  <div className="py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          sortBy === option.value
                            ? `${config.textColor} ${config.bgColor} font-medium`
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
