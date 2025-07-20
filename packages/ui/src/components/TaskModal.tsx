import React, { useState, useEffect } from 'react';
import { Task } from '@serenity/core';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { CustomSelect } from './CustomSelect';
import { TagInput } from './TagInput';
import { DatePicker } from './DatePicker';
import { Calendar, Flag, Folder } from 'lucide-react';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
  projects?: Array<{ id: string; name: string; color: string }>;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  projects = [],
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: null as Date | null,
    projectId: '',
    tags: [] as string[],
    recurring: undefined as Task['recurring'],
  });


  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        projectId: task.projectId || '',
        tags: task.tags,
        recurring: task.recurring,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: null,
        projectId: '',
        tags: [],
        recurring: undefined,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const taskData: Partial<Task> = {
      ...formData,
      dueDate: formData.dueDate || undefined,
      projectId: formData.projectId || undefined,
    };

    if (task) {
      taskData.id = task.id;
    }

    onSave(taskData);
    onClose();
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags,
    }));
  };

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
  ];

  const projectOptions = [
    { value: '', label: 'No Project' },
    ...projects.map(project => ({
      value: project.id,
      label: project.name,
    })),
  ];

  const recurringOptions = [
    { value: '', label: 'No Repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label="Task Title"
          placeholder="What needs to be done?"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Add more details about this task..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />

        {/* Priority and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomSelect
            label="Priority"
            value={formData.priority}
            onChange={(value) => setFormData(prev => ({ ...prev, priority: value as Task['priority'] }))}
            options={priorityOptions}
          />
          
          <DatePicker
            label="Due Date"
            value={formData.dueDate}
            onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
            placeholder="Select due date"
          />
        </div>

        {/* Project */}
        <CustomSelect
          label="Project"
          value={formData.projectId}
          onChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
          options={projectOptions}
        />

        {/* Recurring */}
        <CustomSelect
          label="Repeat"
          value={formData.recurring?.type || ''}
          onChange={(value) => {
            const recurringType = value;
            setFormData(prev => ({
              ...prev,
              recurring: recurringType ? {
                type: recurringType as 'daily' | 'weekly' | 'monthly',
                interval: 1,
              } : undefined,
            }));
          }}
          options={recurringOptions}
        />


        {/* Tags */}
        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={handleTagsChange}
          placeholder="Add a tag..."
          maxTags={8}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {task ? 'Update Task' : 'Create Task'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { TaskModal };