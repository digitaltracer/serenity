# Phase 2 Migration & Cleanup Notes

## Overview
This document tracks the migration from old AI Assistant and Analytics pages to the new InsightsHub architecture completed in Phase 2.

## Deprecated Components

### 1. AIAssistantPage
**Location**: `apps/desktop/src/renderer/pages/AIAssistantPage.tsx`

**Status**: ⚠️ DEPRECATED - Marked with deprecation notice (Phase 2)

**Replacement**:
- **AI Insights & Analytics** → `InsightsHubPage` (`#/insights`)
- **AI Provider Configuration** → `SettingsPage` > AI Section (`#/settings`)

**Migration Path**:
- ✅ Phase 2: Deprecation banner added to page with clear migration instructions
- 📅 Release +1: Keep page accessible with warning (gives users time to adjust)
- 📅 Release +2: Remove file entirely after ensuring all users have migrated

**What Users Need to Do**:
- Update bookmarks from `#/ai-assistant` to `#/insights` or `#/settings`
- No data migration required (all data already in SQLite database)

**Current Route**:
```typescript
// apps/desktop/src/renderer/App.tsx:386
<Route path="/ai-assistant" element={<AIAssistantPage />} />
```

---

### 2. AnalyticsPage
**Location**: `apps/desktop/src/renderer/pages/AnalyticsPage.tsx`

**Status**: ✅ REDIRECT ACTIVE

**Replacement**: `InsightsHubPage` (`#/insights`)

**Migration Path**:
- ✅ Phase 2: Route automatically redirects to InsightsHubPage
- 📅 Release +1: Keep redirect for backward compatibility
- 📅 Release +2: Can remove redirect and update any hard-coded links

**Current Route**:
```typescript
// apps/desktop/src/renderer/App.tsx:385
<Route path="/analytics" element={<InsightsHubPage />} />
```

---

## Data Migration

### AI Insights & Recaps
**Status**: ✅ NO MIGRATION NEEDED

**Reason**:
- Database schema was already enhanced in Phase 1 (Task 1.1)
- Insights are stored in `ai_insights` table with feedback fields
- Recaps are stored in `ai_recaps` table with interaction tracking
- All persistence is handled by SQLite (no localStorage dependency)

**Database Tables**:
- `ai_insights`: Enhanced with user_rating, dismissed, marked_helpful, user_notes, visualization_data, actionability_suggestions
- `ai_recaps`: Enhanced with viewed, favorited, exported fields
- `ai_usage`: Token usage tracking

**Query Methods Available** (`packages/database/src/queries/sqlite/ai.ts`):
- `addInsights()`, `listInsights()`, `getRecentInsights()`
- `addRecap()`, `listRecaps()`
- `updateInsightFeedback()`, `dismissInsight()`, `getInsightsFiltered()`
- `updateRecapInteraction()`, `getRecapsFiltered()`
- `addUsage()`, `listUsage()`
- `deleteOldDismissedInsights()` (cleanup utility)

---

## Navigation Changes

### Old Navigation Structure
```
Sidebar:
├── Home
├── Today
├── Action Hub
├── Journal
├── Goals
├── AI Assistant ❌ (deprecated)
├── Analytics ❌ (deprecated)
├── Integrations
└── Settings
```

### New Navigation Structure (Phase 2)
```
Sidebar:
├── Home
├── Today
├── Action Hub
├── Journal
├── Goals
├── Insights Hub ✨ (new - replaces AI Assistant + Analytics)
├── Integrations
└── Settings
```

**Note**: Navigation updates were completed in Phase 1, Task 1.7.

---

## Backward Compatibility

### Release Strategy

**Current Release (Phase 2 Complete)**:
- ✅ AIAssistantPage shows deprecation banner
- ✅ /analytics redirects to /insights
- ✅ All new features available in InsightsHubPage
- ✅ Database fully migrated (done in Phase 1)

**Release +1** (Next Release):
- Keep AIAssistantPage accessible with warning
- Monitor usage analytics to see if users have migrated
- Update any internal documentation
- Send in-app notification about deprecation

