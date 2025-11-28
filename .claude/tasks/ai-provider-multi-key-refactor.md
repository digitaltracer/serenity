# AI Provider Multi-Key Configuration Refactor

## Overview
Refactor the AI provider configuration system to support multiple API keys per provider with automatic failover, unified UI, and centralized management.

## Current Issues
1. ❌ One API key per provider limit
2. ❌ No automatic failover if a key fails/rate-limited
3. ❌ Separate UI inputs for each provider (not scalable)
4. ❌ Inconsistent storage (files + database)
5. ❌ No key naming or organization
6. ❌ No rotation/expiration tracking

## Goals
1. ✅ Store multiple API keys per provider in database
2. ✅ Unified "Add Provider" UI with provider picker + key input + name
3. ✅ Automatic failover to next key on failure
4. ✅ Validate API keys before saving
5. ✅ Track key usage, errors, and last used timestamp
6. ✅ Enable/disable individual keys
7. ✅ Set key priority for failover order

## Architecture Changes

### 1. Database Schema Changes

#### New Table: `ai_provider_credentials`
```sql
CREATE TABLE IF NOT EXISTS ai_provider_credentials (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
  name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_preference TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Usage tracking
  last_used_at TEXT,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TEXT,

  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Indexes
  UNIQUE(provider, name)
);

CREATE INDEX idx_ai_credentials_provider ON ai_provider_credentials(provider);
CREATE INDEX idx_ai_credentials_enabled ON ai_provider_credentials(enabled);
CREATE INDEX idx_ai_credentials_priority ON ai_provider_credentials(priority DESC);
```

#### Update: `secure_settings` table
- Keep for general AI settings (activeProvider, autoAnalyze, etc.)
- Remove individual API key storage

#### Migration Strategy
- Create migration script to move existing keys to new table
- Set default names: "OpenAI Key 1", "Anthropic Key 1", etc.
- Default priority: 0 for all existing keys
- All existing keys enabled by default

### 2. State Management (Redux)

#### New Interfaces
```typescript
// packages/core/src/types/ai.ts
export interface AIProviderCredential {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  name: string;
  modelPreference?: string;
  enabled: boolean;
  priority: number;

  // Usage stats
  lastUsedAt?: string;
  totalRequests: number;
  totalTokens: number;
  successCount: number;
  errorCount: number;
  lastError?: string;
  lastErrorAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderCredentialInput {
  provider: 'openai' | 'gemini' | 'anthropic';
  name: string;
  apiKey: string;
  modelPreference?: string;
  priority?: number;
}
```

#### Updated Redux Slice
```typescript
// packages/core/src/store/slices/aiAssistantSlice.ts

export interface AIAssistantState {
  // Provider credentials management
  credentials: AIProviderCredential[];
  isLoadingCredentials: boolean;
  credentialError?: string;

  // Provider management (simplified)
  activeProvider?: 'openai' | 'gemini' | 'anthropic';

  // ... rest of existing state
}

// New Actions
- fetchCredentials() - Load all credentials from DB
- addCredential(input: AIProviderCredentialInput) - Add new credential
- updateCredential(id: string, updates: Partial<AIProviderCredential>) - Update credential
- deleteCredential(id: string) - Remove credential
- testCredential(id: string) - Validate credential
- setCredentialPriority(id: string, priority: number) - Reorder failover
- toggleCredentialEnabled(id: string, enabled: boolean) - Enable/disable
```

### 3. Backend Service Changes

#### New AICredentialService
```typescript
// packages/core/src/services/aiCredentialService.ts

export class AICredentialService {
  /**
   * Get all credentials for a provider, sorted by priority
   */
  static async getCredentialsForProvider(
    provider: string,
    enabledOnly: boolean = true
  ): Promise<AIProviderCredential[]>

  /**
   * Get next available credential for provider
   * Skips recently failed keys (with exponential backoff)
   */
  static async getNextAvailableCredential(
    provider: string
  ): Promise<AIProviderCredential | null>

  /**
   * Record successful API call
   */
  static async recordSuccess(
    credentialId: string,
    tokensUsed: number
  ): Promise<void>

  /**
   * Record failed API call
   */
  static async recordError(
    credentialId: string,
    error: string
  ): Promise<void>

  /**
   * Validate credential with provider API
   */
  static async validateCredential(
    provider: string,
    apiKey: string
  ): Promise<{ valid: boolean; error?: string; modelInfo?: any }>
}
```

#### Updated AIAssistantService
```typescript
// packages/core/src/services/aiAssistantService.ts

// Add failover logic
static async callAIWithFailover(
  provider: string,
  prompt: string,
  options?: any
): Promise<{ response: any; credentialId: string }>

// Implement retry with exponential backoff
static async retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any>
```

