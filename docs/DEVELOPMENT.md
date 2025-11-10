# Development Guide

This guide covers common development patterns, conventions, and best practices for Serenity Notes.

---

## Table of Contents

- [Common Development Tasks](#common-development-tasks)
- [Important Patterns & Conventions](#important-patterns--conventions)
- [Working with Different Layers](#working-with-different-layers)
- [Troubleshooting](#troubleshooting)

---

## Common Development Tasks

### Adding a New IPC Handler

1. Create handler in `apps/desktop/src/main/ipc/[domain]Handlers.ts`
2. Register in `apps/desktop/src/main/ipc/index.ts`
3. Add type definitions to `packages/core/src/types/ipc.ts`
4. Update preload script in `apps/desktop/src/main/preload.ts` if exposing new API to renderer

**Example**:
```typescript
// 1. Create handler (apps/desktop/src/main/ipc/myFeatureHandlers.ts)
import { ipcMain } from 'electron';
import { logger } from '@serenity/core';

export function registerMyFeatureHandlers() {
  ipcMain.handle('my-feature:doSomething', async (event, arg1, arg2) => {
    try {
      logger.info('Doing something', { component: 'myFeatureHandlers' });
      // Implementation
      return { success: true, data: result };
    } catch (error) {
      logger.error('Failed to do something', { component: 'myFeatureHandlers' }, error);
      return { success: false, error: (error as Error).message };
    }
  });
}

// 2. Register in apps/desktop/src/main/ipc/index.ts
import { registerMyFeatureHandlers } from './myFeatureHandlers';
// In registerIPCHandlers():
registerMyFeatureHandlers();

// 3. Add type (packages/core/src/types/ipc.ts)
export interface MyFeatureAPI {
  doSomething: (arg1: string, arg2: number) => Promise<{ success: boolean; data?: any; error?: string }>;
}

// 4. Update preload (apps/desktop/src/main/preload.ts)
myFeature: {
  doSomething: (arg1: string, arg2: number) => ipcRenderer.invoke('my-feature:doSomething', arg1, arg2)
}
```

---

### Adding a New Redux Slice

1. Create slice in `packages/core/src/store/slices/[feature]Slice.ts`
2. Add to root reducer in `packages/core/src/store/store.ts`
3. Export types from `packages/core/src/store/index.ts`
4. Use in renderer via `useSelector` and `useDispatch`

**Example**:
```typescript
// 1. Create slice (packages/core/src/store/slices/myFeatureSlice.ts)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MyFeatureState {
  items: any[];
  loading: boolean;
}

const initialState: MyFeatureState = {
  items: [],
  loading: false,
};

const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setItems, setLoading } = myFeatureSlice.actions;
export default myFeatureSlice.reducer;

// 2. Add to root reducer (packages/core/src/store/store.ts)
import myFeatureReducer from './slices/myFeatureSlice';

const rootReducer = {
  // ... existing reducers
  myFeature: myFeatureReducer,
};

// 3. Export from packages/core/src/store/index.ts
export * from './slices/myFeatureSlice';

// 4. Use in renderer
import { useSelector, useDispatch } from 'react-redux';
import { setItems } from '@serenity/core';
import type { RootState } from '@serenity/core';

const MyComponent = () => {
  const items = useSelector((state: RootState) => state.myFeature.items);
  const dispatch = useDispatch();

  const updateItems = (newItems: any[]) => {
    dispatch(setItems(newItems));
  };
};
```

---

### Database Changes

1. Modify schema in `packages/database/src/schema/`
2. Update SQLite adapter with migration method
3. Update query functions in `packages/database/src/queries/sqlite/`
4. If using PostgreSQL, update `packages/database/src/adapters/PostgresAdapter.ts` and `packages/database/src/queries/postgres/`

**Example (Adding a new table)**:
```typescript
// 1. Create migration method (packages/database/src/adapters/SQLiteAdapter.ts)
private async migrateMyNewTable(): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  try {
    const tableExists = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='my_new_table'
    `).get();

    if (!tableExists) {
      logger.info('Creating my_new_table...', { component: 'SQLiteAdapter' });

      this.db.exec(`
        CREATE TABLE my_new_table (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          value INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_my_new_table_name ON my_new_table (name);
      `);

      logger.info('✅ my_new_table created successfully');
    }
  } catch (error) {
    logger.error('Failed to migrate my_new_table', { component: 'SQLiteAdapter' }, error);
    throw error;
  }
}

// Call migration in createSchema() method:
await this.migrateMyNewTable();

// 2. Add query methods (packages/database/src/queries/sqlite/myNewTable.ts)
export class SQLiteMyNewTableQueries {
  constructor(private db: Database.Database) {}

  async create(name: string, value: number): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO my_new_table (id, name, value)
      VALUES (?, ?, ?)
    `).run(id, name, value);

    return { id };
  }

  async getAll(): Promise<any[]> {
    return this.db.prepare('SELECT * FROM my_new_table').all();
  }
}

// 3. Expose through SQLiteService (packages/database/src/sqlite/SQLiteService.ts)
private myNewTable: SQLiteMyNewTableQueries | null = null;

// In initialize():
this.myNewTable = new SQLiteMyNewTableQueries(db);

// Add public methods:
async createMyNewTableEntry(name: string, value: number) {
  this.ensureInitialized();
  return this.myNewTable!.create(name, value);
}
```

---

### Adding UI Components

1. Decide if component is reusable (add to `@serenity/ui`) or app-specific (add to `apps/desktop/src/renderer/components/`)
2. Use Tailwind CSS for styling
3. Export from appropriate index file
4. Import where needed

**Example (Reusable component)**:
```typescript
// 1. Create in packages/ui/src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <button
        onClick={onAction}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Click Me
      </button>
    </div>
  );
};

// 2. Export from packages/ui/src/components/index.ts
export { MyComponent } from './MyComponent';

// 3. Use in renderer
import { MyComponent } from '@serenity/ui';

const MyPage = () => {
  return <MyComponent title="Hello" onAction={() => console.log('Clicked!')} />;
};
```

---

### Working with AI Insights

See `docs/features/ai-insights.md` for comprehensive guide. Quick examples:

**Generating Insights**:
```typescript
// In renderer
const result = await window.api.analyzeData({
  provider: 'anthropic',
  dataTypes: ['tasks', 'journal'],
  analysisMode: 'incremental',  // 'incremental' | 'window' | 'full'
  timeWindow: {                   // optional, for 'window' mode
    start: '2025-10-01',
    end: '2025-10-31'
  }
});
```

**Database Operations**:
```typescript
// Get recent analysis summaries
const summaries = await sqliteService.getRecentAnalysisSummaries(3);

// Get recurring themes
const themes = await sqliteService.ai.getRecurringThemes();

// Cleanup old summaries (keeps last 10)
await sqliteService.deleteOldAnalysisSummaries(10);
```

---

### Working with Native Modules

- **better-sqlite3** is a native addon requiring compilation
- Rebuild after Node.js/Electron version changes: `cd apps/desktop && npm run rebuild`
- `postinstall` hook auto-rebuilds on `npm install`

**Manual rebuild**:
```bash
cd apps/desktop
npm run electron-rebuild
# or
npm rebuild better-sqlite3 --build-from-source
```

---

## Important Patterns & Conventions

### Logging

Always use the structured logger from `@serenity/core`:

```typescript
import { logger } from '@serenity/core';

// Log levels
logger.debug('Detailed information for debugging', { component: 'ComponentName' });
logger.info('General information', { component: 'ComponentName', operation: 'operationName' });
logger.warn('Warning condition', { component: 'ComponentName' });
logger.error('Error occurred', { component: 'ComponentName' }, error as Error);

// Include metadata
logger.info('Task created', {
  component: 'TaskService',
  operation: 'createTask',
  metadata: {
    taskId: task.id,
    priority: task.priority
  }
});
```

**Production builds**: `debug` and `trace` logs are automatically stripped via Vite plugin.

---

### Error Handling

**In IPC Handlers**:
```typescript
ipcMain.handle('feature:doSomething', async (event, ...args) => {
  try {
    // Implementation
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to do something', { component: 'featureHandlers' }, error as Error);
    return { success: false, error: (error as Error).message };
  }
});
```

**In React Components**:
```typescript
// Use Error Boundaries for graceful degradation
import { ErrorBoundary } from '../components/ErrorBoundary';

const MyPage = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <MyFeature />
    </ErrorBoundary>
  );
};
```

**Consistent Error Shapes**:
```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

### Type Safety

- **Strict TypeScript** mode enabled
- **No `any` types** - use `unknown` with type guards
- **Zod schemas** for runtime validation (especially IPC inputs)
- **Shared types** in `packages/core/src/types/`

**Example with Zod**:
```typescript
import { z } from 'zod';

const MySchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
});

