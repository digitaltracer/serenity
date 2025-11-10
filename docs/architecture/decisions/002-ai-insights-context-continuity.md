# ADR-002: AI Insights Context Continuity with Analysis Summaries

**Date**: 2025-10-25
**Status**: Accepted
**Author**: Development Team

## Context

The AI Insights feature generates productivity insights by analyzing user tasks and journal entries. Originally, each analysis was independent - the AI had no memory of previous analyses and couldn't track longitudinal patterns.

**Problem**: Users wanted to know:
- "Is my procrastination pattern getting better or worse?"
- "Did the AI's previous recommendations help?"
- "How do current insights compare to last week's analysis?"

The original implementation:
- Analyzed only new/updated data (incremental mode)
- No historical context in AI prompts
- No way to track if insights were recurring or one-time
- Each analysis was a "fresh start" with no memory

We needed a way to give the AI "memory" of previous analyses while:
- Keeping token usage reasonable (not sending full history every time)
- Enabling longitudinal pattern tracking
- Allowing AI to build on past insights
- Supporting trend analysis (improving/worsening patterns)

## Decision

Implement **Context Continuity** by:

1. **Storing Analysis Summaries**: After each analysis, generate and store a concise summary containing:
   - Top insights from the session
   - Key themes identified
   - Tracked patterns (high-confidence insights)
   - User focus areas and active goals
   - Metadata (tasks/journals analyzed, insights generated)

2. **Including Previous Summaries in Future Prompts**: When generating new insights, automatically fetch the last 2-3 analysis summaries and include them in the AI prompt's context

3. **Database Table**: New `analysis_summaries` table to persist summaries
   - Automatic cleanup (keeps last 10 summaries by default)
   - Indexed by creation date for fast retrieval
   - JSON fields for themes, patterns, focus areas

4. **Token Optimization**: Summaries are concise (≤300 chars each), only recent summaries included (2-3 max)

## Consequences

### Positive

- **Longitudinal Tracking**: AI can now say "Your productivity decreased from last week" or "The focus issue identified 3 days ago has improved"
- **Better Recommendations**: AI builds on past advice, avoiding repetition and providing progressive guidance
- **Trend Analysis**: Users can see if patterns are improving, stable, or worsening over time
- **Context-Aware**: AI remembers user's goals, focus areas, and previous challenges
- **Automatic**: No user intervention needed - summaries created and used automatically
- **Efficient**: Token usage kept reasonable through concise summaries and limits

### Negative

- **Storage Growth**: Analysis summaries accumulate over time
  - Mitigated: Automatic cleanup keeps only last 10 summaries
  - Database impact: Minimal (~1-2 KB per summary)
- **Prompt Complexity**: Including summaries makes prompts longer
  - Mitigated: Only 2-3 most recent summaries, each ≤300 chars
  - Total overhead: ~600-900 chars per analysis
- **Dependency**: Future analyses depend on previous summaries being available
  - Mitigated: System works fine if no previous summaries exist (graceful degradation)

### Neutral

- **Summary Quality**: Accuracy depends on quality of AI-generated insights
  - If insights are poor, summaries will be poor
  - Quality scoring helps by filtering low-confidence insights
- **Backward Compatibility**: Existing analysis flow unchanged for users
  - Summaries added transparently in the background

## Alternatives Considered

### Alternative 1: Send Full History

**Description**: Include all previous insights in every analysis prompt

**Pros**:
- Complete context, nothing lost
- AI has full picture of user's journey
- Most accurate for trend analysis

**Cons**:
- Token usage grows linearly with history
- Expensive and slow (100+ insights = thousands of tokens)
- Hits context limits eventually
- Much higher AI API costs

**Why not chosen**: Not scalable. Token costs would be prohibitive for long-term users.

---

### Alternative 2: User-Visible History Panel

**Description**: Show previous insights in UI, let user manually reference them

**Pros**:
- User has full control
- No automatic token usage
- Transparent to user

**Cons**:
- Requires manual effort from user
- AI doesn't automatically build on past insights
- Breaks flow of automatic analysis
- User must remember to reference past insights

**Why not chosen**: Against design goal of automatic, intelligent analysis. We want the AI to be smart without user intervention.

---

### Alternative 3: Embedding-Based Semantic Search

**Description**: Store embeddings of previous insights, retrieve relevant ones using vector similarity

**Pros**:
- Highly relevant context (only related past insights)
- Scales well with large history
- Advanced AI technique

