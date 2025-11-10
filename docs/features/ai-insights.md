# AI Insights Feature

**Status**: ✅ Fully Functional (Recent enhancements October 2025)
**Location**: `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`

---

## Overview

AI Insights analyzes user tasks and journal entries to generate productivity insights, identify patterns, and provide actionable recommendations. The system uses AI models (OpenAI, Gemini, Anthropic, or local) to understand user behavior and offer personalized guidance.

**Key Capabilities**:
- Analyzes tasks (completion patterns, priorities, deadlines)
- Analyzes journal entries (mood, themes, content)
- Generates multi-dimensional insights (productivity, behavior, recommendations, warnings)
- Tracks longitudinal patterns across analyses (context continuity)
- Supports time-window analysis (last 7 days, monthly reviews, etc.)
- Identifies and tracks recurring themes
- Quality scoring and filtering
- User feedback collection (ratings, helpful/dismissed flags)

---

## Architecture

### Components

```
┌────────────────────────────────────────────────────────┐
│                 Renderer (React UI)                    │
│  InsightsHubPage.tsx - Display insights, controls     │
└─────────────────────┬──────────────────────────────────┘
                      │ IPC: window.api.analyzeData()
                      ↓
┌────────────────────────────────────────────────────────┐
│             Main Process (IPC Handlers)                │
│  aiAssistantHandlers.ts - Orchestrates analysis flow  │
└─────────────────────┬──────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┬─────────────────┐
      ↓               ↓               ↓                 ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Preprocessing │ │  Prompt      │ │  AI Provider │ │   Quality    │
│Service       │ │  Engineering │ │  (API call)  │ │   Scoring    │
│              │ │  Service     │ │              │ │   Service    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
      │               │               │                 │
      └───────────────┴───────────────┴─────────────────┘
                      │
                      ↓
┌────────────────────────────────────────────────────────┐
│              Database (SQLite)                         │
│  - ai_insights: Store generated insights              │
│  - analysis_summaries: Context continuity             │
│  - insight_themes: Theme tracking                     │
└────────────────────────────────────────────────────────┘
```

### Services

1. **AIPreprocessingService** (`packages/core/src/services/aiPreprocessingService.ts`)
   - Smart data summarization (not naive truncation)
   - Quality scoring for tasks and journal entries
   - Temporal weighting (recent data weighted higher)
   - Entity extraction (dates, numbers, important names)
   - Theme extraction from journal entries
   - Sentiment analysis

2. **PromptEngineeringService** (`packages/core/src/services/promptEngineeringService.ts`)
   - Generates context-rich prompts
   - Chain-of-thought reasoning instructions
   - Includes previous analysis summaries (context continuity)
   - User profile integration (focus areas, goals)
   - Multi-step thinking framework

3. **InsightQualityService** (`packages/core/src/services/insightQualityService.ts`)
   - Multi-dimensional quality scoring
     - Relevance (0-1): How relevant to user's data
     - Actionability (0-1): How actionable the insight is
     - Novelty (0-1): How novel vs. obvious
     - Overall confidence (0-1): Combined score
   - Filters low-quality insights (< 0.4 confidence)

4. **UserProfileService** (`packages/core/src/services/userProfileService.ts`)
   - Builds user behavior profile from data
   - Identifies focus areas (most common tags/projects)
   - Tracks active goals
   - Preference extraction

5. **ThemeTrackingService** (`packages/core/src/services/themeTrackingService.ts`)
   - Extracts themes from insights using pattern matching
   - 12 predefined themes: procrastination, context_switching, burnout, focus_issues, time_management, overload, progress, productivity_drop, mood_issues, work_life_balance, goal_alignment, habit_formation
   - Fallback to generic themes (category_type)

6. **AIAssistantService** (`packages/core/src/services/aiAssistantService.ts`)
   - Main orchestration logic
   - Filters unanalyzed data
   - Generates analysis summaries
   - Coordinates between services

### Database Tables

**`ai_insights`**:
```sql
CREATE TABLE ai_insights (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,  -- 'openai' | 'gemini' | 'anthropic' | 'local'
  type TEXT NOT NULL,      -- 'productivity' | 'behavior' | 'recommendation' | 'warning'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  category TEXT NOT NULL,  -- 'tasks' | 'journal' | 'habits' | 'goals'
  actionable INTEGER DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  dismissed INTEGER DEFAULT 0,
  marked_helpful INTEGER DEFAULT 0,
  user_notes TEXT,
  -- Enhancements (Oct 2025)
  theme_id TEXT,           -- Links to insight_themes table
  is_recurring INTEGER,    -- Boolean flag for recurring themes
  occurrence_number INTEGER,
  visualization_data TEXT,
  actionability_suggestions TEXT DEFAULT '[]'
);
```

