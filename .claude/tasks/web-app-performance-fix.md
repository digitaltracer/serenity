# Web App Performance Fix Plan

## Problem Summary

The web app has extremely poor navigation performance (1.4-1.8 seconds per navigation) due to:
1. All pages force dynamic rendering (no caching)
2. No loading states - users see blank pages
3. Using `router.push()` instead of `Link` components (no prefetching)
4. Client-side data fetching via useEffect (waterfall requests)
5. No Suspense boundaries (no streaming)

## Root Cause Analysis

### Current Navigation Flow (1.4-1.8s)
```
Click → Server render → Auth check → HTML/JS → Hydrate → useEffect → Fetch → Re-render
```

### Target Navigation Flow (700-900ms)
```
Click (prefetched) → Hydrate with cached HTML → Streaming data → Interactive
```

---

## Implementation Plan

### Phase 1: Loading States & Visual Feedback (Immediate Impact)

**Goal:** Eliminate blank page during navigation

#### Task 1.1: Add loading.tsx files for all routes
Create loading.tsx with skeleton UI for each dashboard route:

**Files to create:**
- `apps/web/src/app/(dashboard)/loading.tsx` (shared dashboard loading)
- `apps/web/src/app/(dashboard)/home/loading.tsx`
- `apps/web/src/app/(dashboard)/today/loading.tsx`
- `apps/web/src/app/(dashboard)/actionhub/loading.tsx`
- `apps/web/src/app/(dashboard)/journal/loading.tsx`
- `apps/web/src/app/(dashboard)/insights/loading.tsx`
- `apps/web/src/app/(dashboard)/analytics/loading.tsx`
- `apps/web/src/app/(dashboard)/settings/loading.tsx`
- `apps/web/src/app/(dashboard)/goals/loading.tsx`
- `apps/web/src/app/(dashboard)/projects/loading.tsx`
- `apps/web/src/app/(dashboard)/search/loading.tsx`

**Template:**
```tsx
// loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse p-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  )
}
```

#### Task 1.2: Add error.tsx files for error boundaries
Create error boundaries for graceful error handling:

**Files to create:**
- `apps/web/src/app/(dashboard)/error.tsx`
- `apps/web/src/app/error.tsx`

---

### Phase 2: Fix Navigation (Link Prefetching)

**Goal:** Enable automatic page prefetching

#### Task 2.1: Replace router.push with Link in DashboardLayout

**File:** `apps/web/src/components/DashboardLayout.tsx`

**Current (bad):**
```tsx
<SidebarItem onClick={() => router.push('/home')} />
```

**Fixed:**
```tsx
import Link from 'next/link'

<Link href="/home" className="...">
  <SidebarItem />
</Link>
```

#### Task 2.2: Fix the universal Link component

**File:** `packages/ui/src/routing/Link.tsx`

Replace dynamic `require()` with proper conditional imports:

```tsx
'use client'
import React from 'react'
import NextLink from 'next/link'

interface UniversalLinkProps {
  href?: string
  to?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Link: React.FC<UniversalLinkProps> = ({
  href,
  to,
  children,
  className,
  onClick,
  ...props
}) => {
  const path = href || to || '/'

  // In web app context, always use Next.js Link
  // The Electron app uses a different build that doesn't include this file
  return (
    <NextLink
      href={path}
      className={className}
      onClick={onClick}
      prefetch={true}
      {...props}
    >
      {children}
    </NextLink>
  )
}
```

---

### Phase 3: Remove force-dynamic (Enable Caching)

**Goal:** Allow Next.js to cache and statically generate where possible

#### Task 3.1: Remove force-dynamic from layouts

**Files to modify:**
- `apps/web/src/app/layout.tsx` - Remove `export const dynamic = 'force-dynamic'`
- `apps/web/src/app/(dashboard)/layout.tsx` - Remove `export const dynamic = 'force-dynamic'`

#### Task 3.2: Keep force-dynamic only on pages that truly need it

Pages that need user-specific data should remain dynamic, but layouts don't need to be:
- Keep `force-dynamic` on API routes
- Keep `force-dynamic` on pages that show user-specific data
- Remove from layouts

---

### Phase 4: Add Suspense Boundaries

**Goal:** Enable streaming and partial rendering

#### Task 4.1: Wrap data-fetching components in Suspense

**File:** `apps/web/src/app/(dashboard)/layout.tsx`

```tsx
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/DashboardSkeleton'

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent>
        {children}
      </DashboardContent>
    </Suspense>
  )
}
```

