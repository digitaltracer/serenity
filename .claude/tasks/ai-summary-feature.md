# AI Summary Feature Implementation Plan

## Overview
This plan covers two main objectives:
1. **Design Simplification**: Apply cleaner design principles from the mockup to reduce visual complexity
2. **Summary Page Feature**: Create a date-range based summary page that analyzes tasks and journals

## Design Analysis

### Current Design Issues (from mockup comparison)
The current Serenity UI has:
- Heavy use of gradients on cards, tabs, and buttons
- Multiple shadow layers with varying opacity
- Complex utility class combinations (7-10 classes per element)
- Inconsistent border radius usage
- Ring effects that add visual noise

### Target Design Principles (from mockup)
The mockup shows cleaner patterns:
- Simple border-based cards with minimal shadows
- Clean hover states without gradients
- Consistent border radius (`rounded-lg`)
- Backdrop blur effects instead of solid backgrounds
- Simple badge-based filters
- ScrollArea for content overflow
- Clean metadata display with icons

## Feature Requirements

### Summary Page Features
1. **Date Range Selection**
   - Custom date range picker
   - Quick presets (Last 7 days, Last 30 days, This month, Custom)
   - Display selected range clearly

2. **Data Analysis**
   - Fetch tasks from selected date range
   - Fetch journal entries from selected date range
   - Process and analyze using AI

3. **Tasks Summary**
   - Bullet points of completed tasks
   - Progress metrics
   - Categories/tags distribution
   - Priority breakdown
   - Completion trends

4. **Journal Summary**
   - Overall mood analysis (using existing mood tracking)
   - Key themes and topics
   - Main achievements highlighted
   - Emotional patterns
   - Tags from entries

5. **Display Features**
   - Filter by category (All, Tasks, Journal)
   - Save summaries for future reference
   - Export functionality
   - Word count and metadata
   - Scrollable content areas

## Technical Implementation Plan

### Phase 1: Design Simplification (3-4 hours)
**Priority Areas to Simplify:**

1. **ActionHub Page** (`apps/desktop/src/renderer/pages/ActionHubPage.tsx`)
   - Remove gradient backgrounds from task forms
   - Simplify card shadows
   - Use simple borders instead of ring effects
   - Clean up tab navigation styling

2. **Insights Hub Page** (`apps/desktop/src/renderer/pages/InsightsHubPage.tsx`)
   - Simplify KPI cards (remove gradients)
   - Clean up tab styling
   - Reduce shadow complexity

3. **UI Components** (`packages/ui/src/components/`)
   - Card: Simplify shadow and border
   - Button: Remove gradient variants
   - Badge: Use simple solid/outline variants
   - Create cleaner hover states

**Design Tokens to Update:**
```css
/* Simplified shadow system */
shadow-sm: subtle elevation
shadow-md: card elevation (default)
shadow-lg: hover/focus states only

/* Consistent borders */
border-radius: rounded-lg (8px) as standard
border: border-border/50 for subtle borders

/* Backdrop effects */
Use bg-background/95 with backdrop-blur for sticky elements
```

### Phase 2: Database Schema (30 mins)

**New Table: `summaries`**
```sql
CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary_type TEXT NOT NULL CHECK(summary_type IN ('tasks', 'journal', 'combined')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  word_count INTEGER,
  metadata TEXT, -- JSON: tags, mood_analysis, task_stats, etc.
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_summaries_type ON summaries(summary_type);
CREATE INDEX idx_summaries_date_range ON summaries(start_date, end_date);
CREATE INDEX idx_summaries_generated ON summaries(generated_at);
```

### Phase 3: Redux State Management (45 mins)

**New Slice: `summariesSlice.ts`**
```typescript
interface Summary {
  id: string;
  title: string;
  content: string;
  summaryType: 'tasks' | 'journal' | 'combined';
  startDate: string;
  endDate: string;
  generatedAt: string;
  wordCount: number;
  metadata: {
    tags?: string[];
    moodAnalysis?: {
      averageMood: number;
      dominantMood: string;
      moodTrend: 'improving' | 'stable' | 'declining';
    };
    taskStats?: {
      totalTasks: number;
      completedTasks: number;
      byPriority: Record<string, number>;
      byCategory: Record<string, number>;
    };
  };
}

interface SummariesState {
  summaries: Summary[];
  loading: boolean;
  error: string | null;
  filters: {
    category: 'all' | 'tasks' | 'journal' | 'combined';
    sortBy: 'recent' | 'oldest';
  };
}
```

### Phase 4: AI Summarization Service (2-3 hours)

**New Service: `aiSummarizationService.ts`**

Location: `packages/core/src/services/aiSummarizationService.ts`

**Features:**
- Integrate with existing AI services (AIPreprocessingService, PromptEngineeringService)
- Generate structured summaries with bullet points
- Analyze mood patterns from journals
- Extract key achievements and themes
- Calculate statistics and trends

**Prompt Structure:**
```typescript
const summaryPrompt = `
Analyze the following data from ${startDate} to ${endDate} and provide a comprehensive summary.

${tasksData ? `TASKS DATA:\n${tasksData}\n` : ''}
${journalData ? `JOURNAL DATA:\n${journalData}\n` : ''}

