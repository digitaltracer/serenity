import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@serenity/core';
import { addTask, toggleTask, deleteTask, updateTask } from '@serenity/core';
import { Button, Input, TaskCard, Card, CardHeader, CardTitle, CardContent, Select, TagInput } from '@serenity/ui';
import { Plus, Search, Filter, BarChart3, Calendar, CheckCircle2, Clock, AlertCircle, FolderOpen, MoreHorizontal, Info } from 'lucide-react';

export const ActionHubPage: React.FC = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { projects } = useSelector((state: RootState) => state.projects);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);

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

  const handleFilterChange = (filter: 'all' | 'active' | 'completed') => {
    setActiveFilter(filter);
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        title: newTaskTitle,
        projectId: newTaskProject || undefined,
        priority: newTaskPriority,
        tags: newTaskTags,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      dispatch(addTask(newTask));
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskProject('');
      setNewTaskPriority('medium');
      setNewTaskTags([]);
      setShowCreateForm(false);
    }
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
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Projects
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'tasks' ? (
          <div>
            {/* Progress and Add Task - Side by Side when collapsed */}
            {!showCreateForm ? (
              <div className="flex gap-6 mb-6">
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{completedTasks.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Remaining</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{totalTasks - completedTasks.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{totalTasks}</span>
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
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-base">Add new task...</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Width Create Form */
              <div className="mb-6">
                <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="What needs to be done? (Type @ to mention projects)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="text-base"
                      autoFocus
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded flex items-center justify-center">
                          <span className="text-xs text-white">⏰</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Select
                            options={[
                              { value: 'medium', label: 'Medium' },
                              { value: 'low', label: 'Low' },
                              { value: 'high', label: 'High' }
                            ]}
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <Select
                            options={[
                              { value: '', label: 'Select project' },
                              ...projectOptions
                            ]}
                            value={newTaskProject}
                            onChange={(e) => setNewTaskProject(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <Input
                            type="date"
                            placeholder="Due date"
                            className="w-full"
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
                      <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                        Add Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search and Filters - Above task cards */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks, projects, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'completed', label: 'Completed' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key as 'all' | 'active' | 'completed')}
                    className={`px-4 py-3 h-12 text-sm font-medium rounded-lg transition-colors ${
                      activeFilter === filter.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                
                <button className="flex items-center gap-2 px-4 py-3 h-12 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  <Filter className="w-4 h-4" />
                  More Filters
                </button>
              </div>
            </div>
            
            {/* Tasks List - Full Width */}
            <div className="space-y-3">
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
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => dispatch(toggleTask(task.id))}
                    onEdit={() => {
                      // Handle edit
                    }}
                    onDelete={() => dispatch(deleteTask(task.id))}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          /* Projects View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Projects
              </h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
            
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
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${projectProgress}%`,
                              backgroundColor: project.color 
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
        )}
      </div>
    </div>
  );
};