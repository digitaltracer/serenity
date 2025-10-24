/**
 * Insight Actions Menu Component
 * Dropdown menu with all available actions for an insight
 */

import React from 'react';
import {
  ThumbsUp,
  Target,
  Eye,
  StickyNote,
  X,
  Star,
  CheckCircle,
} from 'lucide-react';
import type { AIInsight } from './InsightCard';

export interface InsightActionsMenuProps {
  insight: AIInsight;
  isOpen: boolean;
  onClose: () => void;
  onMarkHelpful?: (id: string, helpful: boolean) => void;
  onSetAsGoal?: (insight: AIInsight) => void;
  onViewSource?: (insight: AIInsight) => void;
  onAddNote?: () => void;
  onDismiss?: (id: string) => void;
  onStartRating?: () => void;
}

export const InsightActionsMenu: React.FC<InsightActionsMenuProps> = ({
  insight,
  isOpen,
  onClose,
  onMarkHelpful,
  onSetAsGoal,
  onViewSource,
  onAddNote,
  onDismiss,
  onStartRating,
}) => {
  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="absolute right-0 top-8 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
        <div className="py-1">
          {/* Mark as Helpful */}
          {onMarkHelpful && (
            <button
              onClick={() => handleAction(() => onMarkHelpful(insight.id, !insight.markedHelpful))}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              {insight.markedHelpful ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Marked as Helpful</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  <span>Mark as Helpful</span>
                </>
              )}
            </button>
          )}

          {/* Rate */}
          {onStartRating && (
            <button
              onClick={() => handleAction(onStartRating)}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <Star className={`w-4 h-4 ${insight.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              <span>{insight.userRating ? `Rated ${insight.userRating}/5` : 'Rate this Insight'}</span>
            </button>
          )}

          {/* Set as Goal */}
          {onSetAsGoal && insight.actionable && (
            <button
              onClick={() => handleAction(() => onSetAsGoal(insight))}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>Set as Goal</span>
            </button>
          )}

          {/* View Source */}
          {onViewSource && insight.metadata?.sourceIds && insight.metadata.sourceIds.length > 0 && (
            <button
              onClick={() => handleAction(() => onViewSource(insight))}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View Source ({insight.metadata.sourceIds.length})</span>
            </button>
          )}

          {/* Add Note */}
          {onAddNote && (
            <button
              onClick={() => handleAction(onAddNote)}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <StickyNote className="w-4 h-4" />
              <span>{insight.userNotes ? 'Edit Note' : 'Add Note'}</span>
            </button>
          )}

          {/* Divider */}
          {onDismiss && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          )}

          {/* Dismiss */}
          {onDismiss && !insight.dismissed && (
            <button
              onClick={() => handleAction(() => onDismiss(insight.id))}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Dismiss</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
