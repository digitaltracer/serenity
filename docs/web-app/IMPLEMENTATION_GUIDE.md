# Implementation Guide for Feature Parity

This guide provides code examples for implementing the critical missing features in the web app.

---

## 1. Add ToastProvider to Web (Phase 1 - 30 min)

### Step 1: Install Sonner
```bash
cd apps/web
npm install sonner
```

### Step 2: Update providers.tsx
```typescript
// apps/web/src/app/providers.tsx
'use client'

import { Provider } from 'react-redux'
import { SessionProvider } from 'next-auth/react'
import { store } from '@serenity/core'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  )
}
```

### Step 3: Use Toast in Components
```typescript
import { toast } from 'sonner'

// Success
toast.success('Task created successfully')

// Error
toast.error('Failed to create task')

// Custom
toast('Settings saved')
```

---

## 2. Fix Modal State to Use Redux (Phase 1 - 1 hour)

### Before (Current - Wrong)
```typescript
// apps/web/src/components/DashboardLayout.tsx
const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
const [isJournalModalOpen, setIsJournalModalOpen] = useState(false)

const handleCreateTask = (taskData) => {
  dispatch(addTask(taskData))
  setIsTaskModalOpen(false)  // Local state
}
```

### After (Correct)
```typescript
// apps/web/src/components/DashboardLayout.tsx
import {
  selectTaskModalOpen,
  selectJournalModalOpen,
  openTaskModal,
  closeTaskModal,
  openJournalModal,
  closeJournalModal,
} from '@serenity/core'

const isTaskModalOpen = useSelector(selectTaskModalOpen)
const isJournalModalOpen = useSelector(selectJournalModalOpen)

const handleCreateTask = (taskData) => {
  dispatch(addTask(taskData))
  dispatch(closeTaskModal())  // Redux state
}

const handleOpenTaskModal = () => {
  dispatch(openTaskModal())
}
```

---

## 3. Add GlobalSearchModal to Web Layout (Phase 1 - 1 hour)

### Step 1: Import Required Components
```typescript
// apps/web/src/components/DashboardLayout.tsx
import {
  GlobalSearchModal,
  PageTransition,
} from '@serenity/ui'
import {
  selectIsGlobalSearchOpen,
  openGlobalSearch,
  closeGlobalSearch,
} from '@serenity/core'
```

### Step 2: Add Redux State
```typescript
const isGlobalSearchOpen = useSelector(selectIsGlobalSearchOpen)
```

### Step 3: Add to Top Bar
```typescript
<div className="h-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => dispatch(openGlobalSearch())}
      className="opacity-70 hover:opacity-100 w-8 h-8 p-0"
      title="Search (Ctrl+K)"
    >
      <Search className="w-4 h-4" />
    </Button>
  </div>
  
  <div className="flex items-center gap-2">
    <ThemeToggle
      theme={currentTheme}
      onThemeChange={handleThemeChange}
      variant="cycle"
      size="sm"
    />
  </div>
</div>
```

### Step 4: Add Modal to Layout
```typescript
<GlobalSearchModal
  isOpen={isGlobalSearchOpen}
  onClose={() => dispatch(closeGlobalSearch())}
  onSelectResult={handleSearchResultSelect}
/>
```

### Step 5: Implement handleSearchResultSelect
```typescript
const handleSearchResultSelect = (result: SearchResult) => {
  switch (result.type) {
    case 'tasks':
      router.push('/actionhub')
      break
    case 'journal':
      router.push('/journal')
      break
    case 'projects':
      router.push('/actionhub')
      break
    default:
      router.push('/home')
  }
  dispatch(closeGlobalSearch())
}
```

---

## 4. Implement Global Search API (Phase 1 - 1.5 hours)

