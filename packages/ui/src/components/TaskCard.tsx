import React, { useMemo } from 'react';
import { Task, selectCompactMode } from '@serenity/core';
import { useSelector } from 'react-redux';
import { cn } from '../utils/cn';
import { CheckCircle2, Circle, Calendar, Flag, RefreshCw, ListTodo, Trash2, Pencil, CheckSquare, Clock } from 'lucide-react';
import { ProjectIcon } from './ProjectIcon';

export interface TaskCardProps {
  task: Task;
  onToggle?: (taskId: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onClick?: (task: Task) => void; // kept for backward compat; not used for edit now
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  className?: string;
  projects?: Array<{ id: string; name: string; color?: string; archived?: boolean }>;
}

const TaskCard = React.memo<TaskCardProps>(({ task, onToggle, onToggleSubtask, onClick, onDelete, onEdit, className, projects }) => {
  const compactMode = useSelector(selectCompactMode);
  
  const priorityColors = {
    high: 'text-green-700 border-green-300 bg-green-100 dark:border-green-600 dark:bg-green-800/30 dark:text-green-200',
    medium: 'text-green-600 border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300',
    low: 'text-green-500 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
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

  // Find project name from projectId
  const projectName = useMemo(() => {
    if (!task.projectId || !projects) return null;
    const project = projects.find(p => p.id === task.projectId && !p.archived);
    return project?.name || null;
  }, [task.projectId, projects]);

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
          // Enhanced overdue styling - red border, background, and shadow to draw attention
          'border-red-400 border-2 from-red-50 to-red-100/50 dark:border-red-500 dark:from-red-900/30 dark:to-red-800/20 shadow-red-200/50 dark:shadow-red-900/40 ring-2 ring-red-200/60 dark:ring-red-800/50': isOverdue,
          'border-blue-300/80 from-blue-50/30 to-blue-25/60 dark:border-blue-700/60 dark:from-blue-900/20 dark:to-blue-800/10': isDueToday && !isOverdue,
        },
        className
      )}
      onClick={() => { /* disable open-on-click to allow checkbox toggling */ }}
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
          aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Left Side - Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className={cn(
                'font-medium text-gray-900 dark:text-gray-100 mb-2',
                {
                  'line-through text-gray-500 dark:text-gray-400': task.completed,
                }
              )}
              title={task.title}
            >
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className={cn(
                'text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2',
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
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 accent-green-600 cursor-pointer"
                      checked={subtask.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSubtask?.(task.id, subtask.id);
                      }}
                    />
                    <span
                      className={cn(
                        'text-gray-600 dark:text-gray-400 truncate',
                        { 'line-through text-gray-400 dark:text-gray-500': subtask.completed }
                      )}
                      title={subtask.title}
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

            {/* Footer - Due Date and Progress */}
            <div className={cn(
              'flex items-center gap-3 flex-wrap',
              {
                'mt-3': !compactMode,
                'mt-2': compactMode,
              }
            )}>
              {/* Created Date - always show */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600">
                <Clock className="w-3 h-3" />
                Created {new Date(task.createdAt).toLocaleDateString()}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                    {
                      'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/20 dark:border-red-700': isOverdue,
                      'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700': isDueToday && !isOverdue,
                      'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600': !isOverdue && !isDueToday,
                    }
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}

              {/* Completed Date */}
              {task.completed && task.completedAt && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 border border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-700">
                  <CheckSquare className="w-3 h-3" />
                  Completed {new Date(task.completedAt).toLocaleDateString()}
                </div>
              )}

              {/* Subtask Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600">
                  <ListTodo className="w-3 h-3" />
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </div>
              )}

              {/* Recurring */}
              {task.recurring && task.recurring.type && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600">
                  <RefreshCw className="w-3 h-3" />
                  {task.recurring.type}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Metadata */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Edit task"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            {/* Priority Badge */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-sm',
                priorityColors[task.priority]
              )}
            >
              <Flag className="w-3 h-3" />
              <span className="capitalize">{task.priority}</span>
            </div>

            {/* Project */}
            {projectName && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600">
                <ProjectIcon size={16} alt={`${projectName} project`} />
                {projectName}
              </div>
            )}

            {/* Tags - Arranged horizontally */}
            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                    title={tag}
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                    +{task.tags.length - 3}
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
