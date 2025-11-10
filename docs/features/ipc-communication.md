# IPC Communication Architecture

**Status**: ✅ Production-ready with type-safe bridge
**Security**: ✅ Context isolation + sandbox enabled
**Pattern**: Preload bridge with contextBridge

---

## Overview

Serenity Notes uses Electron's **Inter-Process Communication (IPC)** system to enable secure communication between the main process (Node.js backend) and renderer process (React frontend). The architecture prioritizes security through sandboxing, context isolation, and a type-safe preload bridge.

**Why IPC?**
- **Security**: Renderer is sandboxed, can't access Node.js APIs directly
- **Separation**: Backend logic stays in main, UI stays in renderer
- **Performance**: Database operations run in main (don't block UI)
- **Type Safety**: TypeScript types enforced across processes

---

## Architecture

### Process Model

```
┌──────────────────────────────────────────────────────────┐
│                   Renderer Process                        │
│              (Chromium Browser Context)                   │
│  - React UI, components, pages                           │
│  - Sandboxed (no Node.js access)                         │
│  - Uses window.api for communication                     │
└─────────────────────┬────────────────────────────────────┘
                      │ window.api.tasks.getAll()
                      ↓
┌──────────────────────────────────────────────────────────┐
│                   Preload Script                          │
│           (Secure Bridge via contextBridge)               │
│  - Exposes window.api safely                             │
│  - No direct Node.js/Electron access in renderer         │
│  - Type-safe API surface                                 │
└─────────────────────┬────────────────────────────────────┘
                      │ ipcRenderer.invoke('tasks:getAll')
                      ↓
┌──────────────────────────────────────────────────────────┐
│                    Main Process                           │
│                (Node.js with full access)                 │
│  - IPC Handlers (organized by domain)                    │
│  - Services (TaskService, JournalService, etc.)          │
│  - Database operations (SQLite)                           │
│  - File system, native APIs                              │
└──────────────────────────────────────────────────────────┘
```

### Communication Flow

```
User clicks button in React
    ↓
React calls window.api.tasks.create(taskData)
    ↓
Preload forwards to ipcRenderer.invoke('tasks:create', taskData)
    ↓
IPC message sent to main process
    ↓
Main process handler receives message
    ↓
Handler calls TaskService.createTask(taskData)
    ↓
TaskService calls SQLite database
    ↓
Database returns created task
    ↓
Handler returns { success: true, data: task }
    ↓
IPC sends response back to renderer
    ↓
Preload returns response to React
    ↓
React updates UI with new task
```

---

## Security Model

### Context Isolation

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

**Why These Settings?**
- **`contextIsolation: true`**: Prevents renderer from accessing Electron/Node.js APIs
- **`nodeIntegration: false`**: No `require()` or Node.js modules in renderer
- **`sandbox: true`**: Renderer runs in OS-level sandbox (extra layer of security)
- **`webSecurity: true`**: Enforces same-origin policy and CSP

**Security Benefit**: Even if XSS vulnerability exists in renderer, attacker cannot execute system commands or access file system.

### Preload Bridge (contextBridge)

```typescript
// apps/desktop/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Safely expose ONLY these methods to renderer
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
  // ... other domains
});
```

**Key Points**:
- **`contextBridge.exposeInMainWorld`**: Safely exposes API to renderer
- **Whitelist Only**: Only explicitly exposed methods are available
- **No Direct Access**: Renderer can't call arbitrary IPC channels
- **Type-Safe**: TypeScript types ensure contract between processes

---

## IPC Handlers by Domain

### Handler Organization

Located in `apps/desktop/src/main/ipc/`:

1. **`taskHandlers.ts`** - Task CRUD operations (~15 methods)
2. **`journalHandlers.ts`** - Journal CRUD operations (~10 methods)
3. **`authHandlers.ts`** - Authentication and security (~8 methods)
4. **`aiAssistantHandlers.ts`** - AI insights generation (~5 methods)
5. **`integrationHandlers.ts`** - Google Calendar, GitHub sync (~12 methods)
6. **`systemHandlers.ts`** - System operations, dialogs (~6 methods)
7. **`goalHandlers.ts`** - Goal tracking (~8 methods)
8. **`insightsHandlers.ts`** - Insights visualization (~4 methods)

**Total**: ~70 IPC methods across 8 handler files

### Handler Pattern

**Standard Handler Structure**:
```typescript
// apps/desktop/src/main/ipc/taskHandlers.ts
import { ipcMain } from 'electron';
import { TaskService } from '../services/TaskService';
import { logger } from '@serenity/core';
import { z } from 'zod';

// Validation schema
const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
});

export function registerTaskHandlers() {
  // Get all tasks
  ipcMain.handle('tasks:getAll', async () => {
    try {
      logger.debug('Getting all tasks', { component: 'taskHandlers' });
      const tasks = await TaskService.getAllTasks();
      return { success: true, data: tasks };
    } catch (error) {
      logger.error('Failed to get tasks', { component: 'taskHandlers' }, error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Create task with validation
  ipcMain.handle('tasks:create', async (event, taskData) => {
    try {
      // Validate input
      const validated = CreateTaskSchema.parse(taskData);

      logger.info('Creating task', {
        component: 'taskHandlers',
        metadata: { title: validated.title }
      });

      const task = await TaskService.createTask(validated);
      return { success: true, data: task };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Task validation failed', { component: 'taskHandlers' });
        return {
          success: false,
          error: error.errors.map(e => e.message).join(', ')
        };
      }

      logger.error('Failed to create task', { component: 'taskHandlers' }, error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Update task
  ipcMain.handle('tasks:update', async (event, id, updates) => {
    try {
      logger.info('Updating task', {
        component: 'taskHandlers',
        metadata: { taskId: id }
      });

      const task = await TaskService.updateTask(id, updates);
      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      return { success: true, data: task };
    } catch (error) {
      logger.error('Failed to update task', { component: 'taskHandlers' }, error as Error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Delete task
  ipcMain.handle('tasks:delete', async (event, id) => {
    try {
      logger.info('Deleting task', {
        component: 'taskHandlers',
        metadata: { taskId: id }
      });

      await TaskService.deleteTask(id);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task', { component: 'taskHandlers' }, error as Error);
      return { success: false, error: (error as Error).message };
    }
  });
}
```

### Handler Registration

```typescript
// apps/desktop/src/main/ipc/index.ts
import { registerTaskHandlers } from './taskHandlers';
import { registerJournalHandlers } from './journalHandlers';
import { registerAuthHandlers } from './authHandlers';
import { registerAIAssistantHandlers } from './aiAssistantHandlers';
import { registerIntegrationHandlers } from './integrationHandlers';
import { registerSystemHandlers } from './systemHandlers';
import { registerGoalHandlers } from './goalHandlers';
import { registerInsightsHandlers } from './insightsHandlers';

export function registerAllIPC() {
  registerTaskHandlers();
  registerJournalHandlers();
  registerAuthHandlers();
  registerAIAssistantHandlers();
  registerIntegrationHandlers();
  registerSystemHandlers();
  registerGoalHandlers();
  registerInsightsHandlers();
}

// Called in main.ts
import { registerAllIPC } from './ipc';
registerAllIPC();
```

---

## Type Definitions

### IPC Type Contract

**Location**: `packages/core/src/types/ipc.ts`

```typescript
// Response type for all IPC methods
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Task API
export interface TaskAPI {
  getAll: () => Promise<APIResponse<Task[]>>;
  getById: (id: string) => Promise<APIResponse<Task>>;
  create: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<APIResponse<Task>>;
  update: (id: string, updates: Partial<Task>) => Promise<APIResponse<Task>>;
  delete: (id: string) => Promise<APIResponse>;
  getByProject: (projectId: string) => Promise<APIResponse<Task[]>>;
}

// Journal API
export interface JournalAPI {
  getAll: () => Promise<APIResponse<JournalEntry[]>>;
  getById: (id: string) => Promise<APIResponse<JournalEntry>>;
  create: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<APIResponse<JournalEntry>>;
  update: (id: string, updates: Partial<JournalEntry>) => Promise<APIResponse<JournalEntry>>;
  delete: (id: string) => Promise<APIResponse>;
  getByDateRange: (startDate: string, endDate: string) => Promise<APIResponse<JournalEntry[]>>;
}

// Auth API
export interface AuthAPI {
  verifyPassword: (password: string) => Promise<APIResponse<boolean>>;
  setPassword: (password: string) => Promise<APIResponse>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<APIResponse>;
  lock: () => Promise<APIResponse>;
}

// AI Assistant API
export interface AIAssistantAPI {
  analyzeData: (options: AnalyzeOptions) => Promise<APIResponse<{ insights: AIInsight[] }>>;
  getInsights: () => Promise<APIResponse<AIInsight[]>>;
  rateInsight: (id: string, rating: number) => Promise<APIResponse>;
  updateInsightFeedback: (id: string, feedback: InsightFeedback) => Promise<APIResponse>;
}

// Complete Electron API exposed via window.api
export interface ElectronAPI {
  tasks: TaskAPI;
  journal: JournalAPI;
  auth: AuthAPI;
  aiAssistant: AIAssistantAPI;
  integrations: IntegrationsAPI;
  system: SystemAPI;
  goals: GoalsAPI;
  insights: InsightsAPI;
}

// Global type augmentation
declare global {
  interface Window {
    api: ElectronAPI;
  }
}
```

### Type Safety Benefits

**Compile-time Checking**:
```typescript
// ✅ GOOD - TypeScript catches errors
const result = await window.api.tasks.getAll();
if (result.success && result.data) {
  result.data.forEach(task => {
    console.log(task.title);  // ✅ Type-safe: task is Task
  });
}

// ❌ BAD - TypeScript error
const badResult = await window.api.tasks.badMethod();
// Error: Property 'badMethod' does not exist on type 'TaskAPI'
```

**Auto-completion**:
- IDE shows all available methods
- Parameter types auto-suggested
- Return types known

---

## Usage Examples

### Basic CRUD Operations

**In Renderer (React)**:
```typescript
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setTasks } from '@serenity/core';
import type { Task } from '@serenity/core';

const TaskListPage = () => {
  const [tasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  // Fetch tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      const result = await window.api.tasks.getAll();
      if (result.success && result.data) {
        setLocalTasks(result.data);
        dispatch(setTasks(result.data));
      } else {
        setError(result.error || 'Failed to load tasks');
      }
      setLoading(false);
    };

    loadTasks();
  }, [dispatch]);

  // Create task
  const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
    const result = await window.api.tasks.create(taskData);
    if (result.success && result.data) {
      setLocalTasks([...tasks, result.data]);
      dispatch(setTasks([...tasks, result.data]));
    } else {
      alert(`Failed to create task: ${result.error}`);
    }
  };

  // Update task
  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const result = await window.api.tasks.update(id, updates);
    if (result.success && result.data) {
      const updatedTasks = tasks.map(t => t.id === id ? result.data! : t);
      setLocalTasks(updatedTasks);
      dispatch(setTasks(updatedTasks));
    } else {
      alert(`Failed to update task: ${result.error}`);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    const result = await window.api.tasks.delete(id);
    if (result.success) {
      const filteredTasks = tasks.filter(t => t.id !== id);
      setLocalTasks(filteredTasks);
      dispatch(setTasks(filteredTasks));
    } else {
      alert(`Failed to delete task: ${result.error}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => handleCreateTask({ title: 'New Task', priority: 'medium' })}>
        Create Task
      </button>
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.title}</span>
          <button onClick={() => handleUpdateTask(task.id, { completed: !task.completed })}>
            Toggle
          </button>
          <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};
