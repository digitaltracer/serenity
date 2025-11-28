# AI Insights & Analytics Revamp - Detailed Implementation Plan

**Status**: Phase 1 ✅ COMPLETED | Phase 2 📝 Ready for Implementation
**Scope**: Phase 1 (Foundation) + Phase 2 (Rich Visualizations & Interactivity)
**Phase 1 Completion**: All 10 tasks completed successfully
**Estimated Effort**: Phase 2 ~2 weeks remaining

---

## Overview

This plan transforms the AI and Analytics experience in Serenity from fragmented pages into a unified, visually rich "Insights Hub" with integrated settings management and interactive visualizations.

### Key Decisions Made

- **Chart Library**: Migrate to Recharts (replacing custom chart implementations)
- **Settings Migration**: Move all AI configuration to Settings > AI
- **Data Storage**: Migrate insights/recaps from localStorage to SQLite database
- **MVP Scope**: Phase 1 (Foundation) + Phase 2 (Visualizations)

---

## Phase 1: Foundation (Week 1-2)

### Task 1.1: Database Schema & Migration

**Priority**: HIGH (Blocker for other tasks)
**Files**:
- `packages/database/src/schema/sqlite/insights.sql` (new)
- `packages/database/src/migrations/008_insights_and_recaps.ts` (new)
- `packages/database/src/queries/sqlite/insightsQueries.ts` (new)

**Description**:
Create SQLite database schema for storing AI insights, recaps, and user feedback.

**Implementation Details**:

1. **Create Schema File** (`insights.sql`):
```sql
-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('productivity', 'behavior', 'recommendation', 'warning')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  category TEXT NOT NULL CHECK(category IN ('tasks', 'journal', 'habits', 'goals')),
  source TEXT NOT NULL CHECK(source IN ('openai', 'gemini', 'anthropic', 'local')),
  actionable BOOLEAN DEFAULT 0,
  metadata TEXT, -- JSON string
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- User feedback fields
  user_rating INTEGER CHECK(user_rating >= 1 AND user_rating <= 5),
  dismissed BOOLEAN DEFAULT 0,
  marked_helpful BOOLEAN DEFAULT 0,
  user_notes TEXT,
  -- Visualization data
  visualization_data TEXT, -- JSON string for chart/graph data
  actionability_suggestions TEXT -- JSON array of suggested actions
);

-- AI Recaps Table
CREATE TABLE IF NOT EXISTS ai_recaps (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('weekly', 'monthly')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  highlights TEXT NOT NULL, -- JSON array
  challenges TEXT NOT NULL, -- JSON array
  recommendations TEXT NOT NULL, -- JSON array
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT, -- JSON string
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- User interaction
  viewed BOOLEAN DEFAULT 0,
  favorited BOOLEAN DEFAULT 0,
  exported BOOLEAN DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_category ON ai_insights(category);
CREATE INDEX IF NOT EXISTS idx_insights_type ON ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_dismissed ON ai_insights(dismissed);
CREATE INDEX IF NOT EXISTS idx_recaps_created_at ON ai_recaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recaps_type ON ai_recaps(type);
CREATE INDEX IF NOT EXISTS idx_recaps_period ON ai_recaps(period_start, period_end);
```

2. **Create Migration Script**:
   - Check for existing insights in Redux state/localStorage
   - Migrate existing data to new tables
   - Preserve all metadata and timestamps

3. **Create Query Functions** (`insightsQueries.ts`):
   - `insertInsight(insight: AIInsight)`
   - `getInsights(filters: { category?, type?, limit?, offset? })`
   - `updateInsightFeedback(id: string, feedback: UserFeedback)`
   - `dismissInsight(id: string)`
   - `deleteOldInsights(olderThan: Date)` // Cleanup old dismissed insights
   - `insertRecap(recap: AIRecap)`
   - `getRecaps(filters: { type?, limit?, offset? })`
   - `updateRecapInteraction(id: string, interaction: RecapInteraction)`

**Acceptance Criteria**:
- [ ] Schema created and tested
- [ ] Migration script successfully migrates existing localStorage data
- [ ] All CRUD operations working
- [ ] Indexes created for performance
- [ ] No data loss during migration

**Testing**:
- Unit tests for query functions
- Integration test for migration with sample data

---

### Task 1.2: Install & Configure Recharts

**Priority**: HIGH
**Files**:
- `packages/ui/package.json`
- `packages/ui/src/components/charts/` (new directory)

**Description**:
Install Recharts library and create base configuration for consistent theming across all charts.

**Implementation Details**:

1. **Install Recharts**:
```bash
cd packages/ui
npm install recharts
npm install --save-dev @types/recharts
```

2. **Create Base Chart Configuration** (`packages/ui/src/components/charts/chartConfig.ts`):
```typescript
import { DefaultLegendContentProps } from 'recharts';

export const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gradient: ['#3B82F6', '#8B5CF6', '#EC4899'],
};

export const chartTheme = {
  fontSize: 12,
  fontFamily: 'Inter, system-ui, sans-serif',
  axisColor: '#9CA3AF',
  gridColor: '#E5E7EB',
  tooltipBg: '#1F2937',
  tooltipColor: '#F9FAFB',
};

export const darkChartTheme = {
  fontSize: 12,
  fontFamily: 'Inter, system-ui, sans-serif',
  axisColor: '#6B7280',
  gridColor: '#374151',
  tooltipBg: '#F9FAFB',
  tooltipColor: '#1F2937',
};

// Custom tooltip wrapper component
// Custom legend wrapper component
// Responsive container defaults
```

3. **Create Chart Utils** (`chartUtils.ts`):
   - Date formatting helpers
   - Number formatting helpers
   - Data transformation utilities
   - Color palette generators

**Acceptance Criteria**:
- [ ] Recharts installed successfully
- [ ] Chart config supports light/dark themes
- [ ] Base utilities created and tested
- [ ] No build errors

---

### Task 1.3: Create Core Chart Components

**Priority**: HIGH
**Files**:
- `packages/ui/src/components/charts/TrendChart.tsx` (new)
- `packages/ui/src/components/charts/KPICard.tsx` (new)
- `packages/ui/src/components/charts/SparklineChart.tsx` (new)

**Description**:
Build reusable, themed chart components using Recharts.

**Implementation Details**:

1. **TrendChart Component**:
```typescript
interface TrendChartProps {
  data: Array<{
    timestamp: string;
    value: number;
    label?: string;
    metadata?: any;
  }>;
  type: 'line' | 'bar' | 'area';
  title?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  onDataPointClick?: (data: any) => void;
}

// Use Recharts LineChart, BarChart, or AreaChart
// Implement responsive behavior
// Custom tooltips with formatted data
// Click handlers for interactivity
// Loading and empty states
```

