import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '@serenity/core';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Plus, CheckSquare } from 'lucide-react';

export interface SubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, subtaskTitle: string) => void;
  tasks: Task[];
  selectedTaskId?: string;
}

const SubtaskModal: React.FC<SubtaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tasks,
  selectedTaskId,
}) => {
  const [formData, setFormData] = useState({
    taskId: selectedTaskId || '',
    subtaskTitle: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        taskId: selectedTaskId || '',
        subtaskTitle: '',
      });
    }
  }, [isOpen, selectedTaskId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subtaskTitle.trim() || !formData.taskId) return;

    onSave(formData.taskId, formData.subtaskTitle.trim());
    setFormData({ taskId: selectedTaskId || '', subtaskTitle: '' });
    onClose();
  };

  const selectedTask = tasks.find(task => task.id === formData.taskId);

  // Filter out completed tasks as they shouldn't have new subtasks
  const availableTasks = tasks.filter(task => !task.completed);

  const taskOptions = [
    { value: '', label: 'Select a task...' },
    ...availableTasks.map(task => ({
      value: task.id,
      label: task.title,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Subtask"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Selection */}
        <Select
          label="Parent Task"
          value={formData.taskId}
          onChange={(e) => setFormData(prev => ({ ...prev, taskId: e.target.value }))}
          options={taskOptions}
          required
        />

        {/* Show selected task info */}
        {selectedTask && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedTask.title}
                </h4>
                {selectedTask.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {selectedTask.description}
                  </p>
                )}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Existing subtasks:
                    </p>
                    <div className="space-y-1">
                      {selectedTask.subtasks.slice(0, 3).map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                            subtask.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {subtask.completed && (
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={subtask.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                      {selectedTask.subtasks.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          +{selectedTask.subtasks.length - 3} more subtasks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subtask Title */}
        <Input
          label="Subtask Title"
          placeholder="What needs to be done?"
          value={formData.subtaskTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, subtaskTitle: e.target.value }))}
          required
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={!formData.taskId || !formData.subtaskTitle.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subtask
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { SubtaskModal };