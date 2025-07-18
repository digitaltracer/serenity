import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setSidebarCollapsed, 
  selectSidebarCollapsed, 
  selectTheme,
  setTheme,
  addTask, 
  addSubtask,
  selectAllTasks,
  addEntry,
  addUsedTags,
  Task,
  JournalEntry
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
  SubtaskModal
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
  ListChecks
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const currentTheme = useSelector(selectTheme);
  const tasks = useSelector(selectAllTasks);
  const location = useLocation();
  const navigate = useNavigate();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);

  const toggleSidebar = () => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed));
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
    dispatch(addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>));
    
    // Add tags to the used tags store
    if (taskData.tags && taskData.tags.length > 0) {
      dispatch(addUsedTags(taskData.tags));
    }
    
    setIsTaskModalOpen(false);
  };

  const handleCreateJournalEntry = (entryData: Partial<JournalEntry>) => {
    dispatch(addEntry(entryData as Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>));
    
    // Add tags to the used tags store
    if (entryData.tags && entryData.tags.length > 0) {
      dispatch(addUsedTags(entryData.tags));
    }
    
    setIsJournalModalOpen(false);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(theme));
  };

  const handleCreateSubtask = (taskId: string, subtaskTitle: string) => {
    dispatch(addSubtask({ taskId, title: subtaskTitle }));
    setIsSubtaskModalOpen(false);
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/actionhub', label: 'ActionHub', icon: CheckSquare },
    { path: '/today', label: 'Today', icon: Calendar },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed}>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              {!sidebarCollapsed && (
                <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                  Serenity Notes
                </h1>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
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
                  {!sidebarCollapsed && item.label}
                </SidebarItem>
              );
            })}
          </SidebarSection>

          <SidebarSection title="Quick Actions">
            <SidebarItem
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setIsTaskModalOpen(true)}
            >
              {!sidebarCollapsed && 'New Task'}
            </SidebarItem>
            <SidebarItem
              icon={<BookOpen className="w-5 h-5" />}
              onClick={() => setIsJournalModalOpen(true)}
            >
              {!sidebarCollapsed && 'New Entry'}
            </SidebarItem>
            <SidebarItem
              icon={<ListChecks className="w-5 h-5" />}
              onClick={() => setIsSubtaskModalOpen(true)}
            >
              {!sidebarCollapsed && 'Add Subtask'}
            </SidebarItem>
          </SidebarSection>
        </SidebarContent>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
          className="h-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-4"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div 
            className="flex items-center gap-2"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <ThemeToggle 
              theme={currentTheme}
              onThemeChange={handleThemeChange}
              variant="cycle"
              size="sm"
            />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSave={handleCreateJournalEntry}
      />

      {/* Subtask Modal */}
      <SubtaskModal
        isOpen={isSubtaskModalOpen}
        onClose={() => setIsSubtaskModalOpen(false)}
        onSave={handleCreateSubtask}
        tasks={tasks}
      />
    </div>
  );
};