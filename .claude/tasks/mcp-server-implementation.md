# MCP Server Implementation Plan for Serenity Notes

**Created:** November 17, 2025
**Status:** Planning Phase
**Goal:** Create an MCP server that enables AI assistants (Claude, ChatGPT, etc.) to interact with Serenity Notes tasks and journals with proper authentication and schema synchronization.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Authentication Strategy](#authentication-strategy)
4. [Schema Synchronization Strategy](#schema-synchronization-strategy)
5. [Implementation Phases](#implementation-phases)
6. [Technical Specifications](#technical-specifications)
7. [Security Considerations](#security-considerations)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Strategy](#deployment-strategy)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### What is MCP?

**Model Context Protocol (MCP)** is an open standard introduced by Anthropic (November 2024) and adopted by OpenAI (March 2025) and Google DeepMind (April 2025) for standardizing how AI systems integrate with external tools and data sources.

### Project Goals

1. **Enable AI Integration**: Allow AI assistants to read/write tasks and journal entries
2. **Secure Authentication**: Ensure only registered web app users can access data
3. **Schema Synchronization**: Maintain type safety across web, desktop, and MCP server
4. **Production-Ready**: Build a scalable, secure, maintainable MCP server

### Key Benefits

- **AI-Powered Productivity**: Users can ask Claude "What are my tasks for today?" or "Add a journal entry about my meeting"
- **Cross-Platform Consistency**: Same types and schemas across all platforms
- **Zero Data Duplication**: MCP server uses existing PostgreSQL database
- **Secure**: Leverages existing NextAuth authentication

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Assistants                           │
│              (Claude Desktop, ChatGPT, Gemini)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ JSON-RPC 2.0 (MCP Protocol)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     MCP Server (New)                            │
│                                                                 │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth Layer   │  │ Tools Layer  │  │  Service Layer    │  │
│  │  (NextAuth)   │  │ (Task, Journal)│ │  (Business Logic) │  │
│  └───────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│          │                  │                     │             │
│          └──────────────────┴─────────────────────┘             │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               │ Shared Types (@serenity/core)
                               │ Shared DB (@serenity/database)
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL Database                        │
│  (Shared with Web App - sessions, tasks, journals, etc.)       │
└─────────────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │                                    │
┌──────────┴────────────┐          ┌───────────┴──────────────┐
│   Next.js Web App     │          │   Electron Desktop App   │
│   (NextAuth OAuth)    │          │   (SQLite + Sync)        │
└───────────────────────┘          └──────────────────────────┘
```

### Monorepo Structure

```
serenity/
├── apps/
│   ├── desktop/              # Electron app (existing)
│   ├── web/                  # Next.js web app (existing)
│   └── mcp-server/           # ⭐ NEW: MCP Server
│       ├── src/
│       │   ├── index.ts      # Server entry point
│       │   ├── server.ts     # MCP server initialization
│       │   ├── config/
│       │   │   └── env.ts    # Environment configuration
│       │   ├── middleware/
│       │   │   ├── auth.ts   # NextAuth session validation
│       │   │   ├── error.ts  # Error handling
│       │   │   └── logger.ts # Request logging
│       │   ├── tools/
│       │   │   ├── index.ts  # Tool registration
│       │   │   ├── tasks.ts  # Task CRUD tools
│       │   │   ├── journal.ts# Journal CRUD tools
│       │   │   ├── projects.ts # Project tools
│       │   │   ├── goals.ts  # Goal tools
│       │   │   └── ai.ts     # AI insights/summary tools
│       │   ├── services/
│       │   │   ├── TaskService.ts      # Task business logic
│       │   │   ├── JournalService.ts   # Journal business logic
│       │   │   ├── ProjectService.ts   # Project logic
│       │   │   ├── GoalService.ts      # Goal logic
│       │   │   ├── AIService.ts        # AI operations
│       │   │   └── SyncService.ts      # Sync metadata tracking
│       │   ├── db/
│       │   │   └── index.ts  # PostgreSQL connection
│       │   └── utils/
│       │       ├── validation.ts # Zod schema helpers
│       │       └── errors.ts     # Custom error classes
│       ├── .env.example
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
└── packages/
    ├── core/                 # ✅ Shared types, validation, services
    │   ├── src/
    │   │   ├── types/        # Task, Journal, etc. (SHARED)
    │   │   ├── validation/   # Zod schemas (SHARED)
    │   │   └── services/     # Business logic (SHARED)
    │
    └── database/             # ✅ Database adapters, queries
        └── src/
            ├── adapters/     # PostgreSQL adapter (SHARED)
            ├── queries/      # SQL queries (SHARED)
            └── schema/       # Database schema (SHARED)
```

### Key Design Decisions

#### 1. **PostgreSQL as Primary Database**
- ✅ Web app already uses PostgreSQL
- ✅ MCP server shares same database (no data duplication)
- ✅ Desktop app syncs to PostgreSQL via `sync_metadata` table
- ✅ Single source of truth

#### 2. **Streamable HTTP Transport**
- ✅ Production-ready transport mechanism
- ✅ Standard HTTP auth (Bearer tokens)
- ✅ Compatible with web browsers
- ✅ Scalable (can deploy behind load balancer)

#### 3. **NextAuth Session-Based Authentication**
- ✅ Reuse existing OAuth providers (Google, GitHub, Microsoft)
- ✅ Validate against `sessions` table in PostgreSQL
- ✅ No new authentication infrastructure needed
- ✅ Secure and battle-tested

#### 4. **Shared Types via Monorepo**
- ✅ `@serenity/core` exports all types (Task, Journal, etc.)
- ✅ `@serenity/database` exports database adapters
- ✅ MCP server imports these packages
- ✅ TypeScript ensures type safety across all apps

#### 5. **Service Layer Pattern**
- ✅ Business logic in service classes (TaskService, JournalService)
- ✅ Tools are thin wrappers calling services
- ✅ Easy to test and maintain
- ✅ Consistent with existing architecture

---

## Authentication Strategy

### Requirements

1. ✅ **User Registration**: Only users registered in web app can use MCP
2. ✅ **Session-Based**: Validate against existing NextAuth sessions
3. ✅ **Secure**: No new credentials to manage
4. ✅ **User-Scoped**: All operations scoped to authenticated user

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│             │         │              │         │                 │
│ AI Assistant│ ───────▶│  MCP Server  │────────▶│   PostgreSQL    │
│  (Claude)   │ Session │              │ Validate│   Database      │
│             │  Token  │  Auth Layer  │  Token  │  sessions table │
│             │         │              │         │                 │
└─────────────┘         └──────────────┘         └─────────────────┘
      │
      │ User provides session token
      │ (from web app login)
      ▼
┌─────────────┐
│  Web App    │
│  (NextAuth) │
│  Login      │
└─────────────┘
```

### Implementation

#### 1. **Session Token Flow**

**Step 1: User logs into web app**
```typescript
// apps/web/src/app/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ... other providers
  ],
  adapter: PostgresAdapter(db), // Stores sessions in PostgreSQL
  session: {
    strategy: 'database', // Session stored in 'sessions' table
  },
};
```

**Step 2: Web app provides session token to user**
```typescript
// apps/web/src/app/api/mcp/session/route.ts
import { auth } from '@/lib/auth/config';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Return session token for MCP server
  const sessionToken = await getSessionToken(session.user.id);

  return Response.json({
    sessionToken,
    expiresAt: session.expires,
    instructions: 'Use this token in Authorization header: Bearer <token>',
  });
}
```

**Step 3: MCP server validates token**
```typescript
// apps/mcp-server/src/middleware/auth.ts
import { db } from '../db';
import type { User } from '@serenity/core';

export async function authenticateRequest(
  authHeader: string | undefined
): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const sessionToken = authHeader.substring(7); // Remove 'Bearer '

  // Validate against sessions table
  const result = await db.query(`
    SELECT
      u.id,
      u.email,
      u.name,
      u.image,
      s.expires
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = $1
      AND s.expires > NOW()
  `, [sessionToken]);

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  // Update last_login timestamp
  await db.query(`
    UPDATE users
    SET last_login = NOW()
    WHERE id = $1
  `, [user.id]);

  // Log to audit table
  await db.query(`
    INSERT INTO audit_logs (user_id, action, ip_address, user_agent)
    VALUES ($1, $2, $3, $4)
  `, [user.id, 'mcp_authenticated', 'mcp-server', 'MCP SDK']);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
```

#### 2. **Context Injection**

```typescript
// apps/mcp-server/src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { authenticateRequest } from './middleware/auth';

const app = express();
const mcpServer = new McpServer({
  name: 'serenity-mcp-server',
  version: '1.0.0',
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  // Authenticate request
  const user = await authenticateRequest(req.headers.authorization);

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please provide a valid session token from the web app',
    });
  }

  // Create transport with authenticated user context
  const transport = new StreamableHTTPServerTransport(req, res);
  transport.context = {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  };

  // Connect MCP server
  await mcpServer.connect(transport);
});

app.listen(3001, () => {
  console.log('MCP Server running on http://localhost:3001');
});
```

#### 3. **Tool-Level Authorization**

```typescript
// apps/mcp-server/src/tools/tasks.ts
import { z } from 'zod';
import { TaskService } from '../services/TaskService';

const taskService = new TaskService();

export function registerTaskTools(server: McpServer) {
  server.registerTool('get-tasks', {
    title: 'Get My Tasks',
    description: 'Retrieve all active tasks for the authenticated user',
    inputSchema: z.object({
      filter: z.enum(['all', 'active', 'completed']).optional(),
      projectId: z.string().uuid().optional(),
    }),
    outputSchema: z.object({
      tasks: z.array(z.custom<Task>()),
      count: z.number(),
    }),
  }, async ({ filter, projectId }, context) => {
    // Context contains authenticated user
    const userId = context.userId;

    // Fetch tasks for this user only
    const tasks = await taskService.getTasks(userId, { filter, projectId });

    return {
      tasks,
      count: tasks.length,
    };
  });

  server.registerTool('create-task', {
    title: 'Create Task',
    description: 'Create a new task in Serenity Notes',
    inputSchema: z.object({
      title: z.string().min(1).max(500),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      dueDate: z.string().datetime().optional(),
      projectId: z.string().uuid().optional(),
      tags: z.array(z.string()).default([]),
    }),
    outputSchema: z.object({
      task: z.custom<Task>(),
      message: z.string(),
    }),
  }, async (params, context) => {
    const userId = context.userId;

    // Create task for authenticated user
    const task = await taskService.createTask(userId, params);

    return {
      task,
      message: `Task "${task.title}" created successfully`,
    };
  });

  server.registerTool('delete-task', {
    title: 'Delete Task',
    description: 'Delete a task (only if owned by user)',
    inputSchema: z.object({
      taskId: z.string().uuid(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  }, async ({ taskId }, context) => {
    const userId = context.userId;

    // Service will verify ownership before deleting
    await taskService.deleteTask(userId, taskId);

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  });
}
```

### Security Measures

1. **Session Expiration**: Enforce NextAuth session expiry (default 30 days)
2. **Token Validation**: Validate token on every request (no caching)
3. **User Scoping**: All queries include `WHERE user_id = $1`
4. **Ownership Checks**: Verify user owns resource before update/delete
5. **Audit Logging**: Log all authenticated requests to `audit_logs`
6. **Rate Limiting**: Implement rate limiting per user (e.g., 100 requests/minute)
7. **CORS**: Restrict origins to trusted domains only

---

## Schema Synchronization Strategy

### Challenge

Three applications need to share the same database schema:
1. **Web App** (Next.js + PostgreSQL)
2. **Desktop App** (Electron + SQLite, syncs to PostgreSQL)
3. **MCP Server** (Node.js + PostgreSQL)

### Solution: Monorepo with Shared Packages

#### 1. **Single Source of Truth: `@serenity/core`**

All TypeScript types are defined in `packages/core/src/types/`:

```typescript
// packages/core/src/types/task.ts
export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId?: string;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ... other types
```

```typescript
// packages/core/src/types/journal.ts
export interface JournalEntry {
  id: string;
  userId?: string;
  title: string;
  content: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  tags: string[];
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
```

**All apps import from `@serenity/core`:**
```typescript
// In web app
import { Task, JournalEntry } from '@serenity/core';

// In desktop app
import { Task, JournalEntry } from '@serenity/core';

// In MCP server
import { Task, JournalEntry } from '@serenity/core';
```

#### 2. **Validation Schemas: `@serenity/core/validation`**

Zod schemas for runtime validation:

```typescript
// packages/core/src/validation/task.ts
import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string()),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export const createTaskSchema = taskSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTaskSchema = createTaskSchema.partial();
```

**Used across all apps:**
```typescript
// In MCP server
import { createTaskSchema } from '@serenity/core/validation';

server.registerTool('create-task', {
  inputSchema: createTaskSchema, // Zod schema
}, async (params) => {
  // params is type-safe and validated
});

// In web app API
import { createTaskSchema } from '@serenity/core/validation';

export async function POST(req: Request) {
  const body = await req.json();
  const validated = createTaskSchema.parse(body); // Throws if invalid
  // ...
}
```

#### 3. **Database Schema: `@serenity/database`**

SQL schema files are versioned and shared:

```
packages/database/src/schema/
├── schema.sql              # Main PostgreSQL schema
├── web-extensions.sql      # Web-specific tables (summaries, integrations)
├── migrations/
│   ├── 001_initial.sql
│   ├── 002_add_goals.sql
│   ├── 003_add_ai_insights.sql
│   └── 004_add_integrations.sql
└── sqlite/
    └── schema.sql          # SQLite schema (for desktop)
```

**Database adapter pattern:**
```typescript
// packages/database/src/adapters/PostgresAdapter.ts
export class PostgresAdapter implements DatabaseOperations {
  async getTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks
      WHERE user_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    const query = `
      INSERT INTO tasks (
        user_id, title, description, priority,
        due_date, tags, "order"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      userId,
      data.title,
      data.description,
      data.priority,
      data.dueDate,
      data.tags,
      data.order,
    ]);
    return result.rows[0];
  }
}
```

**All apps use the same adapter:**
```typescript
// In MCP server
import { DatabaseManager, PostgresAdapter } from '@serenity/database';

const db = new DatabaseManager(
  new PostgresAdapter({ connectionString: process.env.DATABASE_URL! })
);

// In web app
import { DatabaseManager, PostgresAdapter } from '@serenity/database';

const db = new DatabaseManager(
  new PostgresAdapter({ connectionString: process.env.DATABASE_URL! })
);
```

#### 4. **Schema Change Workflow**

**When changing schema:**

```bash
# 1. Update TypeScript types
packages/core/src/types/task.ts

# 2. Update Zod validation schemas
packages/core/src/validation/task.ts

# 3. Create migration SQL
packages/database/src/migrations/005_add_task_priority_labels.sql

# 4. Update database adapters
packages/database/src/adapters/PostgresAdapter.ts
packages/database/src/adapters/SQLiteAdapter.ts

# 5. Rebuild packages
npm run build

# 6. All apps automatically use new schema!
# - Web app gets new types via @serenity/core
# - Desktop app gets new types via @serenity/core
# - MCP server gets new types via @serenity/core
```

**Example: Adding `estimatedMinutes` to Task**

**Step 1: Update type**
```typescript
// packages/core/src/types/task.ts
export interface Task {
  id: string;
  // ... existing fields
  estimatedMinutes?: number; // ⭐ NEW FIELD
}
```

**Step 2: Update validation**
```typescript
// packages/core/src/validation/task.ts
export const taskSchema = z.object({
  // ... existing fields
  estimatedMinutes: z.number().int().min(1).optional(), // ⭐ NEW
});
```

**Step 3: Create migration**
```sql
-- packages/database/src/migrations/006_add_estimated_minutes.sql
ALTER TABLE tasks
ADD COLUMN estimated_minutes INTEGER;

CREATE INDEX idx_tasks_estimated_minutes
ON tasks(estimated_minutes)
WHERE estimated_minutes IS NOT NULL;
```

**Step 4: Update adapter**
```typescript
// packages/database/src/adapters/PostgresAdapter.ts
async createTask(userId: string, data: CreateTaskData): Promise<Task> {
  const query = `
    INSERT INTO tasks (
      user_id, title, description, priority,
      due_date, tags, "order", estimated_minutes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await this.pool.query(query, [
    userId,
    data.title,
    data.description,
    data.priority,
    data.dueDate,
    data.tags,
    data.order,
    data.estimatedMinutes, // ⭐ NEW
  ]);
  return result.rows[0];
}
```

**Step 5: Rebuild**
```bash
npm run build
```

**Result:**
- ✅ TypeScript compiler catches any missing updates
- ✅ All apps get `estimatedMinutes` field automatically
- ✅ MCP server tools can now accept/return `estimatedMinutes`
- ✅ Web API validates `estimatedMinutes` via Zod
- ✅ Desktop app can sync `estimatedMinutes` to SQLite

### Benefits of This Approach

1. **Type Safety**: TypeScript ensures schema consistency across all apps
2. **Single Source of Truth**: Types defined once in `@serenity/core`
3. **Automatic Propagation**: Changes propagate via npm workspaces
4. **Build-Time Validation**: TypeScript catches errors before runtime
5. **Runtime Validation**: Zod validates at API boundaries
6. **Version Control**: Git tracks all schema changes
7. **Migration History**: Numbered migration files document evolution

### Turborepo Build Pipeline

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**"]
    }
  }
}
```

**Build order:**
1. `@serenity/core` builds first (types and validation)
2. `@serenity/database` builds next (uses core types)
3. `apps/web`, `apps/desktop`, `apps/mcp-server` build last (use core + database)

**Rebuild on changes:**
```bash
npm run dev  # Watches all packages, rebuilds on change
```

---

## Implementation Phases

### Phase 1: Project Setup (Week 1)

**Goal:** Set up MCP server project structure and basic infrastructure

**Tasks:**
1. ✅ Create `apps/mcp-server/` directory
2. ✅ Initialize package.json with MCP SDK dependency
3. ✅ Set up TypeScript configuration
4. ✅ Add to Turborepo pipeline
5. ✅ Create basic Express server
6. ✅ Set up environment variables
7. ✅ Add to monorepo workspace

**Deliverables:**
- Working MCP server skeleton
- Can import from `@serenity/core` and `@serenity/database`
- Basic health check endpoint

**Testing:**
```bash
cd apps/mcp-server
npm run dev
curl http://localhost:3001/health  # Should return 200 OK
```

### Phase 2: Authentication (Week 1-2)

**Goal:** Implement NextAuth session-based authentication

**Tasks:**
1. ✅ Create auth middleware
2. ✅ Implement session token validation
3. ✅ Add user context injection
4. ✅ Create audit logging
5. ✅ Add rate limiting
6. ✅ Create web app endpoint to provide session tokens
7. ✅ Test authentication flow

**Deliverables:**
- Auth middleware that validates NextAuth sessions
- Web app API endpoint: `GET /api/mcp/session`
- User context available in all tools
- Audit logs recording MCP access

**Testing:**
```bash
# Get session token from web app
curl http://localhost:3000/api/mcp/session \
  -H "Cookie: next-auth.session-token=..."

