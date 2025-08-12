import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '@serenity/core';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { CustomSelect } from './CustomSelect';
import { ProjectComboBox } from './ProjectComboBox';
import { TagInput } from './TagInput';
import { DatePicker } from './DatePicker';
import { Calendar, Flag, Folder, Trash2, Archive, Plus, Pencil, X } from 'lucide-react';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
  projects?: Array<{ id: string; name: string; color: string }>;
  onCreateProject?: (projectName: string) => void;
  onDelete?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  onSaveAsSubtaskOf?: (parentTaskId: string, subtaskTitle: string) => void;
  allTasks?: Array<{ id: string; title: string }>; // for parent task picker
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateSubtaskTitle?: (taskId: string, subtaskId: string, title: string) => void;
  onRemoveSubtask?: (taskId: string, subtaskId: string) => void;
  onAddSubtaskInline?: (taskId: string, title: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  projects = [],
  onCreateProject,
  onDelete,
  onArchive,
  onSaveAsSubtaskOf,
  allTasks,
  onToggleSubtask,
  onUpdateSubtaskTitle,
  onRemoveSubtask,
  onAddSubtaskInline,
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

  // Detect inline subtask syntax in title
  const parsedSubtask = useMemo(() => {
    const input = (formData.title || '').trim();
    if (!input.startsWith('>')) return null;
    const m1 = input.match(/^>\s*([a-zA-Z0-9_-]{6,})\s*:\s*(.+)$/);
    const m2 = input.match(/^>\s*(.+)\s*@([a-zA-Z0-9_-]{6,})\s*$/);
    if (m1) return { parentId: m1[1], title: m1[2] };
    if (m2) return { parentId: m2[2], title: m2[1] };
    return null;
  }, [formData.title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    // If creating a brand-new task and the title uses subtask syntax, save as subtask
    if (!task && parsedSubtask && onSaveAsSubtaskOf) {
      onSaveAsSubtaskOf(parsedSubtask.parentId, parsedSubtask.title);
      onClose();
      return;
    }

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
        {(!task && parsedSubtask) && (
          <div className="text-xs text-blue-700 dark:text-blue-300 -mt-2">
            Will be saved as a subtask of <span className="font-medium">{parsedSubtask.parentId}</span> with title "{parsedSubtask.title}"
          </div>
        )}

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
        <ProjectComboBox
          label="Project"
          projects={projects}
          value={formData.projectId}
          onChange={(projectId) => setFormData(prev => ({ ...prev, projectId }))}
          onCreateProject={onCreateProject}
          placeholder={projects.length === 0 ? "Type new project name..." : "Select or create project"}
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


        {/* Parent Task (save as subtask) */}
        {!task && onSaveAsSubtaskOf && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Parent Task</label>
            <ProjectComboBox
              // reuse combobox UI by mapping tasks -> project option shape
              projects={(allTasks ?? []).map((t: { id: string; title: string }) => ({ id: t.id, name: t.title, color: '#9CA3AF' }))}
              value={parsedSubtask?.parentId || ''}
              onChange={(parentId) => {
                if (parentId && formData.title.trim()) {
                  setFormData(prev => ({ ...prev, title: `> ${prev.title.replace(/^>\s*/, '')} @${parentId}` }));
                }
              }}
              placeholder={parsedSubtask ? parsedSubtask.parentId : 'Type to search tasks...'}
            />
          </div>
        )}

        {/* Tags */}
        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={handleTagsChange}
          placeholder="Add a tag..."
          maxTags={8}
        />

        {/* Subtasks editor - show only when editing existing task */}
        {task && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtasks</label>
              <button
                type="button"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => {
                  const title = prompt('New subtask title')?.trim();
                  if (title && onAddSubtaskInline) onAddSubtaskInline(task.id, title);
                }}
              >
                Add subtask
              </button>
            </div>
            {(!task.subtasks || task.subtasks.length === 0) ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No subtasks yet.</div>
            ) : (
              <div className="space-y-2">
                {task.subtasks!.map((st) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => onToggleSubtask?.(task.id, st.id)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <input
                      className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1 text-sm"
                      value={st.title}
                      onChange={(e) => onUpdateSubtaskTitle?.(task.id, st.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => onRemoveSubtask?.(task.id, st.id)}
                      title="Remove subtask"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
          
          {/* Delete and Archive Actions - Only for existing tasks */}
          {task && (onDelete || onArchive) && (
            <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(task.id);
                    onClose();
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </Button>
              )}
              {onArchive && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    onArchive(task.id);
                    onClose();
                  }}
                  className="flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive Task
                </Button>
              )}
            </div>
          )}

          {/* Save as subtask of another task */}
          {!task && onSaveAsSubtaskOf && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const parentId = prompt('Enter parent task ID to attach as subtask:')?.trim();
                  if (parentId && formData.title.trim()) {
                    onSaveAsSubtaskOf(parentId, formData.title.trim());
                    onClose();
                  }
                }}
              >
                Save as subtask of another task
              </Button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export { TaskModal };