type MyType = z.infer<typeof MySchema>;

// Validate at runtime
ipcMain.handle('feature:create', async (event, data) => {
  try {
    const validated = MySchema.parse(data);
    // Now validated is type-safe!
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
  }
});
```

---

### Security Best Practices

1. **Never store passwords in plain text**
   ```typescript
   // ✅ Good
   import { hashPassword, verifyPassword } from '@serenity/core';
   const hash = await hashPassword(password);

   // ❌ Bad
   const password = 'plain-text-password';
   ```

2. **Use `secureSessionManager` for in-memory password storage**
   ```typescript
   import { secureSessionManager } from '@serenity/core';
   secureSessionManager.setPassword(password);
   const pwd = secureSessionManager.getPassword(); // Only in memory during session
   ```

3. **Use `EncryptedIntegrationService` for OAuth tokens**
   ```typescript
   import { EncryptedIntegrationService } from '@serenity/core';
   await EncryptedIntegrationService.saveIntegrationData('google', tokenData);
   ```

4. **Validate all IPC inputs with Zod schemas**

5. **Sanitize user input before database queries**
   ```typescript
   // Use parameterized queries (always)
   db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

   // Never concatenate user input
   // ❌ db.prepare(`SELECT * FROM tasks WHERE id = '${taskId}'`).get();
   ```

---

### State Persistence

- Redux state is automatically persisted to SQLite via custom middleware
- Selective persistence (auth tokens excluded)
- Rehydration on app startup from database

**To make a slice persistent**:
```typescript
// In packages/core/src/store/middleware/simplifiedPersistenceMiddleware.ts
// Add slice to PERSISTED_SLICES array
const PERSISTED_SLICES = [
  'tasks',
  'journal',
  'myNewSlice', // Add here
];
```

---

### Performance Considerations

1. **Virtual Scrolling** for large lists
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';

   const rowVirtualizer = useVirtualizer({
     count: items.length,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 50,
   });
   ```