# Use token in MCP request
curl http://localhost:3001/mcp \
  -H "Authorization: Bearer <session-token>" \
  -d '{"method": "tools/list"}'
```

### Phase 3: Task Tools (Week 2)

**Goal:** Implement CRUD operations for tasks

**Tasks:**
1. ✅ Create TaskService
2. ✅ Implement task tools:
   - `get-tasks` - List tasks with filters
   - `create-task` - Create new task
   - `update-task` - Update task fields
   - `complete-task` - Mark task complete
   - `delete-task` - Delete task
   - `add-subtask` - Add subtask to task
3. ✅ Add sync metadata tracking
4. ✅ Write unit tests
5. ✅ Test with Claude Desktop

**Deliverables:**
- 6 task tools fully functional
- Service layer with business logic
- Sync metadata updated on all writes
- Unit tests with 80%+ coverage

**Example Tool:**
```typescript
server.registerTool('complete-task', {
  title: 'Complete Task',
  description: 'Mark a task as completed and update statistics',
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  outputSchema: z.object({
    task: z.custom<Task>(),
    message: z.string(),
  }),
}, async ({ taskId }, context) => {
  const task = await taskService.completeTask(context.userId, taskId);
  return {
    task,
    message: `Task "${task.title}" completed! Great job! 🎉`,
  };
});
```

### Phase 4: Journal Tools (Week 3)

**Goal:** Implement CRUD operations for journal entries

**Tasks:**
1. ✅ Create JournalService
2. ✅ Implement journal tools:
   - `get-journal-entries` - List entries with filters
   - `create-journal-entry` - Create new entry
   - `update-journal-entry` - Update entry
   - `delete-journal-entry` - Delete entry
   - `search-journal` - Full-text search
   - `get-entry-by-date` - Get entry for specific date
3. ✅ Add mood tracking support
4. ✅ Write unit tests
5. ✅ Test with Claude Desktop

**Deliverables:**
- 6 journal tools fully functional
- Service layer with business logic
- Full-text search capability
- Unit tests with 80%+ coverage

### Phase 5: Advanced Tools (Week 4)

**Goal:** Add project, goal, and AI tools

**Tasks:**
1. ✅ Create ProjectService
2. ✅ Create GoalService
3. ✅ Create AIService (wrapper around existing services)
4. ✅ Implement tools:
   - **Projects:** `get-projects`, `create-project`, `archive-project`
   - **Goals:** `get-goals`, `create-goal`, `track-progress`
   - **AI:** `generate-insights`, `generate-summary`, `get-insights`
5. ✅ Write integration tests
6. ✅ Test end-to-end workflows

**Deliverables:**
- 9 additional tools
- Integration with existing AI services
- End-to-end tests
- User documentation

### Phase 6: Testing & Documentation (Week 4-5)

**Goal:** Comprehensive testing and documentation

**Tasks:**
1. ✅ Write integration tests
2. ✅ Write end-to-end tests with MCP Inspector
3. ✅ Create user documentation
4. ✅ Create developer documentation
5. ✅ Add examples and tutorials
6. ✅ Create troubleshooting guide
7. ✅ Add logging and monitoring

**Deliverables:**
- Test coverage > 80%
- Comprehensive documentation
- Example prompts for Claude
- Monitoring dashboards

### Phase 7: Deployment (Week 5)

**Goal:** Deploy to production

**Tasks:**
1. ✅ Set up production environment
2. ✅ Configure environment variables
3. ✅ Set up monitoring and logging
4. ✅ Deploy to server (or serverless)
5. ✅ Configure CORS and security headers
6. ✅ Set up CI/CD pipeline
7. ✅ Load testing
8. ✅ Security audit

**Deliverables:**
- Production MCP server running
- CI/CD pipeline
- Monitoring and alerting
- Security hardened

---

## Technical Specifications

### MCP Server Configuration

```typescript
// apps/mcp-server/src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export const mcpServer = new McpServer({
  name: 'serenity-mcp-server',
  version: '1.0.0',
  description: 'MCP server for Serenity Notes - manage tasks and journal entries',
  capabilities: {
    tools: true,
    resources: false, // Not using resources in v1
    prompts: false,   // Not using prompts in v1
  },
});
```

### Environment Variables

```bash
# apps/mcp-server/.env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/serenity