### Create /api/search endpoint
```typescript
// apps/web/src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchTerm = request.nextUrl.searchParams.get('q') || ''
    
    if (!searchTerm.trim()) {
      return NextResponse.json({ results: [] })
    }

    const query = `%${searchTerm}%`

    // Search tasks
    const tasksResult = await db.query(
      `SELECT id, title, 'tasks' as type FROM tasks 
       WHERE user_id = $1 AND title ILIKE $2 
       LIMIT 5`,
      [session.user.id, query]
    )

    // Search journal
    const journalResult = await db.query(
      `SELECT id, title, 'journal' as type FROM journal_entries 
       WHERE user_id = $1 AND title ILIKE $2 
       LIMIT 5`,
      [session.user.id, query]
    )

    // Search projects
    const projectsResult = await db.query(
      `SELECT id, name as title, 'projects' as type FROM projects 
       WHERE user_id = $1 AND name ILIKE $2 
       LIMIT 5`,
      [session.user.id, query]
    )

    const results = [
      ...tasksResult.rows,
      ...journalResult.rows,
      ...projectsResult.rows,
    ].slice(0, 10)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
```

---

## 5. Add ErrorBoundary to Web (Phase 2 - 30 min)

### Step 1: Create ErrorBoundary Wrapper
```typescript
// apps/web/src/components/ClientErrorBoundary.tsx
'use client'

import { ErrorBoundary } from '@serenity/ui'
import { ReactNode } from 'react'

export function ClientErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
```

### Step 2: Update Providers
```typescript
// apps/web/src/app/providers.tsx
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>
          <ClientErrorBoundary>
            {children}
            <Toaster />
          </ClientErrorBoundary>
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  )
}
```

---

## 6. Add AuthenticatedApp Wrapper (Phase 2 - 30 min)

### Import Component
```typescript
// apps/web/src/app/providers.tsx
import { AuthenticatedApp } from '@serenity/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>
          <ClientErrorBoundary>
            <AuthenticatedApp>
              {children}
              <Toaster />
            </AuthenticatedApp>
          </ClientErrorBoundary>
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  )
}
```

---

## 7. Implement Integrations API (Phase 2 - 2 hours)

### Create Integrations Routes
```bash
# Create the directory
mkdir -p apps/web/src/app/api/integrations
```

### Google Calendar Integration
```typescript
// apps/web/src/app/api/integrations/google-calendar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.query(
      `SELECT * FROM integrations WHERE user_id = $1 AND provider = 'google'`,
      [session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      email: result.rows[0].email,
    })
  } catch (error) {
    console.error('Integration check failed:', error)
    return NextResponse.json({ error: 'Failed to check integration' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Save integration
    const result = await db.query(
      `INSERT INTO integrations (user_id, provider, email, token, refresh_token, expires_at)
       VALUES ($1, 'google', $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) 
       DO UPDATE SET token = $3, refresh_token = $4, expires_at = $5
       RETURNING *`,
      [
        session.user.id,
        body.email,
        body.accessToken,
        body.refreshToken,
        new Date(Date.now() + 3600000), // 1 hour
      ]
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Integration setup failed:', error)
    return NextResponse.json({ error: 'Failed to setup integration' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.query(
      `DELETE FROM integrations WHERE user_id = $1 AND provider = 'google'`,
      [session.user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Integration deletion failed:', error)
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
  }
}
```

---

## 8. Unify Layout Components (Phase 2 - 2 hours)

### Create Shared AppLayout in @serenity/ui

