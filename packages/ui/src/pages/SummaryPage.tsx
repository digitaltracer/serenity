'use client'

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  selectFilteredSummaries,
  selectSummariesLoading,
  selectSummariesGenerating,
  selectSummariesError,
  selectSummariesFilters,
  setFilter,
  type AppDispatch,
} from '@serenity/core';
import {
  SummaryGeneratorCard,
  SummaryCard,
  SummaryFilters,
  EmptySummariesCard,
  type Summary,
  type SummaryCategory,
} from '../components/summaries';

export interface SummaryPageProps {
  // Platform-specific callbacks
  onLoadSummaries?: () => Promise<void>;
  onGenerateSummary?: (params: {
    startDate: string;
    endDate: string;
    types: ('tasks' | 'journal')[];
  }) => Promise<void>;
  onDeleteSummary?: (id: string) => Promise<void>;
  onExportSummary?: (id: string) => Promise<void>;

  // Optional header content (e.g., back button for desktop)
  headerContent?: React.ReactNode;

  // Additional children content
  children?: React.ReactNode;
}

/**
 * Shared SummaryPage component with callback props for platform-specific actions
 */
export const SummaryPage: React.FC<SummaryPageProps> = ({
  onLoadSummaries,
  onGenerateSummary,
  onDeleteSummary,
  onExportSummary,
  headerContent,
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const summaries = useSelector(selectFilteredSummaries) as Summary[];
  const loading = useSelector(selectSummariesLoading);
  const generating = useSelector(selectSummariesGenerating);
  const error = useSelector(selectSummariesError);
  const filters = useSelector(selectSummariesFilters);

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<('tasks' | 'journal')[]>(['tasks', 'journal']);

  // Load summaries on mount (platform-specific)
  useEffect(() => {
    if (onLoadSummaries) {
      onLoadSummaries();
    }
  }, [onLoadSummaries]);

  // Set default dates (last 7 days)
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    setEndDate(today);
    setStartDate(lastWeek);
  }, []);

  const handleGenerateSummary = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (selectedTypes.length === 0) {
      alert('Please select at least one type (Tasks or Journal)');
      return;
    }

    if (onGenerateSummary) {
      await onGenerateSummary({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        types: selectedTypes,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this summary?')) {
      if (onDeleteSummary) {
        await onDeleteSummary(id);
      }
    }
  };

  const handleExport = async (id: string) => {
    if (onExportSummary) {
      await onExportSummary(id);
    }
  };

  const handleQuickPreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);

    setEndDate(today);
    setStartDate(start);
  };

  const toggleType = (type: 'tasks' | 'journal') => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleFilterChange = (category: SummaryCategory) => {
    dispatch(setFilter({ category }));
  };

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {headerContent}
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                    AI Summaries
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Generate and view AI-powered summaries of your tasks and journal entries
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Summary Section */}
          <SummaryGeneratorCard
            startDate={startDate}
            endDate={endDate}
            selectedTypes={selectedTypes}
            generating={generating}
            error={error}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onToggleType={toggleType}
            onQuickPreset={handleQuickPreset}
            onGenerate={handleGenerateSummary}
          />

          {/* Summaries List Header */}
          <div className="flex items-center justify-between my-6">
            <h2 className="text-xl font-semibold">Your Summaries</h2>
            <SummaryFilters
              currentCategory={filters.category as SummaryCategory}
              onCategoryChange={handleFilterChange}
            />
          </div>

          {/* Summaries List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : summaries.length === 0 ? (
            <EmptySummariesCard />
          ) : (
            <div className="grid gap-4">
              {summaries.map((summary) => (
                <SummaryCard
                  key={summary.id}
                  summary={summary}
                  onExport={onExportSummary ? handleExport : undefined}
                  onDelete={onDeleteSummary ? handleDelete : undefined}
                />
              ))}
            </div>
          )}

          {/* Additional platform-specific content */}
          {children}
        </div>
      </div>
    </div>
  );
};