# Server
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://serenity-app.com,https://app.serenity.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000  # 1 minute

# Logging
LOG_LEVEL=info

# Monitoring (optional)
SENTRY_DSN=https://...
```

### Tool Definitions

#### Task Tools

**1. get-tasks**
```typescript
{
  title: 'Get My Tasks',
  description: 'Retrieve tasks for the authenticated user with optional filters',
  inputSchema: z.object({
    filter: z.enum(['all', 'active', 'completed']).optional().default('active'),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    projectId: z.string().uuid().optional(),
    dueDate: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(50),
  }),
  outputSchema: z.object({
    tasks: z.array(z.custom<Task>()),
    count: z.number(),
    hasMore: z.boolean(),
  }),
}
```

**2. create-task**
```typescript
{
  title: 'Create Task',
  description: 'Create a new task in Serenity Notes',
  inputSchema: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    dueDate: z.string().datetime().optional(),
    projectId: z.string().uuid().optional(),
    tags: z.array(z.string()).default([]),
    estimatedMinutes: z.number().int().min(1).optional(),
  }),
  outputSchema: z.object({
    task: z.custom<Task>(),
    message: z.string(),
  }),
}
```

**3. update-task**
```typescript
{
  title: 'Update Task',
  description: 'Update an existing task',
  inputSchema: z.object({
    taskId: z.string().uuid(),
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime().optional(),
    projectId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    task: z.custom<Task>(),
    message: z.string(),
  }),
}
```

**4. complete-task**
```typescript
{
  title: 'Complete Task',
  description: 'Mark a task as completed',
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  outputSchema: z.object({
    task: z.custom<Task>(),
    message: z.string(),
  }),
}
```

**5. delete-task**
```typescript
{
  title: 'Delete Task',
  description: 'Delete a task (soft delete)',
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
}
```

**6. add-subtask**
```typescript
{
  title: 'Add Subtask',
  description: 'Add a subtask to an existing task',
  inputSchema: z.object({
    taskId: z.string().uuid(),
    title: z.string().min(1).max(500),
  }),
  outputSchema: z.object({
    subtask: z.custom<Subtask>(),
    message: z.string(),
  }),
}
```

#### Journal Tools

**1. get-journal-entries**
```typescript
{
  title: 'Get Journal Entries',
  description: 'Retrieve journal entries with optional filters',
  inputSchema: z.object({
    dateRange: z.object({
      from: z.string().date().optional(),
      to: z.string().date().optional(),
    }).optional(),
    mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
    tags: z.array(z.string()).optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(50),
  }),
  outputSchema: z.object({
    entries: z.array(z.custom<JournalEntry>()),
    count: z.number(),
  }),
}
```

**2. create-journal-entry**
```typescript
{
  title: 'Create Journal Entry',
  description: 'Create a new journal entry',
  inputSchema: z.object({
    title: z.string().min(1).max(500),
    content: z.string().min(1),
    mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
    tags: z.array(z.string()).default([]),
    date: z.string().date().optional(), // Defaults to today
  }),
  outputSchema: z.object({
    entry: z.custom<JournalEntry>(),
    message: z.string(),
  }),
}
```

**3. update-journal-entry**
```typescript
{
  title: 'Update Journal Entry',
  description: 'Update an existing journal entry',
  inputSchema: z.object({
    entryId: z.string().uuid(),
    title: z.string().min(1).max(500).optional(),
    content: z.string().min(1).optional(),
    mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
    tags: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    entry: z.custom<JournalEntry>(),
    message: z.string(),
  }),
}
```

**4. delete-journal-entry**
```typescript
{
  title: 'Delete Journal Entry',
  description: 'Delete a journal entry',
  inputSchema: z.object({
    entryId: z.string().uuid(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
}
```

**5. search-journal**
```typescript
{
  title: 'Search Journal',
  description: 'Full-text search across all journal entries',
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      entry: z.custom<JournalEntry>(),
      relevanceScore: z.number(),
      highlights: z.array(z.string()),
    })),
    count: z.number(),
  }),
}
```

**6. get-entry-by-date**
```typescript
{
  title: 'Get Journal Entry by Date',
  description: 'Retrieve journal entry for a specific date',
  inputSchema: z.object({
    date: z.string().date(),
  }),
  outputSchema: z.object({
    entry: z.custom<JournalEntry>().optional(),
    message: z.string(),
  }),
}
```

### Service Layer

```typescript
// apps/mcp-server/src/services/TaskService.ts
import { db } from '../db';
import type { Task, CreateTaskData, UpdateTaskData } from '@serenity/core';
import { logger } from '../utils/logger';

