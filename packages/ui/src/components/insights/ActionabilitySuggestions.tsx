/**
 * Actionability Suggestions Component
 * Display and execute actionable suggestions from insights
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Target,
  RefreshCw,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export interface ActionabilitySuggestion {
  id: string;
  action: string;
  description: string;
  type: 'task' | 'goal' | 'habit' | 'journal_prompt';
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    suggestedTitle?: string;
    suggestedDescription?: string;
    suggestedTags?: string[];
    suggestedDueDate?: string;
  };
}

export interface ActionabilitySuggestionsProps {
  suggestions: ActionabilitySuggestion[];
  onExecute?: (suggestion: ActionabilitySuggestion) => Promise<{ success: boolean; actionId?: string; error?: string }>;
  loading?: boolean;
  defaultExpanded?: boolean;
}

const typeIcons = {
  task: CheckSquare,
  goal: Target,
  habit: RefreshCw,
  journal_prompt: BookOpen,
};

const typeColors = {
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  goal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  habit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  journal_prompt: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const priorityColors = {
  high: 'border-red-300 dark:border-red-700',
  medium: 'border-yellow-300 dark:border-yellow-700',
  low: 'border-gray-300 dark:border-gray-600',
};

export const ActionabilitySuggestions: React.FC<ActionabilitySuggestionsProps> = ({
  suggestions,
  onExecute,
  loading = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleExecute = async (suggestion: ActionabilitySuggestion) => {
    if (!onExecute || executingId || executedIds.has(suggestion.id)) {
      return;
    }

    setExecutingId(suggestion.id);
    setErrors(new Map(errors).set(suggestion.id, '')); // Clear previous error

    try {
      const result = await onExecute(suggestion);

      if (result.success) {
        setExecutedIds(new Set(executedIds).add(suggestion.id));
      } else {
        setErrors(new Map(errors).set(suggestion.id, result.error || 'Failed to execute'));
      }
    } catch (error) {
      setErrors(new Map(errors).set(suggestion.id, (error as Error).message));
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>Suggested Actions</span>
          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
            {suggestions.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Suggestions List */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {suggestions.map((suggestion) => {
            const IconComponent = typeIcons[suggestion.type];
            const isExecuting = executingId === suggestion.id;
            const isExecuted = executedIds.has(suggestion.id);
            const error = errors.get(suggestion.id);

            return (
              <div
                key={suggestion.id}
                className={`p-3 border-l-2 ${priorityColors[suggestion.priority]} bg-gray-50 dark:bg-gray-900 rounded-r-lg`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeColors[suggestion.type]}`}>
                          {suggestion.type.replace('_', ' ')}
                        </span>
                        {suggestion.priority === 'high' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded">
                            High Priority
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.action}
                      </span>
                    </div>
                  </div>

                  {/* Execute Button */}
                  {onExecute && (
                    <button
                      onClick={() => handleExecute(suggestion)}
                      disabled={isExecuting || isExecuted}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                        isExecuted
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-default'
                          : isExecuting
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 cursor-wait'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : isExecuted ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Created</span>
                        </>
                      ) : (
                        <span>Execute</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                  {suggestion.description}
                </p>

                {/* Metadata Preview */}
                {suggestion.metadata?.suggestedTitle && (
                  <div className="mt-2 ml-6 text-xs text-gray-500 dark:text-gray-500">
                    <span className="font-medium">Will create:</span> "{suggestion.metadata.suggestedTitle}"
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-2 ml-6 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-3 text-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Generating suggestions...
          </p>
        </div>
      )}
    </div>
  );
};
