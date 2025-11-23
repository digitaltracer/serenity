'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { DatePicker } from '../DatePicker';
import { Calendar, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

export interface SummaryGeneratorCardProps {
  startDate: Date | null;
  endDate: Date | null;
  selectedTypes: ('tasks' | 'journal')[];
  generating: boolean;
  error?: string | null;
  aiProviderConfigured?: boolean;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onToggleType: (type: 'tasks' | 'journal') => void;
  onQuickPreset: (days: number) => void;
  onGenerate: () => void;
  onNavigateToSettings?: () => void;
}

export const SummaryGeneratorCard: React.FC<SummaryGeneratorCardProps> = ({
  startDate,
  endDate,
  selectedTypes,
  generating,
  error,
  aiProviderConfigured = true,
  onStartDateChange,
  onEndDateChange,
  onToggleType,
  onQuickPreset,
  onGenerate,
  onNavigateToSettings,
}) => {
  const isDisabled = !aiProviderConfigured || generating || !startDate || !endDate || selectedTypes.length === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate New Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickPreset(7)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickPreset(30)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickPreset(90)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Last 3 Months
          </Button>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={onStartDateChange}
            placeholder="Select start date"
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={onEndDateChange}
            placeholder="Select end date"
            minDate={startDate || undefined}
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Include</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onToggleType('tasks')}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
                transition-all cursor-pointer
                ${
                  selectedTypes.includes('tasks')
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              Tasks
            </button>
            <button
              type="button"
              onClick={() => onToggleType('journal')}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
                transition-all cursor-pointer
                ${
                  selectedTypes.includes('journal')
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              Journal
            </button>
          </div>
        </div>

        {/* AI Provider Warning */}
        {!aiProviderConfigured && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                AI Provider not configured
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300/80">
                You need to configure an AI provider to use this feature.{' '}
                {onNavigateToSettings ? (
                  <button
                    onClick={onNavigateToSettings}
                    className="underline hover:no-underline font-medium"
                  >
                    Go to Settings
                  </button>
                ) : (
                  'Please configure one in Settings.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isDisabled}
          className="w-full gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Summary
            </>
          )}
        </Button>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