2. **KPICard Component**:
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  sparklineData?: number[];
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  onClick?: () => void;
}

// Card with large metric display
// Small sparkline chart at bottom (using Recharts)
// Change indicator with color coding
// Icon support
// Click handler for drill-down
```

3. **SparklineChart Component** (for KPI cards):
   - Minimal line chart without axes
   - Area fill with gradient
   - Configurable height (default 40px)

**Acceptance Criteria**:
- [ ] All three components created and styled
- [ ] Responsive on different screen sizes
- [ ] Supports light/dark themes
- [ ] Empty state handling
- [ ] Loading state handling
- [ ] Type-safe props with TypeScript
- [ ] Storybook examples (optional)

---

### Task 1.4: Create Enhanced InsightCard Component

**Priority**: HIGH
**Files**:
- `packages/ui/src/components/insights/InsightCard.tsx` (new)
- `packages/ui/src/components/insights/InsightCategoryBadge.tsx` (new)

**Description**:
Build the new InsightCard component with feedback actions and rich display.

**Implementation Details**:

```typescript
interface InsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  onMarkHelpful?: (id: string) => void;
  onSetAsGoal?: (insight: AIInsight) => void;
  onViewSource?: (insight: AIInsight) => void;
  onRate?: (id: string, rating: number) => void;
  compact?: boolean;
}

interface AIInsight {
  id: string;
  type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
  source: 'openai' | 'gemini' | 'anthropic' | 'local';
  category: 'tasks' | 'journal' | 'habits' | 'goals';
  actionable?: boolean;
  metadata?: {
    sourceIds?: string[]; // IDs of tasks/journal entries that generated this
    tags?: string[];
    priority?: 'high' | 'medium' | 'low';
  };
  visualizationData?: any; // Chart data if applicable
  actionabilitySuggestions?: Array<{
    action: string;
    description: string;
    type: 'task' | 'goal' | 'habit';
  }>;
  // User feedback
  userRating?: number;
  dismissed?: boolean;
  markedHelpful?: boolean;
  userNotes?: string;
}
```

**Component Features**:
- Card layout with hover effects
- Type icon with color coding (productivity=blue, warning=orange, etc.)
- Confidence score indicator (progress bar or badge)
- Category badge
- Mini-chart if visualizationData present
- Action menu (dropdown):
  - ⭐ Mark as Helpful
  - 🎯 Set as Goal (if actionable)
  - 🔗 View Source (navigate to related tasks/journal)
  - 📝 Add Note
  - ⭐ Rate (1-5 stars)
  - 🚫 Dismiss
- Timestamp (relative: "2 hours ago")
- AI provider badge (small, subtle)
- Expandable actionability suggestions section

**Acceptance Criteria**:
- [ ] Card renders all insight types correctly
- [ ] All action handlers work
- [ ] Responsive layout
- [ ] Animations smooth
- [ ] Accessible (keyboard navigation)
- [ ] Shows mini-chart if data present

---

### Task 1.5: Create Insights Hub Page (InsightsHubPage)

**Priority**: HIGH
**Files**:
- `apps/desktop/src/renderer/pages/InsightsHubPage.tsx` (new)
- `apps/desktop/src/renderer/pages/InsightsHub/` (new directory for sub-components)

**Description**:
Create the new top-level Insights Hub page that replaces AnalyticsPage.

**Implementation Details**:

**Page Structure**:
```
┌─────────────────────────────────────────┐
│ Header: "Insights Hub"                  │
│ Subtitle + Last Updated                 │
├─────────────────────────────────────────┤
│ KPI Row (4-6 cards)                     │
│ [Tasks] [Mood] [Productivity] [Streak]  │
├─────────────────────────────────────────┤
│ Main Visualization Area                 │
│ [Large TrendChart with tabs/filters]    │
├─────────────────────────────────────────┤
│ Categorized Insights (3-4 columns)      │
│ ┌─────────┐ ┌──────────┐ ┌──────────┐  │
│ │Productivity│Well-being│  Habits   │  │
│ │ [Cards]  │  [Cards]  │  [Cards]   │  │
│ └─────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────┘
```

**Sub-components to create**:
1. `InsightsHubHeader.tsx` - Header with title, refresh button, filter options
2. `KPIRow.tsx` - Row of KPI cards (reuses KPICard component)
3. `MainVisualization.tsx` - Large chart area with tab switcher for different views
4. `CategorizedInsights.tsx` - Grid layout of insight cards by category
5. `EmptyState.tsx` - Welcome message and CTAs for new users

**State Management**:
- Connect to Redux for insights data
- Local state for filters (category, date range, type)
- Loading states while fetching
- Error states

**KPI Metrics to Display**:
1. **Weekly Tasks Completed**: Count with sparkline, % change from previous week
2. **Average Mood**: From journal entries, trend indicator
3. **Productivity Score**: Calculated from task completion rate + consistency
4. **Active Streak**: Consecutive days with activity

**Main Visualization Tabs**:
1. **Overview**: Tasks completed vs. Mood over time (dual-axis)
2. **Productivity**: Task completion trends, burndown
3. **Well-being**: Mood trends from journal
4. **Habits**: Recurring task completion patterns

**Filters**:
- Time range: Last 7 days, 30 days, 90 days, All time
- Category filter for insights
- Show/hide dismissed insights

**Acceptance Criteria**:
- [ ] Page renders with all sections
- [ ] KPIs calculate correctly from real data
- [ ] Main visualization tabs work
- [ ] Insights display in categorized columns
- [ ] Filters update display correctly
- [ ] Empty state shows for new users
- [ ] Loading states work
- [ ] Responsive layout

---

### Task 1.6: Settings > AI Configuration Page

**Priority**: HIGH
**Files**:
- `apps/desktop/src/renderer/pages/SettingsPage.tsx` (modify)
- `apps/desktop/src/renderer/pages/Settings/AISettingsPanel.tsx` (new)

**Description**:
Create a new AI settings panel within SettingsPage and migrate all AI configuration from AIAssistantPage.

**Implementation Details**:

1. **Update SettingsPage.tsx**:
   - Add a new tab/section for "AI Assistant"
   - Import and render AISettingsPanel component

2. **Create AISettingsPanel.tsx**:

**Panel Sections**:
```
┌─────────────────────────────────────────┐
│ AI Provider Configuration               │
│ - Provider selection (OpenAI/Gemini/...) │
│ - API key input (masked)                │
│ - Test connection button                │
│ - Model selection dropdown              │
├─────────────────────────────────────────┤
│ Analysis Configuration                  │
│ - Auto-analyze toggle                   │
│ - Analysis frequency (daily/weekly/...)  │
│ - Data types (tasks/journal/projects)   │
│ - Include/exclude specific data         │
├─────────────────────────────────────────┤
│ Privacy & Data Usage                    │
│ - Data sent to AI providers (info)      │
│ - Token usage display                   │
│ - Opt-out options                       │
│ - Clear all AI data button              │
├─────────────────────────────────────────┤
│ Recap Settings                          │
│ - Auto-generate recaps toggle           │
│ - Recap schedule (weekly/monthly)       │
│ - Recap format preferences              │
└─────────────────────────────────────────┘
```

**Migrate from AIAssistantPage**:
- Copy the entire "Setup" tab logic
- Copy auto-analyze configuration
- Copy data type selection
- Update Redux action calls (if needed)
- Ensure API key encryption still works

**New Features**:
- Link to Insights Hub: "View Insights →"
- Quick stats: "Last analysis: 2 hours ago"
- Token usage summary card

**Acceptance Criteria**:
- [ ] All AI settings accessible in Settings page
- [ ] API key management works (encrypted storage)
- [ ] Test connection works for all providers
- [ ] Auto-analyze configuration persists
- [ ] No functionality lost from migration
- [ ] Clear, organized UI
- [ ] Help text for each setting

---

### Task 1.7: Update Navigation & Routing

**Priority**: MEDIUM
**Files**:
- `apps/desktop/src/renderer/App.tsx` (modify routes)
- `apps/desktop/src/renderer/components/Sidebar.tsx` (modify)
- `apps/desktop/src/renderer/components/NavigationMenu.tsx` (if exists)

**Description**:
Update app navigation to replace Analytics with Insights Hub and remove AI Assistant from main nav.

**Implementation Details**:

1. **Update App.tsx Routes**:
```typescript
// Replace
<Route path="/analytics" element={<AnalyticsPage />} />
<Route path="/ai-assistant" element={<AIAssistantPage />} />