### 4. IPC Handlers

#### New/Updated Handlers
```typescript
// apps/desktop/src/main/ipc/aiCredentialHandlers.ts (NEW FILE)

ipcMain.handle('ai-credentials:list', async () => {
  // Get all credentials (without decrypted keys)
});

ipcMain.handle('ai-credentials:add', async (event, input: AIProviderCredentialInput) => {
  // 1. Validate API key format
  // 2. Test with provider API
  // 3. Encrypt API key
  // 4. Store in database
  // 5. Return credential (without key)
});

ipcMain.handle('ai-credentials:update', async (event, id: string, updates) => {
  // Update credential metadata (not the key itself)
});

ipcMain.handle('ai-credentials:delete', async (event, id: string) => {
  // Remove credential from DB
});

ipcMain.handle('ai-credentials:test', async (event, id: string) => {
  // Test credential by making API call
});

ipcMain.handle('ai-credentials:reorder', async (event, priorities: { id: string; priority: number }[]) => {
  // Update priorities for failover order
});
```

#### Updated Existing Handlers
```typescript
// apps/desktop/src/main/ipc/aiAssistantHandlers.ts

// Update analyze-data to use failover
ipcMain.handle('ai-assistant:analyze-data', async (event, params) => {
  const provider = params.provider || settings.activeProvider;

  // Try credentials in order until one succeeds
  const credentials = await getCredentialsForProvider(provider, true);

  for (const credential of credentials) {
    try {
      const result = await callAIWithCredential(credential, prompt);
      await recordSuccess(credential.id, result.tokensUsed);
      return result;
    } catch (error) {
      await recordError(credential.id, error.message);
      // Continue to next credential
    }
  }

  throw new Error(`All API keys for ${provider} failed`);
});
```

### 5. UI Changes

#### New Component: `AIProviderCredentialManager`
Location: `packages/ui/src/components/ai/AIProviderCredentialManager.tsx`

```typescript
interface Props {
  credentials: AIProviderCredential[];
  onAdd: (input: AIProviderCredentialInput) => void;
  onUpdate: (id: string, updates: Partial<AIProviderCredential>) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onReorder: (priorities: { id: string; priority: number }[]) => void;
}

// Features:
// - List view with drag-to-reorder (priority)
// - "Add New Credential" button
// - Each credential shows: name, provider, status, usage stats
// - Actions: Edit (name/model only), Delete, Test, Enable/Disable
```

#### New Component: `AddCredentialModal`
Location: `packages/ui/src/components/ai/AddCredentialModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: AIProviderCredentialInput) => void;
  isValidating?: boolean;
}

// Features:
// - Provider selector (OpenAI, Gemini, Anthropic)
// - API key input (password field)
// - Name input (auto-suggest: "OpenAI Key 1", etc.)
// - Model preference dropdown (optional)
// - Priority input (default: 0)
// - Test button (validates before saving)
// - Save button (only enabled after successful test)
```

#### Updated: `SettingsPage.tsx`
Location: `apps/desktop/src/renderer/pages/SettingsPage.tsx`

Replace individual provider inputs with:
```tsx
<AIProviderCredentialManager
  credentials={credentials}
  onAdd={handleAddCredential}
  onUpdate={handleUpdateCredential}
  onDelete={handleDeleteCredential}
  onTest={handleTestCredential}
  onReorder={handleReorderCredentials}
/>
```

### 6. Database Queries

#### New Query Functions
```typescript
// packages/database/src/queries/sqlite/aiCredentials.ts (NEW FILE)

export async function listAICredentials(db: Database): Promise<AIProviderCredential[]>

export async function getAICredential(db: Database, id: string): Promise<AIProviderCredential | null>

export async function getAICredentialsByProvider(
  db: Database,
  provider: string,
  enabledOnly: boolean = true
): Promise<AIProviderCredential[]>

export async function createAICredential(
  db: Database,
  input: AIProviderCredentialInput & { apiKeyEncrypted: string }
): Promise<AIProviderCredential>

export async function updateAICredential(
  db: Database,
  id: string,
  updates: Partial<AIProviderCredential>
): Promise<void>

export async function deleteAICredential(db: Database, id: string): Promise<void>

export async function recordCredentialUsage(
  db: Database,
  id: string,
  success: boolean,
  tokensUsed?: number,
  error?: string
): Promise<void>
```

## Implementation Plan

### Phase 1: Database & Core Services (MVP)
**Tasks:**
1. Create migration script for `ai_provider_credentials` table
2. Implement database query functions
3. Create `AICredentialService` with core methods
4. Update `AIAssistantService` with failover logic
5. Write unit tests for failover logic

**Dependencies:** None
**Time Estimate:** 4-6 hours

