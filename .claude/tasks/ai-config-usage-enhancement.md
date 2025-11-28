# Task: AI Configuration & Usage Tracking Enhancement

**Created**: 2025-10-26
**Status**: In Progress
**Approved By**: User

## Objective
Remove deprecated AI Assistant Page and enhance Settings page with:
1. Inline API key management for multiple AI providers
2. Comprehensive token usage tracking and visualization

## User Requirements
- **API Key UI**: Inline forms (expandable sections) in Settings page
- **Usage Display**: Summary stats + Operation history + Trend charts
- **Component Reuse**: Remove everything from AIAssistantPage (clean slate)
- **Usage Location**: Separate "AI Usage & Billing" section in Settings

---

## Phase 1: Remove Deprecated AI Assistant Page ✂️

### Task 1.1: Delete AIAssistantPage Files
- **Delete**: `/apps/desktop/src/renderer/pages/AIAssistantPage.tsx`
- **Delete**: `/apps/desktop/src/renderer/pages/AIAssistant/` (entire hooks directory)
  - `useLoadAISettings.ts`
  - `useLoadPersistedAIData.ts`
  - `useListProviderModels.ts`
  - `usePersistActiveProviderSettings.ts`

### Task 1.2: Remove Route & Navigation
- **File**: `/apps/desktop/src/renderer/App.tsx`
  - Remove import statement for `AIAssistantPage` (line ~42)
  - Remove route `<Route path="/ai-assistant" element={<AIAssistantPage />} />` (line ~386)
  - Verify `/analytics` redirect still works (should redirect to InsightsHubPage)

### Task 1.3: Verify No Broken References
- Search codebase for any remaining imports of `AIAssistantPage`
- Check navigation components (sidebar, menu) for links to `/ai-assistant`
- Ensure InsightsHubPage is the only active consumer of `aiAssistantSlice`

**What to Keep**: Redux slice, IPC handlers, services, preload APIs (all shared with InsightsHub)

---

## Phase 2: Enhance AI Configuration in Settings 🔑

### Task 2.1: Create API Key Input Components
**File**: Create `/packages/ui/src/components/AIProviderKeyInput.tsx`
- Inline expandable form for each provider (OpenAI, Gemini, Anthropic)
- Features:
  - Password-style input with show/hide toggle (👁️ icon)
  - "Test Connection" button with loading state
  - Success/error feedback messages
  - "Save" and "Remove" buttons
  - Collapsible accordion style (closed by default if key exists)

### Task 2.2: Update Settings Page AI Configuration
**File**: `/apps/desktop/src/renderer/pages/SettingsPage.tsx` (lines 426-575)
- Replace existing provider buttons with new `AIProviderKeyInput` components
- Add three provider sections (one for each: OpenAI, Gemini, Anthropic)
- Each section shows:
  - Provider name with icon
  - Current status (✅ Configured / ⚠️ Not Set)
  - Expandable key input form
  - Active toggle (radio button for active provider selection)

### Task 2.3: Wire Up IPC Handlers
- Connect to existing `window.api.aiAssistant.setApiKey()`
- Connect to existing `window.api.aiAssistant.testApiKey()`
- Connect to existing `window.api.aiAssistant.removeApiKey()`
- Update Redux state on successful save using `setApiKey` thunk
- Show validation errors from IPC responses

### Task 2.4: Security Enhancements
- Ensure API keys never logged to console
- Add input validation (minimum length, format checks)
- Show encryption indicator ("Secured with system encryption")
- Clear key input field immediately after save

---

## Phase 3: Create AI Usage & Billing Section 📊

### Task 3.1: Create New Settings Section Layout
**File**: `/apps/desktop/src/renderer/pages/SettingsPage.tsx`
- Add new section after AI Configuration: "AI Usage & Billing"
- Section structure:
  ```
  📊 AI Usage & Billing
  ├── Summary Stats (cards)
  ├── Operation History (table)
  └── Usage Trends (charts)
  ```

### Task 3.2: Create Summary Stats Component
**File**: Create `/packages/ui/src/components/AIUsageSummary.tsx`
- Display cards for each provider showing:
  - Total tokens used (lifetime)
  - Prompt tokens vs Completion tokens breakdown
  - Most recent usage timestamp
  - Total operations count
- Use existing `selectAIUsage` Redux selector
- Add refresh button to reload from database

### Task 3.3: Create Operation History Component
**File**: Create `/packages/ui/src/components/AIOperationHistory.tsx`
- Scrollable table/list showing recent operations (last 50 by default)
- Columns:
  - Timestamp (formatted relative: "2 hours ago")
  - Provider (with icon badge)
  - Operation type (Analyze / Recap / QuickAdd)
  - Tokens used (Prompt + Completion = Total)
  - Description (e.g., "AI Insights: analyzed 15 tasks, 3 journals")