// With
<Route path="/insights" element={<InsightsHubPage />} />
// Keep old route for backward compatibility, redirect
<Route path="/analytics" element={<Navigate to="/insights" replace />} />
<Route path="/ai-assistant" element={<Navigate to="/settings" replace />} />
```

2. **Update Sidebar/Navigation**:
   - Replace "Analytics" menu item with "Insights" (or "Insights Hub")
   - Icon: Brain or Sparkles icon
   - Remove "AI Assistant" from main navigation
   - Update active route highlighting

3. **Add Breadcrumb** (optional):
   - Show breadcrumb at top: "Insights Hub > Productivity"
   - Navigate between categories

**Acceptance Criteria**:
- [ ] "Insights Hub" appears in navigation
- [ ] Clicking navigates to `/insights`
- [ ] "Analytics" removed from navigation
- [ ] "AI Assistant" removed from main navigation
- [ ] Old routes redirect properly
- [ ] Active state highlights correctly
- [ ] Icon looks good

---

### Task 1.8: Backend Services - Visualization Service

**Priority**: MEDIUM
**Files**:
- `packages/core/src/services/visualizationService.ts` (new)

**Description**:
Create a service to transform Redux state data into chart-ready data structures.

**Implementation Details**:

```typescript
export class VisualizationService {
  /**
   * Generate KPI metrics from tasks and journal entries
   */
  static generateKPIMetrics(data: {
    tasks: Task[];
    journalEntries: JournalEntry[];
    timeRange: { start: Date; end: Date };
  }): {
    weeklyTasksCompleted: { value: number; change: number; sparkline: number[] };
    averageMood: { value: number; change: number; sparkline: number[] };
    productivityScore: { value: number; change: number; sparkline: number[] };
    activeStreak: { value: number; change: number };
  };

  /**
   * Generate time-series data for trend charts
   */
  static generateTrendData(
    tasks: Task[],
    journalEntries: JournalEntry[],
    metric: 'completion' | 'mood' | 'productivity' | 'velocity',
    granularity: 'day' | 'week' | 'month',
    timeRange: { start: Date; end: Date }
  ): Array<{ timestamp: string; value: number; label: string }>;

  /**
   * Calculate productivity score (0-100)
   */
  static calculateProductivityScore(
    tasks: Task[],
    timeRange: { start: Date; end: Date }
  ): number;

  /**
   * Extract mood trend from journal entries
   */
  static extractMoodTrend(
    journalEntries: JournalEntry[],
    timeRange: { start: Date; end: Date }
  ): Array<{ date: string; mood: number }>;

  /**
   * Calculate active streak (consecutive days with activity)
   */
  static calculateActiveStreak(
    tasks: Task[],
    journalEntries: JournalEntry[]
  ): number;

  /**
   * Generate dual-axis chart data (e.g., tasks vs mood)
   */
  static generateDualAxisData(/* ... */);
}
```

**Acceptance Criteria**:
- [ ] All methods implemented and tested
- [ ] Handles edge cases (no data, invalid dates)
- [ ] Efficient for large datasets
- [ ] Returns properly formatted data for Recharts
- [ ] Unit tests with >80% coverage

---

### Task 1.9: IPC Handlers for Insights Hub

**Priority**: MEDIUM
**Files**:
- `apps/desktop/src/main/ipc/insightsHandlers.ts` (new)
- `apps/desktop/src/main/ipc/index.ts` (modify - register handlers)
- `packages/core/src/types/ipc.ts` (modify - add types)

**Description**:
Create new IPC handlers for fetching insights data and updating feedback.

**Implementation Details**:

**New IPC Channels**:
1. `insights:getDashboardData` - Get all data for Insights Hub
2. `insights:getInsights` - Get filtered insights
3. `insights:updateFeedback` - Update insight feedback (dismiss, rate, helpful)
4. `insights:getRecaps` - Get recaps with filters
5. `insights:getKPIMetrics` - Get calculated KPI metrics
6. `insights:getVisualizationData` - Get chart data for specific visualization

**Handler Implementation**:
```typescript
// insightsHandlers.ts
import { ipcMain } from 'electron';
import { DatabaseManager } from '@serenity/database';
import { VisualizationService } from '@serenity/core';

