/**
 * InsightCard Component
 * Interactive card for displaying AI-generated insights with feedback actions
 */

import React, { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Star,
  MoreVertical,
  ThumbsUp,
  Target,
  Eye,
  StickyNote,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SparklineChart } from '../charts/SparklineChart';

export interface AIInsight {
  id: string;
  type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-1 score
  createdAt: string;
  source: 'openai' | 'gemini' | 'anthropic' | 'local';
  category: 'tasks' | 'journal' | 'habits' | 'goals';
  actionable?: boolean;
  metadata?: {
    sourceIds?: string[];
    tags?: string[];
    priority?: 'high' | 'medium' | 'low';
  };
  visualizationData?: number[];
  actionabilitySuggestions?: Array<{
    action: string;
    description: string;
    type: 'task' | 'goal' | 'habit';
  }>;
  // User feedback
  userRating?: number;
  dismissed?: boolean;
  markedHelpful?: boolean;
  userNotes?: string;
}

export interface InsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  onMarkHelpful?: (id: string) => void;
  onSetAsGoal?: (insight: AIInsight) => void;
  onViewSource?: (insight: AIInsight) => void;
  onRate?: (id: string, rating: number) => void;
  onAddNote?: (id: string, note: string) => void;
  compact?: boolean;
}

const typeConfig = {
  productivity: {
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Productivity',
  },
  behavior: {
    icon: Lightbulb,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    label: 'Behavior',
  },
  recommendation: {
    icon: Lightbulb,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    label: 'Recommendation',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    label: 'Warning',
  },
};

const categoryColors = {
  tasks: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  journal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  habits: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  goals: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDismiss,
  onMarkHelpful,
  onSetAsGoal,
  onViewSource,
  onRate,
  onAddNote,
  compact = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rating, setRating] = useState(insight.userRating || 0);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState(insight.userNotes || '');

  const config = typeConfig[insight.type];
  const IconComponent = config.icon;

  const timeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const handleRate = (value: number) => {
    setRating(value);
    if (onRate) {
      onRate(insight.id, value);
    }
  };

  const handleSaveNote = () => {
    if (onAddNote) {
      onAddNote(insight.id, noteText);
    }
    setIsAddingNote(false);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border ${config.border} shadow-sm hover:shadow-md transition-all duration-200 ${
        insight.dismissed ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <IconComponent className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {insight.title}
                </h3>
                {insight.actionable && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                    Actionable
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[insight.category]}`}>
                  {insight.category}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(insight.createdAt)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {insight.source}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {onMarkHelpful && !insight.markedHelpful && (
                    <button
                      onClick={() => {
                        onMarkHelpful(insight.id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Mark as Helpful
                    </button>
                  )}
                  {onSetAsGoal && insight.actionable && (
                    <button
                      onClick={() => {
                        onSetAsGoal(insight);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Set as Goal
                    </button>
                  )}
                  {onViewSource && insight.metadata?.sourceIds && (
                    <button
                      onClick={() => {
                        onViewSource(insight);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Source
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsAddingNote(true);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <StickyNote className="w-4 h-4" />
                    Add Note
                  </button>
                  {onDismiss && (
                    <button
                      onClick={() => {
                        onDismiss(insight.id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm text-gray-700 dark:text-gray-300 ${compact ? 'line-clamp-2' : ''} mb-3`}>
          {insight.description}
        </p>

        {/* Visualization */}
        {insight.visualizationData && insight.visualizationData.length > 0 && (
          <div className="mb-3">
            <SparklineChart
              data={insight.visualizationData}
              height={50}
              color={config.color.includes('blue') ? '#3B82F6' :
                     config.color.includes('purple') ? '#8B5CF6' :
                     config.color.includes('green') ? '#10B981' : '#F59E0B'}
            />
          </div>
        )}

        {/* Confidence Score */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Confidence</span>
            <span>{Math.round(insight.confidence * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.bg}`}
              style={{ width: `${insight.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Rating Stars */}
        {onRate && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Rate:</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRate(value)}
                className="transition-colors"
              >
                <Star
                  className={`w-4 h-4 ${
                    value <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Note Input */}
        {isAddingNote && (
          <div className="mb-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your notes..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNote}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingNote(false)}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* User Notes Display */}
        {!isAddingNote && insight.userNotes && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300">
            <span className="font-medium">Note:</span> {insight.userNotes}
          </div>
        )}

        {/* Actionability Suggestions */}
        {insight.actionabilitySuggestions && insight.actionabilitySuggestions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>Suggested Actions ({insight.actionabilitySuggestions.length})</span>
              {showSuggestions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showSuggestions && (
              <div className="mt-3 space-y-2">
                {insight.actionabilitySuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                        {suggestion.type}
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {suggestion.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {suggestion.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Helpful Badge */}
        {insight.markedHelpful && (
          <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">
            <ThumbsUp className="w-3 h-3" />
            Marked as helpful
          </div>
        )}
      </div>
    </div>
  );
};
