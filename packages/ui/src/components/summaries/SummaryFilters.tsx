'use client'

import React from 'react';
import { Badge } from '../Badge';

export type SummaryCategory = 'all' | 'tasks' | 'journal' | 'combined';

export interface SummaryFiltersProps {
  currentCategory: SummaryCategory;
  onCategoryChange: (category: SummaryCategory) => void;
}

export const SummaryFilters: React.FC<SummaryFiltersProps> = ({
  currentCategory,
  onCategoryChange,
}) => {
  const categories: { value: SummaryCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'journal', label: 'Journal' },
    { value: 'combined', label: 'Combined' },
  ];

  return (
    <div className="flex gap-2">
      {categories.map((cat) => (
        <Badge
          key={cat.value}
          variant={currentCategory === cat.value ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => onCategoryChange(cat.value)}
        >
          {cat.label}
        </Badge>
      ))}
    </div>
  );
};
