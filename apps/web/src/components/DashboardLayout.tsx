'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
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
  selectTaskModalOpen,
  selectJournalModalOpen,
  selectSubtaskModalOpen,
  openTaskModal,
  closeTaskModal,
  openJournalModal,
  closeJournalModal,
  openSubtaskModal,
  closeSubtaskModal,
  selectIsGlobalSearchOpen,
  openGlobalSearch,
  closeGlobalSearch,
  Task,
  JournalEntry,
  SearchResult
} from '@serenity/core'
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
} from '@serenity/ui'
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
  Target,
  Brain,
  Sparkles,
  Globe,
  Search
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email?: string | null
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const dispatch = useDispatch()
  const sidebarCollapsed = useSelector(selectSidebarCollapsed)
  const currentTheme = useSelector(selectTheme)
  const tasks = useSelector(selectAllTasks)
  const isTaskModalOpen = useSelector(selectTaskModalOpen)
  const isJournalModalOpen = useSelector(selectJournalModalOpen)
  const isSubtaskModalOpen = useSelector(selectSubtaskModalOpen)
  const isGlobalSearchOpen = useSelector(selectIsGlobalSearchOpen)
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve the actual theme (handle 'system' preference)
  const resolvedTheme = useMemo(() => {
    if (!mounted) return 'light' // Default for SSR
    if (currentTheme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    }
    return currentTheme
  }, [currentTheme, mounted])

  const toggleSidebar = () => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed))
  }

  const handleCreateTask = (taskData: Partial<Task>) => {
    dispatch(addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>))

    // Add tags to the used tags store
    if (taskData.tags && taskData.tags.length > 0) {
      dispatch(addUsedTags(taskData.tags))
    }

    dispatch(closeTaskModal())
  }

  const handleCreateJournalEntry = (entryData: Partial<JournalEntry>) => {
    dispatch(addEntry(entryData as Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>))

    // Add tags to the used tags store
    if (entryData.tags && entryData.tags.length > 0) {
      dispatch(addUsedTags(entryData.tags))
    }

    dispatch(closeJournalModal())
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(theme))
  }

  const handleCreateSubtask = (taskId: string, subtaskTitle: string) => {
    dispatch(addSubtask({ taskId, title: subtaskTitle }))
    dispatch(closeSubtaskModal())
  }

  const handleSearchResultClick = (result: SearchResult) => {
    // Navigate to the appropriate page based on result type
    if (result.type === 'tasks') {
      router.push('/actionhub')
    } else if (result.type === 'journal') {
      router.push('/journal')
    } else if (result.type === 'projects') {
      router.push('/actionhub')
    } else if (result.type === 'goals') {
      router.push('/goals')
    }
    dispatch(closeGlobalSearch())
  }

  const navigationItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/actionhub', label: 'ActionHub', icon: CheckSquare },
    { path: '/today', label: 'Today', icon: Calendar },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/insights', label: 'Insights', icon: Brain },
    { path: '/summary', label: 'AI Summaries', icon: Sparkles },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed}>
        {/* Header with collapse button */}
        <div className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-center">
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
              <Image
                src={resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                alt="Serenity Notes Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                priority
              />
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
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} prefetch={true}>
                    <SidebarItem
                      icon={<Icon className="w-5 h-5" />}
                      active={isActive(item.path)}
                    >
                      {item.label}
                    </SidebarItem>
                  </Link>
                )
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
                const Icon = item.icon
                return (
                  <Link key={item.path} href={item.path} prefetch={true}>
                    <SidebarItem
                      icon={<Icon className="w-5 h-5" />}
                      active={isActive(item.path)}
                    />
                  </Link>
                )
              })}
            </div>
          )}

          {!sidebarCollapsed && (
            <SidebarSection title="Quick Actions">
              <SidebarItem
                icon={<Plus className="w-5 h-5" />}
                onClick={() => dispatch(openTaskModal())}
              >
                New Task
              </SidebarItem>
              <SidebarItem
                icon={<BookOpen className="w-5 h-5" />}
                onClick={() => dispatch(openJournalModal())}
              >
                New Entry
              </SidebarItem>
              <SidebarItem
                icon={<ListChecks className="w-5 h-5" />}
                onClick={() => dispatch(openSubtaskModal())}
              >
                Add Subtask
              </SidebarItem>
            </SidebarSection>
          )}

          {sidebarCollapsed && (
            <div className="space-y-2 mt-4">
              <SidebarItem
                icon={<Plus className="w-5 h-5" />}
                onClick={() => dispatch(openTaskModal())}
              />
              <SidebarItem
                icon={<BookOpen className="w-5 h-5" />}
                onClick={() => dispatch(openJournalModal())}
              />
              <SidebarItem
                icon={<ListChecks className="w-5 h-5" />}
                onClick={() => dispatch(openSubtaskModal())}
              />
            </div>
          )}
        </SidebarContent>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Link href="/integrations" prefetch={true}>
            <SidebarItem
              icon={<Globe className="w-5 h-5" />}
              active={isActive('/integrations')}
            >
              {!sidebarCollapsed && 'Integrations'}
            </SidebarItem>
          </Link>
          <Link href="/settings" prefetch={true}>
            <SidebarItem
              icon={<Settings className="w-5 h-5" />}
              active={isActive('/settings')}
            >
              {!sidebarCollapsed && 'Settings'}
            </SidebarItem>
          </Link>
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with search and theme toggle */}
        <div className="h-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(openGlobalSearch())}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
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
        onClose={() => dispatch(closeTaskModal())}
        onSave={handleCreateTask}
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
        onSelectResult={handleSearchResultClick}
      />
    </div>
  )
}