export function registerInsightsHandlers(dbManager: DatabaseManager) {
  ipcMain.handle('insights:getDashboardData', async (event, params: {
    timeRange: { start: string; end: string };
    includeKPIs: boolean;
    includeInsights: boolean;
    includeRecaps: boolean;
  }) => {
    try {
      // Fetch tasks and journal entries
      const tasks = await dbManager.getTasks(/* ... */);
      const journalEntries = await dbManager.getJournalEntries(/* ... */);

      // Generate KPIs
      const kpis = params.includeKPIs
        ? VisualizationService.generateKPIMetrics({ tasks, journalEntries, timeRange })
        : null;

      // Fetch insights
      const insights = params.includeInsights
        ? await dbManager.getInsights({ limit: 50 })
        : null;

      // Fetch recaps
      const recaps = params.includeRecaps
        ? await dbManager.getRecaps({ limit: 10 })
        : null;

      return { success: true, data: { kpis, insights, recaps } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ... other handlers
}
```

**Update preload.ts**:
```typescript
// Expose new APIs to renderer
insights: {
  getDashboardData: (params) => ipcRenderer.invoke('insights:getDashboardData', params),
  getInsights: (filters) => ipcRenderer.invoke('insights:getInsights', filters),
  updateFeedback: (id, feedback) => ipcRenderer.invoke('insights:updateFeedback', id, feedback),
  // ... other methods
}
```

**Acceptance Criteria**:
- [ ] All handlers registered
- [ ] Handlers return proper data structures
- [ ] Error handling implemented
- [ ] Security validation (no arbitrary queries)
- [ ] Preload script exposes APIs
- [ ] Type definitions updated

---

### Task 1.10: Redux Slice Updates

**Priority**: MEDIUM
**Files**:
- `packages/core/src/store/slices/aiAssistantSlice.ts` (modify)
- `packages/core/src/store/slices/insightsSlice.ts` (new - optional)

**Description**:
Update Redux slice to work with SQLite persistence and new data structures.

**Implementation Details**:

**Option A**: Update existing `aiAssistantSlice.ts`:
- Add new async thunks for database operations
- Update state shape to match new insight structure
- Add feedback actions (rate, dismiss, markHelpful)
- Remove localStorage logic (now in SQLite)

**Option B**: Create new `insightsSlice.ts` (recommended):
- Cleaner separation of concerns
- Keep aiAssistantSlice for provider/settings management
- New slice for insights/recaps data and interactions
- Easier to test and maintain

**New Async Thunks**:
```typescript
export const fetchDashboardData = createAsyncThunk(
  'insights/fetchDashboardData',
  async (params: { timeRange: TimeRange }) => {
    const result = await window.electronAPI.insights.getDashboardData(params);
    if (result.success) return result.data;
    throw new Error(result.error);
  }
);

export const dismissInsight = createAsyncThunk(
  'insights/dismiss',
  async (insightId: string) => {
    const result = await window.electronAPI.insights.updateFeedback(insightId, { dismissed: true });
    if (result.success) return insightId;
    throw new Error(result.error);
  }
);

export const rateInsight = createAsyncThunk(
  'insights/rate',
  async ({ id, rating }: { id: string; rating: number }) => {
    const result = await window.electronAPI.insights.updateFeedback(id, { userRating: rating });
    if (result.success) return { id, rating };
    throw new Error(result.error);
  }
);

// ... markHelpful, addNote, etc.
```

**State Shape**:
```typescript
interface InsightsState {
  // Dashboard data
  kpis: KPIMetrics | null;
  insights: AIInsight[];
  recaps: AIRecap[];
  visualizations: Record<string, ChartData>;

  // UI state
  filters: {
    timeRange: TimeRange;
    category: string | null;
    type: string | null;
    showDismissed: boolean;
  };
  loading: boolean;
  error: string | null;
  lastFetch: string | null;
}
```

**Acceptance Criteria**:
- [ ] Redux slice updated/created
- [ ] All async thunks work with IPC
- [ ] No localStorage dependencies
- [ ] State shape matches new requirements
- [ ] Selectors created for components
- [ ] No breaking changes for existing components (or migration plan)

---

## Phase 2: Rich Visualizations & Interactivity (Week 3-4)

### Task 2.1: Actionability Service

**Priority**: HIGH
**Files**:
- `packages/core/src/services/actionabilityService.ts` (new)

**Description**:
Service to generate concrete, actionable suggestions from insights.

**Implementation Details**:

```typescript
export interface ActionabilitySuggestion {
  id: string;
  action: string; // "Create a task", "Set a goal", "Block time"
  description: string;
  type: 'task' | 'goal' | 'habit' | 'journal_prompt';
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    suggestedTitle?: string;
    suggestedDescription?: string;
    suggestedTags?: string[];
    suggestedDueDate?: string;
  };
}

export class ActionabilityService {
  /**
   * Analyze an insight and generate actionable suggestions
   */
  static generateSuggestions(
    insight: AIInsight,
    userContext: {
      tasks: Task[];
      goals: Goal[];
      habits: any[];
    }
  ): ActionabilitySuggestion[];

  /**
   * Check if an insight is actionable based on type and content
   */
  static isActionable(insight: AIInsight): boolean;

  /**
   * Convert a suggestion into a concrete action (e.g., create task)
   */
  static executeSuggestion(
    suggestion: ActionabilitySuggestion,
    dispatch: AppDispatch
  ): Promise<{ success: boolean; actionId?: string }>;
}
```

**Example Logic**:
- Insight: "You complete more tasks in the morning"
  → Suggestion: "Block 2 hours each morning for focused work" (type: 'habit')

- Insight: "You haven't journaled in 5 days"
  → Suggestion: "Write a journal entry today" (type: 'task')

- Insight: "3 tasks are overdue in Project X"
  → Suggestion: "Review and reschedule overdue tasks in Project X" (type: 'task')

**Acceptance Criteria**:
- [ ] Service generates relevant suggestions
- [ ] Suggestions are context-aware
- [ ] Can execute suggestions (create tasks/goals)
- [ ] Unit tests for different insight types
- [ ] No duplicate suggestions

---

### Task 2.2: Feedback Service

**Priority**: HIGH
**Files**:
- `packages/core/src/services/feedbackService.ts` (new)
- `packages/core/src/services/userProfileService.ts` (modify)

**Description**:
Service to handle user feedback on insights and update user preferences.

**Implementation Details**:

```typescript
export class FeedbackService {
  /**
   * Process user feedback on an insight
   */
  static async processFeedback(
    insightId: string,
    feedback: {
      rating?: number;
      helpful?: boolean;
      dismissed?: boolean;
      note?: string;
    }
  ): Promise<void> {
    // 1. Update insight in database
    // 2. Update UserProfileService preferences
    // 3. Dispatch Redux action
    // 4. Log for analytics
  }

  /**
   * Learn from feedback to improve future insights
   */
  static updateUserPreferences(
    userId: string, // or use current user
    insight: AIInsight,
    feedback: UserFeedback
  ): void {
    // If user dismissed productivity insights multiple times,
    // reduce their priority in future analysis
    // If user marked habit insights as helpful,
    // generate more habit-related insights
  }

  /**
   * Get feedback statistics for monitoring
   */
  static getFeedbackStats(): {
    totalInsights: number;
    helpfulCount: number;
    dismissedCount: number;
    avgRating: number;
    preferredCategories: string[];
  };
}
```

**Integration with UserProfileService**:
```typescript
// In userProfileService.ts
interface InsightPreferences {
  preferredCategories: string[]; // ['productivity', 'habits']
  dismissedTypes: string[]; // Types user frequently dismisses
  helpfulTypes: string[]; // Types user finds helpful
  avgRatingByType: Record<string, number>;
}

// Add method to update preferences based on feedback
```

**Acceptance Criteria**:
- [ ] Feedback persisted to database
- [ ] User preferences updated
- [ ] Redux state updated
- [ ] No blocking operations (async)
- [ ] Statistics calculated correctly

---

### Task 2.3: Enhanced Insight Card with Actions

**Priority**: HIGH
**Files**:
- `packages/ui/src/components/insights/InsightCard.tsx` (modify from Task 1.4)
- `packages/ui/src/components/insights/InsightActionsMenu.tsx` (new)
- `packages/ui/src/components/insights/ActionabilitySuggestions.tsx` (new)

**Description**:
Enhance InsightCard with interactive feedback and actionability UI.

**Implementation Details**:

1. **Add Actions Menu** (`InsightActionsMenu.tsx`):
   - Dropdown/popover menu
   - Actions: Rate, Helpful, Dismiss, Add Note, Set as Goal, View Source
   - Icons for each action
   - Confirmation for destructive actions (dismiss)

2. **Add Actionability Section** (`ActionabilitySuggestions.tsx`):
```typescript
interface ActionabilitySuggestionsProps {
  suggestions: ActionabilitySuggestion[];
  onExecute: (suggestion: ActionabilitySuggestion) => void;
  loading?: boolean;
}

// Display as expandable section in InsightCard
// Each suggestion as a button with icon
// "Create Task", "Set Goal", etc.
// Show loading state when executing
// Success feedback after execution
```

3. **Update InsightCard**:
   - Add actions menu in top-right corner
   - Show actionability suggestions at bottom (collapsible)
   - Add rating stars (1-5) that appear on click
   - Visual feedback for dismissed/helpful state
   - Mini-chart display if visualizationData present

**User Flows**:
1. User clicks "Mark as Helpful" → Card gets green checkmark, feedback saved
2. User clicks "Set as Goal" → Modal opens to create goal from suggestion
3. User rates 5 stars → Stars filled, rating saved, thank you message
4. User dismisses → Card fades out, insight hidden

**Acceptance Criteria**:
- [ ] All actions work correctly
- [ ] UI feedback immediate
- [ ] Redux state updates
- [ ] Database persists feedback
- [ ] Animations smooth
- [ ] Accessible (keyboard)

---

### Task 2.4: Categorized Insights Display

**Priority**: MEDIUM
**Files**:
- `apps/desktop/src/renderer/pages/InsightsHub/CategorizedInsights.tsx` (modify)
- `packages/ui/src/components/insights/InsightCategoryHeader.tsx` (new)

**Description**:
Organize insights into visual categories with filtering and sorting.

**Implementation Details**:

**Layout**: 3-4 column grid
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Productivity │  │  Well-being  │  │    Habits    │
│ (🎯 icon)    │  │  (💚 icon)   │  │  (🔁 icon)   │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ [Insight 1]  │  │ [Insight 1]  │  │ [Insight 1]  │
│ [Insight 2]  │  │ [Insight 2]  │  │ [Insight 2]  │
│ [Insight 3]  │  │ [Insight 3]  │  │ [Insight 3]  │
│ ...          │  │ ...          │  │ ...          │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Category Mapping**:
```typescript
const categoryConfig = {
  productivity: {
    title: 'Productivity',
    icon: Target,
    color: 'blue',
    description: 'Task completion, velocity, focus patterns',
  },
  wellbeing: {
    title: 'Well-being',
    icon: Heart,
    color: 'green',
    description: 'Mood, balance, stress indicators',
  },
  habits: {
    title: 'Habits',
    icon: RefreshCw,
    color: 'purple',
    description: 'Recurring patterns, consistency',
  },
  goals: {
    title: 'Goals',
    icon: Flag,
    color: 'orange',
    description: 'Progress, milestones, achievements',
  },
};
```

**Category Header** (`InsightCategoryHeader.tsx`):
- Icon + Title
- Count badge (e.g., "5 insights")
- Expand/collapse toggle
- Sort options (newest, highest rated, most helpful)

**Filtering**:
- Filter insights by category (local filtering, already fetched)
- Filter by type (productivity/behavior/recommendation/warning)
- Toggle dismissed insights visibility

**Empty States**:
- When category has no insights: "No productivity insights yet. Complete some tasks to generate insights."

**Acceptance Criteria**:
- [ ] Insights grouped by category correctly
- [ ] Responsive column layout (mobile: 1 col, tablet: 2 cols, desktop: 3-4 cols)
- [ ] Category headers interactive
- [ ] Sorting works per category
- [ ] Empty states helpful
- [ ] Smooth expand/collapse animations

---

### Task 2.5: Main Visualization with Tabs

**Priority**: MEDIUM
**Files**:
- `apps/desktop/src/renderer/pages/InsightsHub/MainVisualization.tsx` (modify)
- `packages/ui/src/components/insights/VisualizationTabs.tsx` (new)

**Description**:
Create the large interactive chart area with multiple visualization views.

**Implementation Details**:

**Tab Structure**:
```typescript
const visualizationTabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'Tasks completed and mood trends',
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: TrendingUp,
    description: 'Task velocity and completion patterns',
  },
  {
    id: 'wellbeing',
    label: 'Well-being',
    icon: Heart,
    description: 'Mood trends from journal entries',
  },
  {
    id: 'habits',
    label: 'Habits',
    icon: Calendar,
    description: 'Recurring task completion heatmap',
  },
];
```

**Overview Tab**:
- Dual-axis line chart: Tasks completed (bars) + Average mood (line)
- Time range: Last 30 days by default
- Interactive tooltips showing both metrics
- Zoom controls

**Productivity Tab**:
- Line chart: Tasks completed per day/week
- Burndown chart option
- Velocity trend line
- Highlight peak productivity times

**Well-being Tab**:
- Area chart: Mood over time
- Color gradient based on mood value (red=low, green=high)
- Journal entry markers (dots on timeline)
- Click to view journal entry

**Habits Tab**:
- Heatmap calendar (like GitHub contributions)
- Shows recurring task completion
- Color intensity = completion rate
- Click day to see details

**Controls**:
- Time range selector (7 days, 30 days, 90 days, custom)
- Chart type toggle (line/bar/area) where applicable
- Export chart as image button
- Fullscreen mode

**Acceptance Criteria**:
- [ ] All 4 tabs implemented
- [ ] Charts render correct data
- [ ] Smooth tab transitions
- [ ] Interactive tooltips work
- [ ] Time range filter updates all charts
- [ ] Export functionality works
- [ ] Responsive on different screen sizes
- [ ] Loading states while fetching data

---

### Task 2.6: Insight Quality Scoring Integration

**Priority**: LOW (existing service, just integration)
**Files**:
- `apps/desktop/src/main/services/aiAssistantService.ts` (modify)
- `packages/core/src/services/insightQualityService.ts` (already exists)

**Description**:
Integrate InsightQualityService into the analysis flow to filter low-quality insights.

**Implementation Details**:

1. **In AI Analysis Flow**:
```typescript
// After generating insights from AI
const rawInsights = parseAIResponse(response);

// Score and filter
const scoredInsights = await InsightQualityService.scoreInsights(rawInsights, {
  existingInsights: currentInsights,
  userProfile: userProfileData,
  contextData: { tasks, journalEntries },
});

// Only keep insights with quality score > 0.4
const qualityInsights = scoredInsights.filter(i => i.qualityScore > 0.4);

// Deduplicate
const uniqueInsights = InsightQualityService.deduplicateInsights(qualityInsights);

// Rank by quality
const rankedInsights = InsightQualityService.rankInsights(uniqueInsights);

// Return top N
return rankedInsights.slice(0, maxInsights);
```

2. **Display Quality Score**:
   - Show in InsightCard as subtle indicator
   - Tooltip: "Relevance: 95%, Actionability: 80%"
   - Use for default sorting

3. **Quality Reporting**:
   - Log quality statistics for monitoring
   - Track improvement over time
   - Use feedback to adjust quality thresholds

**Acceptance Criteria**:
- [ ] Quality scoring runs during analysis
- [ ] Low-quality insights filtered out
- [ ] Deduplication prevents similar insights
- [ ] Quality score visible in UI (optional)
- [ ] No performance impact on analysis

---

### Task 2.7: Time Range Filtering

**Priority**: MEDIUM
**Files**:
- `apps/desktop/src/renderer/pages/InsightsHub/TimeRangeFilter.tsx` (new)
- `apps/desktop/src/renderer/pages/InsightsHubPage.tsx` (modify)

**Description**:
Add time range filtering for insights and visualizations.

**Implementation Details**:

**TimeRangeFilter Component**:
```typescript
interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  presets?: Array<{ label: string; days: number }>;
}