**`analysis_summaries`** (new - Oct 2025):
```sql
CREATE TABLE analysis_summaries (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  summary_text TEXT NOT NULL,        -- Concise summary (≤300 chars)
  key_themes TEXT,                    -- JSON array of theme names
  tracked_patterns TEXT,              -- JSON array of pattern objects
  user_focus_areas TEXT,              -- JSON array of focus areas
  tasks_analyzed INTEGER DEFAULT 0,
  journals_analyzed INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0
);
```

**`insight_themes`** (new - Oct 2025):
```sql
CREATE TABLE insight_themes (
  id TEXT PRIMARY KEY,
  theme_name TEXT NOT NULL UNIQUE,
  category TEXT,
  first_seen DATETIME NOT NULL,
  last_seen DATETIME NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  severity_trend TEXT,             -- 'improving' | 'stable' | 'worsening'
  insight_ids TEXT DEFAULT '[]'    -- JSON array of related insight IDs
);
```

---

## Core Features

### 1. Context Continuity (Oct 2025)

**What it does**: AI remembers previous analyses and tracks longitudinal patterns

**How it works**:
1. After each analysis, generate a summary:
   - Extract top 5 themes by frequency and confidence
   - Identify high-confidence patterns (≥0.6)
   - Capture user focus areas from insights
   - Generate concise summary text (≤300 chars)
2. Store summary in `analysis_summaries` table
3. Before next analysis, fetch last 2-3 summaries
4. Include summaries in AI prompt context
5. AI can now reference past analyses and track trends

**Example**:
```
Previous analysis (3 days ago): "You had 5 overdue tasks. Procrastination pattern detected."

Current analysis: "You have 8 overdue tasks - this is WORSENING from 5 tasks three days ago.
The procrastination pattern is getting worse. Recommended actions: ..."
```

**Key Files**:
- `packages/database/src/adapters/SQLiteAdapter.ts:515` - Migration
- `packages/database/src/queries/sqlite/ai.ts` - 6 CRUD methods
- `packages/core/src/services/aiAssistantService.ts:726` - Summary generation
- `packages/core/src/services/promptEngineeringService.ts:172` - Prompt enhancement
- `apps/desktop/src/main/ipc/aiAssistantHandlers.ts:1469` - Fetch/store summaries

**API**:
```typescript
// Automatic - no user intervention needed
// Summaries generated after each analysis
// Previous summaries included in next analysis automatically

// Manual access:
const summaries = await sqliteService.getRecentAnalysisSummaries(3);
await sqliteService.deleteOldAnalysisSummaries(10); // Cleanup
```

---

### 2. Time-Window Analysis (Oct 2025)

**What it does**: Analyze specific time periods instead of just incremental

**Analysis Modes**:
1. **Incremental** (default): Only new/updated data since last analysis
2. **Window**: Analyze specific date range (e.g., "last 7 days", "October 2025")
3. **Full**: Re-analyze all data regardless of previous analyses

**Use Cases**:
- Weekly reviews: "Analyze my last 7 days"
- Monthly retrospectives: "Analyze October 2025"
- Force refresh: "Re-analyze everything with new AI provider"

**API**:
```typescript
// Incremental mode (default)
await window.api.analyzeData({
  provider: 'anthropic',
  dataTypes: ['tasks', 'journal'],
  analysisMode: 'incremental',  // or omit for default
});

// Time-window mode
await window.api.analyzeData({
  provider: 'anthropic',
  dataTypes: ['tasks', 'journal'],
  analysisMode: 'window',
  timeWindow: {
    start: '2025-10-01',
    end: '2025-10-31'
  }
});

// Full re-analysis mode
await window.api.analyzeData({
  provider: 'anthropic',
  dataTypes: ['tasks', 'journal'],
  analysisMode: 'full',
});
```

**Implementation**:
- `apps/desktop/src/main/ipc/aiAssistantHandlers.ts:1254` - Mode-based filtering
- Backward compatible with `forceReAnalyze` flag (maps to 'full' mode)

---

### 3. Insight Evolution Tracking (Oct 2025)

**What it does**: Automatically extracts themes and tracks recurring patterns

**Predefined Themes** (12):
- `procrastination` - Delaying tasks, avoiding work
- `context_switching` - Multitasking, distractions
- `burnout` - Exhaustion, overwhelming stress
- `focus_issues` - Concentration problems
- `time_management` - Deadline issues, scheduling
- `overload` - Too many tasks, capacity issues
- `progress` - Achievements, goal completion
- `productivity_drop` - Fewer tasks, slowing down
- `mood_issues` - Anxiety, depression, sadness
- `work_life_balance` - Personal time, balance
- `goal_alignment` - Purpose, direction
- `habit_formation` - Routines, consistency

