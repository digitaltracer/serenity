import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTodayTasks, selectAllTasks, toggleTask, updateTask, deleteTask, RootState } from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent, TaskCard, ProgressBar, Button, Input, CustomSelect, TagInput, DatePicker, Textarea } from '@serenity/ui';
import { Calendar, Clock, CheckCircle, AlertTriangle, Target } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const dispatch = useDispatch();
  const allTasks = useSelector(selectAllTasks);
  const todayTasks = useSelector(selectTodayTasks);
  
  // Calculate today's statistics
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  // Tasks planned for today (due today)
  const plannedToday = todayTasks.length;
  
  // Tasks completed today (regardless of due date)
  const completedToday = allTasks.filter(task => {
    if (!task.completed || !task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt).toISOString().split('T')[0];
    return completedDate === todayString;
  }).length;
  
  // Overdue tasks (due before today and not completed)
  const overdueTasks = allTasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const taskDateString = new Date(task.dueDate).toISOString().split('T')[0];
    return taskDateString < todayString;
  });
  
  const progressToday = todayTasks.length > 0 ? (todayTasks.filter(task => task.completed).length / todayTasks.length) * 100 : 0;
  
  // Edit task state
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editTaskTags, setEditTaskTags] = useState<string[]>([]);
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | null>(null);

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleEditTask = (task: any) => {
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskPriority(task.priority);
    setEditTaskTags(task.tags || []);
    setEditTaskDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setEditingTask(task.id);
  };

  const handleUpdateTask = () => {
    if (editTaskTitle.trim() && editingTask) {
      const taskData = {
        id: editingTask,
        title: editTaskTitle,
        description: editTaskDescription,
        priority: editTaskPriority,
        tags: editTaskTags,
        dueDate: editTaskDueDate?.toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      dispatch(updateTask(taskData));
      
      // Reset form
      setEditTaskTitle('');
      setEditTaskDescription('');
      setEditTaskPriority('medium');
      setEditTaskTags([]);
      setEditTaskDueDate(null);
      setEditingTask(null);
    }
  };

  const handleCancelEdit = () => {
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskPriority('medium');
    setEditTaskTags([]);
    setEditTaskDueDate(null);
    setEditingTask(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Today</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Focus on what matters most right now
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{dateString}</p>
      </div>

      {/* Today's Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {Math.round(progressToday)}%
            </div>
            <ProgressBar value={progressToday} variant="success" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {completedToday.length} of {todayTasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Planned for today</span>
                <span className="ml-auto font-semibold text-blue-600 dark:text-blue-400">{plannedToday}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Completed today</span>
                <span className="ml-auto font-semibold text-green-600 dark:text-green-400">{completedToday}</span>
              </div>
              
              {overdueTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Overdue</span>
                  <span className="ml-auto font-semibold text-red-600 dark:text-red-400">{overdueTasks.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Today's Tasks
        </h2>
        
        {todayTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tasks scheduled for today
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have a clear schedule today. Consider adding some tasks or take a well-deserved break!
              </p>
            </CardContent>
          </Card>
        ) : (
          todayTasks.map((task) => (
            editingTask === task.id ? (
              /* Edit Form */
              <div key={task.id} className="mb-6">
                <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/80 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-xl p-6 shadow-lg shadow-gray-200/40 dark:shadow-black/25 ring-1 ring-gray-100/80 dark:ring-gray-800/60 backdrop-blur-sm">
                  <div className="space-y-4">
                    <Input
                      placeholder="Task title"
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      className="text-base"
                      autoFocus
                    />
                    
                    <Textarea
                      placeholder="Task description or details..."
                      value={editTaskDescription}
                      onChange={(e) => setEditTaskDescription(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded flex items-center justify-center">
                          <span className="text-xs text-white">⏰</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CustomSelect
                            options={[
                              { value: 'medium', label: 'Medium' },
                              { value: 'low', label: 'Low' },
                              { value: 'high', label: 'High' }
                            ]}
                            value={editTaskPriority}
                            onChange={(value) => setEditTaskPriority(value as 'low' | 'medium' | 'high')}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <DatePicker
                            value={editTaskDueDate}
                            onChange={setEditTaskDueDate}
                            placeholder="Due date"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🏷️</span>
                        <div className="flex-1 min-w-0">
                          <TagInput
                            value={editTaskTags}
                            onChange={setEditTaskTags}
                            placeholder="Add tags"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateTask} disabled={!editTaskTitle.trim()}>
                        Update Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => dispatch(toggleTask(task.id))}
                onClick={handleEditTask}
                onDelete={() => dispatch(deleteTask(task.id))}
              />
            )
          ))
        )}
      </div>
      
      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">
              Overdue Tasks ({overdueTasks.length})
            </h2>
          </div>
          
          {overdueTasks.map(task => (
            <div key={task.id} className="border-l-4 border-red-500 pl-4">
              <TaskCard
                task={task}
                onToggle={() => dispatch(toggleTask(task.id))}
                onClick={handleEditTask}
                onDelete={() => dispatch(deleteTask(task.id))}
                className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30"
              />
            </div>
          ))}
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {overdueTasks.length} {overdueTasks.length === 1 ? 'task is' : 'tasks are'} overdue
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Consider updating due dates or completing these tasks to stay on track.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};