/**
 * Drop Zone Components
 * Reusable drop zones for different types of drag and drop operations
 */

import React from 'react';
import { useProjectDropZone, usePriorityDropZone, useDropZone } from '@serenity/core';
import { 
  FolderIcon, 
  Flag, 
  CalendarIcon, 
  TargetIcon,
  ArrowDownIcon,
  PlusIcon 
} from 'lucide-react';

/**
 * Project Drop Zone
 */
interface ProjectDropZoneProps {
  project: {
    id: string;
    name: string;
    color?: string;
  } | null; // null for "No Project"
  className?: string;
}

export const ProjectDropZone: React.FC<ProjectDropZoneProps> = ({
  project,
  className = '',
}) => {
  const projectId = project?.id || 'none';
  const { dropRef, isOver, canDrop, isActive, dropProps } = useProjectDropZone(projectId);

  return (
    <div
      ref={dropRef}
      className={`
        flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed
        transition-all duration-200 min-h-[60px]
        ${isActive ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}
        ${isOver && canDrop ? 'border-blue-500 bg-blue-100 dark:bg-blue-800/30 scale-105' : ''}
        ${isOver && !canDrop ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        ${className}
      `}
      {...dropProps}
    >
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-lg
        ${project?.color ? `bg-${project.color}-100 text-${project.color}-600` : 'bg-gray-100 text-gray-500'}
        ${isOver && canDrop ? 'bg-blue-200 text-blue-700' : ''}
      `}>
        <FolderIcon className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <h3 className={`
          font-medium text-sm
          ${isOver && canDrop ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}
        `}>
          {project ? project.name : 'No Project'}
        </h3>
        {isActive && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Drop tasks here to {project ? 'assign to project' : 'remove from project'}
          </p>
        )}
      </div>
      
      {isOver && canDrop && (
        <div className="text-blue-600 dark:text-blue-400">
          <ArrowDownIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

/**
 * Priority Drop Zone
 */
interface PriorityDropZoneProps {
  priority: 'low' | 'medium' | 'high';
  className?: string;
}

export const PriorityDropZone: React.FC<PriorityDropZoneProps> = ({
  priority,
  className = '',
}) => {
  const { dropRef, isOver, canDrop, isActive, dropProps } = usePriorityDropZone(priority);

  const priorityConfig = {
    low: {
      label: 'Low Priority',
      color: 'text-green-600 bg-green-100 border-green-300',
      icon: '🔵',
    },
    medium: {
      label: 'Medium Priority',
      color: 'text-yellow-600 bg-yellow-100 border-yellow-300',
      icon: '🟡',
    },
    high: {
      label: 'High Priority',
      color: 'text-red-600 bg-red-100 border-red-300',
      icon: '🔴',
    },
  };

  const config = priorityConfig[priority];

  return (
    <div
      ref={dropRef}
      className={`
        flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed
        transition-all duration-200 min-h-[60px]
        ${isActive ? `${config.color}` : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}
        ${isOver && canDrop ? 'scale-105 shadow-lg' : ''}
        ${isOver && !canDrop ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        ${className}
      `}
      {...dropProps}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
        <Flag className={`w-5 h-5 ${config.color.split(' ')[0]}`} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{config.icon}</span>
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {config.label}
          </h3>
        </div>
        {isActive && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Drop tasks to set {priority} priority
          </p>
        )}
      </div>
      
      {isOver && canDrop && (
        <div className={config.color.split(' ')[0]}>
          <ArrowDownIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

/**
 * Generic Task List Drop Zone
 */
interface TaskListDropZoneProps {
  listId: string;
  title: string;
  icon?: React.ReactNode;
  emptyMessage?: string;
  onDrop: (dragItem: any, dropResult: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export const TaskListDropZone: React.FC<TaskListDropZoneProps> = ({
  listId,
  title,
  icon,
  emptyMessage = 'Drop tasks here',
  onDrop,
  className = '',
  children,
}) => {
  const dropZone = {
    id: listId,
    type: 'task-list',
    accepts: ['task' as const],
    isActive: false,
    isOver: false,
    canDrop: true,
  };

  const { dropRef, isOver, canDrop, isActive, dropProps } = useDropZone(
    dropZone,
    onDrop
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* List Header */}
      <div className="flex items-center space-x-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      
      {/* Drop Zone */}
      <div
        ref={dropRef}
        className={`
          min-h-[200px] rounded-lg border-2 border-dashed p-4
          transition-all duration-200
          ${isActive ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}
          ${isOver && canDrop ? 'border-blue-500 bg-blue-100 dark:bg-blue-800/30 scale-102' : ''}
          ${isOver && !canDrop ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        `}
        {...dropProps}
      >
        {children ? (
          <div className="space-y-3">
            {children}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
            `}>
              <TargetIcon className="w-8 h-8" />
            </div>
            <p className={`
              text-sm font-medium
              ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500 dark:text-gray-400'}
            `}>
              {isActive ? 'Drop tasks here' : emptyMessage}
            </p>
          </div>
        )}
        
        {isOver && canDrop && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-lg">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium">
              Release to drop
            </div>
          </div>
        )}
        
        {isOver && !canDrop && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium">
              Cannot drop here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Calendar Drop Zone (for scheduling)
 */
interface CalendarDropZoneProps {
  date: Date;
  onScheduleTask: (taskId: string, date: Date) => void;
  className?: string;
}

export const CalendarDropZone: React.FC<CalendarDropZoneProps> = ({
  date,
  onScheduleTask,
  className = '',
}) => {
  const dropZone = {
    id: `calendar-${date.toISOString()}`,
    type: 'calendar-drop',
    accepts: ['task' as const],
    isActive: false,
    isOver: false,
    canDrop: true,
  };

  const handleDrop = (dragItem: any) => {
    if (dragItem.type === 'task') {
      onScheduleTask(dragItem.id, date);
    }
  };

  const { dropRef, isOver, canDrop, isActive, dropProps } = useDropZone(
    dropZone,
    handleDrop
  );

  return (
    <div
      ref={dropRef}
      className={`
        p-2 rounded border min-h-[80px]
        transition-all duration-200
        ${isActive ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}
        ${isOver && canDrop ? 'border-blue-500 bg-blue-100 dark:bg-blue-800/30' : ''}
        ${isOver && !canDrop ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        ${className}
      `}
      {...dropProps}
    >
      <div className="flex items-center space-x-2">
        <CalendarIcon className={`
          w-4 h-4
          ${isActive ? 'text-blue-600' : 'text-gray-400'}
        `} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {date.getDate()}
        </span>
      </div>
      
      {isActive && (
        <div className="mt-2">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Schedule tasks
          </p>
        </div>
      )}
    </div>
  );
};