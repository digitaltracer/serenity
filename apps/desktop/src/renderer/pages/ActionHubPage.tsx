import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, selectCompactMode } from '@serenity/core';
import { addTask, toggleTask, deleteTask, updateTask, addProject, updateGoalsProgress, selectAllEntries, selectAllProjects } from '@serenity/core';
import { Button, Input, TaskCard, Card, CardHeader, CardTitle, CardContent, Select, CustomSelect, ProjectComboBox, TagInput, DatePicker, Textarea, cn, DraggableTaskCard, SelectableItem, BulkOperationsToolbar, BulkActionsButton } from '@serenity/ui';
import { Plus, Search, Filter, BarChart3, Calendar, CheckCircle2, Clock, AlertCircle, FolderOpen, MoreHorizontal, Info, MoreVertical, Flag, Folder, CheckCircle, Target, List } from 'lucide-react';

export const ActionHubPage: React.FC = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { projects } = useSelector((state: RootState) => state.projects);
  const journalEntries = useSelector(selectAllEntries);
  const allProjects = useSelector(selectAllProjects);
  const compactMode = useSelector(selectCompactMode);

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
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#8B5CF6');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      activeFilter === 'all' || 
      (activeFilter === 'active' && !task.completed) ||
      (activeFilter === 'completed' && task.completed);
    return matchesSearch && matchesFilter;
  });

  const completedTasks = tasks.filter(task => task.completed);
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  // Projects calculations
  const activeProjects = projects.filter(p => !p.archived);
  const projectTasks = tasks.filter(t => t.projectId);
  
  // Calculate project statuses based on their tasks
  const getProjectStatus = (project: any) => {
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

  const handleFilterChange = (filter: 'all' | 'active' | 'completed') => {
    setActiveFilter(filter);
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

  const handleCreateProjectFromCombo = (projectName: string) => {
    const projectData = {
      name: projectName,
      color: '#8B5CF6', // Default purple color
      description: '',
      archived: false
    };
    
    dispatch(addProject(projectData));
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      const taskData = {
        title: newTaskTitle,
        description: newTaskDescription,
        projectId: newTaskProject || undefined,
        priority: newTaskPriority,
        tags: newTaskTags,
        dueDate: newTaskDueDate?.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (editingTask) {
        dispatch(updateTask({ ...taskData, id: editingTask }));
      } else {
        dispatch(addTask(taskData));
      }
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskProject('');
      setNewTaskPriority('medium');
      setNewTaskTags([]);
      setNewTaskDueDate(null);
      setShowCreateForm(false);
      setEditingTask(null);
    }
  };

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

  const projectOptions = projects.map(project => ({
    value: project.id,
    label: project.name,
  }));

  return (
    <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
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
                          Overall Progress
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
                          <span className="text-sm text-gray-700 dark:text-gray-300">Total Tasks</span>
                          <span className="ml-auto font-semibold text-blue-600 dark:text-blue-400">{totalTasks}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {totalTasks - completedTasks.length} tasks left to complete
                        </p>
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
                <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/80 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-xl p-6 shadow-lg shadow-gray-200/40 dark:shadow-black/25 ring-1 ring-gray-100/80 dark:ring-gray-800/60 backdrop-blur-sm">
                  <div className="space-y-4">
                    <Input
                      placeholder="What needs to be done?"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="text-base"
                      autoFocus
                    />
                    
                    <Textarea
                      placeholder="Add task description or details..."
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <CustomSelect
                            options={[
                              { value: 'medium', label: 'Medium' },
                              { value: 'low', label: 'Low' },
                              { value: 'high', label: 'High' }
                            ]}
                            value={newTaskPriority}
                            onChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high')}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <ProjectComboBox
                            projects={projects}
                            value={newTaskProject}
                            onChange={(projectId) => setNewTaskProject(projectId)}
                            onCreateProject={handleCreateProjectFromCombo}
                            placeholder={projects.length === 0 ? "Type new project name..." : "Select or create project"}
                          />
                        </div>
                      </div>
                      
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
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => {
                        setShowCreateForm(false);
                        setEditingTask(null);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskProject('');
                        setNewTaskPriority('medium');
                        setNewTaskTags([]);
                        setNewTaskDueDate(null);
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              {filteredTasks.length === 0 ? (
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
                filteredTasks.map((task, index) => (
                  <SelectableItem key={task.id} id={task.id} type="tasks">
                    <DraggableTaskCard
                      task={task}
                      onToggle={() => dispatch(toggleTask(task.id))}
                      onClick={handleEditTask}
                      onDelete={() => dispatch(deleteTask(task.id))}
                      index={index}
                      containerName="actionhub-tasks"
                    />
                  </SelectableItem>
                ))
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
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
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