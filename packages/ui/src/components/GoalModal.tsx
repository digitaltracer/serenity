import React, { useState, useEffect } from 'react';
import { Goal, Project, getGoalTypeLabel, getGoalDescription } from '@serenity/core';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { CustomSelect } from './CustomSelect';
import { Textarea } from './Textarea';
import { 
  Target, 
  Calendar, 
  Flag, 
  Tag, 
  Type, 
  Hash,
  Clock,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  TrendingUp,
  BookOpen,
  Zap,
  Folder
} from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => void;
  goal?: Goal | null;
  isEditing?: boolean;
  projects?: Project[];
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goal,
  isEditing = false,
  projects = [],
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'weekly_tasks' as Goal['type'],
    status: 'active' as Goal['status'],
    priority: 'medium' as Goal['priority'],
    config: {
      targetCount: 10,
      projectId: '',
      priority: 'high' as 'high' | 'medium' | 'low',
      streakDays: 7,
      targetRate: 80,
      timeframe: 'weekly' as 'daily' | 'weekly' | 'monthly',
    } as Goal['config'],
    reminders: [] as any[],
  });

  const [selectedGoalType, setSelectedGoalType] = useState<Goal['type']>('weekly_tasks');

  useEffect(() => {
    if (goal && isEditing) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        type: goal.type,
        status: goal.status,
        priority: goal.priority,
        config: {
          targetCount: goal.config?.targetCount || 10,
          projectId: goal.config?.projectId || '',
          priority: goal.config?.priority || 'high',
          streakDays: goal.config?.streakDays || 7,
          targetRate: goal.config?.targetRate || 80,
          timeframe: goal.config?.timeframe || 'weekly',
        },
        reminders: goal.reminders || [],
      });
      setSelectedGoalType(goal.type);
    } else {
      // Reset to defaults
      setFormData({
        title: '',
        description: '',
        type: 'weekly_tasks',
        status: 'active',
        priority: 'medium',
        config: {
          targetCount: 10,
          projectId: '',
          priority: 'high' as 'high' | 'medium' | 'low',
          streakDays: 7,
          targetRate: 80,
          timeframe: 'weekly' as 'daily' | 'weekly' | 'monthly',
        } as Goal['config'],
        reminders: [],
      });
      setSelectedGoalType('weekly_tasks');
    }
  }, [goal, isEditing, isOpen]);

  // Goal type configurations
  const goalTypes = [
    { 
      value: 'weekly_tasks', 
      label: 'Weekly Tasks', 
      icon: Target,
      description: 'Complete a specific number of tasks per week'
    },
    { 
      value: 'project_tasks', 
      label: 'Project Tasks', 
      icon: Folder,
      description: 'Complete tasks in a specific project'
    },
    { 
      value: 'priority_tasks', 
      label: 'Priority Tasks', 
      icon: Flag,
      description: 'Complete all tasks of a specific priority level'
    },
    { 
      value: 'daily_streak', 
      label: 'Daily Streak', 
      icon: Zap,
      description: 'Complete at least one task every day for consecutive days'
    },
    { 
      value: 'journal_weekly', 
      label: 'Journal Weekly', 
      icon: BookOpen,
      description: 'Write a specific number of journal entries per week'
    },
    { 
      value: 'completion_rate', 
      label: 'Completion Rate', 
      icon: TrendingUp,
      description: 'Maintain a specific task completion percentage'
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate smart title if not provided
    const goalTitle = formData.title || getGoalDescription({
      type: selectedGoalType,
      config: formData.config
    } as Goal, projects);
    
    const goalData: Partial<Goal> = {
      title: goalTitle,
      description: formData.description,
      type: selectedGoalType,
      status: formData.status,
      priority: formData.priority,
      config: formData.config,
      reminders: formData.reminders,
    };

    onSave(goalData);
    onClose();
  };

  const handleGoalTypeChange = (type: Goal['type']) => {
    setSelectedGoalType(type);
    setFormData(prev => ({
      ...prev,
      type,
      // Reset config to defaults for new type
      config: {
        ...prev.config,
        // Set appropriate defaults based on goal type
        ...(type === 'weekly_tasks' && { targetCount: 10, timeframe: 'weekly' as const }),
        ...(type === 'project_tasks' && { targetCount: 5, timeframe: 'monthly' as const }),
        ...(type === 'priority_tasks' && { priority: 'high' as const, timeframe: 'weekly' as const }),
        ...(type === 'daily_streak' && { streakDays: 7 }),
        ...(type === 'journal_weekly' && { targetCount: 5, timeframe: 'weekly' as const }),
        ...(type === 'completion_rate' && { targetRate: 80, timeframe: 'weekly' as const }),
      }
    }));
  };

  // Render type-specific configuration fields
  const renderConfigFields = () => {
    switch (selectedGoalType) {
      case 'weekly_tasks':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Tasks *
                </label>
                <Input
                  type="number"
                  value={formData.config?.targetCount || 10}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, targetCount: parseInt(e.target.value) || 10 }
                  }))}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeframe
                </label>
                <CustomSelect
                  value={formData.config?.timeframe || 'weekly'}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, timeframe: value as 'daily' | 'weekly' | 'monthly' }
                  }))}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
              </div>
            </div>
          </>
        );

      case 'project_tasks':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Tasks *
                </label>
                <Input
                  type="number"
                  value={formData.config?.targetCount || 5}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, targetCount: parseInt(e.target.value) || 5 }
                  }))}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeframe
                </label>
                <CustomSelect
                  value={formData.config.timeframe}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, timeframe: value as 'daily' | 'weekly' | 'monthly' }
                  }))}
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project *
              </label>
              <CustomSelect
                value={formData.config?.projectId || ''}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, projectId: value }
                }))}
                placeholder="Select a project..."
                options={[
                  { value: '', label: 'Select a project...' },
                  ...projects.map(project => ({
                    value: project.id,
                    label: project.name
                  }))
                ]}
              />
            </div>
          </>
        );

      case 'priority_tasks':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority Level *
                </label>
                <CustomSelect
                  value={formData.config?.priority || 'high'}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, priority: value as 'high' | 'medium' | 'low' }
                  }))}
                  options={[
                    { value: 'high', label: 'High Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'low', label: 'Low Priority' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeframe
                </label>
                <CustomSelect
                  value={formData.config?.timeframe || 'weekly'}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, timeframe: value as 'daily' | 'weekly' | 'monthly' }
                  }))}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
              </div>
            </div>
          </>
        );

      case 'daily_streak':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Streak Days *
            </label>
            <Input
              type="number"
              value={formData.config?.streakDays || 7}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                config: { ...prev.config, streakDays: parseInt(e.target.value) || 7 }
              }))}
              min="1"
              max="365"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Number of consecutive days to complete at least one task
            </p>
          </div>
        );

      case 'journal_weekly':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Entries *
              </label>
              <Input
                type="number"
                value={formData.config.targetCount || 5}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, targetCount: parseInt(e.target.value) || 5 }
                }))}
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeframe
              </label>
              <CustomSelect
                value={formData.config.timeframe}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, timeframe: value as 'daily' | 'weekly' | 'monthly' }
                }))}
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
              />
            </div>
          </div>
        );

      case 'completion_rate':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Rate (%) *
              </label>
              <Input
                type="number"
                value={formData.config?.targetRate || 80}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, targetRate: parseInt(e.target.value) || 80 }
                }))}
                min="1"
                max="100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeframe
              </label>
              <CustomSelect
                value={formData.config.timeframe}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, timeframe: value as 'daily' | 'weekly' | 'monthly' }
                }))}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active', icon: PlayCircle, color: 'text-green-600' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-blue-600' },
    { value: 'paused', label: 'Paused', icon: PauseCircle, color: 'text-yellow-600' },
    { value: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-600' },
  ];

  const priorityOptions = [
    { value: 'high', label: 'High Priority', color: 'text-red-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'low', label: 'Low Priority', color: 'text-green-600' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Goal' : 'Create New Goal'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Goal Type Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Goal Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {goalTypes.map(type => {
              const Icon = type.icon;
              const isSelected = selectedGoalType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleGoalTypeChange(type.value as Goal['type'])}
                  className={`p-3 border rounded-md text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    <div>
                      <h4 className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                        {type.label}
                      </h4>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title (Optional - auto-generated if empty) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Goal Title <span className="text-gray-400">(optional - auto-generated if empty)</span>
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder={getGoalDescription({
              type: selectedGoalType,
              config: formData.config
            } as Goal, projects)}
            className="w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Add additional details about your goal..."
            rows={3}
          />
        </div>

        {/* Type-specific Configuration */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Goal Configuration
          </label>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            {renderConfigFields()}
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <CustomSelect
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value as Goal['status'] }))}
              options={statusOptions.map(status => ({
                value: status.value,
                label: status.label
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <CustomSelect
              value={formData.priority}
              onChange={(value) => setFormData(prev => ({ ...prev, priority: value as Goal['priority'] }))}
              options={priorityOptions.map(priority => ({
                value: priority.value,
                label: priority.label
              }))}
            />
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
          >
            {isEditing ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};