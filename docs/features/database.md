# Database Architecture

**Status**: ✅ SQLite Production-Ready | ⚠️ PostgreSQL Experimental
**Primary**: SQLite (via better-sqlite3)
**Optional**: PostgreSQL (for future server deployments)

---

## Overview

Serenity Notes uses a **dual-adapter database architecture** with SQLite as the primary database for the desktop application. The system is designed to be database-agnostic through the `DatabaseManager` abstraction layer, allowing future migration to PostgreSQL or other databases.

**Key Features**:
- File-based persistence (SQLite) - zero setup for users
- Automatic schema migrations on app startup
- Optimized queries with proper indexing
- ACID compliance with WAL mode
- Type-safe query methods
- Foreign key constraints enforced

---

## Architecture

### Adapter Pattern

```
┌────────────────────────────────────────────────────┐
│           Application Layer (Services)             │
│  TaskService, JournalService, AIAssistantService   │
└─────────────────────┬──────────────────────────────┘
                      │
                      ↓
┌────────────────────────────────────────────────────┐
│            DatabaseManager (Abstraction)           │
│  Provides unified interface for all adapters      │
└─────────────────────┬──────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        ↓                            ↓
┌──────────────────┐      ┌──────────────────┐
│  SQLiteAdapter   │      │ PostgresAdapter  │
│  (Production)    │      │  (Experimental)  │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         ↓                         ↓
┌──────────────────┐      ┌──────────────────┐
│ SQLiteService    │      │ PostgresService  │
│ - Query methods  │      │ - Query methods  │
│ - CRUD ops       │      │ - CRUD ops       │
└──────────────────┘      └──────────────────┘
```

### Key Components

1. **DatabaseManager** (`packages/core/src/database/DatabaseManager.ts`)
   - Abstraction layer using adapter pattern
   - Provides common interface: `DatabaseOperations`
   - Switches between SQLite and PostgreSQL based on config

2. **SQLiteAdapter** (`packages/database/src/adapters/SQLiteAdapter.ts`)
   - Manages SQLite database connection
   - Handles schema creation and migrations
   - Configures WAL mode, foreign keys, synchronous mode
   - Auto-creates database file on first run

3. **SQLiteService** (`packages/database/src/sqlite/SQLiteService.ts`)
   - Coordinates all SQLite operations
   - Exposes high-level API for services
   - Organizes queries by domain (tasks, journal, AI, goals)

4. **Query Modules** (`packages/database/src/queries/sqlite/`)
   - Separate query files per domain
   - `tasks.ts` - Task CRUD and relationships
   - `journal.ts` - Journal entry operations
   - `ai.ts` - AI insights, summaries, themes
   - `goals.ts` - Goal tracking
   - `projects.ts` - Project management

---

## Database Location

### SQLite File Location

**macOS**:
```
~/Library/Application Support/Serenity Notes/serenity.db
```

**Windows**:
```
%APPDATA%\Serenity Notes\serenity.db
```

**Linux**:
```
~/.config/Serenity Notes/serenity.db
```

**Fallback** (if Electron app.getPath() unavailable):
```
~/.serenity-notes/serenity.db
```

### Database Configuration

```typescript
// SQLite configuration
const db = new Database(dbPath, {
  readonly: false,
  fileMustExist: false,  // Create if doesn't exist
  timeout: 5000,
  verbose: isDevelopment ? logger.debug : undefined
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Synchronous mode for durability
db.pragma('synchronous = NORMAL');
```

---

## Database Schema

### Core Tables

**`users`**:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  preferences TEXT DEFAULT '{}',  -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**`projects`**:
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  archived BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**`tasks`**:
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  priority TEXT DEFAULT 'medium',  -- 'low' | 'medium' | 'high' | 'urgent'
  project_id TEXT,
  parent_task_id TEXT,             -- For subtasks
  `order` INTEGER DEFAULT 0,       -- Display order
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
  FOREIGN KEY (parent_task_id) REFERENCES tasks (id) ON DELETE CASCADE
);
```

**`task_tags`** (many-to-many):
```sql
CREATE TABLE task_tags (
  task_id TEXT,
  tag TEXT,
  PRIMARY KEY (task_id, tag),
  FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);
