# ADR-004: Electron IPC Architecture with Preload Bridge

**Date**: 2024-12-01 (Original decision)
**Status**: Accepted
**Author**: Development Team

## Context

Serenity Notes is built with Electron, which has two separate processes:
1. **Main Process** (Node.js): Backend, full system access, database operations
2. **Renderer Process** (Chromium): Frontend UI, sandboxed browser environment

These processes must communicate securely to:
- Fetch/update data from database (tasks, journal, etc.)
- Perform system operations (file access, native dialogs, etc.)
- Maintain security (prevent renderer from accessing sensitive APIs)
- Preserve type safety (TypeScript across processes)
- Handle errors gracefully

Electron provides `ipcMain` and `ipcRenderer` for inter-process communication (IPC), but:
- Direct `ipcRenderer` access in renderer breaks sandboxing
- No type safety by default
- Error handling must be consistent
- Security context isolation recommended

We needed a communication architecture that is:
- **Secure**: Renderer cannot access Node.js APIs directly
- **Type-Safe**: TypeScript types enforced across processes
- **Organized**: Clear separation of concerns
- **Testable**: Easy to test handlers independently
- **Performant**: Minimal overhead

## Decision

Implement **IPC Bridge Architecture** with:

1. **Main Process Handlers**: Organized by domain in `apps/desktop/src/main/ipc/`
   - `taskHandlers.ts` - Task CRUD operations
   - `journalHandlers.ts` - Journal CRUD operations
   - `authHandlers.ts` - Authentication and security
   - `aiAssistantHandlers.ts` - AI insights generation
   - `integrationHandlers.ts` - Google Calendar, GitHub sync
   - etc.

2. **Preload Script**: Safe API exposure via `contextBridge`
   - Located at `apps/desktop/src/main/preload.ts`
   - Exposes `window.api` with type-safe methods
   - Acts as secure bridge between renderer and main
   - No direct Node.js or Electron API access from renderer

3. **Type Definitions**: Centralized in `packages/core/src/types/ipc.ts`
   - Defines all IPC method signatures
   - Shared between main and renderer
   - TypeScript enforces contract