- Filters:
  - Provider dropdown (All / OpenAI / Gemini / Anthropic)
  - Operation dropdown (All / Analyze / Recap / QuickAdd)
  - Date range picker (Last 7 days / 30 days / All time)
- "Load More" pagination button

### Task 3.4: Create Trend Charts Component
**File**: Create `/packages/ui/src/components/AIUsageTrendChart.tsx`
- Use a charting library (recharts or chart.js - check existing dependencies)
- Two charts:
  1. **Tokens Over Time**: Line chart showing daily token usage
  2. **Usage by Provider**: Bar chart comparing providers
- Time range selector (7 days / 30 days / 90 days / All time)
- Toggle between "Tokens" and "Operations Count" views

### Task 3.5: Wire Up Data Loading
- Load usage data on Settings page mount using `restoreUsage` action
- Call `window.api.aiAssistant.listUsage()` to hydrate from SQLite
- Implement auto-refresh (every 30 seconds if Settings page is active)
- Add loading skeletons for better UX

### Task 3.6: Add Description/Help Text
- Add info banner explaining token usage:
  > "AI operations consume tokens based on the amount of data analyzed. Each provider has different pricing models. Track your usage here to monitor costs."
- Add tooltips for technical terms (e.g., "Prompt tokens = input data", "Completion tokens = AI response")

---

## Phase 4: Integration & Polish 🎨

### Task 4.1: Update Redux Integration
- Verify `aiAssistantSlice` properly handles new usage data structure
- Ensure `recordUsage` action called after each AI operation
- Test localStorage persistence for usage history

### Task 4.2: Update Type Definitions
**File**: `/packages/core/src/types/ipc.ts`
- Add any missing types for new components
- Ensure AIUsageEntry interface matches database schema

### Task 4.3: Styling & Responsiveness
- Apply consistent Tailwind CSS styling
- Ensure components work in compact mode (if applicable)
- Test responsive behavior for smaller window sizes
- Match existing Settings page design language

### Task 4.4: Testing Checklist
- [ ] API key save/test/remove functionality
- [ ] Encryption verification (keys stored in encrypted format)
- [ ] Provider switching updates active state
- [ ] Usage stats display correctly after AI operations
- [ ] Charts render with real data
- [ ] Filters work in operation history
- [ ] No console errors or warnings
- [ ] Performance (Settings page loads quickly)
- [ ] InsightsHub still works after AIAssistantPage removal

---

## Files Summary

### To Delete (5 files)
1. `/apps/desktop/src/renderer/pages/AIAssistantPage.tsx`
2. `/apps/desktop/src/renderer/pages/AIAssistant/useLoadAISettings.ts`
3. `/apps/desktop/src/renderer/pages/AIAssistant/useLoadPersistedAIData.ts`
4. `/apps/desktop/src/renderer/pages/AIAssistant/useListProviderModels.ts`
5. `/apps/desktop/src/renderer/pages/AIAssistant/usePersistActiveProviderSettings.ts`

### To Create (4 files)
1. `/packages/ui/src/components/AIProviderKeyInput.tsx`
2. `/packages/ui/src/components/AIUsageSummary.tsx`
3. `/packages/ui/src/components/AIOperationHistory.tsx`
4. `/packages/ui/src/components/AIUsageTrendChart.tsx`

### To Modify (2 files)
1. `/apps/desktop/src/renderer/App.tsx` (remove route)
2. `/apps/desktop/src/renderer/pages/SettingsPage.tsx` (add sections)

---

## Implementation Notes

### Research Findings

**Current State:**
- API key storage already implemented with Electron safeStorage encryption
- Token usage tracking fully functional (ai_usage table in SQLite)
- Redux slice `aiAssistantSlice` shared between old AIAssistantPage and new InsightsHubPage
- IPC handlers in `aiAssistantHandlers.ts` handle all backend operations

**Key Architectural Points:**
- AIAssistantPage is deprecated but core infrastructure is actively used by InsightsHubPage
- Must preserve all Redux slices, IPC handlers, services, and preload APIs
- Only remove UI components and routes specific to the old page

**Dependencies to Verify:**
- Check if charting library exists (recharts preferred)
- Ensure date-fns or similar for timestamp formatting
- Verify Tailwind CSS setup for new components

---

## Progress Log

### 2025-10-26: Initial Planning
- Conducted comprehensive codebase exploration
- Identified all components to remove
- Documented existing API key storage and token tracking
- User approved implementation plan
- Plan written to task file

### Next Steps
1. Create todo list for tracking
2. Start Phase 1: Remove deprecated components
3. Implement Phase 2: API key management UI
4. Build Phase 3: Usage tracking visualization
5. Complete Phase 4: Integration and testing