```

**`journal_entries`**:
```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,  -- 'great' | 'good' | 'okay' | 'bad' | 'awful'
  date DATE NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**`journal_tags`** (many-to-many):
```sql
CREATE TABLE journal_tags (
  entry_id TEXT,
  tag TEXT,
  PRIMARY KEY (entry_id, tag),
  FOREIGN KEY (entry_id) REFERENCES journal_entries (id) ON DELETE CASCADE
);
```

**`goals`**:
```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,              -- 'numeric' | 'habit' | 'milestone'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  unit TEXT,                        -- 'tasks' | 'hours' | 'pages' | etc.
  target_date DATE,
  status TEXT DEFAULT 'active',     -- 'active' | 'completed' | 'abandoned'
  project_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
);
```

### AI Insights Tables

**`ai_insights`**:
```sql
CREATE TABLE ai_insights (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'local')),
  type TEXT NOT NULL CHECK (type IN ('productivity', 'behavior', 'recommendation', 'warning')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  category TEXT NOT NULL CHECK (category IN ('tasks', 'journal', 'habits', 'goals')),
  actionable INTEGER DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  dismissed INTEGER DEFAULT 0,
  marked_helpful INTEGER DEFAULT 0,
  user_notes TEXT,
  -- Theme tracking (Oct 2025)
  theme_id TEXT,
  is_recurring INTEGER,
  occurrence_number INTEGER,
  -- Visualization and actionability
  visualization_data TEXT,
  actionability_suggestions TEXT DEFAULT '[]'
);
```

**`analysis_summaries`** (new - Oct 2025):
```sql
CREATE TABLE analysis_summaries (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  summary_text TEXT NOT NULL,
  key_themes TEXT,              -- JSON array
  tracked_patterns TEXT,         -- JSON array
  user_focus_areas TEXT,         -- JSON array
  tasks_analyzed INTEGER DEFAULT 0,
  journals_analyzed INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0
);

CREATE INDEX idx_analysis_summaries_created_at ON analysis_summaries (created_at);
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
  severity_trend TEXT,           -- 'improving' | 'stable' | 'worsening'
  insight_ids TEXT DEFAULT '[]'  -- JSON array
);
```

**`ai_recaps`**:
```sql
CREATE TABLE ai_recaps (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'local')),
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  highlights TEXT DEFAULT '[]',  -- JSON array
  challenges TEXT DEFAULT '[]',  -- JSON array
  recommendations TEXT DEFAULT '[]',  -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**`ai_usage`**:
```sql
CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('analysis', 'recap', 'quickadd')),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Security Tables

**`secure_settings`**:
```sql
CREATE TABLE secure_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**`encrypted_integrations`**:
```sql
CREATE TABLE encrypted_integrations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'google_calendar' | 'github' | 'notion'
  encrypted_data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**`db_metadata`**:
