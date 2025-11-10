/**
 * InsightCategoryBadge Component
 * Small badge displaying insight category with color coding
 */

import React from 'react';

export type InsightCategory = 'tasks' | 'journal' | 'habits' | 'goals';

export interface InsightCategoryBadgeProps {
  category: InsightCategory;
  size?: 'sm' | 'md' | 'lg';
}

const categoryConfig = {
  tasks: {
    label: 'Tasks',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  journal: {
    label: 'Journal',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  habits: {
    label: 'Habits',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  goals: {
    label: 'Goals',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  },
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const InsightCategoryBadge: React.FC<InsightCategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const config = categoryConfig[category];

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};
