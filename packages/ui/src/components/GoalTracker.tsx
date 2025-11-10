/**
 * Goal Tracker Component
 * Track and visualize progress towards productivity goals with gamification
 */

import React, { useMemo, useState } from 'react';
import { Target, TrendingUp, Award, Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { InteractiveChart } from './InteractiveChart';
import { Goal as CoreGoal } from '@serenity/core';

// Legacy Goal interface for backward compatibility
export interface LegacyGoal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target: number;
  current: number;
  unit: string; // e.g., "tasks", "entries", "hours"
  startDate: Date;
  endDate: Date;
  color?: string;
  isActive: boolean;
  createdAt: Date;
}

interface GoalTrackerProps {
  goals: LegacyGoal[];
  tasks?: any[];
  journalEntries?: any[];
  className?: string;
  onGoalCreate?: (goal: Omit<LegacyGoal, 'id' | 'current' | 'createdAt'>) => void;
  onGoalUpdate?: (goalId: string, updates: Partial<LegacyGoal>) => void;
  onGoalDelete?: (goalId: string) => void;
  showCreateButton?: boolean;
  showProgress?: boolean;
  showChart?: boolean;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  goals,
  tasks = [],
  journalEntries = [],
  className = '',
  onGoalCreate,
  onGoalUpdate,
  onGoalDelete,
  showCreateButton = true,
  showProgress = true,
  showChart = true,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<LegacyGoal | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Calculate current progress for goals based on actual data
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      let current = 0;
      const now = new Date();
      const isExpired = now > goal.endDate;
      
      // Calculate progress based on goal type and data
      if (goal.unit === 'tasks') {
        current = tasks.filter(task => {
          if (!task.completed || !task.updatedAt) return false;
          const completedDate = new Date(task.updatedAt);
          return completedDate >= goal.startDate && completedDate <= goal.endDate;
        }).length;
      } else if (goal.unit === 'entries') {
        current = journalEntries.filter(entry => {
          if (!entry.date) return false;
          const entryDate = new Date(entry.date);
          return entryDate >= goal.startDate && entryDate <= goal.endDate;
        }).length;
      }