export class TaskService {
  async getTasks(
    userId: string,
    filters?: {
      filter?: 'all' | 'active' | 'completed';
      priority?: 'low' | 'medium' | 'high';
      projectId?: string;
      tags?: string[];
      search?: string;
      limit?: number;
    }
  ): Promise<Task[]> {
    logger.info('Getting tasks', { userId, filters });

    let query = `
      SELECT t.*,
             array_agg(st.*) FILTER (WHERE st.id IS NOT NULL) as subtasks
      FROM tasks t
      LEFT JOIN subtasks st ON st.task_id = t.id
      WHERE t.user_id = $1
        AND t.deleted_at IS NULL
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.filter === 'active') {
      query += ` AND t.completed = false`;
    } else if (filters?.filter === 'completed') {
      query += ` AND t.completed = true`;
    }

    if (filters?.priority) {
      query += ` AND t.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters?.projectId) {
      query += ` AND t.project_id = $${paramIndex++}`;
      params.push(filters.projectId);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query += ` AND t.tags && $${paramIndex++}`;
      params.push(filters.tags);
    }

    if (filters?.search) {
      query += ` AND (
        t.title ILIKE $${paramIndex} OR
        t.description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` GROUP BY t.id ORDER BY t.created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    logger.info('Creating task', { userId, title: data.title });

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert task
      const taskResult = await client.query(
        `INSERT INTO tasks (
          user_id, title, description, priority,
          due_date, tags, "order"
        ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE(
          (SELECT MAX("order") FROM tasks WHERE user_id = $1), 0
        ) + 1)
        RETURNING *`,
        [
          userId,
          data.title,
          data.description || null,
          data.priority || 'medium',
          data.dueDate || null,
          data.tags || [],
        ]
      );

      const task = taskResult.rows[0];

      // Update sync metadata
      await client.query(
        `INSERT INTO sync_metadata (
          user_id, entity_type, entity_id, version,
          last_modified_at, last_modified_by
        ) VALUES ($1, 'task', $2, 1, NOW(), 'mcp-server')`,
        [userId, task.id]
      );

      // Log to audit
      await client.query(
        `INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, metadata
        ) VALUES ($1, 'task_created', 'task', $2, $3)`,
        [userId, task.id, JSON.stringify({ via: 'mcp-server', title: task.title })]
      );

      await client.query('COMMIT');

      logger.info('Task created successfully', { taskId: task.id });
      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create task', { error, userId, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTask(
    userId: string,
    taskId: string,
    data: UpdateTaskData
  ): Promise<Task> {
    logger.info('Updating task', { userId, taskId, data });

    // Verify ownership
    const ownershipCheck = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [taskId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }

    if (data.dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(data.dueDate);
    }

    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(data.tags);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);