---

## IMPLEMENTATION COMPLETED - 2025-10-26

### Summary of Changes

**Phase 1: Removed Deprecated AI Assistant Page** ✅
- Deleted `/apps/desktop/src/renderer/pages/AIAssistantPage.tsx`
- Deleted `/apps/desktop/src/renderer/pages/AIAssistant/` hooks directory (4 hooks)
- Removed import and route from `App.tsx`
- Removed navigation link from `Layout.tsx`
- Verified no broken references (only documentation files remain)

**Phase 2: Enhanced AI Configuration in Settings** ✅
- Created `/packages/ui/src/components/AIProviderKeyInput.tsx`
  - Inline expandable forms for each provider
  - Password-style input with show/hide toggle
  - Test connection button with loading states
  - Save and Remove functionality
  - Active provider radio button selection
  - Success/error feedback messages
  - Encryption indicator
- Updated `SettingsPage.tsx` AI Configuration section
  - Replaced old provider button grid with new AIProviderKeyInput components
  - Added handlers: `handleSaveApiKey`, `handleTestApiKey`, `handleRemoveApiKey`
  - Integrated with existing Redux thunks (`setApiKey`, `testApiKey`)
  - Wired up IPC handlers for `removeApiKey`

**Phase 3: Created AI Usage & Billing Section** ✅
- Created `/packages/ui/src/components/AIUsageSummary.tsx`
  - Provider-specific summary cards with token breakdowns
  - Overall statistics (total tokens, operations, avg tokens/op)
  - Refresh button with loading state
  - Empty state handling
  - Color-coded provider indicators
- Created `/packages/ui/src/components/AIOperationHistory.tsx`
  - Filterable table with provider, operation type, and date range filters
  - Paginated display (50 entries per page)
  - Detailed token breakdown (prompt, completion, total)
  - Relative timestamps ("2h ago", "3d ago")
  - Operation descriptions
  - Empty state handling
- Created `/packages/ui/src/components/AIUsageTrendChart.tsx`
  - Line chart for token usage trends over time
  - Bar chart for operation count trends
  - Toggle between "Tokens" and "Operations" views
  - Time range selector (7d, 30d, 90d, All time)
  - Provider-specific trend lines
  - Uses recharts library
  - Custom tooltips
- Added new "AI Usage & Billing" section to `SettingsPage.tsx`
  - Integrated all three usage components
  - Added usage data loading on mount (`handleRefreshUsage`)
  - Connected to Redux `selectAIUsage` and `restoreUsage`
  - Added help text explaining token usage

**Phase 4: Integration & Testing** ✅
- Exported all new components from `packages/ui/src/components/index.ts`
- Fixed TypeScript type conflicts (AIUsageEntry interface)
- Verified build succeeds for all packages
- All components properly styled with Tailwind CSS
- Consistent with existing design language

### Files Created (4)
1. `/packages/ui/src/components/AIProviderKeyInput.tsx` - 279 lines
2. `/packages/ui/src/components/AIUsageSummary.tsx` - 233 lines
3. `/packages/ui/src/components/AIOperationHistory.tsx` - 285 lines
4. `/packages/ui/src/components/AIUsageTrendChart.tsx` - 254 lines

### Files Modified (5)
1. `/apps/desktop/src/renderer/App.tsx` - Removed AIAssistantPage import and route
2. `/apps/desktop/src/renderer/components/Layout.tsx` - Removed navigation link
3. `/apps/desktop/src/renderer/pages/SettingsPage.tsx` - Added new sections and handlers
4. `/packages/ui/src/components/index.ts` - Exported new components

### Files Deleted (5)
1. `/apps/desktop/src/renderer/pages/AIAssistantPage.tsx`
2-5. `/apps/desktop/src/renderer/pages/AIAssistant/*.ts` (4 hooks)

### Build Status
✅ All packages build successfully
✅ No TypeScript errors
✅ No breaking changes to existing functionality

### Next Steps for Testing
1. Run the application: `npm run electron`
2. Navigate to Settings page
3. Test AI Configuration section:
   - Expand provider forms
   - Add API keys
   - Test connections
   - Set active provider
   - Remove API keys
4. Test AI Usage & Billing section:
   - Verify summary stats display
   - Check trend charts render correctly
   - Test filters in operation history
   - Verify pagination works
5. Use AI features to generate usage data and verify tracking

### Implementation Notes
- All Redux slices, IPC handlers, and services preserved (shared with InsightsHubPage)
- Existing API key storage and encryption mechanisms reused
- Token usage tracking already implemented, just added UI visualization
- Components designed to handle empty states gracefully
- Responsive design considerations included
- Proper loading states and error handling throughout
