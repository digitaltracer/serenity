# Web App Status

## Current State (as of 2025-11-10)

The web app now has feature parity with the desktop app in terms of available pages and routing. All major functionality is accessible through the web interface.

### Shared Pages (Cross-Platform)

These pages are in `packages/ui/src/pages/` and work on both desktop (Electron) and web (Next.js):

| Page | Status | Description |
|------|--------|-------------|
| **HomePage** | ✅ Complete | AI-powered quick-add, recent activity, smart cards |
| **TodayPage** | ✅ Complete | Today's tasks, overdue items, inline editing |
| **GoalsPage** | ✅ Complete | Goal tracking and progress (placeholder) |
| **InsightsPage** | ✅ Complete | AI insights summary (simplified version) |
| **DatabasePage** | ✅ Complete | Database management (placeholder) |
| **IntegrationsPage** | ✅ Complete | Integration settings (placeholder) |
| **SummaryPage** | ✅ Complete | Activity summary (placeholder) |

### Desktop-Only Pages (Not Yet Migrated)

These pages remain in `apps/desktop/src/renderer/pages/` and need platform service integration before migration:

| Page | Size | Why Not Migrated | Priority |
|------|------|------------------|----------|
| **ActionHubPage** | 50KB | Complex task management with drag-drop, requires IPC for operations | High |
| **AnalyticsPage** | 7KB | Analytics and charts, mostly Redux-based, could migrate | Medium |
| **InsightsHubPage** | 40KB | Full AI insights with analysis, requires platform service for AI calls | High |
| **JournalPage** | 10KB | Journal entry management, mostly Redux-based | Medium |
| **SettingsPage** | 39KB | Uses `window.electronAPI` for AI usage/settings, needs platform service | High |

### Web App Routing

All routes are functional in `/apps/web/src/app/(dashboard)/`:

```
/home          → HomePage (shared)
/today         → TodayPage (shared)
/actionhub     → Custom implementation (needs migration)
/journal       → Custom implementation (needs migration)
/goals         → GoalsPage (shared)
/analytics     → Custom implementation (needs migration)
/insights      → InsightsPage (shared)
/settings      → Custom implementation (needs migration)
/database      → DatabasePage (shared)
/integrations  → IntegrationsPage (shared)
/summary       → SummaryPage (shared)
```

## Platform Service Integration

### ✅ Implemented Operations

- `aiQuickAdd()` - Process natural language into tasks/journals
- `aiGetSettings()` - Get AI provider configuration
- `aiSetApiKey()` - Store API keys
- `aiRemoveApiKey()` - Delete API keys
- `aiListUsage()` - Get AI usage statistics
- `aiAnalyze()` - Run AI analysis
- `aiGenerateSummary()` - Generate summaries

### 📝 API Routes Created

| Route | Method | Description | Status |
|-------|--------|-------------|--------|
| `/api/ai/quick-add` | POST | Process natural language input | ✅ |
| `/api/ai/settings` | GET/PUT | AI provider settings | ✅ |
| `/api/ai/api-key` | POST/DELETE | Manage API keys | ✅ |
| `/api/ai/usage` | GET | Retrieve usage statistics | ✅ |

### 🚧 Missing API Routes

These are needed for full feature parity with desktop:

| Route | Methods | Purpose | Required For |
|-------|---------|---------|--------------|
| `/api/ai/analyze` | POST | Run AI analysis on data | InsightsHubPage |
| `/api/ai/summary` | POST | Generate AI summaries | SummaryPage |
| `/api/database/stats` | GET | Database statistics | DatabasePage |
| `/api/database/backup` | POST | Trigger backup | DatabasePage |
| `/api/integrations/google/auth` | GET | Google OAuth flow | IntegrationsPage |
| `/api/integrations/google/sync` | POST | Sync Google Calendar | IntegrationsPage |
| `/api/integrations/github/auth` | GET | GitHub OAuth flow | IntegrationsPage |
| `/api/integrations/github/sync` | POST | Sync GitHub issues | IntegrationsPage |

## Next Steps

### Phase 1: Complete Shared Page Migration (Priority: High)

1. **SettingsPage**: Update to use `platformService` for AI operations
   - Replace `window.electronAPI.aiAssistant.listUsage()` → `platformService.aiListUsage()`
   - Replace `window.electronAPI.aiAssistant.removeApiKey()` → `platformService.aiRemoveApiKey()`
   - Move to `packages/ui/src/pages/`

2. **InsightsHubPage**: Integrate platform service for AI analysis
   - Add AI analysis operations to platform service
   - Create `/api/ai/analyze` route
   - Move to `packages/ui/src/pages/`

3. **ActionHubPage**: Abstract task operations
   - Most operations are Redux-based (already works)
   - Needs drag-drop file upload abstraction if applicable
   - Move to `packages/ui/src/pages/`

### Phase 2: Enhance Existing Pages (Priority: Medium)

4. **AnalyticsPage**: Can migrate as-is (mostly Redux)
5. **JournalPage**: Can migrate as-is (mostly Redux)

### Phase 3: Additional API Routes (Priority: Low)

6. Implement database and integration API routes for web platform

## Testing Checklist

- [ ] Verify all shared pages render correctly in web app
- [ ] Test navigation between all pages
- [ ] Confirm AI quick-add works on web (requires API key setup)
- [ ] Validate Redux state persistence across page refreshes
- [ ] Test responsive design on mobile devices
- [ ] Verify dark mode works on all pages

## Known Limitations

1. **AI Features**: Require API key configuration in database (not yet implemented in web UI)
2. **File Operations**: Desktop backup/export features not available in web
3. **OAuth Flows**: Integration auth flows need web-specific implementation
4. **Offline Support**: Desktop has SQLite, web requires network for all operations