#### Task 4.2: Add Suspense to page-level data fetching

Wrap heavy data components in Suspense with fallbacks.

---

### Phase 5: Optimize Data Fetching

**Goal:** Move data fetching server-side, add caching

#### Task 5.1: Create server-side data fetching utilities

**File to create:** `apps/web/src/lib/data/index.ts`

```tsx
import { cache } from 'react'
import { db } from '@/lib/db/postgres'
import { auth } from '@/lib/auth/config'

// Cached data fetchers (deduplicated per request)
export const getTasks = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return []

  const result = await db.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [session.user.id]
  )
  return result.rows
})

export const getJournalEntries = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return []

  const result = await db.query(
    'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY date DESC',
    [session.user.id]
  )
  return result.rows
})
```

#### Task 5.2: Pass data from Server Component to Client Component

```tsx
// page.tsx (Server Component)
import { getTasks } from '@/lib/data'
import { TaskList } from './TaskList'

export default async function ActionHubPage() {
  const tasks = await getTasks()

  return <TaskList initialTasks={tasks} />
}

// TaskList.tsx (Client Component)
'use client'
export function TaskList({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks)
  // Client-side updates only, no initial fetch needed
}
```

---

### Phase 6: API Route Caching

**Goal:** Cache API responses where appropriate

#### Task 6.1: Add cache headers to read-only API routes

**File:** `apps/web/src/app/api/stats/route.ts`

```tsx
export async function GET(request: NextRequest) {
  // ... existing code ...

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
    }
  })
}
```

---

### Phase 7: Theme Flash Fix

**Goal:** Eliminate flash of unstyled content

#### Task 7.1: Use cookie-based theme with inline script

**File:** `apps/web/src/app/layout.tsx`

Add inline script in `<head>` to set theme before render:

```tsx
<head>
  <script dangerouslySetInnerHTML={{
    __html: `
      (function() {
        const theme = document.cookie.match(/theme=(light|dark)/)?.[1]
          || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.add(theme);
      })();
    `
  }} />
</head>
```

---

## Implementation Order

| Priority | Task | Estimated Impact | Complexity |
|----------|------|------------------|------------|
| 1 | Add loading.tsx files | High - immediate visual feedback | Low |
| 2 | Fix DashboardLayout navigation | High - enables prefetching | Medium |
| 3 | Remove force-dynamic from layouts | High - enables caching | Low |
| 4 | Add Suspense boundaries | Medium - streaming | Medium |
| 5 | Fix Link component | Medium - universal routing | Medium |
| 6 | Server-side data fetching | High - eliminates waterfall | High |
| 7 | API caching headers | Medium - reduces server load | Low |
| 8 | Theme flash fix | Low - cosmetic | Low |

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Time to First Paint | 500-800ms | 100-200ms | 4x faster |
| Time to Interactive | 1400-1800ms | 700-900ms | 2x faster |
| Navigation (subsequent) | 800-1200ms | 200-400ms | 4x faster |
| Perceived Load Time | Blank → Content | Skeleton → Content | Smooth |

---

## Files to Modify

### High Priority
1. `apps/web/src/app/(dashboard)/loading.tsx` - CREATE
2. `apps/web/src/app/(dashboard)/*/loading.tsx` - CREATE (10 files)
3. `apps/web/src/components/DashboardLayout.tsx` - Replace router.push with Link
4. `apps/web/src/app/layout.tsx` - Remove force-dynamic
5. `apps/web/src/app/(dashboard)/layout.tsx` - Remove force-dynamic, add Suspense

### Medium Priority
6. `packages/ui/src/routing/Link.tsx` - Fix dynamic imports
7. `apps/web/src/lib/data/index.ts` - CREATE server-side fetchers
8. `apps/web/src/app/(dashboard)/*/page.tsx` - Server-side data passing

### Low Priority
9. `apps/web/src/app/api/*/route.ts` - Add cache headers
10. `apps/web/src/components/ThemeProvider.tsx` - Cookie-based theme

---

## Notes

- Phase 1 (loading states) provides immediate perceived improvement
- Phase 2-3 provide actual performance improvements
- Phase 5-6 require more significant refactoring but provide the biggest gains
- All changes are backwards compatible with the existing API

## Status

- [ ] Phase 1: Loading States
- [ ] Phase 2: Navigation Fix
- [ ] Phase 3: Remove force-dynamic
- [ ] Phase 4: Suspense Boundaries
- [ ] Phase 5: Data Fetching
- [ ] Phase 6: API Caching
- [ ] Phase 7: Theme Flash Fix