    values.push(taskId);
    const taskIdParam = paramIndex++;

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${taskIdParam}
      RETURNING *
    `;

    const result = await db.query(query, values);

    // Update sync metadata
    await db.query(
      `UPDATE sync_metadata
       SET version = version + 1,
           last_modified_at = NOW(),
           last_modified_by = 'mcp-server'
       WHERE entity_type = 'task' AND entity_id = $1`,
      [taskId]
    );

    logger.info('Task updated successfully', { taskId });
    return result.rows[0];
  }

  async completeTask(userId: string, taskId: string): Promise<Task> {
    logger.info('Completing task', { userId, taskId });

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update task
      const result = await client.query(
        `UPDATE tasks
         SET completed = true,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [taskId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Task not found or access denied');
      }

      const task = result.rows[0];

      // Update daily stats
      await client.query(
        `INSERT INTO daily_stats (user_id, date, tasks_completed)
         VALUES ($1, CURRENT_DATE, 1)
         ON CONFLICT (user_id, date)
         DO UPDATE SET tasks_completed = daily_stats.tasks_completed + 1`,
        [userId]
      );

      // Update sync metadata
      await client.query(
        `UPDATE sync_metadata
         SET version = version + 1,
             last_modified_at = NOW(),
             last_modified_by = 'mcp-server'
         WHERE entity_type = 'task' AND entity_id = $1`,
        [taskId]
      );

