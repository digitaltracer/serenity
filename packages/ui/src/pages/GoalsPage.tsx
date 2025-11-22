'use client'

import React, { useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectAllGoals,
  selectFilteredGoals,
  selectGoalFilters,
  selectGoalModalOpen,
  selectActiveProjects,
  selectAllTasks,
  selectAllEntries,
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalsProgress,
  openGoalModal,
  closeGoalModal,
  setGoalFilters,
  clearGoalFilters,
  Goal,
  Project,
} from '@serenity/core';
import { GoalCard, GoalModal, Button, Card, CardContent, CustomSelect } from '../components';
import { Target, Plus, Filter, RefreshCw } from 'lucide-react';

/**
 * Shared GoalsPage component for both desktop and web
 */
export const GoalsPage: React.FC = () => {
  const dispatch = useDispatch();

  // Selectors
  const goals = useSelector(selectAllGoals);
  const filteredGoals = useSelector(selectFilteredGoals);
  const filters = useSelector(selectGoalFilters);
  const isModalOpen = useSelector(selectGoalModalOpen);
  const projects = useSelector(selectActiveProjects);
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);

  // Update goal progress when tasks/entries change
  useEffect(() => {
    if (goals.length > 0) {
      dispatch(updateGoalsProgress({ tasks, journalEntries, projects }));
    }
  }, [dispatch, tasks, journalEntries, projects, goals.length]);

  // Memoized stats
  const stats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.progress?.percentage || 0), 0) / goals.length)
      : 0;

    return {
      total: goals.length,
      active: activeGoals.length,
      completed: completedGoals.length,
      avgProgress,
    };
  }, [goals]);

  // Handlers
  const handleCreateGoal = useCallback((goalData: Partial<Goal>) => {
    dispatch(addGoal(goalData as Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress'>));
    dispatch(closeGoalModal());
  }, [dispatch]);

  const handleEditGoal = useCallback((goal: Goal) => {
    // For now, just log - full edit functionality would need selectedGoal state
    console.log('Edit goal:', goal);
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      dispatch(deleteGoal(goalId));
    }
  }, [dispatch]);

  const handleRefreshProgress = useCallback(() => {
    dispatch(updateGoalsProgress({ tasks, journalEntries, projects }));
  }, [dispatch, tasks, journalEntries, projects]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    dispatch(setGoalFilters({ [key]: value }));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearGoalFilters());
  }, [dispatch]);

  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.priority !== 'all';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Goals
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshProgress}
              title="Refresh progress"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => dispatch(openGoalModal())}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Goal
            </Button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Set and track your personal and professional goals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.avgProgress}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-3">
              <div className="min-w-[140px]">
                <CustomSelect
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'failed', label: 'Failed' },
                  ]}
                />
              </div>

              <div className="min-w-[160px]">
                <CustomSelect
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'weekly_tasks', label: 'Weekly Tasks' },
                    { value: 'project_tasks', label: 'Project Tasks' },
                    { value: 'priority_tasks', label: 'Priority Tasks' },
                    { value: 'daily_streak', label: 'Daily Streak' },
                    { value: 'journal_weekly', label: 'Journal Weekly' },
                    { value: 'completion_rate', label: 'Completion Rate' },
                  ]}
                />
              </div>

              <div className="min-w-[140px]">
                <CustomSelect
                  value={filters.priority}
                  onChange={(value) => handleFilterChange('priority', value)}
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">
              {goals.length === 0 ? '🎯' : '🔍'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {goals.length === 0 ? 'No Goals Yet' : 'No Goals Match Filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {goals.length === 0
                ? 'Create your first goal to start tracking your progress'
                : 'Try adjusting your filters to see more goals'}
            </p>
            {goals.length === 0 && (
              <Button
                variant="primary"
                onClick={() => dispatch(openGoalModal())}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => dispatch(closeGoalModal())}
        onSave={handleCreateGoal}
        projects={projects}
        isEditing={false}
      />
    </div>
  );
};