      const progress = goal.target > 0 ? (current / goal.target) * 100 : 0;
      const isCompleted = current >= goal.target;
      const daysRemaining = Math.max(0, Math.ceil((goal.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyTargetRemaining = daysRemaining > 0 ? Math.ceil((goal.target - current) / daysRemaining) : 0;

      return {
        ...goal,
        current,
        progress: Math.min(progress, 100),
        isCompleted,
        isExpired,
        daysRemaining,
        dailyTargetRemaining: Math.max(0, dailyTargetRemaining),
      };
    });
  }, [goals, tasks, journalEntries]);

  // Generate progress chart data for selected goal
  const chartData = useMemo(() => {
    if (!selectedGoal || !showChart) return [];

    const goal = goalsWithProgress.find(g => g.id === selectedGoal.id);
    if (!goal) return [];

    const data: any[] = [];
    const startDate = new Date(goal.startDate);
    const endDate = new Date(Math.min(goal.endDate.getTime(), new Date().getTime()));
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      let dayProgress = 0;
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      if (goal.unit === 'tasks') {
        dayProgress = tasks.filter(task => {
          if (!task.completed || !task.updatedAt) return false;
          const completedDate = new Date(task.updatedAt);
          return completedDate >= dayStart && completedDate <= dayEnd;
        }).length;
      } else if (goal.unit === 'entries') {
        dayProgress = journalEntries.filter(entry => {
          if (!entry.date) return false;
          const entryDate = new Date(entry.date);
          return entryDate >= dayStart && entryDate <= dayEnd;
        }).length;
      }

      data.push({
        id: `progress-${currentDate.getTime()}`,
        label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: dayProgress,
        date: new Date(currentDate),
        color: goal.color || '#3B82F6',
        metadata: {
          date: currentDate,
          progress: dayProgress,
          cumulative: data.reduce((sum, d) => sum + d.value, dayProgress),
        },
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }, [selectedGoal, goalsWithProgress, tasks, journalEntries, showChart]);

  const getProgressColor = (progress: number, isCompleted: boolean, isExpired: boolean) => {
    if (isCompleted) return 'text-green-600 dark:text-green-400';
    if (isExpired) return 'text-red-600 dark:text-red-400';
    if (progress >= 80) return 'text-green-600 dark:text-green-400';
    if (progress >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (progress >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBgColor = (progress: number, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-100 dark:bg-green-900/20';
    if (progress >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (progress >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (progress >= 40) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const formatTimeRemaining = (daysRemaining: number) => {
    if (daysRemaining === 0) return 'Due today';
    if (daysRemaining === 1) return '1 day left';
    if (daysRemaining <= 7) return `${daysRemaining} days left`;
    if (daysRemaining <= 30) return `${Math.ceil(daysRemaining / 7)} weeks left`;
    return `${Math.ceil(daysRemaining / 30)} months left`;
  };

  if (goalsWithProgress.length === 0 && !showCreateButton) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3" />
          <div className="text-sm">No goals set</div>
          <div className="text-xs mt-1">Set some productivity goals to track your progress</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`goal-tracker ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Goal Tracker</span>
        </h3>
        {showCreateButton && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        )}
      </div>

      {/* Goals Grid */}
      {goalsWithProgress.length > 0 && (
        <div className="space-y-4 mb-6">
          {goalsWithProgress.map(goal => (
            <div
              key={goal.id}
              className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                selectedGoal?.id === goal.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              } ${
                !goal.isActive ? 'opacity-60' : ''
              }`}
              onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{goal.title}</h4>
                    {goal.isCompleted && (
                      <Award className="w-4 h-4 text-yellow-500" />
                    )}
                    {goal.isExpired && !goal.isCompleted && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle edit
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoalDelete?.(goal.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {showProgress && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span className={`text-sm font-medium ${getProgressColor(goal.progress, goal.isCompleted, goal.isExpired)}`}>
                      {Math.round(goal.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.isCompleted
                          ? 'bg-green-500'
                          : goal.isExpired
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Goal Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{goal.type}</span>
                  </span>
                  {!goal.isExpired && !goal.isCompleted && goal.daysRemaining > 0 && (
                    <span>{formatTimeRemaining(goal.daysRemaining)}</span>
                  )}
                </div>
                {!goal.isCompleted && !goal.isExpired && goal.dailyTargetRemaining > 0 && (
                  <span className="text-orange-600 dark:text-orange-400">
                    {goal.dailyTargetRemaining} {goal.unit}/day needed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Chart for Selected Goal */}
      {selectedGoal && chartData.length > 0 && showChart && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Daily Progress: {selectedGoal.title}
          </h4>
          <InteractiveChart
            data={chartData}
            type="bar"
            width={600}
            height={200}
            showGrid={true}
            showAxis={true}
            showTooltip={true}
            colors={[selectedGoal.color || '#3B82F6']}
            formatTooltip={(dataPoint) => ({
              title: dataPoint.label,
              content: `${dataPoint.value} ${selectedGoal.unit} completed`,
            })}
          />
        </div>
      )}

      {/* Achievement Badges */}
      {goalsWithProgress.some(g => g.isCompleted) && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span>Recent Achievements</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {goalsWithProgress
              .filter(g => g.isCompleted)
              .slice(0, 5)
              .map(goal => (
                <div
                  key={goal.id}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>{goal.title}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {goalsWithProgress.filter(g => g.isCompleted).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {goalsWithProgress.filter(g => g.isActive && !g.isCompleted && !g.isExpired).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {Math.round(
              goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / 
              Math.max(goalsWithProgress.length, 1)
            )}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Progress</div>
        </div>
      </div>
    </div>
  );
};