4. **Security**:
   - `contextIsolation: true` (renderer can't access Electron APIs)
   - `nodeIntegration: false` (no Node.js in renderer)
   - `sandbox: true` (renderer runs in sandboxed environment)
   - Content Security Policy (CSP) enforcement

5. **Error Handling**: Consistent response format
   ```typescript
   { success: boolean; data?: T; error?: string }
   ```

## Consequences

### Positive

- **Security**: Renderer is fully sandboxed
  - Cannot access file system directly
  - Cannot execute system commands
  - Cannot access Node.js modules
  - All privileged operations go through main process

- **Type Safety**: Full TypeScript support
  - `window.api` methods are type-checked
  - Compiler catches mismatches between main and renderer
  - Auto-completion in IDE

- **Organized**: Domain-based handlers
  - Each feature has its own handler file
  - Easy to find IPC methods
  - Clear responsibility boundaries
  - Testable independently

- **Maintainable**: Clear communication flow
  ```
  Renderer (React) → window.api.method() → Preload (contextBridge)
  → IPC → Main Handler → Service/Database → Response
  ```

- **Error Handling**: Consistent error shapes
  - All handlers return same format
  - Easy to handle errors in UI
  - Detailed logging on main process
  - User-friendly errors in renderer

- **Performance**: Efficient IPC
  - Handlers are async (non-blocking)
  - Database operations run in main (don't block UI)
  - Structured cloning for data transfer (fast)

### Negative

- **Boilerplate**: Each new IPC method requires:
  1. Handler in main process
  2. Preload bridge method
  3. Type definition in `ipc.ts`
  - Can be tedious for simple operations

- **No Direct Access**: Renderer can't access file system directly
  - Must go through IPC for every operation
  - Slightly more code than direct access
  - Mitigated: Security benefit outweighs inconvenience

- **Debugging**: Cross-process debugging is harder
  - Must debug main and renderer separately
  - Can't step through IPC boundary in debugger
  - Mitigated: Detailed logging on both sides

### Neutral

- **IPC Overhead**: Minimal performance impact
  - Message serialization/deserialization
  - Typically <1ms per call
  - Negligible for desktop app

- **Context Isolation**: Required for security
  - Prevents some Electron features (e.g., remote module)
  - Best practice for modern Electron apps

## Alternatives Considered

### Alternative 1: `nodeIntegration: true`

**Description**: Allow Node.js access directly in renderer

**Pros**:
- No IPC needed
- Direct database access from React components
- Simpler code (no preload bridge)

**Cons**:
- **Major security risk**: Renderer can execute arbitrary code
  - XSS vulnerabilities can execute system commands
  - Third-party packages can access file system
  - Malicious code injection risk
- No clear separation of concerns
- Hard to test (database mixed with UI)

**Why not chosen**: Unacceptable security risk. Modern Electron apps should never use `nodeIntegration: true`.

---

### Alternative 2: Electron `remote` Module

**Description**: Use deprecated `remote` module to access main from renderer

**Pros**:
- Less boilerplate than IPC
- Synchronous access to main process

**Cons**:
- **Deprecated and removed** in Electron 14+
- Security issues (similar to nodeIntegration)
- Synchronous calls block UI
- Complex memory management (leaks)

**Why not chosen**: Deprecated, insecure, and removed from Electron.

---

### Alternative 3: REST API with Express

**Description**: Run Express server in main process, renderer makes HTTP calls

**Pros**:
- Platform-agnostic (could work with web version)
- Standard HTTP patterns (RESTful API)
- Easy to document with OpenAPI

**Cons**:
- Massive overkill for local communication
- Performance overhead (HTTP stack)
- Complexity (server setup, port management)
- Authentication needed (local server security)
- Can't easily pass complex objects (serialization)

**Why not chosen**: Over-engineered. IPC is designed for this exact use case.

---

### Alternative 4: Direct Database Access in Renderer

**Description**: Bundle database driver (better-sqlite3) in renderer, open DB directly

**Pros**:
- No IPC needed
- Direct queries from React components
- Simpler architecture

**Cons**:
- **Native module in renderer**: Sandboxing issues
- Breaks separation of concerns (UI knows about DB)
- Hard to test (DB mixed with UI)
- Concurrent access issues (main and renderer both accessing DB)
- Security: Renderer can execute arbitrary SQL

**Why not chosen**: Violates separation of concerns, security issues, and architectural complexity.

## Implementation Notes

**Main Process Handlers**:
```typescript
// apps/desktop/src/main/ipc/taskHandlers.ts
import { ipcMain } from 'electron';
import { TaskService } from '../services/TaskService';
import { logger } from '@serenity/core';

export function registerTaskHandlers() {
  ipcMain.handle('tasks:getAll', async () => {
    try {
      const tasks = await TaskService.getAllTasks();
      return { success: true, data: tasks };
    } catch (error) {
      logger.error('Failed to get tasks', { component: 'taskHandlers' }, error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('tasks:create', async (event, task) => {
    try {
      const created = await TaskService.createTask(task);
      return { success: true, data: created };
    } catch (error) {
      logger.error('Failed to create task', { component: 'taskHandlers' }, error);
      return { success: false, error: (error as Error).message };
    }
  });
}
```

**Preload Bridge**:
```typescript
// apps/desktop/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  tasks: {
    getAll: () => ipcRenderer.invoke('tasks:getAll'),
    create: (task: any) => ipcRenderer.invoke('tasks:create', task),
    update: (id: string, updates: any) => ipcRenderer.invoke('tasks:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('tasks:delete', id),
  },
  journal: {
    // ... journal methods
  },
  auth: {
    // ... auth methods
  }
});
```

**Type Definitions**:
```typescript
// packages/core/src/types/ipc.ts
export interface TaskAPI {
  getAll: () => Promise<{ success: boolean; data?: Task[]; error?: string }>;
  create: (task: Omit<Task, 'id'>) => Promise<{ success: boolean; data?: Task; error?: string }>;
  update: (id: string, updates: Partial<Task>) => Promise<{ success: boolean; data?: Task; error?: string }>;
  delete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronAPI {
  tasks: TaskAPI;
  journal: JournalAPI;
  auth: AuthAPI;
  // ... other APIs
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
```

**Usage in Renderer**:
```typescript
// apps/desktop/src/renderer/pages/HomePage.tsx
const HomePage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      const result = await window.api.tasks.getAll();
      if (result.success && result.data) {
        setTasks(result.data);
      } else {
        console.error('Failed to load tasks:', result.error);
      }
    };
    loadTasks();
  }, []);

  const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
    const result = await window.api.tasks.create(taskData);
    if (result.success && result.data) {
      setTasks([...tasks, result.data]);
    }
  };

  return <TaskList tasks={tasks} onCreate={handleCreateTask} />;
};
```

**Security Configuration**:
```typescript
// apps/desktop/src/main/main.ts
mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,      // ✅ Isolate renderer context
    nodeIntegration: false,       // ✅ No Node.js in renderer
    sandbox: true,                // ✅ Sandbox renderer
    webSecurity: true,            // ✅ Enforce web security
  }
});
```

**IPC Handler Registration**:
```typescript
// apps/desktop/src/main/ipc/index.ts
import { registerTaskHandlers } from './taskHandlers';
import { registerJournalHandlers } from './journalHandlers';
import { registerAuthHandlers } from './authHandlers';
import { registerAIAssistantHandlers } from './aiAssistantHandlers';

export function registerAllIPC() {
  registerTaskHandlers();
  registerJournalHandlers();
  registerAuthHandlers();
  registerAIAssistantHandlers();
  // ... register other handlers
}
```

**Key Files**:
- Handlers: `apps/desktop/src/main/ipc/` (multiple files)
- Preload: `apps/desktop/src/main/preload.ts`
- Types: `packages/core/src/types/ipc.ts`
- Security: `apps/desktop/src/main/security/` (CSP policies)
- Registration: `apps/desktop/src/main/ipc/index.ts`

## Handler Organization

Each domain has its own handler file:
- `taskHandlers.ts` - Task CRUD operations (~15 methods)
- `journalHandlers.ts` - Journal CRUD operations (~10 methods)
- `authHandlers.ts` - Authentication and security (~8 methods)
- `aiAssistantHandlers.ts` - AI insights generation (~5 methods)
- `integrationHandlers.ts` - Google Calendar, GitHub sync (~12 methods)
- `systemHandlers.ts` - System operations, dialogs (~6 methods)
- `goalHandlers.ts` - Goal tracking (~8 methods)
- `insightsHandlers.ts` - Insights visualization (~4 methods)

**Total**: ~70 IPC methods across 8 handler files

## Validation

We use **Zod schemas** to validate IPC inputs:

```typescript
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().datetime().optional(),
});

ipcMain.handle('tasks:create', async (event, data) => {
  try {
    const validated = CreateTaskSchema.parse(data);
    // Type-safe validated data
    const task = await TaskService.createTask(validated);
    return { success: true, data: task };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: (error as Error).message };
  }
});
```

## Performance

**IPC Overhead Measurements**:
- Simple method call (get all tasks): ~0.5ms
- Complex operation (AI analysis): ~200-500ms (mostly AI processing, not IPC)
- Database query through IPC: ~1-5ms

**Impact**: Negligible. IPC is not a bottleneck.

## References

- Electron IPC Documentation: https://www.electronjs.org/docs/latest/tutorial/ipc
- Electron Security Best Practices: https://www.electronjs.org/docs/latest/tutorial/security
- contextBridge Documentation: https://www.electronjs.org/docs/latest/api/context-bridge
- Implementation: `apps/desktop/src/main/ipc/`, `apps/desktop/src/main/preload.ts`
- Related ADR: ADR-001 (SQLite as Primary Database) - accessed through IPC handlers