```sql
CREATE TABLE db_metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Relationships

```
projects (1) ──< (N) tasks
tasks (1) ──< (N) tasks (parent-child subtasks)
tasks (N) ──< (N) task_tags
journal_entries (N) ──< (N) journal_tags
goals (N) ──> (1) projects (optional)
ai_insights (N) ──> (1) insight_themes (optional)
```

**Key Relationship Patterns**:

1. **Projects ↔ Tasks**: One-to-many
   - One project can have many tasks
   - Task can have zero or one project
   - ON DELETE SET NULL (task remains if project deleted)

2. **Tasks ↔ Subtasks**: Self-referential
   - Parent task can have many subtasks
   - Subtask has exactly one parent
   - ON DELETE CASCADE (subtasks deleted if parent deleted)

3. **Tasks ↔ Tags**: Many-to-many
   - Task can have multiple tags
   - Tag can be on multiple tasks
   - ON DELETE CASCADE (tag association deleted with task)

4. **Insights ↔ Themes**: Many-to-one
   - Multiple insights can have same theme
   - Theme tracks all related insights
   - Optional relationship (insights can have no theme)

---

## Migration System

### How Migrations Work

Migrations run **automatically on app startup** via `SQLiteAdapter.createSchema()`:

1. **Base Schema Creation**: Creates all tables with `IF NOT EXISTS`
2. **Migration Methods**: Runs individual migration methods in sequence
3. **Idempotent**: Safe to run multiple times (checks existence before creating)

**Migration Method Pattern**:
```typescript
private async migrateMyNewTable(): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');

  try {
    // Check if table exists
    const tableExists = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='my_new_table'
    `).get();

    if (!tableExists) {
      logger.info('🔄 Creating my_new_table...');

      // Create table
      this.db.exec(`
        CREATE TABLE my_new_table (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_my_new_table_name ON my_new_table (name);
      `);

      logger.info('✅ my_new_table created successfully');
    } else {
      logger.info('✅ my_new_table already exists');
    }
  } catch (error) {
    logger.error('Failed to migrate my_new_table', { component: 'SQLiteAdapter' }, error);
    throw error;
  }
}
```

### Current Migrations

Located in `packages/database/src/adapters/SQLiteAdapter.ts`:

1. **`migrateAIUsageTable()`** (Line ~309)
   - Adds support for 'quickadd' operation type
   - Recreates table if constraint check fails

2. **`migrateTasksCompletedAt()`** (Line ~415)
   - Adds `completed_at` column to tasks table
   - Tracks when tasks were completed

3. **`migrateAIInsightsEnhancements()`** (Line ~455)
   - Adds feedback columns (user_rating, dismissed, marked_helpful, user_notes)
   - Adds visualization_data and actionability_suggestions columns

4. **`migrateAnalysisSummaries()`** (Line ~515) - **Oct 2025**
   - Creates `analysis_summaries` table
   - Adds index on created_at

5. **`migrateInsightThemes()`** (Line ~573) - **Oct 2025**
   - Creates `insight_themes` table
   - Adds theme_id, is_recurring, occurrence_number columns to ai_insights

### Migration Execution Order

```typescript
// In createSchema() method:
await this.migrateAIUsageTable();
await this.migrateTasksCompletedAt();
await this.migrateAIInsightsEnhancements();
await this.migrateAnalysisSummaries();      // New
await this.migrateInsightThemes();          // New
```

**Important**: New migrations should be added to the end of the sequence to maintain order.

---

## Query Organization

### Query Modules by Domain

**Tasks** (`packages/database/src/queries/sqlite/tasks.ts`):
- `getTasksWithSubtasks()` - Optimized query with subtask fetching
- `createTask()` / `createTaskWithId()`
- `updateTask()` / `deleteTask()`
- `getTaskById()` / `getTasksByProject()`
- Tag management methods

**Journal** (`packages/database/src/queries/sqlite/journal.ts`):
- `getAllEntries()` / `getEntryById()`
- `createEntry()` / `updateEntry()` / `deleteEntry()`
- Tag management methods
- `getEntriesByDateRange()` / `getEntriesByTag()`

**AI** (`packages/database/src/queries/sqlite/ai.ts`):
- **Insights**: CRUD operations
- **Analysis Summaries** (new):
  - `addAnalysisSummary()`
  - `getRecentAnalysisSummaries()`
  - `getAllAnalysisSummaries()`
  - `getAnalysisSummaryById()`
  - `deleteOldAnalysisSummaries()`
  - `getAnalysisSummariesByDateRange()`
- **Theme Tracking** (new):
  - `getOrCreateTheme()`
  - `trackThemeOccurrence()`
  - `calculateSeverityTrend()` (private)
  - `getAllThemes()` / `getThemesByCategory()`
  - `getRecurringThemes()`
  - `updateInsightTheme()`

**Goals** (`packages/database/src/queries/sqlite/goals.ts`):
- `getAllGoals()` / `getGoalById()`
- `createGoal()` / `updateGoal()` / `deleteGoal()`
- `updateGoalProgress()`

**Projects** (`packages/database/src/queries/sqlite/projects.ts`):
- `getAllProjects()` / `getProjectById()`
- `createProject()` / `updateProject()` / `deleteProject()`

---

## Performance Optimizations

### Indexing Strategy

**Indexes Created**:
```sql
-- Analysis summaries (for quick lookups by date)
CREATE INDEX idx_analysis_summaries_created_at ON analysis_summaries (created_at);

-- Additional indexes in base schema
CREATE INDEX idx_tasks_project ON tasks (project_id);
CREATE INDEX idx_tasks_parent ON tasks (parent_task_id);
CREATE INDEX idx_tasks_completed ON tasks (completed);
CREATE INDEX idx_journal_date ON journal_entries (date);
CREATE INDEX idx_ai_insights_provider ON ai_insights (provider);
```

### Query Optimizations

**N+1 Query Fix** (~98% performance improvement):
```typescript
// ❌ BAD - N+1 Query
async getTasksWithSubtasks() {
  const tasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id IS NULL').all();
  for (const task of tasks) {
    task.subtasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ?').all(task.id);
  }
  return tasks;
}

// ✅ GOOD - Single Query with JOIN
async getTasksWithSubtasks() {
  const tasks = db.prepare(`
    SELECT
      t.*,
      s.id AS subtask_id,
      s.title AS subtask_title,
      s.completed AS subtask_completed
    FROM tasks t
    LEFT JOIN tasks s ON s.parent_task_id = t.id
    WHERE t.parent_task_id IS NULL
  `).all();

  // Group subtasks by parent
  return groupTasksWithSubtasks(tasks);
}
```

### WAL Mode Benefits

**Write-Ahead Logging** (WAL) mode enabled:
```typescript
db.pragma('journal_mode = WAL');
```

**Benefits**:
- **Concurrent Reads**: Readers don't block writers
- **Faster Writes**: Appends to WAL file instead of main database
- **Better Crash Recovery**: More reliable than DELETE or TRUNCATE mode
- **Less Locking**: Reduced contention between operations

**Trade-offs**:
- Slightly more disk space (WAL + SHM files)
- Requires periodic checkpointing (automatic)

---

## Database API Usage

### Initialization

```typescript
import { sqliteService } from '@serenity/database';

// Initialize once on app startup
await sqliteService.initialize();
```

### CRUD Operations

**Tasks**:
```typescript
// Get all tasks
const tasks = await sqliteService.getTasks();

// Create task
const newTask = await sqliteService.createTask({
  title: 'My Task',
  priority: 'high',
  dueDate: new Date('2025-11-01'),
});

// Update task
await sqliteService.updateTask(task.id, {
  completed: true,
  completedAt: new Date(),
});

// Delete task
await sqliteService.deleteTask(task.id);
```

**Journal**:
```typescript
// Get all entries
const entries = await sqliteService.getJournalEntries();

// Create entry
const entry = await sqliteService.createJournalEntry({
  title: 'My Day',
  content: 'Today was productive...',
  mood: 'good',
  date: new Date(),
  tags: ['work', 'productivity'],
});
```

**AI Insights**:
```typescript
// Get recent analysis summaries
const summaries = await sqliteService.getRecentAnalysisSummaries(3);

// Get recurring themes
const themes = await sqliteService.ai.getRecurringThemes();

// Cleanup old summaries
await sqliteService.deleteOldAnalysisSummaries(10);
```

### Raw Queries

```typescript
// Execute raw query (use with caution)
const results = await sqliteService.executeRawQuery(
  'SELECT * FROM tasks WHERE completed = ?',
  [true]
);
```

---

## Best Practices

### 1. Always Use Parameterized Queries

```typescript
// ✅ GOOD - Parameterized
db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

// ❌ BAD - SQL Injection Risk
db.prepare(`SELECT * FROM tasks WHERE id = '${taskId}'`).get();
```

### 2. Use Transactions for Multiple Operations

```typescript
const insertMany = db.transaction((tasks) => {
  const insert = db.prepare('INSERT INTO tasks (id, title) VALUES (?, ?)');
  for (const task of tasks) {
    insert.run(task.id, task.title);
  }
});

// Execute as single transaction
insertMany(taskList);
```

### 3. Index Frequently Queried Columns

```typescript
// If querying by priority often
CREATE INDEX idx_tasks_priority ON tasks (priority);

// If querying by date range
CREATE INDEX idx_journal_date ON journal_entries (date);
```

### 4. Use Foreign Keys for Referential Integrity

```typescript
// Enable foreign keys (done in SQLiteAdapter)
db.pragma('foreign_keys = ON');

// Define relationships
FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
```

### 5. Batch Operations for Performance

```typescript
// ✅ GOOD - Batch insert
const insert = db.prepare('INSERT INTO tasks (id, title) VALUES (?, ?)');
const insertMany = db.transaction((tasks) => {
  for (const task of tasks) insert.run(task.id, task.title);
});
insertMany(tasks);

// ❌ BAD - Individual inserts
for (const task of tasks) {
  await sqliteService.createTask(task);  // Many transactions
}
```

---

## PostgreSQL Support (Experimental)

**Status**: ⚠️ Not recommended for production

**Location**: `packages/database/src/adapters/PostgresAdapter.ts`

**Why Not Recommended**:
- No automatic migration system
- Manual schema setup required
- Not actively tested
- Overkill for single-user desktop app

**When to Use**:
- Future server-based deployments
- Multi-user scenarios
- Advanced features (full-text search, JSON queries)

**Setup** (if needed):
```bash
# Install PostgreSQL
brew install postgresql
brew services start postgresql

# Create database
createdb serenity_notes

# Run schema manually
psql serenity_notes < packages/database/src/schema/schema.sql
```

---

## Troubleshooting

### "Database is locked"

**Cause**: Multiple processes trying to write simultaneously

**Solution**:
- Check WAL mode is enabled: `db.pragma('journal_mode = WAL')`
- Use transactions for multiple operations
- Don't open database from multiple SQLiteAdapter instances

---

### "Foreign key constraint failed"

**Cause**: Trying to insert/update with invalid foreign key

**Solution**:
- Ensure referenced record exists before inserting
- Check foreign key constraints are enabled: `db.pragma('foreign_keys = ON')`
- Use ON DELETE CASCADE or SET NULL appropriately

---

### "Cannot find module 'better-sqlite3'"

**Cause**: Native module not rebuilt for current Electron version

**Solution**:
```bash
cd apps/desktop
npm run electron-rebuild
```

---

### Migration Fails on Startup

**Symptoms**: App crashes with migration error

**Solution**:
- Check logs for specific migration error
- Verify table doesn't exist before creating
- Ensure migration method is idempotent
- Manually inspect database: `sqlite3 ~/Library/Application\ Support/Serenity\ Notes/serenity.db`

---

## Related Documentation

- **ADR**: See `docs/architecture/decisions/001-sqlite-primary-database.md`
- **Schema Files**: `packages/database/src/schema/schema.sql`
- **Adapter Code**: `packages/database/src/adapters/SQLiteAdapter.ts`
- **Query Code**: `packages/database/src/queries/sqlite/`
- **Current Status**: See `docs/STATUS.md` - Database section

---

**Last Updated**: 2025-10-26
**Database Version**: 1.5 (with analysis_summaries and insight_themes)
**Migration Count**: 5