**Release +2** (2 Releases from now):
- Remove AIAssistantPage.tsx entirely
- Remove /ai-assistant route
- Update App.tsx to remove lazy import
- Clean up any remaining hooks/utilities specific to old page

---

## Testing Checklist

### Before Removing Files (Release +2):
- [ ] Confirm no users accessing /ai-assistant route (check analytics)
- [ ] Search codebase for hard-coded `#/ai-assistant` or `#/analytics` links
- [ ] Verify all bookmarks/shortcuts updated
- [ ] Test deep-linking scenarios
- [ ] Check for any external documentation referencing old routes

### Verification Commands:
```bash
# Search for hard-coded routes to old pages
grep -r "ai-assistant" apps/desktop/src/renderer --exclude-dir=node_modules
grep -r "/analytics" apps/desktop/src/renderer --exclude-dir=node_modules

# Search for component imports
grep -r "AIAssistantPage" apps/desktop/src --exclude-dir=node_modules
grep -r "AnalyticsPage" apps/desktop/src --exclude-dir=node_modules
```

---

## Rollback Plan

If critical issues are discovered with InsightsHubPage:

1. **Short-term** (Emergency):
   - Remove deprecation banner from AIAssistantPage
   - Update navigation to show both old and new pages
   - Communicate temporary rollback to users

2. **Medium-term** (Fix Issues):
   - Identify and fix issues in InsightsHubPage
   - Test thoroughly in staging environment
   - Re-deploy with fixes

3. **Long-term** (Resume Deprecation):
   - Re-add deprecation banner once issues resolved
   - Continue with original timeline (Release +1, +2)

**Feature Flag** (Optional for larger deployments):
```typescript
// config.ts
export const FEATURES = {
  USE_NEW_INSIGHTS_HUB: process.env.VITE_USE_NEW_INSIGHTS_HUB !== 'false',
};

// App.tsx
<Route
  path="/ai-assistant"
  element={FEATURES.USE_NEW_INSIGHTS_HUB ? <InsightsHubPage /> : <AIAssistantPage />}
/>
```

---

## Impact Assessment

### User Impact: 🟢 LOW
- Automatic redirects minimize disruption
- Clear migration path with prominent notices
- No data loss or manual migration required
- Feature parity maintained (all old features available in new location)

### Developer Impact: 🟡 MEDIUM
- Need to update any hard-coded route references
- Update tests referencing old pages
- Documentation updates required
- Timeline: 2-3 releases for complete removal

### Data Integrity: 🟢 NO RISK
- All data already in SQLite database
- No localStorage dependency
- Backward compatible database schema
- Rollback possible without data loss

---

## Completion Criteria

Phase 2 Migration is considered complete when:
- [x] Deprecation notices added to old pages
- [x] Routes updated (redirects or deprecation warnings)
- [x] New InsightsHubPage fully functional
- [x] Database schema supports all Phase 2 features
- [x] Migration documentation complete
- [ ] User analytics show <5% traffic to deprecated routes (Release +1)
- [ ] Old files removed from codebase (Release +2)

---

## Related Documentation

- Task file: `.claude/tasks/ai-insights-revamp.md`
- Database schema: `packages/database/src/schema/sqlite.sql` (ai_insights, ai_recaps tables)
- Query methods: `packages/database/src/queries/sqlite/ai.ts`
- New page: `apps/desktop/src/renderer/pages/InsightsHubPage.tsx`
- Deprecated page: `apps/desktop/src/renderer/pages/AIAssistantPage.tsx`

---

## Contact

For questions about this migration:
- See `CLAUDE.md` in project root for development guidelines
- Check `AI-IMPROVEMENTS-SUMMARY.md` for AI services architecture
- Review `.claude/tasks/ai-insights-revamp.md` for full Phase 2 requirements

---

**Last Updated**: Phase 2 Completion (2025)
**Next Review**: Release +1 (check usage analytics)