### Phase 2: Backend & IPC (API Layer)
**Tasks:**
1. Create new IPC handlers file (`aiCredentialHandlers.ts`)
2. Implement all CRUD handlers
3. Update `analyze-data` handler with failover
4. Add encryption/decryption for API keys
5. Update IPC type definitions
6. Test IPC handlers

**Dependencies:** Phase 1
**Time Estimate:** 3-4 hours

### Phase 3: State Management (Redux)
**Tasks:**
1. Update Redux slice interfaces
2. Add new actions and thunks
3. Add reducers for credential management
4. Update existing actions to use new credential system
5. Add selectors for credential filtering/sorting

**Dependencies:** Phase 2
**Time Estimate:** 2-3 hours

### Phase 4: UI Components (React)
**Tasks:**
1. Create `AddCredentialModal` component
2. Create `AIProviderCredentialManager` component
3. Create `CredentialListItem` component with drag-and-drop
4. Update `SettingsPage` to use new components
5. Add loading states and error handling
6. Style with Tailwind (match existing design)

**Dependencies:** Phase 3
**Time Estimate:** 4-5 hours

### Phase 5: Migration & Testing (Quality Assurance)
**Tasks:**
1. Create data migration script for existing API keys
2. Test migration on sample data
3. End-to-end testing of entire flow
4. Test failover scenarios (rate limit, invalid key, network error)
5. Test with multiple keys per provider
6. Performance testing (100+ credentials)
7. Update documentation

**Dependencies:** Phase 4
**Time Estimate:** 3-4 hours

## Total Estimated Time: 16-22 hours

## Risk Assessment

### High Risk
- **Data Loss:** Existing API keys must be migrated safely
  - **Mitigation:** Backup before migration, rollback plan
- **Breaking Changes:** Existing UI components depend on old structure
  - **Mitigation:** Phased rollout, feature flag

### Medium Risk
- **Failover Logic:** Complex edge cases (all keys failing, rate limits)
  - **Mitigation:** Comprehensive unit tests, exponential backoff
- **Encryption:** Must maintain backward compatibility
  - **Mitigation:** Keep existing encryption method

### Low Risk
- **UI Changes:** Well-scoped component changes
- **Database Schema:** Additive changes only

## Success Criteria

1. ✅ Users can add multiple API keys per provider
2. ✅ Users can name and organize their keys
3. ✅ Automatic failover works without user intervention
4. ✅ All existing API keys are migrated successfully
5. ✅ No data loss or security regressions
6. ✅ UI is intuitive and matches existing design
7. ✅ System handles rate limits and errors gracefully

## Rollback Plan

If issues arise:
1. Revert UI changes (restore old SettingsPage)
2. Keep new database table (no harm)
3. Restore old IPC handlers
4. Document issues for future attempt

## Future Enhancements (Out of Scope)

- [ ] Cost tracking per credential
- [ ] Quota limits per credential
- [ ] Credential expiration warnings
- [ ] Team/workspace credential sharing
- [ ] Credential usage analytics dashboard
- [ ] Import/export credentials (encrypted)
- [ ] Webhook notifications on failures

## Design Decisions (APPROVED)

1. **Priority System:** ✅ User drag-and-drop ordering in UI determines priority
   - Display message: "Drag to reorder. AI will try keys from top to bottom."
   - Lower priority number = try first (priority 0, 1, 2, 3...)

2. **Failover Cooldown:** ✅ Simple retry logic
   - On failure: Wait 30s, retry same key once
   - If still fails: Move to next key in list
   - No exponential backoff, no auto-disable

3. **Auto-Disable:** ✅ NO auto-disable
   - Show all failure attempts in token usage table
   - Let user manually disable problematic keys

4. **Cross-Provider Failover:** ✅ Single ordered list across ALL providers
   - Example order: OpenAI Key 1 → Anthropic Key 1 → OpenAI Key 2 → Gemini Key 1
   - System tries keys in exact user-specified order regardless of provider
   - Removes concept of "active provider" - just uses first available key

5. **Model Selection:** ✅ Per-credential model preference
   - Fetch available models from provider after validating API key
   - Store model preference with credential
   - User can edit credential to change name and model

6. **UI Location:** ✅ Keep in Settings page
   - Replace existing AI Provider Configuration section

7. **Migration:** ✅ Keep old encrypted files as backup
   - Migrate existing keys with default names and priority
   - Keep old files for manual recovery if needed

## Notes

- All API keys remain encrypted at rest using Electron safeStorage
- Database stores encrypted strings, never plain text
- Credentials are decrypted only in memory, only in main process
- Renderer process never sees decrypted API keys
- Failed credentials are logged for debugging but errors sanitized
- Usage tracking helps identify problematic keys early

---

**Ready to begin implementation?** Please review this plan and approve before I start coding.
