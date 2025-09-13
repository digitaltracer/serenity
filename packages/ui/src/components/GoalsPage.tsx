import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RootState,
  selectAllGoals,
  selectFilteredGoals,
  selectGoalFilters,
  selectGoalModalOpen,
  selectReminderModalOpen,
  selectSelectedGoalId,
  openGoalModal,
  closeGoalModal,
  openReminderModal,
  closeReminderModal,
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalsProgress,
  setGoalFilters,
  clearGoalFilters,
  selectGoal,
  selectAllTasks,
  selectAllEntries,
  selectAllProjects,
  Goal,
  Reminder
} from '@serenity/core';
import { GoalCard } from './GoalCard';
import { GoalModal } from './GoalModal';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { CustomSelect } from './CustomSelect';
import { 
  Target, 
  Plus, 
  Filter, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Flag,
  Calendar,
  BarChart3,
  Trophy,
  Zap
} from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const dispatch = useDispatch();
  const goals = useSelector(selectAllGoals);
  const filteredGoals = useSelector(selectFilteredGoals);
  const filters = useSelector(selectGoalFilters);
  const isGoalModalOpen = useSelector(selectGoalModalOpen);
  const isReminderModalOpen = useSelector(selectReminderModalOpen);
  const selectedGoalId = useSelector(selectSelectedGoalId);
  
  // Data for goal progress calculation
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);
  
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Auto-update goal progress when data changes
  useEffect(() => {
    if (goals.length > 0) {
      dispatch(updateGoalsProgress({ tasks, journalEntries, projects }));
    }
  }, [dispatch, tasks, journalEntries, projects, goals.length]);

  // Calculate stats with null checks
  const safeGoals = goals || [];
  const safeFilteredGoals = filteredGoals || [];
  const stats = {
    total: safeGoals.length,
    active: safeGoals.filter(g => g?.status === 'active').length,
    completed: safeGoals.filter(g => g?.status === 'completed').length,
    completionRate: safeGoals.length > 0 ? Math.round((safeGoals.filter(g => g?.status === 'completed').length / safeGoals.length) * 100) : 0,
  };

  const handleCreateGoal = () => {
    setSelectedGoal(null);
    setIsEditing(false);
    dispatch(openGoalModal());
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditing(true);
    dispatch(selectGoal(goal.id));
    dispatch(openGoalModal());
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      dispatch(deleteGoal(goalId));
    }
  };

  const handleSaveGoal = (goalData: Partial<Goal>) => {
    if (isEditing && selectedGoal) {
      dispatch(updateGoal({ id: selectedGoal.id, updates: goalData }));
    } else {
      dispatch(addGoal(goalData as Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>));
    }
  };

  const handleUpdateProgress = (goalId: string, newValue: number) => {
    // Manual progress updates are not needed with auto-calculation
    // dispatch(updateGoal({ id: goalId, updates: { ... } }));
  };

  const handleAddReminder = (goal: Goal) => {
    setSelectedGoal(goal);
    dispatch(selectGoal(goal.id));
    dispatch(openReminderModal());
  };

  const handleFilterChange = (filterType: string, value: string) => {
    dispatch(setGoalFilters({ [filterType]: value }));
  };

  const clearFilters = () => {
    dispatch(clearGoalFilters());
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.priority !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Goal and Progress
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Set and track your personal and professional goals
              </p>
            </div>
            <Button
              onClick={handleCreateGoal}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  goals created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.active}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.completed}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  goals achieved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.completionRate}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" size="sm">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                  >
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <CustomSelect
                    label="Status"
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'paused', label: 'Paused' },
                      { value: 'abandoned', label: 'Abandoned' }
                    ]}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <CustomSelect
                    label="Type"
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'weekly_tasks', label: 'Weekly Tasks' },
                      { value: 'project_tasks', label: 'Project Tasks' },
                      { value: 'priority_tasks', label: 'Priority Tasks' },
                      { value: 'daily_streak', label: 'Daily Streak' },
                      { value: 'journal_weekly', label: 'Journal Weekly' },
                      { value: 'completion_rate', label: 'Completion Rate' }
                    ]}
                    value={filters.type}
                    onChange={(value) => handleFilterChange('type', value)}
                  />
                </div>

                {/* Priority Filter */}
                <div>
                  <CustomSelect
                    label="Priority"
                    options={[
                      { value: 'all', label: 'All Priorities' },
                      { value: 'high', label: 'High Priority' },
                      { value: 'medium', label: 'Medium Priority' },
                      { value: 'low', label: 'Low Priority' }
                    ]}
                    value={filters.priority}
                    onChange={(value) => handleFilterChange('priority', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals Grid */}
          {safeFilteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
              {safeFilteredGoals.map(goal => goal && (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                  onUpdateProgress={handleUpdateProgress}
                  onAddReminder={handleAddReminder}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {safeGoals.length === 0 ? 'No goals yet' : 'No goals match your filters'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {safeGoals.length === 0 
                    ? 'Create your first goal to start tracking your progress and achieving your objectives.'
                    : 'Try adjusting your filters or create a new goal to get started.'
                  }
                </p>
                {safeGoals.length === 0 ? (
                  <Button onClick={handleCreateGoal} variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Goal
                  </Button>
                ) : (
                  <Button onClick={clearFilters} variant="secondary">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          dispatch(closeGoalModal());
          setSelectedGoal(null);
          setIsEditing(false);
        }}
        onSave={handleSaveGoal}
        goal={selectedGoal}
        isEditing={isEditing}
      />

      {/* TODO: Add Reminder Modal when implemented */}
    </div>
  );
};
