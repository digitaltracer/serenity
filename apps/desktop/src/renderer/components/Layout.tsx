import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setSidebarCollapsed, 
  selectSidebarCollapsed, 
  selectTheme,
  setTheme,
  addTask, 
  addProject,
  addSubtask,
  removeSubtask,
  toggleSubtask,
  updateSubtaskTitle,
  deleteTask,
  selectAllTasks,
  selectAllProjects,
  addEntry,
  addUsedTags,
  selectIsGlobalSearchOpen,
  openGlobalSearch,
  closeGlobalSearch,
  openHelpModal,
  selectTaskModalOpen,
  selectJournalModalOpen,
  selectSubtaskModalOpen,
  openTaskModal,
  closeTaskModal,
  openJournalModal,
  closeJournalModal,
  openSubtaskModal,
  closeSubtaskModal,
  selectShortcuts,
  Task,
  JournalEntry,
  SearchResult
} from '@serenity/core';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarItem, 
  SidebarSection,
  Button,
  TaskModal,
  JournalEntryModal,
  ThemeToggle,
  SubtaskModal,
  GlobalSearchModal
} from '@serenity/ui';
import { 
  Home,
  CheckSquare, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Plus,
  Menu,
  ListChecks,
  PanelLeft,
  PanelLeftClose,
  Square,
  Search,
  HelpCircle,
  Target,
  Database,
  Globe,
  Brain
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const currentTheme = useSelector(selectTheme);
  const tasks = useSelector(selectAllTasks);
  const projects = useSelector(selectAllProjects);
  const isGlobalSearchOpen = useSelector(selectIsGlobalSearchOpen);
  const isTaskModalOpen = useSelector(selectTaskModalOpen);
  const isJournalModalOpen = useSelector(selectJournalModalOpen);
  const isSubtaskModalOpen = useSelector(selectSubtaskModalOpen);
  const shortcuts = useSelector(selectShortcuts);
  
  // Find relevant shortcuts for buttons
  const searchShortcut = shortcuts.find(s => s.action === 'OPEN_GLOBAL_SEARCH');
  const helpShortcut = shortcuts.find(s => s.action === 'SHOW_SHORTCUTS_HELP');
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed));
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
    dispatch(addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>));
    
    // Add tags to the used tags store
    if (taskData.tags && taskData.tags.length > 0) {
      dispatch(addUsedTags(taskData.tags));
    }
    
    dispatch(closeTaskModal());
  };

  const handleCreateProject = (projectName: string) => {
    const projectData = {
      name: projectName,
      color: '#8B5CF6', // Default purple color
      description: '',
      archived: false
    };
    
    dispatch(addProject(projectData));
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch(deleteTask(taskId));
  };

  const handleArchiveTask = (taskId: string) => {
    // For now, we'll implement archive as setting a special tag or status
    // This can be expanded later with a proper archive field
    console.log('Archive task:', taskId);
    // TODO: Implement proper archiving when archive field is added to Task interface
  };

  const handleCreateJournalEntry = (entryData: Partial<JournalEntry>) => {
    dispatch(addEntry(entryData as Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>));
    
    // Add tags to the used tags store
    if (entryData.tags && entryData.tags.length > 0) {
      dispatch(addUsedTags(entryData.tags));
    }
    
    dispatch(closeJournalModal());
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(theme));
  };

  const handleCreateSubtask = (taskId: string, subtaskTitle: string) => {
    dispatch(addSubtask({ taskId, title: subtaskTitle }));
    dispatch(closeSubtaskModal());
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    // Navigate to the appropriate page based on the result type
    switch (result.type) {
      case 'tasks':
        navigate('/actionhub');
        break;
      case 'journal':
        navigate('/journal');
        break;
      case 'projects':
        navigate('/actionhub'); // Projects are typically managed in ActionHub
        break;
      default:
        navigate('/');
    }
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/actionhub', label: 'ActionHub', icon: CheckSquare },
    { path: '/today', label: 'Today', icon: Calendar },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Brain },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed}>
        {/* Draggable top section - reserve space for window controls */}
        <div 
          className="h-12 bg-white/5 dark:bg-gray-900/30 backdrop-blur-md border-b border-gray-200/10 dark:border-gray-700/20 flex items-center justify-end px-4"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {!sidebarCollapsed && (
            <div 
              className="flex items-center justify-center"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="opacity-70 hover:opacity-100 w-6 h-6 p-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 justify-center w-full">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <img 
                  src="/logo.png" 
                  alt="Serenity Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              {!sidebarCollapsed && (
                <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                  Serenity Notes
                </h1>
              )}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {!sidebarCollapsed && (
            <SidebarSection title="Navigation">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarItem
                    key={item.path}
                    icon={<Icon className="w-5 h-5" />}
                    active={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </SidebarItem>
                );
              })}
            </SidebarSection>
          )}
          
          {sidebarCollapsed && (
            <div className="space-y-2">
              {/* Toggle button when collapsed */}
              <SidebarItem
                icon={<PanelLeft className="w-5 h-5" />}
                onClick={toggleSidebar}
              />
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarItem
                    key={item.path}
                    icon={<Icon className="w-5 h-5" />}
                    active={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                  />
                );
              })}
            </div>
          )}

          {/* Quick Actions section removed as requested */}
          
          {/* Collapsed quick buttons removed */}
        </SidebarContent>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <SidebarItem
            icon={<Globe className="w-5 h-5" />}
            active={isActive('/integrations')}
            onClick={() => navigate('/integrations')}
          >
            {!sidebarCollapsed && 'Integrations'}
          </SidebarItem>
          <SidebarItem
            icon={<Database className="w-5 h-5" />}
            active={isActive('/database')}
            onClick={() => navigate('/database')}
          >
            {!sidebarCollapsed && 'Database'}
          </SidebarItem>
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            active={isActive('/settings')}
            onClick={() => navigate('/settings')}
          >
            {!sidebarCollapsed && 'Settings'}
          </SidebarItem>
        </div>
      </Sidebar>


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Drag Region Header */}
        <div 
          className="h-10 bg-white/5 dark:bg-gray-900/20 backdrop-blur-md border-b border-gray-200/10 dark:border-gray-700/20 flex items-center justify-end px-4"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div 
            className="flex items-center gap-2"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(openGlobalSearch())}
              className="opacity-70 hover:opacity-100 w-8 h-8 p-0"
              title={`Global Search${searchShortcut ? ` (${searchShortcut.modifiers.ctrl ? (navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl+') : ''}${searchShortcut.key.toUpperCase()})` : ''}`}
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(openHelpModal())}
              className="opacity-70 hover:opacity-100 w-8 h-8 p-0"
              title={`Keyboard Shortcuts${helpShortcut ? ` (${helpShortcut.modifiers.shift ? 'Shift+' : ''}${helpShortcut.key})` : ''}`}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <ThemeToggle 
              theme={currentTheme}
              onThemeChange={handleThemeChange}
              variant="cycle"
              size="sm"
            />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => dispatch(closeTaskModal())}
        onSave={handleCreateTask}
        projects={projects}
        onCreateProject={handleCreateProject}
        onDelete={handleDeleteTask}
        onArchive={handleArchiveTask}
        onSaveAsSubtaskOf={(parentId: string, subtaskTitle: string) => {
          dispatch(addSubtask({ taskId: parentId, title: subtaskTitle }));
        }}
        allTasks={tasks.map(t => ({ id: t.id, title: t.title }))}
        onToggleSubtask={(taskId, subtaskId) => dispatch(toggleSubtask({ taskId, subtaskId }))}
        onUpdateSubtaskTitle={(taskId, subtaskId, title) => dispatch(updateSubtaskTitle({ taskId, subtaskId, title }))}
        onRemoveSubtask={(taskId, subtaskId) => dispatch(removeSubtask({ taskId, subtaskId }))}
        onAddSubtaskInline={(taskId, title) => dispatch(addSubtask({ taskId, title }))}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => dispatch(closeJournalModal())}
        onSave={handleCreateJournalEntry}
      />

      {/* Subtask Modal */}
      <SubtaskModal
        isOpen={isSubtaskModalOpen}
        onClose={() => dispatch(closeSubtaskModal())}
        onSave={handleCreateSubtask}
        tasks={tasks}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => dispatch(closeGlobalSearch())}
        onSelectResult={handleSearchResultSelect}
      />
    </div>
  );
};