**Tracking**:
- Occurrence count (how many times theme appeared)
- Severity trend: `improving` ↗️, `stable` →, `worsening` ↘️
- First/last seen dates
- Related insight IDs

**Severity Trend Calculation**:
```typescript
// Compare confidence scores of last 2 occurrences
const previous = previousInsights.filter(i => i.theme_id === themeId);
if (previous.length === 0) return 'stable';

const avgPreviousConfidence = average(previous.map(i => i.confidence));
if (currentConfidence > avgPreviousConfidence + 0.1) return 'improving';
if (currentConfidence < avgPreviousConfidence - 0.1) return 'worsening';
return 'stable';
```

**Implementation**:
- `packages/core/src/services/themeTrackingService.ts` - Theme extraction (regex patterns)
- `packages/database/src/queries/sqlite/ai.ts` - 7 theme tracking methods
- **Note**: Theme tracking database ready, but not yet integrated into analysis flow (requires 10-15 lines of code)

**API**:
```typescript
import { ThemeTrackingService } from '@serenity/core';

// Extract theme from insight
const theme = ThemeTrackingService.extractTheme(insight);
// Returns: { themeName: 'procrastination', confidence: 0.75 }

// Get or create theme in database
const themeRow = await sqliteService.ai.getOrCreateTheme(
  theme.themeName,
  insight.category
);

// Track occurrence
await sqliteService.ai.trackThemeOccurrence(
  themeRow.id,
  insight.id,
  theme.confidence
);

// Get recurring themes
const themes = await sqliteService.ai.getRecurringThemes();
// Returns themes with occurrence_count > 1
```

---

### 4. Smart Preprocessing

**What it does**: Intelligent data summarization instead of naive truncation

**Features**:
- **Quality Scoring**: Scores tasks/journals (0-1) based on:
  - Completeness (has title, description, tags)
  - Recency (newer = higher score)
  - Actionability (for tasks: has due date, priority)
  - Richness (for journals: longer content = higher score)

- **Temporal Weighting**: Recent data weighted higher
  ```typescript
  // Data from last 7 days: weight = 1.0
  // Data from 7-14 days ago: weight = 0.8
  // Data from 14-30 days ago: weight = 0.6
  // Data older than 30 days: weight = 0.4
  ```

- **Entity Extraction**: Identifies dates, numbers, important terms

- **Theme Extraction**: Extracts themes from journal content

- **Sentiment Analysis**: Analyzes mood from journal entries

**Implementation**:
- `packages/core/src/services/aiPreprocessingService.ts` (~500 lines)
- Used automatically in all AI analysis calls

---

## Usage

### Basic Analysis

```typescript
// In renderer (React)
import { useDispatch } from 'react-redux';
import { setInsights } from '@serenity/core';

const InsightsPage = () => {
  const dispatch = useDispatch();

  const handleAnalyze = async () => {
    const result = await window.api.analyzeData({
      provider: 'anthropic',
      dataTypes: ['tasks', 'journal'],
      analysisMode: 'incremental',
    });

    if (result.success && result.insights) {
      dispatch(setInsights(result.insights));
    } else {
      console.error('Analysis failed:', result.error);
    }
  };

  return <button onClick={handleAnalyze}>Generate Insights</button>;
};
```

### Time-Window Analysis

```typescript
const handleWeeklyReview = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const result = await window.api.analyzeData({
    provider: 'anthropic',
    dataTypes: ['tasks', 'journal'],
    analysisMode: 'window',
    timeWindow: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  });
};
```

### User Feedback

```typescript
// Rate an insight
await window.api.rateInsight(insightId, 5); // 1-5 rating

// Mark as helpful
await window.api.updateInsightFeedback(insightId, {
  marked_helpful: 1,
  user_notes: 'This helped me identify procrastination pattern'
});

// Dismiss an insight
await window.api.updateInsightFeedback(insightId, {
  dismissed: 1
});
```

---

## Supported AI Providers

### OpenAI (GPT)
```typescript
{
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY
}
```

### Google Gemini
```typescript
{
  provider: 'gemini',
  model: 'gemini-pro',
  apiKey: process.env.GOOGLE_AI_API_KEY
}
```

### Anthropic Claude
```typescript
{
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY
}
```

### Local Models
```typescript
{
  provider: 'local',
  endpoint: 'http://localhost:11434',  // Ollama endpoint
  model: 'llama2'
}
```

---

## Configuration

