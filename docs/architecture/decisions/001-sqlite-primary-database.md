# ADR-001: SQLite as Primary Database

**Date**: 2025-01-15 (Original decision)
**Status**: Accepted
**Author**: Development Team

## Context

Serenity Notes is a cross-platform desktop productivity application built with Electron. We needed to choose a database solution that would:

- Work offline-first (no network dependency)
- Require zero setup for end users
- Support complex queries and relationships
- Perform well for a single-user desktop application
- Be cross-platform (macOS, Windows, Linux)
- Handle concurrent reads/writes safely
- Persist data reliably without data loss

We considered three main options:
1. SQLite (file-based SQL database)
2. PostgreSQL (client-server SQL database)
3. LevelDB / IndexedDB (key-value store)

## Decision

We chose **SQLite as the primary database** for the Electron desktop application, with PostgreSQL as an optional secondary adapter for future server-based deployments.

SQLite is accessed via the `better-sqlite3` npm package (native Node.js addon) from the Electron main process.

## Consequences

### Positive

- **Zero Setup**: Users don't need to install or configure a database server
- **Offline-First**: Fully functional without network connection
- **Performance**: Excellent read/write performance for single-user scenarios
- **Reliability**: ACID-compliant with WAL (Write-Ahead Logging) mode
- **Portability**: Single file database easy to backup/restore
- **Cross-Platform**: Works identically on macOS, Windows, Linux
- **SQL Support**: Full SQL capabilities (JOINs, transactions, foreign keys, indexes)
- **File-Based**: Database stored in user's app data folder
  - macOS: `~/Library/Application Support/Serenity Notes/serenity.db`
  - Windows: `%APPDATA%/Serenity Notes/serenity.db`
  - Linux: `~/.config/Serenity Notes/serenity.db`

### Negative

- **Native Module**: `better-sqlite3` requires native compilation
  - Must rebuild when switching Electron/Node.js versions
  - Adds complexity to build process (auto-rebuild on postinstall)
- **Single-User Only**: Not suitable for multi-user concurrent access
- **Limited Scalability**: Not ideal for server deployments with many concurrent connections
- **Synchronous API**: `better-sqlite3` uses synchronous calls (blocking)
  - Mitigated by running in main process (doesn't block renderer UI)

### Neutral

- **Dual Adapter Pattern**: Implemented `DatabaseManager` abstraction to support both SQLite and PostgreSQL
  - Allows future migration to PostgreSQL if needed
  - SQLite recommended for desktop, PostgreSQL for server
- **Migration System**: Custom migration system using migration methods in `SQLiteAdapter`
  - Each migration checks table existence before creating
  - Idempotent (safe to run multiple times)
  - Runs automatically on app startup

## Alternatives Considered

### Alternative 1: PostgreSQL

**Description**: Client-server database, requires PostgreSQL server running

**Pros**:
- Industry-standard, battle-tested
- Excellent for multi-user scenarios
- Advanced features (full-text search, JSON support, extensions)
- Better for future server-based deployments

**Cons**:
- Requires PostgreSQL installation and configuration
- Network dependency (not offline-first)
- Overkill for single-user desktop app
- Complex setup for end users
- Connection management overhead

**Why not chosen**: Too complex for desktop app. Requires user to install and configure PostgreSQL server. Not offline-first.

**Current Status**: PostgreSQL adapter implemented but marked experimental. Used for future server deployments, not desktop.

---

### Alternative 2: LevelDB / IndexedDB

**Description**: Key-value store, no SQL

**Pros**:
- Simple, lightweight
- No native module compilation (if using pure JS implementation)
- Fast for key-value operations

**Cons**:
- No SQL support (no JOINs, complex queries difficult)
- No relationships between entities (manual relationship management)
- Less familiar to developers (SQL is widely known)
- Limited querying capabilities

**Why not chosen**: Serenity Notes has complex data relationships (tasks → projects → subtasks, journal entries → tags, AI insights → themes). SQL is much better suited for relational data.

## Implementation Notes

**Key Files**:
- Adapter: `packages/database/src/adapters/SQLiteAdapter.ts`
- Service: `packages/database/src/sqlite/SQLiteService.ts`
- Queries: `packages/database/src/queries/sqlite/`
- Native module: `better-sqlite3` (auto-rebuilt via postinstall)

**Database Configuration**:
```typescript
// WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Synchronous mode for durability
db.pragma('synchronous = NORMAL');
```

**Migration System**:
- Migrations run on app startup via `createSchema()` method
- Each migration is a separate method (e.g., `migrateAnalysisSummaries()`)
- Checks table existence before creating: `SELECT name FROM sqlite_master WHERE type='table' AND name='...'`
- Idempotent: safe to run multiple times

**Current Tables** (as of October 2025):
- `users`, `projects`, `tasks`, `task_tags`
- `journal_entries`, `journal_tags`
- `goals`
- `ai_insights`, `ai_recaps`, `ai_usage`
- `analysis_summaries` (new - Oct 2025)
- `insight_themes` (new - Oct 2025)
- `secure_settings`, `encrypted_integrations`
- `db_metadata`

**Performance Optimization**:
- N+1 query issues fixed (~98% performance improvement)
- Use of indexes on frequently queried columns
- Batch operations where appropriate
- WAL mode reduces lock contention

## References

- SQLite Documentation: https://www.sqlite.org/
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Implementation: `packages/database/src/adapters/SQLiteAdapter.ts`
- Migration History: See individual `migrate*()` methods in SQLiteAdapter
- Related ADR: ADR-002 (AI Insights Context Continuity) - added new tables
