import React, { useMemo, useCallback } from 'react';
import { Goal, getGoalTypeLabel } from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Calendar, Flag, Edit2, Trash2, Bell } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
  onAddReminder?: (goal: Goal) => void;
  className?: string;
  showActions?: boolean;
}

const GoalCardComponent: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  onAddReminder,
  className = '',
  showActions = true,
}) => {
  // Memoize expensive calculations
  const { progress, isCompleted, isOverdue } = useMemo(() => {
    const prog = goal.progress?.percentage ?? 0;
    const completed = goal.status === 'completed' || goal.progress?.isCompleted || false;
    const overdue = goal.progress?.periodEnd && new Date(goal.progress.periodEnd) < new Date() && !completed;
    return { progress: prog, isCompleted: completed, isOverdue: overdue };
  }, [goal.progress?.percentage, goal.progress?.isCompleted, goal.progress?.periodEnd, goal.status]);

  

  // Memoize formatted dates and days remaining to avoid recalculation
  const { daysRemaining, formattedStartDate, formattedEndDate } = useMemo(() => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    let days: number | null = null;
    if (goal.progress?.periodEnd) {
      const today = new Date();
      const endDate = new Date(goal.progress.periodEnd);
      const diffTime = endDate.getTime() - today.getTime();
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      daysRemaining: days,
      formattedStartDate: goal.progress?.periodStart ? formatDate(goal.progress.periodStart) : 'No start',
      formattedEndDate: goal.progress?.periodEnd ? formatDate(goal.progress.periodEnd) : 'No end'
    };
  }, [goal.progress?.periodStart, goal.progress?.periodEnd]);

  // Memoize progress color
  const ringColor = useMemo(() => {
    if (isCompleted) return 'rgb(34 197 94)'; // green-500
    if (progress >= 75) return 'rgb(59 130 246)'; // blue-500
    if (progress >= 50) return 'rgb(234 179 8)'; // yellow-500
    return 'rgb(156 163 175)'; // gray-400
  }, [isCompleted, progress]);

  const ringTrack = 'rgba(107,114,128,0.25)';

  // Memoize event handlers
  const handleProgressIncrement = useCallback(() => {
    if (goal.progress?.current !== undefined && goal.progress?.target !== undefined &&
        goal.progress.current < goal.progress.target && onUpdateProgress) {
      onUpdateProgress(goal.id, goal.progress.current + 1);
    }
  }, [goal.id, goal.progress?.current, goal.progress?.target, onUpdateProgress]);

  const handleProgressDecrement = useCallback(() => {
    if (goal.progress?.current !== undefined && goal.progress.current > 0 && onUpdateProgress) {
      onUpdateProgress(goal.id, goal.progress.current - 1);
    }
  }, [goal.id, goal.progress?.current, onUpdateProgress]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit(goal);
  }, [goal, onEdit]);

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(goal.id);
  }, [goal.id, onDelete]);

  const handleAddReminder = useCallback(() => {
    if (onAddReminder) onAddReminder(goal);
  }, [goal, onAddReminder]);

  return (
    <Card
      className={`group goal-card transition-all duration-200 hover:shadow-md ${className} ${
        isOverdue ? 'border-red-300 dark:border-red-700' : ''
      }`}
    >
      <CardHeader className="pb-4 md:pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {goal.title}
            </CardTitle>
            {goal.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{goal.description}</p>
            )}
            {/* Minimal metadata row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  goal.status === 'active'
                    ? 'bg-green-500'
                    : goal.status === 'completed'
                    ? 'bg-blue-500'
                    : goal.status === 'paused'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`} />
                <span className="capitalize">{goal.status}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Flag className="w-3 h-3" />
                <span className="capitalize">{goal.priority}</span>
              </span>
              <span className="inline-flex items-center gap-1">{getGoalTypeLabel(goal.type)}</span>
              {goal.reminders && goal.reminders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Bell className="w-3 h-3" />
                  {goal.reminders.length}
                </span>
              )}
            </div>

            {showActions && (
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 flex items-center gap-2">
                {onAddReminder && (
                  <button
                    onClick={handleAddReminder}
                    className="p-1 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Add Reminder"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="p-1 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit Goal"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Circular progress */}
          <div className="flex flex-col items-end shrink-0">
            <div
              className="relative w-16 h-16 rounded-full"
              aria-label={`Progress ${Math.round(progress)}%`}
              title={`${Math.round(progress)}% complete`}
              style={{
                background: `conic-gradient(${ringColor} ${Math.min(progress, 100) * 3.6}deg, ${ringTrack} 0deg)`,
              }}
            >
              <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
              {(goal.progress?.current ?? 0)} / {(goal.progress?.target ?? 0)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {formattedStartDate}
              {' '}–{' '}
              {formattedEndDate}
            </span>
          </div>
          {daysRemaining !== null && (
            <span className={`${
              isOverdue ? 'text-red-500' : daysRemaining <= 7 ? 'text-yellow-500' : ''
            }`}>
              {isOverdue
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0
                ? 'Due today'
                : daysRemaining === 1
                ? '1 day left'
                : `${daysRemaining} days left`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const GoalCard = React.memo(GoalCardComponent);