**Cons**:
- Requires additional AI API calls (embedding generation)
- Complexity: vector database or similarity search
- Increased costs (embedding API calls)
- Slower analysis (additional API roundtrip)
- Overkill for current use case

**Why not chosen**: Over-engineered for current needs. Simple chronological summaries work well. Can revisit if scaling issues arise.

## Implementation Notes

**Key Files**:
- Database migration: `packages/database/src/adapters/SQLiteAdapter.ts:515` (`migrateAnalysisSummaries()`)
- Database queries: `packages/database/src/queries/sqlite/ai.ts` (6 new methods)
- Summary generation: `packages/core/src/services/aiAssistantService.ts:726` (`generateAnalysisSummary()`)
- Prompt enhancement: `packages/core/src/services/promptEngineeringService.ts:172` (includes previous summaries)
- IPC handler integration: `apps/desktop/src/main/ipc/aiAssistantHandlers.ts:1469` (fetch and store summaries)

**Database Schema**:
```sql
CREATE TABLE analysis_summaries (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  summary_text TEXT NOT NULL,           -- Concise summary (≤300 chars)
  key_themes TEXT,                       -- JSON array of theme names
  tracked_patterns TEXT,                 -- JSON array of pattern objects
  user_focus_areas TEXT,                 -- JSON array of focus areas
  tasks_analyzed INTEGER DEFAULT 0,
  journals_analyzed INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0
);
CREATE INDEX idx_analysis_summaries_created_at ON analysis_summaries (created_at);
```

**Summary Generation Logic**:
1. Extract top 5 themes by frequency and confidence
2. Filter high-confidence patterns (≥0.6)
3. Identify user focus areas from insights
4. Generate concise summary (top 3 insights)
5. Store with metadata

**Prompt Enhancement**:
```
PREVIOUS ANALYSIS HISTORY (for longitudinal tracking):

Analysis #1 (3 days ago):
You had 5 overdue tasks concentrated in "Work" project. Procrastination pattern detected.

Analysis #2 (1 day ago):
Overdue tasks increased to 8. Procrastination pattern WORSENING.

IMPORTANT: Compare current data with previous analyses. Identify:
- Patterns that are improving (celebrate progress!)
- Patterns that are worsening (provide support and actionable steps)
- Recurring themes (reference previous occurrences)
```

**Automatic Cleanup**:
```typescript
// Keeps last 10 summaries by default
await sqliteService.deleteOldAnalysisSummaries(10);
```

**Usage**:
Fully automatic - no code changes needed in renderer. Backend handles:
1. Fetch previous summaries before analysis
2. Include in prompt context
3. Generate new summary after analysis
4. Store in database
5. Cleanup old summaries

## Impact

**Before** (no context continuity):
```
User: Generate Insights

AI Analysis #1 (Monday):
"You have 5 overdue tasks. Consider reviewing your priorities."

AI Analysis #2 (Wednesday):
"You have 8 overdue tasks. Consider reviewing your priorities."
[No connection to Monday - can't see problem is worsening]
```

**After** (with context continuity):
```
User: Generate Insights

AI Analysis #1 (Monday):
"You have 5 overdue tasks. Consider reviewing your priorities."
[Summary stored]

AI Analysis #2 (Wednesday):
"You have 8 overdue tasks - this is WORSENING from 5 tasks two days ago.
The procrastination pattern identified in your previous analysis is getting worse.

Recommended Actions:
1. Block 2 hours today to tackle the 3 highest-priority overdue items
2. Reschedule or delegate the 5 lower-priority tasks
3. Consider what changed between Monday and today that caused this increase"

[Tracks this as recurring "procrastination" theme with "worsening" trend]
```

## Performance Impact

- **Query Time**: +20ms to fetch 2-3 summaries from database
- **Token Usage**: +600-900 tokens per analysis (negligible cost increase)
- **Storage**: ~1-2 KB per summary, max 10 summaries = 10-20 KB total
- **API Cost**: Minimal increase (~$0.001 per analysis with GPT-4)

**Overall**: Negligible performance impact, significant quality improvement

## References

- Implementation Summary: `AI-INSIGHTS-IMPLEMENTATION-SUMMARY.md`
- Related ADR: ADR-003 (Insight Evolution Tracking) - complements this with theme tracking
- Code: ~120 lines added to `aiAssistantService.ts`, ~47 lines to `SQLiteService.ts`
- PR: (to be added when merged)