Generate a summary with:
1. Overview paragraph (2-3 sentences)
2. Key Achievements (bullet points)
3. ${journalData ? 'Mood Analysis (overall mood, patterns, trends)' : ''}
4. ${tasksData ? 'Task Statistics (completion rate, priorities, categories)' : ''}
5. Insights and Recommendations
6. Relevant tags and themes

Format as structured JSON for easy parsing.
`;
```

### Phase 5: IPC Handlers (1 hour)

**New Handler: `summaryHandlers.ts`**

Location: `apps/desktop/src/main/ipc/summaryHandlers.ts`

**Endpoints:**
```typescript
// Generate new summary
ipcMain.handle('summary:generate', async (event, params: {
  startDate: string;
  endDate: string;
  types: ('tasks' | 'journal')[];
}) => { ... });

// Get all summaries
ipcMain.handle('summary:getAll', async () => { ... });

// Get summary by ID
ipcMain.handle('summary:getById', async (event, id: string) => { ... });

// Delete summary
ipcMain.handle('summary:delete', async (event, id: string) => { ... });

// Export summary
ipcMain.handle('summary:export', async (event, id: string, format: 'pdf' | 'markdown' | 'json') => { ... });
```

### Phase 6: React Components (2-3 hours)

**New Page: `SummaryPage.tsx`**

Location: `apps/desktop/src/renderer/pages/SummaryPage.tsx`

**Components:**
1. Header with back button and theme toggle (like mockup)
2. Date range selector with presets
3. Generate summary button
4. Filter badges (All/Tasks/Journal)
5. Summary cards with:
   - Title
   - Category badge
   - Time range and metadata
   - Scrollable content
   - Action buttons (delete, export)
6. Empty state with sparkles icon

**Styling Approach:**
- Follow mockup's clean design
- Use shadcn/ui components (Card, Badge, ScrollArea)
- Simple borders and minimal shadows
- Backdrop blur for header
- Clean hover states

### Phase 7: Integration & Testing (1-2 hours)

1. Add route to router
2. Add navigation link in main app
3. Test summary generation with various date ranges
4. Test filtering and display
5. Verify AI analysis accuracy
6. Test export functionality
7. Ensure responsive design

## Implementation Order

1. ✅ Research and planning (current)
2. ⏳ Design simplification (Phase 1)
3. ⏳ Database schema (Phase 2)
4. ⏳ Redux slice (Phase 3)
5. ⏳ AI service (Phase 4)
6. ⏳ IPC handlers (Phase 5)
7. ⏳ React components (Phase 6)
8. ⏳ Integration & testing (Phase 7)

## Estimated Timeline
- **Design Simplification**: 3-4 hours
- **Summary Feature**: 6-8 hours
- **Total**: 9-12 hours of development

## Dependencies
- Existing AI services (AIPreprocessingService, PromptEngineeringService)
- Existing database adapters (SQLiteAdapter)
- Existing Redux store setup
- shadcn/ui components (already available)

## Success Criteria
1. UI is visually cleaner with reduced complexity
2. Summary page generates accurate analysis of tasks and journals
3. Date range selection works smoothly
4. AI summaries include bullet points, mood analysis, and tags
5. Summaries can be saved, filtered, and exported
6. Performance is acceptable (< 5s for summary generation)
7. UI matches the clean design principles from mockup

## Questions to Resolve ✅ ANSWERED
1. ✅ AI Provider: Use user's selected AI provider from settings
2. ✅ Regeneration: Manual trigger only, store in database
3. ✅ Export: Markdown only for now
4. ✅ Storage: Create new summaries table, no auto-deletion
5. ✅ Token Tracking: Store token usage in existing token usage table

## Additional Requirements
- Always use user's selected AI provider (from settings)
- Summary generation is manual (triggered by user)
- Store generated summaries in database for history
- Track token usage for each summary generation
- Export to Markdown format only (for now)
- No automatic deletion of old summaries

---

**Status**: 🚧 In Progress
**Current Phase**: Building AI Summarization Service

## Progress Tracking

### ✅ Completed (50% done)
1. ✅ Design Simplification
   - Removed all gradients from ActionHub, TodayPage, HomePage, SettingsPage, IntegrationsPage
   - Simplified tab navigation (removed complex gradient backgrounds)
   - Simplified form styling (removed shadow layers and ring effects)
   - Simplified button/card hover states
   - Updated to clean `bg-card/50 backdrop-blur-sm border border-border/50` pattern

2. ✅ Database Schema
   - Added `summaries` table with migration in SQLiteAdapter
   - Includes: id, title, content, summary_type, date range, metadata, token tracking
   - Indexes on type, date_range, generated_at for performance
   - Automatic migration on app startup

3. ✅ Redux State Management
   - Created `summariesSlice.ts` with full state management
   - Async thunks: generateSummary, fetchSummaries, deleteSummary, exportSummary
   - Selectors for filtered summaries with category and sort support
   - Integrated into root reducer in enhancedStore.ts
   - Exported from store/index.ts

### 🚧 In Progress (50% remaining)
4. ⏳ AI Summarization Service (NEXT)
5. ⏳ IPC Handlers
6. ⏳ SummaryPage Component
7. ⏳ Navigation & Routing
8. ⏳ Testing

**Estimated Time Remaining**: 4-6 hours