```

### AI Analysis

```typescript
const InsightsPage = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const handleAnalyze = async () => {
    setAnalyzing(true);

    const result = await window.api.aiAssistant.analyzeData({
      provider: 'anthropic',
      dataTypes: ['tasks', 'journal'],
      analysisMode: 'incremental',
    });

    setAnalyzing(false);

    if (result.success && result.data) {
      setInsights(result.data.insights);
    } else {
      alert(`Analysis failed: ${result.error}`);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={analyzing}>
        {analyzing ? 'Analyzing...' : 'Generate Insights'}
      </button>
      {insights.map(insight => (
        <div key={insight.id}>
          <h3>{insight.title}</h3>
          <p>{insight.description}</p>
          <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
};
```

### Authentication

```typescript
const LoginPage = () => {
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await window.api.auth.verifyPassword(password);

    if (result.success && result.data) {
      // Logged in successfully
      navigate('/home');
    } else {
      alert('Invalid password');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter master password"
      />
      <button type="submit">Login</button>
    </form>
  );
};
```

---

## Adding New IPC Methods

### Step-by-Step Guide

**1. Create Handler in Main Process**:

```typescript
// apps/desktop/src/main/ipc/myFeatureHandlers.ts
import { ipcMain } from 'electron';
import { logger } from '@serenity/core';

export function registerMyFeatureHandlers() {
  ipcMain.handle('myFeature:doSomething', async (event, arg1, arg2) => {
    try {
      logger.info('Doing something', { component: 'myFeatureHandlers' });

      // Your logic here
      const result = await doSomething(arg1, arg2);

      return { success: true, data: result };
    } catch (error) {
      logger.error('Failed to do something', { component: 'myFeatureHandlers' }, error as Error);
      return { success: false, error: (error as Error).message };
    }
  });
}
```

**2. Register Handler**:

```typescript
// apps/desktop/src/main/ipc/index.ts
import { registerMyFeatureHandlers } from './myFeatureHandlers';

export function registerAllIPC() {
  // ... existing registrations
  registerMyFeatureHandlers();
}
```

**3. Add Type Definitions**:

```typescript
// packages/core/src/types/ipc.ts
export interface MyFeatureAPI {
  doSomething: (arg1: string, arg2: number) => Promise<APIResponse<MyResult>>;
}

export interface ElectronAPI {
  // ... existing APIs
  myFeature: MyFeatureAPI;
}
```

**4. Expose in Preload**:

```typescript
// apps/desktop/src/main/preload.ts
contextBridge.exposeInMainWorld('api', {
  // ... existing APIs
  myFeature: {
    doSomething: (arg1: string, arg2: number) =>
      ipcRenderer.invoke('myFeature:doSomething', arg1, arg2)
  }
});
```

**5. Use in Renderer**:

```typescript
const result = await window.api.myFeature.doSomething('hello', 42);
if (result.success) {
  console.log('Result:', result.data);
}
```

---

## Validation with Zod

**Why Validate?**
- IPC inputs come from renderer (user input)
- Prevent malformed data from crashing main process
- Type safety at runtime

**Example**:
```typescript
import { z } from 'zod';

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
});

ipcMain.handle('tasks:update', async (event, id, updates) => {
  try {
    const validated = UpdateTaskSchema.parse(updates);
    const task = await TaskService.updateTask(id, validated);
    return { success: true, data: task };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }
    return { success: false, error: (error as Error).message };
  }
});
```

---

## Error Handling

### Consistent Error Format

All IPC handlers return:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

**Benefits**:
- Predictable error handling in renderer
- Easy to check success with `if (result.success)`
- User-friendly error messages

### Error Handling Pattern

**In Handler**:
```typescript
try {
  const result = await doSomething();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { component: 'handler' }, error as Error);
  return { success: false, error: (error as Error).message };
}
```

**In Renderer**:
```typescript
const result = await window.api.tasks.create(taskData);
if (result.success) {
  // Happy path
  console.log('Task created:', result.data);
} else {
  // Error path
  alert(`Failed: ${result.error}`);
}
```

---

## Performance Considerations

### IPC Overhead

**Measurement**:
- Simple method call: ~0.5ms
- Database query through IPC: ~1-5ms
- Complex operation (AI analysis): ~200-500ms (mostly AI processing)

**Impact**: Negligible for desktop app

### Best Practices

1. **Batch Operations**: Send multiple items at once instead of individual calls
   ```typescript
   // ✅ GOOD
   await window.api.tasks.createMany(tasks);

   // ❌ BAD
   for (const task of tasks) {
     await window.api.tasks.create(task);
   }
   ```

2. **Debounce Frequent Calls**: For search, auto-save, etc.
   ```typescript
   const debouncedSearch = debounce((term: string) => {
     window.api.search.query(term);
   }, 300);
   ```

3. **Use Redux for State**: Don't fetch from database on every render
   ```typescript
   // ✅ GOOD - Fetch once, store in Redux
   useEffect(() => {
     window.api.tasks.getAll().then(result => {
       if (result.success) dispatch(setTasks(result.data));
     });
   }, []);

   const tasks = useSelector((state: RootState) => state.tasks.items);
   ```

---

## Security Best Practices

### 1. Never Trust Renderer Input

```typescript
// ✅ GOOD - Validate all inputs
const validated = TaskSchema.parse(taskData);

