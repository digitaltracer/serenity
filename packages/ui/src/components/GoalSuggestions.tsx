import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { Lightbulb, TrendingUp, CheckCircle, Calendar } from 'lucide-react';

export interface GoalSuggestion {
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  targetCount?: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
  reasoning: string;
  confidence: number;
}

export interface GoalSuggestionsProps {
  suggestions: GoalSuggestion[];
  onAccept: (suggestion: GoalSuggestion) => void;
  onDismiss: (index: number) => void;
  className?: string;
}

const GoalSuggestions: React.FC<GoalSuggestionsProps> = ({
  suggestions,
  onAccept,
  onDismiss,
  className,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'daily':
        return <CheckCircle className="w-4 h-4" />;
      case 'weekly':
        return <Calendar className="w-4 h-4" />;
      case 'monthly':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No new goal suggestions available at this time.
            <br />
            Keep tracking your tasks and journal entries!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-foreground">
          Suggested Goals
        </h3>
      </div>

      {suggestions.map((suggestion, index) => (
        <Card key={index} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-base mb-2">
                  {suggestion.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getPriorityColor(suggestion.priority)
                )}>
                  {suggestion.priority}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Reasoning */}
              <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                <strong>Why this goal?</strong> {suggestion.reasoning}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getTimeframeIcon(suggestion.timeframe)}
                  <span className="capitalize">{suggestion.timeframe}</span>
                </div>
                <div>
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </div>
                {suggestion.targetCount && (
                  <div>
                    Target: {suggestion.targetCount}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => onAccept(suggestion)}
                  className="rounded-lg text-xs"
                >
                  Create Goal
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss(index)}
                  className="rounded-lg text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { GoalSuggestions };

