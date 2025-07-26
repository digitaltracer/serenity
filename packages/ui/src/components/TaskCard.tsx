import React, { useMemo } from 'react';
import { Task, selectCompactMode } from '@serenity/core';
import { useSelector } from 'react-redux';
import { cn } from '../utils/cn';
import { CheckCircle2, Circle, Calendar, Flag, RefreshCw, ListTodo } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  onToggle?: (taskId: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onClick?: (task: Task) => void;
  className?: string;
}

const TaskCard = React.memo<TaskCardProps>(({ task, onToggle, onToggleSubtask, onClick, className }) => {
  const compactMode = useSelector(selectCompactMode);
  
  const priorityColors = {
    high: 'text-red-500 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
    medium: 'text-yellow-500 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
    low: 'text-green-500 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
  };

  // Memoize expensive date calculations to prevent re-computation on every render
  const dateInfo = useMemo(() => {
    if (!task.dueDate) return { isOverdue: false, isDueToday: false };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(task.dueDate);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    return {
      isOverdue: dueDateOnly < today && !task.completed,
      isDueToday: dueDateOnly.getTime() === today.getTime()
    };
  }, [task.dueDate, task.completed]);

  const { isOverdue, isDueToday } = dateInfo;

  return (
    <div
      className={cn(
        // Premium card design with elegant gradients and shadows
        'group relative rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm',
        'shadow-lg shadow-gray-200/40 ring-1 ring-gray-100/80',
        'dark:border-gray-700/40 dark:from-gray-800/80 dark:to-gray-900/60 dark:shadow-black/25 dark:ring-gray-800/60',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:shadow-xl hover:shadow-gray-300/50 hover:border-gray-300/80',
        'dark:hover:shadow-black/40 dark:hover:border-gray-600/60',
        'hover:-translate-y-0.5 hover:scale-[1.005] transform-gpu',
        // Compact mode responsive padding
        {
          'p-6': !compactMode,
          'p-4': compactMode,
          'opacity-60': task.completed,
          'border-red-300/80 from-red-50/30 to-red-25/60 dark:border-red-700/60 dark:from-red-900/20 dark:to-red-800/10': isOverdue,
          'border-blue-300/80 from-blue-50/30 to-blue-25/60 dark:border-blue-700/60 dark:from-blue-900/20 dark:to-blue-800/10': isDueToday && !isOverdue,
        },
        className
      )}
      onClick={() => onClick?.(task)}
    >
      <div className={cn(
        'flex items-start',
        {
          'gap-3': !compactMode,
          'gap-2': compactMode,
        }
      )}>
        {/* Checkbox */}
        <button
          className="flex-shrink-0 mt-0.5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(task.id);
          }}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3
              className={cn(
                'font-medium text-gray-900 dark:text-gray-100',
                {
                  'line-through text-gray-500 dark:text-gray-400': task.completed,
                }
              )}
            >
              {task.title}
            </h3>

            {/* Priority Badge */}
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
                priorityColors[task.priority]
              )}
            >
              <Flag className="w-3 h-3" />
              {task.priority}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className={cn(
              'text-sm text-gray-600 dark:text-gray-400 line-clamp-2',
              {
                'mt-1': !compactMode,
                'mt-0.5': compactMode,
              }
            )}>
              {task.description}
            </p>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className={cn(
              'space-y-1',
              {
                'mt-2': !compactMode,
                'mt-1.5': compactMode,
              }
            )}>
              {task.subtasks.slice(0, 3).map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                  <button
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubtask?.(task.id, subtask.id);
                    }}
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <Circle className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-gray-600 dark:text-gray-400',
                      { 'line-through text-gray-400 dark:text-gray-500': subtask.completed }
                    )}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                  +{task.subtasks.length - 3} more subtasks
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className={cn(
            'flex items-center justify-between',
            {
              'mt-3': !compactMode,
              'mt-2': compactMode,
            }
          )}>
            <div className="flex items-center gap-2">
              {/* Due Date */}
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    {
                      'text-red-600 dark:text-red-400': isOverdue,
                      'text-blue-600 dark:text-blue-400': isDueToday && !isOverdue,
                      'text-gray-500 dark:text-gray-400': !isOverdue && !isDueToday,
                    }
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}

              {/* Subtask Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <ListTodo className="w-3 h-3" />
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </div>
              )}

              {/* Recurring */}
              {task.recurring && task.recurring.type && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <RefreshCw className="w-3 h-3" />
                  {task.recurring.type}
                </div>
              )}

              {/* Project */}
              {task.projectId && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  📁 Project
                </div>
              )}
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export { TaskCard };