type TimeRange = {
  start: Date;
  end: Date;
  label: string;
};

// Presets
const defaultPresets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: -1 }, // Special case
  { label: 'All time', days: -2 }, // Special case
  { label: 'Custom', days: 0 }, // Opens date picker
];
```

**UI Design**:
- Button group / segmented control for presets
- Custom date picker for "Custom" option
- Show current selection: "Last 30 days (Feb 1 - Mar 1)"
- Position in header area

**Integration**:
1. When changed, update Redux filter state
2. Re-fetch insights with new time range
3. Update all charts/KPIs with new data
4. Show loading indicator during fetch

**Persistence**:
- Save selected time range to localStorage
- Restore on page load

**Acceptance Criteria**:
- [ ] Preset buttons work
- [ ] Custom date picker works
- [ ] Redux state updates
- [ ] Data refetches with new range
- [ ] All visualizations update
- [ ] Selection persisted across sessions
- [ ] Validates date ranges (end > start)

---

### Task 2.8: Empty States & Onboarding

**Priority**: MEDIUM
**Files**:
- `apps/desktop/src/renderer/pages/InsightsHub/EmptyState.tsx` (new)
- `apps/desktop/src/renderer/pages/InsightsHub/OnboardingTour.tsx` (new, optional)

**Description**:
Create helpful empty states for new users and optional onboarding tour.

**Implementation Details**:

**Empty State Scenarios**:
1. **No AI Provider Configured**:
   - Illustration/icon
   - Message: "Get started with AI-powered insights"
   - CTA: "Configure AI Provider" → links to Settings > AI
   - Show sample insight preview

2. **No Data Yet**:
   - Message: "Complete some tasks and write journal entries to unlock insights"
   - Progress checklist:
     - ✓ Create 3+ tasks
     - ✓ Complete 2+ tasks
     - ✓ Write 2+ journal entries
     - ⏱ Run your first analysis
   - CTA: "Get Started" → links to ActionHub

3. **No Insights Generated**:
   - Message: "Run your first analysis to generate insights"
   - CTA: "Analyze My Data" → triggers analysis
   - Show what insights look like (sample/demo)

4. **All Insights Dismissed**:
   - Message: "You're all caught up!"
   - Option to view dismissed insights
   - Next analysis: "in 23 hours" (if auto-analyze enabled)

**Sample Insights** (for empty state demo):
```typescript
const sampleInsights = [
  {
    type: 'productivity',
    title: 'Peak productivity at 10 AM',
    description: 'You complete 40% more tasks in the morning. Consider scheduling important work before noon.',
    category: 'productivity',
    actionable: true,
    confidence: 0.85,
  },
  // ... 2-3 more samples
];
```

**Onboarding Tour** (optional, Phase 2.5):
- Highlight key features on first visit
- Step 1: "This is your Insights Hub"
- Step 2: "KPIs show your progress at a glance"
- Step 3: "Charts visualize your productivity patterns"
- Step 4: "AI-generated insights appear here"
- Step 5: "Configure your AI provider in Settings"
- Use library like react-joyride or custom tooltips
- Skip button always visible
- Track completion in localStorage

**Acceptance Criteria**:
- [ ] All empty states implemented
- [ ] CTAs navigate correctly
- [ ] Sample insights look good
- [ ] Helpful and encouraging messaging
- [ ] Responsive design
- [ ] (Optional) Tour works on first visit

---

### Task 2.9: Migration & Cleanup

**Priority**: HIGH (at end of Phase 2)
**Files**:
- Multiple files to deprecate/remove

**Description**:
Safely deprecate old pages and migrate user data.

**Implementation Details**:

**Step 1: Data Migration Script**:
```typescript
// apps/desktop/src/main/migrations/migrateInsightsToSQLite.ts
export async function migrateInsightsToSQLite(dbManager: DatabaseManager): Promise<void> {
  // 1. Check if migration already done (flag in settings)
  const migrated = await checkMigrationFlag('insights_migration_v1');
  if (migrated) return;

  // 2. Load insights from localStorage
  const localInsights = loadFromLocalStorage('serenity_ai_insights');
  const localRecaps = loadFromLocalStorage('serenity_ai_recaps');

  // 3. Insert into SQLite
  if (localInsights?.length) {
    for (const insight of localInsights) {
      await dbManager.insertInsight(insight);
    }
  }

  if (localRecaps?.length) {
    for (const recap of localRecaps) {
      await dbManager.insertRecap(recap);
    }
  }

  // 4. Set migration flag
  await setMigrationFlag('insights_migration_v1', true);

  // 5. Clean up localStorage (after confirmation)
  // Keep for 1-2 releases as backup
}
```

**Step 2: Run Migration**:
- Add to main process initialization
- Run once on app start
- Show progress notification (optional)
- Log results

**Step 3: Deprecate AIAssistantPage**:
- Remove from navigation (already done in Task 1.7)
- Keep file temporarily with deprecation notice
- Redirect to Settings for 2 releases
- Then delete file

**Step 4: Deprecate AnalyticsPage**:
- Remove from navigation (already done in Task 1.7)
- Keep file temporarily with redirect
- Delete after 1-2 releases

**Step 5: Remove Custom Chart Components** (if fully replaced by Recharts):
- `InteractiveChart.tsx` - delete if not used elsewhere
- `SafeInteractiveChart` in AdvancedAnalytics - refactor to use Recharts
- `BurndownChart.tsx`, `VelocityChart.tsx` - refactor or delete

**Step 6: Update Imports**:
- Find all imports of deprecated components
- Update to use new components
- Test thoroughly

**Rollback Plan**:
- Keep old files for 2 releases
- Feature flag to toggle old/new pages
- Can revert if critical issues found

**Acceptance Criteria**:
- [ ] Migration script works without data loss
- [ ] All user data preserved
- [ ] Old pages removed from navigation
- [ ] Old files deprecated with comments
- [ ] No broken imports
- [ ] Rollback plan documented
- [ ] Release notes updated

---


## Post-Phase 2: Future Enhancements (Phase 3 & 4)

These are not part of the current MVP but documented for future reference:

### Phase 3: Proactive & In-Context Analysis
- Background analysis scheduler
- In-context "Analyze" buttons in ActionHub and Journal
- Notification system for new insights
- Resource management and rate limiting

### Phase 4: Conversational AI
- Natural language query interface
- Chat-based interaction with data
- Conversational insight generation
- Query history and saved queries

---

## Implementation Checklist

Use this as a high-level tracker:

### Phase 1: Foundation ✅ **COMPLETED**
- [✅] **1.1 Database Schema & Migration** - COMPLETED
  - Enhanced ai_insights and ai_recaps tables with feedback fields (user_rating, dismissed, marked_helpful, user_notes)
  - Added migration script in SQLiteAdapter.migrateAIInsightsEnhancements()
  - Created 8 new query methods in packages/database/src/queries/sqlite/ai.ts
  - Safe column addition with existence checks via PRAGMA table_info

- [✅] **1.2 Install & Configure Recharts** - COMPLETED
  - Installed recharts v2.x in @serenity/ui (28 packages added)
  - Created chartConfig.ts with light/dark theme support
  - Created chartUtils.ts with 10+ utility functions (formatChartDate, formatChartNumber, fillTimeSeriesGaps, etc.)
  - Centralized color palette and responsive defaults

- [✅] **1.3 Create Core Chart Components** - COMPLETED
  - **TrendChart**: Supports line/bar/area types, tooltips, loading states, empty states, dark mode
  - **KPICard**: Displays metrics with sparklines, change indicators (up/down/neutral), 5 color themes
  - **SparklineChart**: Minimal 40px height chart for compact displays
  - All components fully typed with TypeScript

- [✅] **1.4 Create Enhanced InsightCard Component** - COMPLETED
  - Interactive card with complete feedback system
  - Actions: Rate (1-5 stars), Dismiss, Mark Helpful, Add Note
  - Confidence indicator, category badge, actionability suggestions
  - Mini sparkline integration for visualization data
  - Type-based color coding and icons

- [✅] **1.5 Create Insights Hub Page (InsightsHubPage)** - COMPLETED
  - Complete new page replacing AnalyticsPage
  - KPI row with 4 cards (Tasks Completed, Average Mood, Productivity Score, Active Streak)
  - Tab navigation (Overview, Trends, Insights, Recaps) using custom tab implementation
  - Category filtering (All, Tasks, Journal, Habits, Goals)
  - Time range selector (7D, 30D, 90D, 1Y) with Redux integration
  - RecapCard component with expand/collapse
  - Empty states for new users
  - Refresh functionality

- [✅] **1.6 Settings > AI Configuration Panel** - COMPLETED
  - New AI Configuration section in SettingsPage.tsx
  - Active provider selection (OpenAI, Gemini, Anthropic) with visual indicators
  - Auto-analyze toggle
  - Analysis frequency selector (daily/weekly/manual)
  - Data sources display (tasks, journal, projects)
  - Privacy notice with security information
  - All settings connected to Redux

- [✅] **1.7 Update Navigation & Routing** - COMPLETED
  - Added /insights route with InsightsHubPage
  - Backward compatibility redirect from /analytics to /insights
  - Updated sidebar navigation: "Analytics" → "Insights" with Sparkles icon
  - Removed duplicate routes
  - Active route highlighting updated
  - Lazy loading for InsightsHubPage

- [✅] **1.8 Backend Services - VisualizationService** - COMPLETED
  - Created packages/core/src/services/visualizationService.ts
  - **generateKPIMetrics()**: Calculates 4 KPIs with sparklines and change percentages
  - **generateTrendData()**: Creates time-series data for completion, mood, productivity, velocity metrics
  - **calculateProductivityScore()**: 0-100 score (70% completion rate + 30% consistency)
  - **calculateActiveStreak()**: Consecutive days with activity
  - **extractMoodTrend()**: Mood values over time from journal
  - **generateDualAxisData()**: Multi-metric charts
  - Type-safe with proper date handling

- [✅] **1.9 IPC Handlers for Insights Hub** - COMPLETED
  - Created apps/desktop/src/main/ipc/insightsHandlers.ts with 7 handlers:
    - insights:getDashboardData (batched: KPIs + insights + recaps)
    - insights:getInsights (filtered retrieval)
    - insights:updateFeedback (user feedback)
    - insights:dismiss (dismiss insights)
    - insights:getRecaps (filtered recaps)
    - insights:updateRecapInteraction (track interactions)
    - insights:getVisualizationData & insights:getKPIMetrics
  - Registered in apps/desktop/src/main/ipc/index.ts
  - Exposed all via preload script (apps/desktop/src/main/preload.ts)

- [✅] **1.10 Redux Slice Updates** - COMPLETED
  - Created new insightsSlice.ts (clean separation from aiAssistantSlice)
  - 10 async thunks for all IPC operations (fetchDashboardData, dismissInsight, rateInsight, etc.)
  - Complete state management: KPIs, insights, recaps, filters (time range, category, type)
  - Loading states for all async operations
  - 12+ selectors including derived selectors (selectNonDismissedInsights, selectInsightsByCategory, etc.)
  - Registered in enhancedStore.ts
  - Exported from packages/core/src/store/index.ts

---

## Phase 1 Summary

### Completion Date
**Completed**: December 2024

### Key Achievements
✅ Complete database layer with feedback system
✅ Modern charting infrastructure with Recharts
✅ New Insights Hub page with KPIs and visualizations
✅ AI Configuration integrated into Settings
✅ Full IPC communication layer
✅ Redux state management for insights
✅ Navigation updated with backward compatibility

### Files Created (13 new files)
1. `packages/database/src/queries/sqlite/ai.ts` - AI insights query functions
2. `packages/ui/src/components/charts/chartConfig.ts` - Chart theming
3. `packages/ui/src/components/charts/chartUtils.ts` - Chart utilities
4. `packages/ui/src/components/charts/TrendChart.tsx` - Main chart component
5. `packages/ui/src/components/charts/KPICard.tsx` - KPI display
6. `packages/ui/src/components/charts/SparklineChart.tsx` - Compact charts
7. `packages/ui/src/components/insights/InsightCard.tsx` - Insight card
8. `packages/core/src/services/visualizationService.ts` - Data transformation
9. `packages/core/src/store/slices/insightsSlice.ts` - Redux slice
10. `apps/desktop/src/main/ipc/insightsHandlers.ts` - IPC handlers
11. `apps/desktop/src/renderer/pages/InsightsHubPage.tsx` - Main page

### Files Modified (6 files)
1. `packages/database/src/adapters/SQLiteAdapter.ts` - Migration method
2. `packages/database/src/sqlite/SQLiteService.ts` - New methods
3. `packages/core/src/store/enhancedStore.ts` - Registered slice
4. `packages/core/src/store/index.ts` - Exports
5. `apps/desktop/src/main/ipc/index.ts` - Handler registration
6. `apps/desktop/src/main/preload.ts` - API exposure
7. `apps/desktop/src/renderer/App.tsx` - Routes
8. `apps/desktop/src/renderer/components/Layout.tsx` - Navigation
9. `apps/desktop/src/renderer/pages/SettingsPage.tsx` - AI panel

### Technical Highlights
- **Type Safety**: All new code fully typed with TypeScript
- **Performance**: Optimized database queries with indexes
- **Theming**: Complete light/dark mode support
- **Accessibility**: Keyboard navigation and ARIA labels
- **Security**: All user feedback persisted to encrypted database
- **Scalability**: Modular architecture ready for Phase 2 enhancements

### What's Ready to Use
1. Navigate to **Insights Hub** via sidebar (Sparkles icon)
2. View **KPI metrics** (once you have task/journal data)
3. Browse **AI insights** with category filtering
4. Interact with insights: rate, dismiss, mark helpful, add notes
5. View **weekly/monthly recaps**
6. Configure **AI settings** in Settings > AI Configuration
7. Filter by **time range** (7D, 30D, 90D, 1Y)

---

### Phase 2: Rich Visualizations
- [ ] 2.1 Actionability Service
- [ ] 2.2 Feedback Service
- [ ] 2.3 Enhanced Insight Card with Actions
- [ ] 2.4 Categorized Insights Display
- [ ] 2.5 Main Visualization with Tabs
- [ ] 2.6 Insight Quality Scoring Integration
- [ ] 2.7 Time Range Filtering
- [ ] 2.8 Empty States & Onboarding
- [ ] 2.9 Migration & Cleanup

---

## Risk Mitigation

**Risk**: Data loss during migration
**Mitigation**: Keep localStorage data for 2 releases, test migration thoroughly, add rollback capability

**Risk**: Performance issues with large datasets
**Mitigation**: Add pagination, virtualization, database indexes, query optimization

**Risk**: Breaking changes affect existing users
**Mitigation**: Feature flags, gradual rollout, keep old routes as redirects, comprehensive testing

**Risk**: Recharts bundle size impact
**Mitigation**: Code splitting, lazy loading, tree shaking, bundle size monitoring

**Risk**: AI API cost increase from new features
**Mitigation**: Rate limiting, token usage tracking, user quotas, local fallback always available

---

## Success Metrics

Track these to measure success of the revamp:

1. **User Engagement**: % of users who visit Insights Hub weekly
2. **Insight Interaction**: Average feedback actions per insight
3. **Actionability**: % of actionable suggestions executed
4. **Retention**: % of users who return to Insights Hub after first visit
5. **Performance**: Page load time, chart render time
6. **Quality**: Average insight rating, helpful vs dismissed ratio
7. **Adoption**: % of users who configure AI provider

---

## Open Questions & Decisions Needed

1. Should we add export functionality for insights? (PDF report, CSV, etc.)
2. Should insights be shareable? (Generate sharable link?)
3. Should there be insight notifications in the app header?
4. Should we add a "regenerate" button to refresh specific insights?
5. Should dismissed insights be permanently hidden or have a "view dismissed" section?
6. Should we add more granular time ranges (custom date picker always available)?
7. Should there be insight categories beyond the 4 proposed?
8. Should we implement insight threading/commenting for future collaboration?

---

## Timeline Estimate

**Phase 1 (Foundation)**: 10-12 days
- Tasks 1.1-1.5: 6 days (core infrastructure)
- Tasks 1.6-1.10: 4-6 days (integration and setup)

**Phase 2 (Visualizations)**: 8-10 days
- Tasks 2.1-2.5: 5 days (services and major features)
- Tasks 2.6-2.10: 3-5 days (polish and testing)

**Total**: 18-22 working days (~3-4 weeks with testing buffer)

---

## Conclusion

This plan provides a complete roadmap for revamping the AI Insights and Analytics experience. The breakdown into specific, actionable tasks with clear acceptance criteria should make implementation straightforward. Each task can be assigned and tracked independently while maintaining the overall coherence of the system.

The phased approach allows for incremental delivery and testing, reducing risk while providing value early. Phase 1 establishes the foundation, while Phase 2 adds the rich interactivity that makes the experience truly compelling.