// ❌ BAD - Trust input blindly
await db.prepare(`INSERT INTO tasks VALUES (${taskData})`);
```

### 2. Don't Expose Sensitive Methods

```typescript
// ❌ BAD - Exposing dangerous method
contextBridge.exposeInMainWorld('api', {
  executeArbitraryCommand: (cmd: string) => exec(cmd)  // NEVER DO THIS
});

// ✅ GOOD - Whitelist safe operations only
contextBridge.exposeInMainWorld('api', {
  openFileDialog: () => dialog.showOpenDialog({ properties: ['openFile'] })
});
```

### 3. Use Parameterized Queries

```typescript
// ✅ GOOD
db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

// ❌ BAD - SQL injection risk
db.prepare(`SELECT * FROM tasks WHERE id = '${taskId}'`).get();
```

---

## Troubleshooting

### "window.api is undefined"

**Cause**: Preload script not loaded or context isolation issues

**Solution**:
- Verify `preload` path in BrowserWindow options
- Check `contextIsolation: true` is set
- Ensure preload script runs before renderer

---

### TypeScript Errors: "Property 'api' does not exist on type 'Window'"

**Cause**: Type definitions not imported in renderer

**Solution**:
```typescript
// In renderer files, import types
import type { ElectronAPI } from '@serenity/core';

// Or add to tsconfig.json
{
  "include": ["packages/core/src/types/ipc.ts"]
}
```

---

### IPC Handler Not Firing

**Cause**: Handler not registered or channel name mismatch

**Solution**:
- Verify handler registered in `registerAllIPC()`
- Check channel name matches: `ipcMain.handle('tasks:getAll')` vs `ipcRenderer.invoke('tasks:getAll')`
- Check logs for errors during registration

---

## Related Documentation

- **ADR**: See `docs/architecture/decisions/004-electron-ipc-architecture.md`
- **Type Definitions**: `packages/core/src/types/ipc.ts`
- **Handlers**: `apps/desktop/src/main/ipc/`
- **Preload**: `apps/desktop/src/main/preload.ts`
- **Security**: `apps/desktop/src/main/security/`
- **Development Guide**: See `docs/DEVELOPMENT.md` - Adding New IPC Handler section

---

**Last Updated**: 2025-10-26
**IPC Methods**: ~70 across 8 domains
**Security Model**: Context isolation + sandbox + CSP