```typescript
// packages/ui/src/components/AppLayout.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setSidebarCollapsed,
  selectSidebarCollapsed,
  selectTheme,
  setTheme,
  selectAllTasks,
  Task,
  JournalEntry,
} from '@serenity/core'
import { useNavigation, isNextJS } from '../routing'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
  SidebarSection,
  Button,
  ThemeToggle,
} from './index'

interface AppLayoutProps {
  children: React.ReactNode
  showSearch?: boolean
  showKeyboardHelp?: boolean
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showSearch = true,
  showKeyboardHelp = true,
}) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const sidebarCollapsed = useSelector(selectSidebarCollapsed)
  const currentTheme = useSelector(selectTheme)

  // Navigation items (same for both apps)
  const navigationItems = [
    { path: '/home', label: 'Home', icon: 'Home' },
    { path: '/actionhub', label: 'ActionHub', icon: 'CheckSquare' },
    { path: '/today', label: 'Today', icon: 'Calendar' },
    { path: '/journal', label: 'Journal', icon: 'BookOpen' },
    { path: '/goals', label: 'Goals', icon: 'Target' },
    { path: '/insights', label: 'Insights', icon: 'Brain' },
    { path: '/summary', label: 'AI Summaries', icon: 'Sparkles' },
  ]

  const toggleSidebar = () => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed))
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(theme))
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed}>
        {/* Header */}
        <SidebarHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xl">S</span>
              {!sidebarCollapsed && <span>Serenity Notes</span>}
            </div>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
              >
                Close
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          {!sidebarCollapsed && (
            <SidebarSection title="Navigation">
              {navigationItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  onClick={() => navigation.push(item.path)}
                >
                  {item.label}
                </SidebarItem>
              ))}
            </SidebarSection>
          )}
        </SidebarContent>

        {/* Bottom section */}
        <div className="p-4 border-t space-y-2">
          <SidebarItem onClick={() => navigation.push('/integrations')}>
            {!sidebarCollapsed && 'Integrations'}
          </SidebarItem>
          <SidebarItem onClick={() => navigation.push('/database')}>
            {!sidebarCollapsed && 'Database'}
          </SidebarItem>
          <SidebarItem onClick={() => navigation.push('/settings')}>
            {!sidebarCollapsed && 'Settings'}
          </SidebarItem>
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-10 border-b flex items-center justify-between px-4">
          <div>
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                title="Search"
              >
                Search
              </Button>
            )}
          </div>
          <ThemeToggle
            theme={currentTheme}
            onThemeChange={handleThemeChange}
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## 9. Move ThemeProvider to @serenity/ui (Phase 3 - 15 min)

### Copy to shared package
```bash
cp apps/desktop/src/renderer/components/ThemeProvider.tsx packages/ui/src/components/
```

### Update exports
```typescript
// packages/ui/src/components/index.ts
export { ThemeProvider } from './ThemeProvider'
```

### Update both apps
```typescript
// apps/desktop/src/renderer/App.tsx
import { ThemeProvider } from '@serenity/ui'

// apps/web/src/app/providers.tsx
import { ThemeProvider } from '@serenity/ui'
```

---

## 10. Normalize Route Paths (Phase 3 - 1 hour)

### Option: Update Desktop to use /home
```typescript
// apps/desktop/src/renderer/App.tsx
<Routes>
  <Route path="/" element={<Navigate to="/home" />} />
  <Route path="/home" element={<HomePage />} />
  {/* rest of routes... */}
</Routes>
```

---

## Estimated Effort

| Task | Duration | Difficulty | Impact |
|------|----------|------------|--------|
| Add ToastProvider | 30 min | Easy | High |
| Fix modal state | 1 hour | Medium | High |
| Add GlobalSearchModal | 1 hour | Medium | High |
| Implement /api/search | 1.5 hours | Medium | High |
| Add ErrorBoundary | 30 min | Easy | Medium |
| Add AuthenticatedApp | 30 min | Easy | Medium |
| Integrations API | 2 hours | Hard | High |
| Unify Layout | 2 hours | Hard | High |
| Move ThemeProvider | 15 min | Easy | Low |
| Normalize routes | 1 hour | Medium | Medium |
| **Total Phase 1** | **4 hours** | **Medium** | **Critical** |
| **Total Phase 2** | **6 hours** | **Hard** | **High** |
| **Total Phase 3** | **4 hours** | **Medium** | **Medium** |

---

## Testing Checklist

After each implementation:

- [ ] Verify component renders without errors
- [ ] Test on both web and desktop (if applicable)
- [ ] Check Redux state in Redux DevTools
- [ ] Verify toast messages appear
- [ ] Test keyboard shortcuts (if implemented)
- [ ] Check API endpoints with curl/Postman
- [ ] Run `npm run build` without errors
- [ ] Run `npm run test` (if tests exist)

---

## References

- Toast notifications: https://sonner.emilkowal.ski/
- Redux: https://redux.js.org/
- Next.js API: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- React Router: https://reactrouter.com/