2. **Code Splitting** - Already configured in Vite
   - Vendor chunk: React, Redux, UI libraries
   - UI chunk: `@serenity/ui` components
   - Core chunk: `@serenity/core` logic

3. **Debounced Inputs**
   ```typescript
   import { useMemo } from 'react';
   import debounce from 'lodash/debounce';

   const debouncedSearch = useMemo(
     () => debounce((value: string) => setSearchTerm(value), 300),
     []
   );
   ```

4. **Optimized Database Queries**
   - Avoid N+1 queries - use JOINs or batch fetches
   - Use indexes for frequently queried columns
   - Limit result sets where appropriate

---

## Working with Different Layers

### Electron Main Process (Node.js)
- Full system access
- Handles database operations
- Business logic and services
- IPC handlers

**Location**: `apps/desktop/src/main/`

### Electron Renderer Process (React)
- Sandboxed browser context
- UI layer only
- Communicates with main via IPC
- Cannot directly access Node.js APIs

**Location**: `apps/desktop/src/renderer/`

### Preload Script (Bridge)
- Safely exposes IPC APIs to renderer
- Via `contextBridge.exposeInMainWorld`
- Type-safe API exposed as `window.api`

**Location**: `apps/desktop/src/main/preload.ts`

**Communication Flow**:
```
Renderer (React) → window.api.someMethod() → Preload → IPC → Main Process Handler → Database/Service → Response
```

---

## Troubleshooting

### Build Failures / "Cannot find module" errors

```bash
# Clean stale build caches and rebuild
npm run clean
npm run build
```

**Note**: `npm install` postinstall hook automatically builds all packages, but if you encounter module resolution errors (especially `dist-cjs/index.js` not found), running `clean` then `build` will clear stale TypeScript incremental build caches.

---

### Database Connection Issues

1. **Verify SQLite is initialized**:
   ```typescript
   // Check logs for:
   // "📁 SQLite database initialized at: /path/to/serenity.db"
   ```

2. **Check database file exists**:
   ```bash
   # macOS
   ls ~/Library/Application\ Support/Serenity\ Notes/serenity.db

   # Windows
   dir %APPDATA%\Serenity Notes\serenity.db

   # Linux
   ls ~/.config/Serenity\ Notes/serenity.db
   ```

3. **PostgreSQL issues** (if using):
   ```bash
   # Verify PostgreSQL is running
   brew services list | grep postgresql  # macOS

   # Check connection string in .env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=serenity_notes
   ```

---

### Electron Issues

**Rebuild native modules**:
```bash
cd apps/desktop
npm run electron-rebuild
```

**Check Electron/Node.js version compatibility**:
- Electron 26.x requires Node.js 18.x
- better-sqlite3 must be rebuilt for Electron version

---

### TypeScript Errors

**Check TypeScript configuration**:
```bash
npx tsc --noEmit
```

**Common issues**:
- Missing `dist-cjs/` folder → Run `npm run build`
- Stale types → Restart TypeScript server in IDE
- Import errors → Check `package.json` exports in `@serenity/core`

---

### Hot Reload Not Working

1. **Renderer**: Vite handles hot reload - check terminal for errors
2. **Main process**: Changes require restart (no hot reload)
3. **Shared packages** (`@serenity/core`, etc.): Run `npm run dev` in package folder for watch mode

---

### Native Module Errors (better-sqlite3)

**Error**: "Module did not self-register"

**Solution**: Rebuild native modules for current Electron version
```bash
cd apps/desktop
npm run electron-rebuild
```

**Error**: "Cannot find module 'better-sqlite3'"

**Solution**: Reinstall dependencies
```bash
npm install
# Postinstall hook will auto-rebuild
```

---

## Documentation Maintenance

When making changes:

**For new features**:
1. Create ADR in `docs/architecture/decisions/` (if architectural decision)
2. Create/update feature doc in `docs/features/`
3. Add JSDoc comments to new services/methods
4. Run `npm run docs:generate` (auto-updates API docs)
5. Update `docs/STATUS.md`

**For bug fixes**:
1. Update feature doc if behavior changes
2. Update `docs/STATUS.md` if changing status (⚠️ → ✅)

**For refactoring**:
1. Create ADR if changing architecture
2. Update affected feature docs

---

For more information:
- **Setup & Architecture**: See `README.md`
- **Current Status**: See `docs/STATUS.md`
- **Architectural Decisions**: See `docs/architecture/decisions/`
- **Feature Guides**: See `docs/features/`
- **API Reference**: Run `npm run docs:generate` and see `docs/api/`