      await client.query('COMMIT');

      logger.info('Task completed successfully', { taskId });
      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    logger.info('Deleting task', { userId, taskId });

    // Soft delete
    const result = await db.query(
      `UPDATE tasks
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    // Update sync metadata
    await db.query(
      `UPDATE sync_metadata
       SET version = version + 1,
           last_modified_at = NOW(),
           last_modified_by = 'mcp-server',
           is_deleted = true
       WHERE entity_type = 'task' AND entity_id = $1`,
      [taskId]
    );

    logger.info('Task deleted successfully', { taskId });
  }
}
```

### Database Connection

```typescript
// apps/mcp-server/src/db/index.ts
import { Pool } from 'pg';
import { logger } from '../utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err });
});

pool.on('connect', () => {
  logger.debug('Database connection established');
});

export const db = {
  pool,
  query: (text: string, params?: any[]) => {
    logger.debug('Executing query', { text, params });
    return pool.query(text, params);
  },
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections');
  await pool.end();
  process.exit(0);
});
```

---

## Security Considerations

### 1. **Authentication Security**

- ✅ **Session Validation**: Validate session token on every request
- ✅ **Session Expiration**: Enforce NextAuth session expiry
- ✅ **No Token Caching**: Always query database for freshness
- ✅ **Audit Logging**: Log all authenticated requests

### 2. **Authorization Security**

- ✅ **User Scoping**: All queries include `WHERE user_id = $1`
- ✅ **Ownership Checks**: Verify user owns resource before mutation
- ✅ **Input Validation**: Zod schemas validate all inputs
- ✅ **SQL Injection Prevention**: Parameterized queries only

### 3. **Rate Limiting**

```typescript
// apps/mcp-server/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user
    return req.context?.userId || req.ip;
  },
});
```

### 4. **CORS Configuration**

```typescript
// apps/mcp-server/src/middleware/cors.ts
import cors from 'cors';

export const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://serenity-app.com'],
  credentials: true,
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id', 'Authorization'],
});
```

### 5. **Error Handling**

```typescript
// apps/mcp-server/src/middleware/error.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    userId: req.context?.userId,
    path: req.path,
  });

  // Don't expose internal errors to client
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid session token',
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: 'Access denied',
    });
  }

  // Generic error
  return res.status(500).json({
    error: 'Internal server error',
  });
}
```

### 6. **Data Encryption**

- ✅ **Transport Security**: HTTPS only in production
- ✅ **At-Rest Encryption**: PostgreSQL with encrypted volumes
- ✅ **Token Storage**: Sessions stored with secure hashing
- ✅ **Sensitive Fields**: Encrypt if needed (e.g., journal content)

### 7. **Audit Logging**

```typescript
// All mutations logged
await db.query(
  `INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    ip_address, user_agent, metadata
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [
    userId,
    'task_created',
    'task',
    task.id,
    req.ip,
    req.headers['user-agent'],
    JSON.stringify({ via: 'mcp-server', title: task.title })
  ]
);
```

---

## Testing Strategy

### 1. **Unit Tests**

Test services in isolation:

```typescript
// apps/mcp-server/tests/services/TaskService.test.ts
import { TaskService } from '../../src/services/TaskService';
import { db } from '../../src/db';

jest.mock('../../src/db');

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      const mockTask = {
        id: 'test-id',
        userId: 'user-123',
        title: 'Test Task',
        completed: false,
        // ...
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [mockTask] });

      const result = await taskService.createTask('user-123', {
        title: 'Test Task',
        priority: 'high',
      });

      expect(result).toEqual(mockTask);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tasks'),
        expect.arrayContaining(['user-123', 'Test Task'])
      );
    });

    it('should throw error for invalid data', async () => {
      await expect(
        taskService.createTask('user-123', { title: '' })
      ).rejects.toThrow();
    });
  });
});
```

### 2. **Integration Tests**

Test MCP server with real database:

```typescript
// apps/mcp-server/tests/integration/tasks.test.ts
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { startTestServer, stopTestServer, getTestSessionToken } from '../helpers';

