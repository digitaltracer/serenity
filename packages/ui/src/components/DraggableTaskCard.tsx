/**
 * Draggable Task Card Component
 * Task card with built-in drag and drop functionality
 */

import React from 'react';
import { useDraggable, useTaskDragDrop } from '@serenity/core';
import { TaskCard } from './TaskCard';
import { Task } from '@serenity/core';
import { GripVertical } from 'lucide-react';

interface DraggableTaskCardProps {
  task: Task;
  onToggle: () => void;
  onClick?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
  index?: number;
  containerName?: string;
  showDragHandle?: boolean;
  disabled?: boolean;
  projects?: Array<{ id: string; name: string; color?: string; archived?: boolean }>;
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  onToggle,
  onClick,
  onDelete,
  className = '',
  index,
  containerName,
  showDragHandle = true,
  disabled = false,
  projects,
}) => {
  const { createTaskDragItem } = useTaskDragDrop();
  
  const dragItem = createTaskDragItem(task, index, containerName);
  const { dragRef, isDragging, dragProps } = useDraggable(dragItem, !disabled);

  return (
    <div
      ref={dragRef}
      className={`
        relative group transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 rotate-1 shadow-2xl z-50' : ''}
        ${className}
      `}
      {...dragProps}
    >
      {showDragHandle && !disabled && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      )}
      
      <TaskCard
        task={task}
        onToggle={onToggle}
        onClick={onClick}
        onDelete={onDelete}
        projects={projects}
        className={`
          transition-all duration-200
          ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''}
          ${!disabled ? 'hover:shadow-md' : ''}
        `}
      />
      
      {isDragging && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
            Dragging
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Draggable Subtask Component
 */
interface DraggableSubtaskProps {
  subtask: any;
  parentTaskId: string;
  onToggle: () => void;
  index?: number;
  disabled?: boolean;
  className?: string;
}

export const DraggableSubtask: React.FC<DraggableSubtaskProps> = ({
  subtask,
  parentTaskId,
  onToggle,
  index,
  disabled = false,
  className = '',
}) => {
  const { createSubtaskDragItem } = useTaskDragDrop();
  
  const dragItem = createSubtaskDragItem(subtask, parentTaskId, index);
  const { dragRef, isDragging, dragProps } = useDraggable(dragItem, !disabled);

  return (
    <div
      ref={dragRef}
      className={`
        relative group flex items-center space-x-3 p-2 rounded-lg
        transition-all duration-200
        ${isDragging ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
        ${className}
      `}
      {...dragProps}
    >
      {!disabled && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <GripVertical className="w-3 h-3 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>
      )}
      
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={onToggle}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      
      <span
        className={`
          flex-1 text-sm transition-all duration-200
          ${subtask.completed 
            ? 'line-through text-gray-500 dark:text-gray-400' 
            : 'text-gray-900 dark:text-gray-100'
          }
          ${isDragging ? 'text-blue-600 dark:text-blue-400' : ''}
        `}
      >
        {subtask.title}
      </span>
      
      {isDragging && (
        <div className="text-xs text-blue-500 font-medium">
          Moving...
        </div>
      )}
    </div>
  );
};