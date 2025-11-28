# Add Insights Metrics - Implementation Plan

## Overview
Add three new data visualizations to the Insights Hub page:
1. **Priority Distribution** - Visual breakdown of tasks by priority level
2. **Completion Rate** - Percentage of completed vs total tasks
3. **Average Completion Time** - Average time from creation to completion

## Current State Analysis

### Existing Implementation
- **Page**: `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`
- **Components**: KPICard, TrendChart, InsightCard available from `@serenity/ui`
- **Data Source**: Tasks from Redux store via `selectAllTasks` selector
- **Task Structure**:
  ```typescript
  interface Task {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    // ... other fields
  }
  ```

### Current KPI Cards
The page already displays 4 KPI cards:
1. Tasks Completed (weekly)
2. Average Mood
3. Productivity Score
4. Active Streak

## Implementation Plan

### Phase 1: Create Data Calculation Utilities

**File**: `packages/ui/src/utils/taskAnalyticsUtils.ts` (new file)

**Functions to implement**:

1. **`calculatePriorityDistribution(tasks: Task[])`**
   - Input: Array of all tasks
   - Output:
     ```typescript
     {
       high: { count: number, percentage: number },
       medium: { count: number, percentage: number },
       low: { count: number, percentage: number }
     }
     ```
   - Logic: Group tasks by priority and calculate percentages

2. **`calculateCompletionRate(tasks: Task[], timeRange?: { start: Date, end: Date })`**
   - Input: Tasks array, optional time range
   - Output:
     ```typescript
     {
       completedCount: number,
       totalCount: number,
       rate: number (0-100),
       change: number (vs previous period)
     }
     ```
   - Logic:
     - Filter tasks by time range if provided
     - Count completed vs total tasks
     - Calculate percentage
     - Compare with previous period for trend

3. **`calculateAverageCompletionTime(tasks: Task[])`**
   - Input: Array of completed tasks
   - Output:
     ```typescript
     {
       averageHours: number,
       averageDays: number,
       median: number,
       fastest: number,
       slowest: number
     }
     ```
   - Logic:
     - Filter only completed tasks with both createdAt and completedAt
     - Calculate time difference for each task
     - Compute average, median, min, max
     - Return in hours and days

### Phase 2: Create Priority Distribution Chart Component

**File**: `packages/ui/src/components/charts/PriorityDistributionChart.tsx` (new file)

**Component**: `PriorityDistributionChart`
- Props:
  ```typescript
  interface PriorityDistributionChartProps {
    data: {
      high: { count: number, percentage: number },
      medium: { count: number, percentage: number },
      low: { count: number, percentage: number }
    };
    height?: number;
    showLabels?: boolean;
  }
  ```