describe('Task Tools Integration', () => {
  let client: McpClient;
  let sessionToken: string;

  beforeAll(async () => {
    await startTestServer();
    sessionToken = await getTestSessionToken('test-user@example.com');
  });

  afterAll(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    client = new McpClient({ sessionToken });
  });

  it('should create and retrieve task', async () => {
    // Create task
    const createResult = await client.callTool('create-task', {
      title: 'Integration Test Task',
      priority: 'high',
    });

    expect(createResult.task).toBeDefined();
    expect(createResult.task.title).toBe('Integration Test Task');

    // Retrieve tasks
    const getResult = await client.callTool('get-tasks', {});

    expect(getResult.tasks).toContainEqual(
      expect.objectContaining({ title: 'Integration Test Task' })
    );
  });
});
```

### 3. **End-to-End Tests**

Test with MCP Inspector:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run MCP server
npm run dev

# Open inspector
npx @modelcontextprotocol/inspector http://localhost:3001/mcp
```

Test scenarios:
1. ✅ Authenticate with session token
2. ✅ List all tools
3. ✅ Create task
4. ✅ Get tasks
5. ✅ Complete task
6. ✅ Delete task
7. ✅ Create journal entry
8. ✅ Search journal

### 4. **Load Testing**

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load/mcp-server.js
```

```javascript
// tests/load/mcp-server.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'get-tasks',
      arguments: { filter: 'active' },
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.SESSION_TOKEN}`,
    },
  };

  const res = http.post('http://localhost:3001/mcp', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

---

## Deployment Strategy

### Option 1: Same Server as Web App (Simplest)

Deploy MCP server alongside Next.js app:

```
Server (e.g., DigitalOcean Droplet)
├── Nginx (Reverse Proxy)
│   ├── serenity-app.com → Next.js (port 3000)
│   └── mcp.serenity-app.com → MCP Server (port 3001)
├── Next.js Web App (port 3000)
├── MCP Server (port 3001)
└── PostgreSQL (port 5432)
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/serenity
server {
  listen 443 ssl http2;
  server_name mcp.serenity-app.com;

  ssl_certificate /etc/letsencrypt/live/serenity-app.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/serenity-app.com/privkey.pem;

  location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**PM2 Process Management:**
```bash
# Install PM2
npm install -g pm2

# Start MCP server
cd apps/mcp-server
pm2 start npm --name "mcp-server" -- start

# Save PM2 config
pm2 save
pm2 startup
```

### Option 2: Separate Server (Scalable)

Deploy MCP server on dedicated infrastructure:

```
Load Balancer
├── Web App Servers (N instances)
│   └── Next.js (port 3000)
└── MCP Server Instances (M instances)
    └── MCP Server (port 3001)
        ↓
    PostgreSQL (managed service)
```

### Option 3: Serverless (Cost-Effective)

Deploy as serverless function:

**Vercel:**
```typescript
// apps/mcp-server/api/mcp.ts
import { mcpServer } from '../src/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const transport = new StreamableHTTPServerTransport(req, res);
  transport.context = { userId: user.id };

  await mcpServer.connect(transport);
}
```

**Deploy:**
```bash
cd apps/mcp-server
vercel deploy
```

### Environment Variables (Production)

```bash
# Set via hosting provider dashboard or CLI
# Never commit these to git!

DATABASE_URL=postgresql://user:pass@prod-db.com:5432/serenity
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://serenity-app.com
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
LOG_LEVEL=info
SENTRY_DSN=https://...
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy-mcp-server.yml
name: Deploy MCP Server

on:
  push:
    branches: [main]
    paths:
      - 'apps/mcp-server/**'
      - 'packages/core/**'
      - 'packages/database/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Run tests
        run: npm run test

      - name: Deploy to production
        run: |
          cd apps/mcp-server
          npm run deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

---

## Future Enhancements

### Phase 8: Advanced Features (Post-Launch)

#### 1. **Real-Time Sync**
- WebSocket support for live updates
- Notify MCP clients when data changes in web/desktop

#### 2. **Batch Operations**
- `complete-multiple-tasks`
- `delete-multiple-entries`
- More efficient for bulk actions

#### 3. **Advanced Search**
- Semantic search using embeddings
- AI-powered task recommendations

#### 4. **Integrations**
- Trigger Google Calendar sync via MCP
- Trigger GitHub sync via MCP
- Access AI insights and summaries

#### 5. **Resources**
- Add MCP resources for static data
- Template access
- Settings configuration

#### 6. **Prompts**
- Predefined conversation starters
- "What should I focus on today?"
- "Summarize my week"

#### 7. **Analytics Tools**
- `get-productivity-stats`
- `get-mood-trends`
- `get-goal-progress-report`

#### 8. **Multi-Tenant Support**
- Team workspaces
- Shared tasks and projects
- Collaborative journaling

---

## Appendix

### A. Example Usage with Claude Desktop

**Setup:**
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "serenity": {
      "url": "https://mcp.serenity-app.com/mcp",
      "headers": {
        "Authorization": "Bearer <your-session-token>"
      }
    }
  }
}
```

**Example Prompts:**

1. **"What are my tasks for today?"**
   - Claude calls `get-tasks` with filter `active` and `dueDate: today`
   - Returns list of tasks due today

2. **"Add a task to buy groceries tomorrow at high priority"**
   - Claude calls `create-task`:
     ```json
     {
       "title": "Buy groceries",
       "priority": "high",
       "dueDate": "2025-11-18T12:00:00Z"
     }
     ```

3. **"Mark task XYZ as complete"**
   - Claude calls `complete-task` with `taskId: "XYZ"`
   - Returns success message

4. **"Create a journal entry about my productive day"**
   - Claude calls `create-journal-entry`:
     ```json
     {
       "title": "Productive Day",
       "content": "Today was very productive...",
       "mood": "great",
       "tags": ["productivity", "work"]
     }
     ```

5. **"Search my journal for entries about meetings"**
   - Claude calls `search-journal` with `query: "meetings"`
   - Returns relevant entries with highlights

### B. Troubleshooting Guide

**Issue: "Unauthorized" error**
- Solution: Ensure session token is valid and not expired
- Check: `curl http://localhost:3000/api/mcp/session` to get new token

**Issue: "Task not found" error**
- Solution: Verify taskId is correct UUID
- Check: User owns the task (query scoped to userId)

**Issue: Slow response times**
- Solution: Check database query performance
- Add indexes on frequently queried columns
- Monitor PostgreSQL slow query log

**Issue: "Rate limit exceeded"**
- Solution: Wait 1 minute before retrying
- Consider increasing rate limit in production

### C. API Reference

Full API documentation will be generated using TypeDoc:

```bash
cd apps/mcp-server
npm run docs:generate
```

Output: `apps/mcp-server/docs/` (HTML documentation)

---

## Summary

This implementation plan provides a comprehensive roadmap for building a production-ready MCP server for Serenity Notes. Key highlights:

1. ✅ **Authentication**: Secure NextAuth session-based auth
2. ✅ **Schema Sync**: Monorepo ensures type safety across all apps
3. ✅ **Architecture**: Clean service layer with proper separation of concerns
4. ✅ **Security**: Rate limiting, audit logging, CORS, input validation
5. ✅ **Testing**: Unit, integration, E2E, and load testing
6. ✅ **Deployment**: Multiple options (same server, separate, serverless)
7. ✅ **Scalability**: Designed to handle growth

**Estimated Timeline:** 5 weeks for MVP (Phases 1-7)

**Next Step:** Review this plan and approve before starting implementation.

---

**Plan Status:** ⏳ Awaiting Review & Approval
**Created By:** Claude Code
**Date:** November 17, 2025