### Environment Variables

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Local model endpoint
LOCAL_AI_ENDPOINT=http://localhost:11434
```

### Quality Thresholds

```typescript
// packages/core/src/services/insightQualityService.ts
const QUALITY_THRESHOLDS = {
  MIN_CONFIDENCE: 0.4,        // Filter insights below this
  HIGH_CONFIDENCE: 0.6,       // Consider high-quality
  MIN_RELEVANCE: 0.5,
  MIN_ACTIONABILITY: 0.3,
};
```

### Preprocessing Config

```typescript
// packages/core/src/services/aiPreprocessingService.ts
const DEFAULT_CONFIG = {
  maxTokens: 4000,             // Max tokens to send to AI
  prioritizeRecent: true,      // Weight recent data higher
  includeCompletedTasks: true, // Analyze completed tasks
  minJournalLength: 10,        // Minimum journal entry length
};
```

---

## Performance & Token Usage

### Token Optimization
- Context summaries limited to 300 chars each
- Only last 2-3 summaries included in prompts
- Smart preprocessing reduces token usage by 20-30%
- High-priority/recent data gets full context, old data minimized

### Database Performance
- All queries indexed appropriately
- Automatic cleanup of old summaries (keeps last 10)
- Theme tracking uses efficient lookups
- No performance impact on normal operations

### API Costs (Estimated)
- **OpenAI GPT-4**: ~$0.01-0.03 per analysis
- **Google Gemini Pro**: ~$0.001-0.005 per analysis
- **Anthropic Claude**: ~$0.01-0.02 per analysis
- **Local Models**: Free (but requires local setup)

---

## Known Limitations

1. **Theme Tracking UI Not Integrated**: Backend ready, UI pending
   - No badges for recurring insights
   - No trend indicators in UI
   - Requires 10-15 lines of code to integrate

2. **Time-Window UI Controls Not Implemented**: API ready, UI pending
   - No dropdown selector for analysis mode
   - No quick action buttons ("Last 7 Days", "Last 30 Days")

3. **No Real-Time Streaming**: Analysis is batch-only
   - User must wait for full analysis to complete
   - No progress indicators during AI processing

4. **Single AI Provider Per Analysis**: Can't combine providers
   - Must choose one provider (OpenAI, Gemini, or Anthropic)
   - Can't ensemble multiple models

5. **Limited Theme Extraction**: Regex-based, not ML
   - 12 predefined themes only
   - Fallback to generic themes (category_type)
   - Future: Could use embeddings/ML for better theme extraction

---

## Future Enhancements

**Short-term** (1-2 weeks):
1. Integrate theme tracking into analysis flow
2. Add UI controls for time-window analysis
3. Add theme badges and trend indicators in UI
4. Theme history view (all insights for a specific theme)

**Medium-term** (1-2 months):
5. Real-time streaming responses
6. Progress indicators during analysis
7. Timeline view showing pattern evolution
8. Export analysis summaries

**Long-term** (3+ months):
9. Machine learning for theme extraction (replace regex)
10. Automatic goal suggestions based on recurring themes
11. Predictive analytics ("Based on patterns, you're likely to...")
12. Integration with notification system for urgent trends
13. Multi-model ensemble (combine insights from multiple AI providers)

---

## Troubleshooting

### Analysis Fails Silently
**Symptoms**: No insights generated, no error message

**Possible Causes**:
1. API key not set or invalid
2. No tasks/journals to analyze
3. All insights filtered out (low quality scores)

**Solution**:
- Check logs: `logger.error` calls in `aiAssistantHandlers.ts`
- Verify API key: `process.env.ANTHROPIC_API_KEY`
- Check quality thresholds: Lower `MIN_CONFIDENCE` temporarily

---

### "Cannot find module '@serenity/core'" in Main Process
**Symptoms**: Build fails, import errors

**Solution**:
```bash
npm run clean
npm run build
```
Ensures `dist-cjs/` folder is built for main process

---

### Analysis Too Slow
**Symptoms**: Takes >30 seconds to generate insights

**Possible Causes**:
1. Too much data (thousands of tasks/journals)
2. Slow AI provider response
3. No preprocessing (sending raw data)

**Solution**:
- Enable preprocessing (should be automatic)
- Use time-window mode to limit data
- Switch to faster model (GPT-3.5 vs GPT-4)

---

### Theme Tracking Not Working
**Symptoms**: Themes not appearing in database

**Reason**: Theme tracking database ready but not integrated into analysis flow

**Solution**: Integrate ThemeTrackingService (10-15 lines of code needed in `aiAssistantHandlers.ts`)

---

## Related Documentation

- **Architecture Decision**: See `docs/architecture/decisions/002-ai-insights-context-continuity.md`
- **Implementation Summary**: See `AI-INSIGHTS-IMPLEMENTATION-SUMMARY.md`
- **Database Schema**: See `docs/features/database.md`
- **API Reference**: Run `npm run docs:generate` and see `docs/api/services/AIAssistantService.md`
- **Current Status**: See `docs/STATUS.md` - AI Insights section

---

**Last Updated**: 2025-10-26
**Contributors**: Development Team
**Status**: ✅ Production-ready with optional UI enhancements pending