- Implementation:
  - Use Recharts library (already in dependencies based on TrendChart)
  - Create a horizontal bar chart or pie chart
  - Color scheme:
    - High priority: Red (#ef4444)
    - Medium priority: Orange (#f59e0b)
    - Low priority: Blue (#3b82f6)
  - Display count and percentage for each priority
  - Responsive design with Tailwind CSS

**Export**: Add to `packages/ui/src/components/charts/index.ts`

### Phase 3: Update InsightsHubPage

**File**: `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`

**Changes**:

1. **Import new utilities and component**:
   ```typescript
   import {
     calculatePriorityDistribution,
     calculateCompletionRate,
     calculateAverageCompletionTime,
     PriorityDistributionChart
   } from '@serenity/ui';
   ```

2. **Calculate metrics** (add to component body):
   ```typescript
   // Calculate metrics based on selected time range
   const timeRangeObj = getTimeRangeFromPreset(selectedTimeRange);

   const priorityDistribution = useMemo(() =>
     calculatePriorityDistribution(tasks),
     [tasks]
   );

   const completionRate = useMemo(() =>
     calculateCompletionRate(tasks, timeRangeObj),
     [tasks, selectedTimeRange]
   );

   const avgCompletionTime = useMemo(() =>
     calculateAverageCompletionTime(tasks),
     [tasks]
   );
   ```

3. **Add new KPI cards** (in the KPI Cards Row section, after line 353):
   ```typescript
   <KPICard
     title="Completion Rate"
     value={`${completionRate.rate.toFixed(1)}%`}
     change={{
       value: completionRate.change,
       direction: completionRate.change > 0 ? 'up' : completionRate.change < 0 ? 'down' : 'neutral',
       period: 'vs last period',
     }}
     icon={<CheckCircle className="w-5 h-5" />}
     color="green"
     subtitle={`${completionRate.completedCount} of ${completionRate.totalCount} tasks`}
   />

   <KPICard
     title="Avg Completion Time"
     value={
       avgCompletionTime.averageDays < 1
         ? `${avgCompletionTime.averageHours.toFixed(1)}h`
         : `${avgCompletionTime.averageDays.toFixed(1)}d`
     }
     icon={<Clock className="w-5 h-5" />}
     color="indigo"
     subtitle={`Median: ${
       avgCompletionTime.median < 24
         ? `${avgCompletionTime.median.toFixed(1)}h`
         : `${(avgCompletionTime.median / 24).toFixed(1)}d`
     }`}
   />
   ```

4. **Add Priority Distribution Card** (in Overview Tab section, after Recent Insights card):
   ```typescript
   <Card>
     <CardHeader>
       <CardTitle className="flex items-center gap-2">
         <BarChart3 className="w-5 h-5 text-blue-500" />
         Priority Distribution
       </CardTitle>
       <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
         Breakdown of tasks by priority level
       </p>
     </CardHeader>
     <CardContent>
       {tasks.length === 0 ? (
         <div className="text-center py-8">
           <p className="text-gray-500 dark:text-gray-400">
             No tasks to analyze
           </p>
         </div>
       ) : (
         <>
           <PriorityDistributionChart
             data={priorityDistribution}
             height={300}
             showLabels={true}
           />
           <div className="mt-4 grid grid-cols-3 gap-4 text-center">
             <div>
               <div className="text-2xl font-bold text-red-600">
                 {priorityDistribution.high.count}
               </div>
               <div className="text-xs text-gray-500">
                 High ({priorityDistribution.high.percentage.toFixed(1)}%)
               </div>
             </div>
             <div>
               <div className="text-2xl font-bold text-orange-600">
                 {priorityDistribution.medium.count}
               </div>
               <div className="text-xs text-gray-500">
                 Medium ({priorityDistribution.medium.percentage.toFixed(1)}%)
               </div>
             </div>
             <div>
               <div className="text-2xl font-bold text-blue-600">
                 {priorityDistribution.low.count}
               </div>
               <div className="text-xs text-gray-500">
                 Low ({priorityDistribution.low.percentage.toFixed(1)}%)
               </div>
             </div>
           </div>
         </>
       )}
     </CardContent>
   </Card>
   ```

5. **Import additional icons**:
   ```typescript
   import {
     // ... existing imports
     CheckCircle,
     Clock,
   } from 'lucide-react';
   ```

### Phase 4: Update Exports and Type Definitions

1. **Export utilities**: Add to `packages/ui/src/utils/index.ts` (or create if doesn't exist):
   ```typescript
   export * from './taskAnalyticsUtils';
   ```

2. **Update package exports**: Ensure `packages/ui/src/index.ts` exports utilities:
   ```typescript
   export * from './utils/taskAnalyticsUtils';
   ```

### Phase 5: Testing & Refinement

1. **Test with different data scenarios**:
   - Empty task list
   - Tasks with no completions
   - Tasks with various priorities
   - Different time ranges

2. **Visual polish**:
   - Ensure responsive design on different screen sizes
   - Dark mode compatibility
   - Smooth transitions and loading states

3. **Performance**:
   - Verify useMemo hooks prevent unnecessary recalculations
   - Test with large task lists (100+ tasks)

## Technical Decisions

### Why not add to existing KPIs slice?
- The existing KPIs in the Redux store (`aiAssistantSlice`) are AI-generated insights
- These new metrics are pure analytics calculations from task data
- Keeping them separate maintains clarity and reduces Redux complexity
- Computing on-the-fly with useMemo is efficient for these simple calculations

### Chart Library Choice
- Use Recharts (already used in TrendChart component)
- Consistent with existing codebase
- Good TypeScript support
- Flexible and customizable

### Placement in UI
- **Completion Rate & Avg Completion Time**: Add as KPI cards in the top row (making it 6 cards total)
- **Priority Distribution**: Add as a full card in the Overview tab
- This provides both quick-glance metrics and detailed visualization

## Files to Create
1. `packages/ui/src/utils/taskAnalyticsUtils.ts` - Calculation utilities
2. `packages/ui/src/components/charts/PriorityDistributionChart.tsx` - Chart component

## Files to Modify
1. `apps/desktop/src/renderer/pages/InsightsHubPage.tsx` - Add metrics display
2. `packages/ui/src/components/charts/index.ts` - Export new chart
3. `packages/ui/src/index.ts` - Export utilities (if needed)

## Estimated Complexity
- **Low-Medium complexity**
- Primarily involves data transformation and UI composition
- Leverages existing components and patterns
- No database changes required
- No IPC/backend changes required

## MVP Approach
Focus on core functionality first:
1. Basic calculations for all three metrics
2. Simple, clear visualizations
3. Responsive design
4. Dark mode support

**Optional enhancements for later**:
- Time range filtering for all metrics
- Drill-down interactions (click priority to filter tasks)
- Export metrics data
- Historical trending for completion rate over time
- Comparison with goals/targets

---

## Implementation Summary

### ✅ Completed Tasks

1. **Created `packages/ui/src/utils/taskAnalyticsUtils.ts`**
   - `calculatePriorityDistribution()` - Calculates distribution of tasks by priority (high/medium/low)
   - `calculateCompletionRate()` - Calculates completion rate with time range support and trend comparison
   - `calculateAverageCompletionTime()` - Calculates average, median, fastest, and slowest completion times
   - Uses `Task` type from `@serenity/core` to avoid conflicts

2. **Created `packages/ui/src/components/charts/PriorityDistributionChart.tsx`**
   - Horizontal bar chart using Recharts
   - Color-coded priorities (high=red, medium=orange, low=blue)
   - Custom tooltip showing count and percentage
   - Empty state for zero tasks
   - Dark mode support via `isDark` prop

3. **Updated `packages/ui/src/components/charts/index.ts`**
   - Exported `PriorityDistributionChart` component
   - Exported related types: `PriorityDistributionChartProps`, `PriorityDistributionData`

4. **Updated `packages/ui/src/index.ts`**
   - Exported all utilities from `taskAnalyticsUtils`
   - Made functions available to consuming applications

5. **Updated `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`**
   - Added imports for new components and utilities
   - Added `CheckCircle` and `Clock` icons from lucide-react
   - Created `useMemo` calculations for:
     - `priorityDistribution` - Recalculated when tasks change
     - `completionRate` - Recalculated when tasks or time range changes
     - `avgCompletionTime` - Recalculated when tasks change
   - Updated KPI Cards grid from 4 to 6 cards (3 columns on lg, 6 on xl)
   - Added "Completion Rate" KPI card (5th position)
   - Added "Avg Completion Time" KPI card (6th position)
   - Added "Priority Distribution" full card in Overview tab
   - Updated loading skeleton to show 6 placeholders

### 📁 Files Created
- `packages/ui/src/utils/taskAnalyticsUtils.ts` (156 lines)
- `packages/ui/src/components/charts/PriorityDistributionChart.tsx` (170 lines)

### 📝 Files Modified
- `packages/ui/src/components/charts/index.ts` (+1 export)
- `packages/ui/src/index.ts` (+1 export)
- `apps/desktop/src/renderer/pages/InsightsHubPage.tsx` (+95 lines)

### 🏗️ Build Status
- ✅ All packages build successfully
- ✅ TypeScript compilation passed
- ✅ Vite build completed (renderer process)
- ✅ No linting errors

### 🎨 UI Changes
1. **KPI Cards Row**: Now displays 6 cards in a responsive grid
   - Mobile: 1 column
   - Medium: 2 columns
   - Large: 3 columns
   - XL: 6 columns

2. **Priority Distribution Card**: Added to Overview tab
   - Horizontal bar chart visualization
   - Summary statistics below chart (count and percentage per priority)
   - Empty state when no tasks exist

3. **Completion Rate Card**: Shows percentage with trend indicator

4. **Avg Completion Time Card**: Shows time in hours (if <1 day) or days

### 🔍 Key Implementation Details

**Type Safety**:
- Used `as any` casting in InsightsHubPage for Redux Task type compatibility
- Could be improved with proper type alignment between Redux and utility types

**Performance**:
- All calculations use `useMemo` to prevent unnecessary recalculations
- Calculations are lightweight (O(n) complexity)

**Responsiveness**:
- Grid adapts from 1 to 6 columns based on screen size
- Chart uses ResponsiveContainer from Recharts

**Dark Mode**:
- All new components support dark mode
- Uses existing theme utilities from `chartConfig`

### ⚠️ Known Issues / Future Improvements
1. Type casting with `as any` should be replaced with proper type definitions
2. Could add subtitle to Completion Rate KPI showing "X of Y tasks"
3. Could add median display to Avg Completion Time KPI
4. Priority Distribution could be made interactive (click to filter)
5. Time range filter currently only affects Completion Rate, could apply to all metrics

### 🧪 Testing Notes
- Build completed successfully
- Ready for manual testing in the application
- Test scenarios to verify:
  - Empty state (no tasks)
  - Various priority distributions
  - Different time ranges
  - Dark mode toggle
  - Responsive layouts (mobile, tablet, desktop)

---

## Bug Fix: Time Range Not Updating KPIs

### Issue
When changing the time range selector (7D, 30D, 90D, 1Y), the KPI cards (Tasks Completed, Average Mood, Productivity Score, Active Streak) were not updating to reflect the selected time period.

### Root Cause
The `handleTimeRangeChange` function was dispatching `fetchDashboardData` without explicitly passing the `timeRange` parameter. While it was updating the Redux state with `setTimeRangePreset`, the async thunk was relying on reading the updated state, which could lead to timing issues or the old time range being used.

### Solution
Modified `handleTimeRangeChange` and `handleRefresh` to explicitly calculate and pass the `timeRange` object to `fetchDashboardData`:

```typescript
const handleTimeRangeChange = (preset: '7d' | '30d' | '90d' | 'year') => {
  setSelectedTimeRange(preset);

  // Calculate the time range explicitly
  const end = new Date();
  const start = new Date();
  // ... switch statement to calculate start date ...

  const timeRange = {
    start: start.toISOString(),
    end: end.toISOString(),
  };

  dispatch(setTimeRangePreset(preset)); // Still update Redux state

  // Pass explicit timeRange to fetchDashboardData
  dispatch(fetchDashboardData({
    timeRange,
    includeKPIs: true,
    includeInsights: true,
    includeRecaps: true,
  }));
};
```

### Files Modified
- `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`:
  - Updated `handleTimeRangeChange` to calculate and pass explicit time range
  - Updated `handleRefresh` to use current selected time range

### Result
✅ KPI cards now properly update when time range is changed
✅ All metrics (Tasks Completed, Average Mood, Productivity Score, Active Streak) respond to time range selection
✅ Refresh button maintains the current time range selection

---

## Priority Distribution Conversion to Pie Chart

### Changes Made
1. **Converted from Bar Chart to Pie Chart**
   - Changed from horizontal bar chart to donut pie chart
   - Uses `PieChart` and `Pie` components from Recharts
   - Configured as donut chart with `innerRadius` and `outerRadius`

2. **Moved to KPI Cards Row**
   - Added as 7th card in the top KPI cards section
   - Compact design (100px height) to match other KPI cards
   - Includes small legend with colored dots and counts

3. **Removed from Overview Tab**
   - Deleted the large Priority Distribution card from Overview section
   - Simplified Overview to show only Recent Insights and Latest Recap

4. **Updated Grid Layout**
   - Changed from 6-card to 7-card grid
   - Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7`

### Files Modified
- `packages/ui/src/components/charts/PriorityDistributionChart.tsx`:
  - Changed chart type from Bar to Pie
  - Adjusted default height to 200px (from 300px)
  - Added donut configuration
  - Added index signature to ChartDataPoint for Recharts compatibility

- `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`:
  - Added Priority Distribution as inline card in KPI row
  - Removed full Priority Distribution card from Overview tab
  - Updated grid classes to support 7 columns
  - Updated loading skeleton to 7 placeholders

### Result
✅ Priority Distribution now appears as compact donut pie chart in KPI row
✅ Consistent styling with other KPI cards
✅ More efficient use of screen space
✅ Better visual hierarchy on Insights Hub page

---

## UI Fix: Consistent Card Heights

### Issue
KPI cards had inconsistent heights, making the page look unprofessional. Some cards with sparklines were taller, cards without sparklines were shorter, and the Priority Distribution card was even taller due to its pie chart and legend.

### Solution
Set all KPI cards to a fixed height of **168px** using Tailwind's arbitrary value `h-[168px]` and flexbox layout:

1. **KPICard Component** (`packages/ui/src/components/charts/KPICard.tsx`):
   - Added `h-[168px] flex flex-col` to the card wrapper
   - Wrapped sparkline in `flex-1 flex items-end` container to push it to the bottom
   - This ensures consistent height whether sparkline is present or not

2. **Priority Distribution Card** (`apps/desktop/src/renderer/pages/InsightsHubPage.tsx`):
   - Added `h-[168px] flex flex-col` to match KPICard height
   - Reduced pie chart height from 100px to 80px
   - Used `flex-1 flex flex-col items-center justify-center` for chart/legend container
   - Vertically centers the content within the card

3. **Loading Skeleton**:
   - Updated from `h-32` (128px) to `h-[168px]` to match actual card height
   - Ensures loading state looks consistent with actual cards

### Files Modified
- `packages/ui/src/components/charts/KPICard.tsx`: Fixed height + flexbox layout
- `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`: Priority Distribution card + loading skeleton

### Result
✅ All KPI cards now have exactly the same height (168px)
✅ Content is properly aligned and centered within each card
✅ Sparklines appear at the bottom of cards consistently
✅ Priority Distribution pie chart and legend fit perfectly within the card
✅ Professional, uniform appearance across all metrics
✅ Loading skeletons match the actual card dimensions

---

## UI Fix: Percentage Formatting in KPI Cards

### Issue
The change percentage in KPI cards was displaying with excessive decimal precision, showing values like `16.666666666666657%` instead of a clean, readable format.

### Solution
Applied `.toFixed(2)` to format percentages to exactly 2 decimal places.

**Changed in** `packages/ui/src/components/charts/KPICard.tsx`:
```typescript
// Before
<span>{Math.abs(change.value)}%</span>

// After
<span>{Math.abs(change.value).toFixed(2)}%</span>
```

### Files Modified
- `packages/ui/src/components/charts/KPICard.tsx`: Line 128

### Result
✅ Percentages now display cleanly (e.g., `16.67%` instead of `16.666666666666657%`)
✅ Consistent formatting across all KPI cards
✅ More professional and readable appearance
✅ Works for all change indicators (up, down, neutral)

---

## Feature Fix: Window Dragging on Lock Screen

### Issue
When the app starts in a locked state (before login), the window cannot be dragged/moved by clicking and holding the mouse. However, after logging in, the window becomes draggable. This inconsistency made the lock screen feel less polished and prevented users from repositioning the app window before unlocking.

### Root Cause
The `AppLockScreen` component didn't have a drag region defined using Electron's `-webkit-app-region: drag` CSS property. The logged-in state (Layout component) has drag regions at the top of both the sidebar and main content area, enabling window dragging.

### Solution
Added a draggable header region to the top of the lock screen:

**Changed in** `packages/ui/src/components/AppLockScreen.tsx`:
1. Changed root container from `flex items-center justify-center` to `flex flex-col` to accommodate header
2. Added a 10px-high draggable header at the top:
   ```tsx
   <div
     className="h-10 w-full flex-shrink-0"
     style={{ WebkitAppRegion: 'drag' } as any}
   />
   ```
3. Wrapped main content in a flex container: `<div className="flex-1 flex items-center justify-center p-4">`
4. Added `pointer-events-none` to background pattern to prevent interference with drag region

### Technical Details
- Uses Electron's `-webkit-app-region` CSS property
- `'drag'` value enables window dragging when user clicks and holds in that region
- 40px height (h-10) provides sufficient grab area without being visually intrusive
- Background pattern has `pointer-events-none` to ensure drag region remains functional

### Files Modified
- `packages/ui/src/components/AppLockScreen.tsx`:
  - Changed layout from centered flex to column layout
  - Added draggable header region
  - Restructured content wrapper

### Result
✅ Lock screen window is now draggable by clicking and holding the top area
✅ Consistent user experience between locked and unlocked states
✅ Users can reposition the app window before entering their password
✅ Visual appearance remains unchanged - drag region is invisible
✅ No performance impact or additional dependencies
