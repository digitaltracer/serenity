import React from 'react';
import { Goal, getGoalTypeLabel } from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Badge } from './Badge';
import {
  Calendar,
  Flag,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Bell
} from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
  onAddReminder?: (goal: Goal) => void;
  className?: string;
  showActions?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  onAddReminder,
  className = '',
  showActions = true,
}) => {
  const progress = goal.progress?.percentage ?? 0;
  const isCompleted = goal.status === 'completed' || goal.progress?.isCompleted || false;
  const isOverdue = goal.progress?.periodEnd && new Date(goal.progress.periodEnd) < new Date() && !isCompleted;

  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-4 h-4 text-green-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'paused': return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    }
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    }
  };

  const getTypeLabel = (type: Goal['type']) => {
    return getGoalTypeLabel(type);
  };

  const handleProgressIncrement = () => {
    if (goal.progress?.current !== undefined && goal.progress?.target !== undefined &&
        goal.progress.current < goal.progress.target && onUpdateProgress) {
      onUpdateProgress(goal.id, goal.progress.current + 1);
    }
  };

  const handleProgressDecrement = () => {
    if (goal.progress?.current !== undefined && goal.progress.current > 0 && onUpdateProgress) {
      onUpdateProgress(goal.id, goal.progress.current - 1);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!goal.progress?.periodEnd) return null;
    const today = new Date();
    const endDate = new Date(goal.progress.periodEnd);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card className={`goal-card transition-all duration-200 hover:shadow-md ${className} ${isOverdue ? 'border-red-300 dark:border-red-700' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {goal.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className={getStatusColor(goal.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(goal.status)}
                  <span className="capitalize">{goal.status}</span>
                </div>
              </Badge>
              <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                <Flag className="w-3 h-3 mr-1" />
                {goal.priority}
              </Badge>
              <Badge variant="outline">
                {getTypeLabel(goal.type)}
              </Badge>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1 ml-2">
              {onAddReminder && (
                <button
                  onClick={() => onAddReminder(goal)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Add Reminder"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(goal)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Edit Goal"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(goal.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {goal.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {goal.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <div className="flex items-center space-x-2">
              {showActions && onUpdateProgress && goal.status === 'active' && goal.progress && (
                <>
                  <button
                    onClick={handleProgressDecrement}
                    disabled={(goal.progress?.current ?? 0) <= 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleProgressIncrement}
                    disabled={(goal.progress?.current ?? 0) >= (goal.progress?.target ?? 0)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {goal.progress?.current ?? 0} / {goal.progress?.target ?? 0}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500'
                    : progress >= 75
                      ? 'bg-blue-500'
                      : progress >= 50
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>

        {/* Period Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Period: {goal.progress?.periodStart ? formatDate(goal.progress.periodStart) : 'Not set'} - {goal.progress?.periodEnd ? formatDate(goal.progress.periodEnd) : 'Not set'}</span>
            </div>
            {daysRemaining !== null && (
              <div className={`flex items-center space-x-1 ${
                isOverdue ? 'text-red-500' : daysRemaining <= 7 ? 'text-yellow-500' : ''
              }`}>
                <Calendar className="w-3 h-3" />
                <span>
                  {isOverdue
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                      ? 'Due today'
                      : daysRemaining === 1
                        ? '1 day left'
                        : `${daysRemaining} days left`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reminder count */}
        {goal.reminders && goal.reminders.length > 0 && (
          <div className="mt-3 flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
            <Bell className="w-3 h-3" />
            <span>{goal.reminders.length} reminder{goal.reminders.length !== 1 ? 's' : ''} set</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
