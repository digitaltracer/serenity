import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, selectCompactMode } from '@serenity/core';
import { addTask, toggleTask, deleteTask, updateTask, addProject, deleteProject, updateGoalsProgress, selectAllEntries, selectAllProjects, addUsedTags, generateId, addSubtask, toggleSubtask, selectPaginatedTasks, selectTasksPagination, loadMoreTasks, resetPagination, setPaginationHasMore } from '@serenity/core';
import { Button, Input, TaskCard, Card, CardHeader, CardTitle, CardContent, Select, CustomSelect, ProjectComboBox, TagInput, DatePicker, Textarea, cn, DraggableTaskCard, SelectableItem, BulkOperationsToolbar, BulkActionsButton } from '@serenity/ui';
import { Plus, Search, Filter, BarChart3, Calendar, CheckCircle2, Clock, AlertCircle, FolderOpen, MoreHorizontal, Info, MoreVertical, Flag, Folder, CheckCircle, Target, List, Trash2 } from 'lucide-react';
import { logger } from '@serenity/core';

export const ActionHubPage: React.FC = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { projects } = useSelector((state: RootState) => state.projects);
  const journalEntries = useSelector(selectAllEntries);
  const allProjects = useSelector(selectAllProjects);
  const compactMode = useSelector(selectCompactMode);
  const paginatedTasksData = useSelector(selectPaginatedTasks);
  const pagination = useSelector(selectTasksPagination);

  // Auto-update goal progress when tasks change
  useEffect(() => {
    dispatch(updateGoalsProgress({ tasks, journalEntries, projects: allProjects }));
  }, [dispatch, tasks, journalEntries, allProjects]);
  const createFormRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskParentId, setNewTaskParentId] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#8B5CF6');
  const [progressView, setProgressView] = useState<'overall' | 'weekly'>('overall');

  // Reset pagination when filters change
  useEffect(() => {
    dispatch(resetPagination());
  }, [searchQuery, activeFilter, dispatch]);

  // Handle Load More
  const handleLoadMore = useCallback(() => {
    dispatch(loadMoreTasks());
  }, [dispatch]);

  const taskStatistics = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of current week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    if (progressView === 'weekly') {
      // Filter tasks for current week based on due date
      const weeklyTasks = tasks.filter(task => {
        if (!task.dueDate) return false; // Only include tasks with due dates
        const taskDueDate = new Date(task.dueDate);
        return taskDueDate >= weekStart && taskDueDate <= weekEnd;
      });

      const weeklyCompletedTasks = weeklyTasks.filter(task => task.completed);
      const weeklyTotalTasks = weeklyTasks.length;
      const weeklyProgressPercentage = weeklyTotalTasks > 0 ? Math.round((weeklyCompletedTasks.length / weeklyTotalTasks) * 100) : 0;

      return {
        completedTasks: weeklyCompletedTasks,
        totalTasks: weeklyTotalTasks,
        progressPercentage: weeklyProgressPercentage
      };
    } else {
      // Overall statistics
      const completedTasks = tasks.filter(task => task.completed);
      const totalTasks = tasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      return { completedTasks, totalTasks, progressPercentage };
    }
  }, [tasks, progressView]);
  
  // Projects calculations - memoized for performance
  const projectStatistics = useMemo(() => {
    const activeProjects = projects.filter(p => !p.archived);
    const projectTasks = tasks.filter(t => t.projectId);
    
    // Calculate project statuses based on their tasks
    const getProjectStatus = (project: any): 'yet-to-start' | 'in-progress' | 'completed' => {
      const pTasks = tasks.filter(t => t.projectId === project.id);
      if (pTasks.length === 0) return 'yet-to-start';
      const completedTasks = pTasks.filter(t => t.completed);
      if (completedTasks.length === pTasks.length) return 'completed';
      if (completedTasks.length > 0) return 'in-progress';
      return 'yet-to-start';
    };
    
    const inProgressProjects = activeProjects.filter(p => getProjectStatus(p) === 'in-progress');
    const yetToStartProjects = activeProjects.filter(p => getProjectStatus(p) === 'yet-to-start');
    const completedProjects = activeProjects.filter(p => getProjectStatus(p) === 'completed');
    const projectsProgressPercentage = activeProjects.length > 0 ? Math.round((completedProjects.length / activeProjects.length) * 100) : 0;
    
    return {
      activeProjects,
      projectTasks,
      inProgressProjects,
      yetToStartProjects,
      completedProjects,
      projectsProgressPercentage,
      getProjectStatus
    };
  }, [projects, tasks]);

  const { completedTasks, totalTasks, progressPercentage } = taskStatistics;
  const { activeProjects, projectTasks, inProgressProjects, yetToStartProjects, completedProjects, projectsProgressPercentage, getProjectStatus } = projectStatistics;

  const handleFilterChange = (filter: 'all' | 'active' | 'completed') => {
    setActiveFilter(filter);
    // Update Redux filter state
    const statusFilter = filter === 'active' ? 'pending' : filter === 'completed' ? 'completed' : 'all';
    dispatch({ type: 'tasks/setTaskFilter', payload: { status: statusFilter } });
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const projectData = {
        name: newProjectName,
        color: newProjectColor,
        description: '',
        archived: false
      };
      
      dispatch(addProject(projectData));
      setNewProjectName('');
      setNewProjectColor('#8B5CF6');
      setShowCreateProjectForm(false);
    }
  };

  const handleCreateProjectFromCombo = (projectName: string): string => {
    logger.info('🚀 ActionHub: handleCreateProjectFromCombo called with:', projectName, { component: 'ActionHubPage', operation: 'actionhub:HandlecreateprojectfromcomboCalled' });
    
    // Generate the ID ourselves before dispatching
    const newProjectId = generateId();
    
    const projectData = {
      id: newProjectId, // Pre-assign the ID
      name: projectName,
      color: '#8B5CF6', // Default purple color
      description: '',
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    logger.info('🎯 ActionHub: Creating project with pre-generated ID:', newProjectId, { component: 'ActionHubPage', operation: 'actionhub:CreatingProject' });
    
    // Use the regular addProject action with pre-generated data
    dispatch(addProject(projectData));
    
    logger.info('✅ ActionHub: Returning project ID for auto-selection:', newProjectId, { component: 'ActionHubPage', operation: 'actionhub:ReturningProject' });
    return newProjectId;
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete the project "${projectName}"? This will remove the project but keep all associated tasks.`)) {
      dispatch(deleteProject(projectId));
      
      // If the deleted project was selected in the new task form, clear it
      if (newTaskProject === projectId) {
        setNewTaskProject('');
      }
    }
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      // If a parent task is selected and this is not an edit, create as subtask
      if (!editingTask && newTaskParentId) {
        dispatch(addSubtask({ taskId: newTaskParentId, title: newTaskTitle.trim() }));
        // Reset form
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskProject('');
        setNewTaskPriority('medium');
        setNewTaskTags([]);
        setNewTaskDueDate(null);
        setNewTaskParentId('');
        setShowCreateForm(false);
        setEditingTask(null);
        return;
      }
      const taskData = {
        title: newTaskTitle,
        description: newTaskDescription,
        projectId: newTaskProject || undefined,
        priority: newTaskPriority,
        tags: newTaskTags,
        dueDate: newTaskDueDate || undefined,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (editingTask) {
        dispatch(updateTask({ ...taskData, id: editingTask }));
      } else {
        dispatch(addTask(taskData));
      }
      
      // Add tags to the used tags collection for autocomplete
      if (newTaskTags.length > 0) {
        dispatch(addUsedTags(newTaskTags));
      }
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskProject('');
      setNewTaskPriority('medium');
      setNewTaskTags([]);
      setNewTaskDueDate(null);
      setNewTaskParentId('');
      setShowCreateForm(false);
      setEditingTask(null);
    }
  };

  // Create-as-subtask helper: when the title starts with "> <taskId> : <title>" or "> <title> @<parentId>"
  const tryCreateAsSubtaskFromTitle = useCallback(() => {
    const input = newTaskTitle.trim();
    // Pattern 1: "> parentId: title"
    const matchIdPrefix = input.match(/^>\s*([a-zA-Z0-9_-]{6,})\s*:\s*(.+)$/);
    // Pattern 2: "> title @parentId"
    const matchIdSuffix = input.match(/^>\s*(.+)\s*@([a-zA-Z0-9_-]{6,})\s*$/);
    let parentId: string | null = null;
    let title: string | null = null;
    if (matchIdPrefix) {
      parentId = matchIdPrefix[1];
      title = matchIdPrefix[2];
    } else if (matchIdSuffix) {
      parentId = matchIdSuffix[2];
      title = matchIdSuffix[1];
    }
    if (parentId && title) {
      dispatch(addTask({
        title,
        description: newTaskDescription,
        projectId: newTaskProject || undefined,
        priority: newTaskPriority,
        tags: newTaskTags,
        dueDate: newTaskDueDate || undefined,
        completed: false,
      }));
      dispatch(addUsedTags(newTaskTags));
      dispatch(addTask({} as any));
      dispatch({ type: 'tasks/addSubtask', payload: { taskId: parentId, title } });
      setNewTaskTitle('');
      return true;
    }
    return false;
  }, [dispatch, newTaskTitle, newTaskDescription, newTaskProject, newTaskPriority, newTaskTags, newTaskDueDate]);

  const handleEditTask = (task: any) => {
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    setNewTaskProject(task.projectId || '');
    setNewTaskPriority(task.priority);
    setNewTaskTags(task.tags || []);
    setNewTaskDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setEditingTask(task.id);
    setShowCreateForm(true);
    
    // Scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const projectOptions = useMemo(() =>
    projects.map(project => ({
      value: project.id,
      label: project.name,
    }))
  , [projects]);

  return (
    <div className="flex-1 h-full bg-background">
      {/* Header */}
      <div className="bg-card text-card-foreground border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              ActionHub
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize your tasks and boost productivity
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <BulkActionsButton variant="icon" />
          </div>
        </div>
      </div>

      <div className={cn(
        'flex-1 overflow-auto',
        {
          'p-6': !compactMode,
          'p-4': compactMode,
        }
      )}>
        {/* Tabs */}
        <div className={cn(
          'flex space-x-1 bg-gradient-to-br from-gray-100 to-gray-200/30 dark:from-gray-800 dark:to-gray-900/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 p-1.5 rounded-xl w-fit shadow-sm shadow-gray-200/30 dark:shadow-black/20',
          {
            'mb-6': !compactMode,
            'mb-4': compactMode,
          }
        )}>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-white shadow-md shadow-gray-200/40 dark:shadow-black/40 ring-1 ring-gray-100/50 dark:ring-gray-600/30'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'projects'
                ? 'bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-white shadow-md shadow-gray-200/40 dark:shadow-black/40 ring-1 ring-gray-100/50 dark:ring-gray-600/30'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
            }`}
          >
            Projects
          </button>
        </div>
        {activeTab === 'tasks' ? (
          <div>
            {/* Progress and Add Task - Side by Side when collapsed */}
            {!showCreateForm ? (
              <div className={cn(
                'flex',
                {
                  'gap-6 mb-6': !compactMode,
                  'gap-4 mb-4': compactMode,
                }
              )}>
                {/* Overall Progress Card - Left Side */}
                <div className="w-80">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {progressView === 'weekly' ? 'This Week Progress' : 'Overall Progress'}
                        </h3>
                        <div className="flex items-center gap-2">
                          {/* Progress View Toggle */}
                          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                              onClick={() => setProgressView('overall')}
                              className={cn(
                                'px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                                progressView === 'overall'
                                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              )}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setProgressView('weekly')}
                              className={cn(
                                'px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                                progressView === 'weekly'
                                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              )}
                            >
                              Week
                            </button>
                          </div>
                          <Info className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Circular Progress */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${progressPercentage * 2.51} 251`}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {progressPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                          <span className="ml-auto font-semibold text-green-600 dark:text-green-400">{completedTasks.length}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Remaining</span>
                          <span className="ml-auto font-semibold text-orange-600 dark:text-orange-400">{totalTasks - completedTasks.length}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {progressView === 'weekly' ? 'This Week' : 'Total Tasks'}
                          </span>
                          <span className="ml-auto font-semibold text-blue-600 dark:text-blue-400">{totalTasks}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {progressView === 'weekly'
                            ? `${totalTasks - completedTasks.length} tasks left this week`
                            : `${totalTasks - completedTasks.length} tasks left to complete`
                          }
                        </p>
                        {progressView === 'weekly' && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Week starting {new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Add Task Placeholder - Right Side */}
                <div className="flex-1">
                  <div 
                    className="border border-dashed border-gray-300/80 dark:border-gray-600/60 rounded-xl p-8 text-center cursor-pointer bg-gradient-to-br from-gray-50/50 to-white/80 dark:from-gray-800/40 dark:to-gray-900/30 backdrop-blur-sm shadow-sm shadow-gray-200/30 dark:shadow-black/20 ring-1 ring-gray-100/40 dark:ring-gray-800/30 transition-all duration-300 ease-out hover:border-blue-300/80 dark:hover:border-blue-500/60 hover:from-blue-50/40 hover:to-blue-25/60 dark:hover:from-blue-900/20 dark:hover:to-blue-800/10 hover:shadow-md hover:shadow-blue-200/40 dark:hover:shadow-blue-900/30 hover:-translate-y-0.5 hover:scale-[1.01] transform-gpu"
                    onClick={() => {
                      setShowCreateForm(true);
                      // Scroll to the form after a short delay to ensure it's rendered
                      setTimeout(() => {
                        createFormRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }, 100);
                    }}
                  >
                    <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Add new task...</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Width Create Form */
              <div className="mb-6" ref={createFormRef}>
                <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/80 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-6 shadow-lg shadow-gray-200/40 dark:shadow-black/25 ring-1 ring-gray-100/80 dark:ring-gray-800/60 backdrop-blur-sm">
                  <div className="space-y-5">
                      <Input
                        label="Task title"
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // Try create-as-subtask if syntax is used
                            if (!tryCreateAsSubtaskFromTitle()) {
                              handleCreateTask();
                            }
                          }
                        }}
                        className="text-base"
                        autoFocus
                      />

                      <Textarea
                        label="Description"
                        placeholder="Add task description or details..."
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        rows={4}
                        className="text-sm"
                      />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Priority</span>
                        <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <CustomSelect
                            options={[
                              { value: 'low', label: 'Low' },
                              { value: 'medium', label: 'Medium' },
                              { value: 'high', label: 'High' }
                            ]}
                            value={newTaskPriority}
                            onChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high')}
                          />
                        </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Project</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <ProjectComboBox
                              projects={projects}
                              value={newTaskProject}
                              onChange={(projectId) => {
                                setNewTaskProject(projectId);
                              }}
                              onCreateProject={handleCreateProjectFromCombo}
                              placeholder={projects.length === 0 ? "Type new project name..." : "Select or create project"}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Parent Task selector */}
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Parent task (optional)</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <ProjectComboBox
                              projects={tasks.map(t => ({ id: t.id, name: t.title, color: '#9CA3AF' })) as any}
                              value={newTaskParentId}
                              onChange={(parentId) => setNewTaskParentId(parentId)}
                              placeholder={newTaskParentId ? newTaskParentId : 'Type to search parent task...'}
                            />
                          </div>
                        </div>
                        {newTaskParentId && (
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Will be saved as a subtask of <span className="font-medium">{newTaskParentId}</span></div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Due date</span>
                        <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <DatePicker
                            value={newTaskDueDate}
                            onChange={setNewTaskDueDate}
                            placeholder="Due date"
                          />
                        </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🏷️</span>
                        <div className="flex-1 min-w-0">
                          <TagInput
                            value={newTaskTags}
                            onChange={setNewTaskTags}
                            placeholder="Add tags (press Enter)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subtasks Section - shown when editing, outside the options grid */}
                    {editingTask && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtasks</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const title = prompt('New subtask title')?.trim();
                              if (!title) return;
                              dispatch(addSubtask({ taskId: editingTask, title }));
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                        {(tasks.find(t => t.id === editingTask)?.subtasks ?? []).length === 0 ? (
                          <div className="text-[12px] text-gray-500 dark:text-gray-400">No subtasks yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {(tasks.find(t => t.id === editingTask)?.subtasks ?? []).map((st) => (
                              <div key={st.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-green-600"
                                  checked={!!st.completed}
                                  onChange={() => dispatch(toggleSubtask({ taskId: editingTask!, subtaskId: st.id }))}
                                />
                                <input
                                  className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1 text-sm"
                                  value={st.title}
                                  onChange={(e) => dispatch(updateTask({ id: editingTask!, subtasks: (tasks.find(t => t.id === editingTask)?.subtasks ?? []).map(s => s.id === st.id ? { ...s, title: e.target.value } : s) as any }))}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => dispatch({ type: 'tasks/removeSubtask', payload: { taskId: editingTask, subtaskId: st.id } })}
                                  title="Remove subtask"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => {
                        setShowCreateForm(false);
                        setEditingTask(null);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskProject('');
                        setNewTaskPriority('medium');
                        setNewTaskTags([]);
                        setNewTaskDueDate(null);
                        setNewTaskParentId('');
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                        {editingTask ? 'Update Task' : 'Add Task'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search and Filters - Above task cards */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks, projects, or tags..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Update Redux search state
                    dispatch({ type: 'tasks/setTaskFilter', payload: { search: e.target.value } });
                  }}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'completed', label: 'Completed' },
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? 'primary' : 'secondary'}
                    onClick={() => handleFilterChange(filter.key as 'all' | 'active' | 'completed')}
                    className="h-12 rounded-xl"
                  >
                    {filter.label}
                  </Button>
                ))}
                
                <Button variant="secondary" className="h-12 w-12 p-0 rounded-xl">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Tasks List - Full Width */}
            <div className={cn(
              {
                'space-y-3': !compactMode,
                'space-y-2': compactMode,
              }
            )}>
              {paginatedTasksData.tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery ? 'No tasks found' : 'No tasks yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery ? 'Try adjusting your search query' : 'Create your first task to get started'}
                  </p>
                </div>
              ) : (
                <>
                  {paginatedTasksData.tasks.map((task, index) => (
                    <SelectableItem key={task.id} id={task.id} type="tasks">
                      <DraggableTaskCard
                        task={task}
                        onToggle={() => dispatch(toggleTask(task.id))}
                        onToggleSubtask={(taskId: string, subtaskId: string) => dispatch(toggleSubtask({ taskId, subtaskId }))}
                        onEdit={handleEditTask}
                        onDelete={() => dispatch(deleteTask(task.id))}
                        index={index}
                        containerName="actionhub-tasks"
                        projects={projects}
                      />
                    </SelectableItem>
                  ))}

                  {/* Load More Button */}
                  {paginatedTasksData.hasMore && (
                    <div className="flex justify-center py-6">
                      <Button
                        onClick={handleLoadMore}
                        variant="secondary"
                        className="px-6 py-3 rounded-xl"
                      >
                        Load More Tasks ({paginatedTasksData.totalTasks - paginatedTasksData.currentlyShowing} remaining)
                      </Button>
                    </div>
                  )}

                  {/* Pagination Info */}
                  {paginatedTasksData.totalTasks > 0 && (
                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                      Showing {paginatedTasksData.currentlyShowing} of {paginatedTasksData.totalTasks} tasks
                      {!paginatedTasksData.hasMore && paginatedTasksData.totalTasks > pagination.tasksPerPage && (
                        <span className="ml-2">• All tasks loaded</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Projects View */
          <div>
            {/* Projects Progress and Add Project - Side by Side */}
            <div className="flex gap-6 mb-6">
              {/* Projects Progress Card - Left Side */}
              <div className="w-80">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Projects Progress
                      </h3>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Circular Progress */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${projectsProgressPercentage * 2.51} 251`}
                            className="text-green-600 dark:text-green-400"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {projectsProgressPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                        <span className="ml-auto font-semibold text-green-600 dark:text-green-400">{completedProjects.length}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                        <span className="ml-auto font-semibold text-orange-600 dark:text-orange-400">{inProgressProjects.length}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Yet to Start</span>
                        <span className="ml-auto font-semibold text-blue-600 dark:text-blue-400">{yetToStartProjects.length}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {completedProjects.length} of {activeProjects.length} projects completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Add New Project */}
              <div className="flex-1">
                {!showCreateProjectForm ? (
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500" onClick={() => setShowCreateProjectForm(true)}>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">New Project</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Create a new project to organize your tasks</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Project</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowCreateProjectForm(false)}>
                          ✕
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <Input
                          placeholder="Project name..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="rounded-xl"
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                        
                        <div className="flex gap-3 items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                            <div className="relative">
                              <input
                                type="color"
                                value={newProjectColor}
                                onChange={(e) => setNewProjectColor(e.target.value)}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent"
                                style={{
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  appearance: 'none',
                                  background: 'transparent',
                                  border: '2px solid',
                                  borderColor: 'rgb(209 213 219)',
                                }}
                              />
                              <div 
                                className="absolute inset-1 rounded-md pointer-events-none"
                                style={{ backgroundColor: newProjectColor }}
                              />
                            </div>
                          </div>
                          
                          <Button onClick={handleCreateProject} className="flex-1 rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Project
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            
            {/* Projects Grid */}
            <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const projectTasks = tasks.filter(task => task.projectId === project.id);
                const completedProjectTasks = projectTasks.filter(task => task.completed);
                const projectProgress = projectTasks.length > 0 
                  ? Math.round((completedProjectTasks.length / projectTasks.length) * 100)
                  : 0;
                
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id, project.name);
                          }}
                          title={`Delete ${project.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-white">{projectProgress}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300 bg-blue-600 dark:bg-blue-400"
                            style={{ 
                              width: `${projectProgress}%`
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div className="text-center">
                            <div className="font-medium text-green-600 dark:text-green-400">
                              {completedProjectTasks.length}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">completed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {projectTasks.length}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">total</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar />
    </div>
  );
};
