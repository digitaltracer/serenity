import Foundation
import GRDB

struct DatabaseMigration: Sendable {
  let identifier: String
  let statements: [String]
}

struct MigrationRunSummary: Sendable {
  let databasePath: String
  let appliedMigrations: [String]
  let skippedMigrations: [String]

  var isFreshBootstrap: Bool {
    !appliedMigrations.isEmpty && skippedMigrations.isEmpty
  }
}

actor DatabaseMigrationRunner {
  private let fileManager: FileManager

  init(fileManager: FileManager = .default) {
    self.fileManager = fileManager
  }

  func bootstrapDatabase(at databaseURL: URL) throws -> MigrationRunSummary {
    try fileManager.createDirectory(
      at: databaseURL.deletingLastPathComponent(),
      withIntermediateDirectories: true
    )

    var configuration = Configuration()
    configuration.prepareDatabase { db in
      try db.execute(sql: "PRAGMA foreign_keys = ON")
    }

    let dbQueue = try DatabaseQueue(path: databaseURL.path, configuration: configuration)
    let identifiers = Self.migrations.map(\.identifier)

    let appliedBefore = try fetchAppliedMigrations(dbQueue)

    var migrator = DatabaseMigrator()
    registerMigrations(on: &migrator)
    try migrator.migrate(dbQueue)

    let appliedAfter = try fetchAppliedMigrations(dbQueue)

    let newlyApplied = identifiers.filter { !appliedBefore.contains($0) && appliedAfter.contains($0) }
    let skipped = identifiers.filter { appliedBefore.contains($0) }

    return MigrationRunSummary(
      databasePath: databaseURL.path,
      appliedMigrations: newlyApplied,
      skippedMigrations: skipped
    )
  }

  static func defaultDatabaseURL(fileManager: FileManager = .default) throws -> URL {
    let applicationSupport = try fileManager.url(
      for: .applicationSupportDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )

    let databaseDirectory = applicationSupport
      .appendingPathComponent("SerenityMac", isDirectory: true)
      .appendingPathComponent("Database", isDirectory: true)

    return databaseDirectory.appendingPathComponent("serenity.sqlite3")
  }

  private func fetchAppliedMigrations(_ dbQueue: DatabaseQueue) throws -> Set<String> {
    try dbQueue.read { db in
      let migrationTableExists = try Bool.fetchOne(
        db,
        sql: """
        SELECT EXISTS(
          SELECT 1
          FROM sqlite_master
          WHERE type = 'table' AND name = 'grdb_migrations'
        );
        """
      ) ?? false

      guard migrationTableExists else {
        return []
      }

      return Set(try String.fetchAll(db, sql: "SELECT identifier FROM grdb_migrations;"))
    }
  }

  private func registerMigrations(on migrator: inout DatabaseMigrator) {
    for migration in Self.migrations {
      migrator.registerMigration(migration.identifier) { db in
        for statement in migration.statements {
          try db.execute(sql: statement)
        }
      }
    }
  }

  private static let migrations: [DatabaseMigration] = [
    DatabaseMigration(
      identifier: "20260214_001_core_entities",
      statements: [
        """
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT,
          archived INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          notes TEXT,
          completed INTEGER NOT NULL DEFAULT 0,
          due_at TEXT,
          project_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          mood TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          target_value REAL,
          progress_value REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        """,
      ]
    ),
    DatabaseMigration(
      identifier: "20260214_002_bootstrap_metadata",
      statements: [
        """
        CREATE TABLE IF NOT EXISTS app_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('schema_version', '2');",
        "INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('bootstrap_source', 'native-macos');",
      ]
    ),
    DatabaseMigration(
      identifier: "20260214_003_core_schema_parity",
      statements: [
        "ALTER TABLE tasks ADD COLUMN description TEXT;",
        "ALTER TABLE tasks ADD COLUMN completed_at TEXT;",
        "ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';",
        "ALTER TABLE tasks ADD COLUMN due_date TEXT;",
        "ALTER TABLE tasks ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';",
        "ALTER TABLE tasks ADD COLUMN subtasks_json TEXT NOT NULL DEFAULT '[]';",
        "ALTER TABLE tasks ADD COLUMN recurring_json TEXT;",
        "ALTER TABLE tasks ADD COLUMN user_id TEXT;",
        "UPDATE tasks SET description = notes WHERE description IS NULL;",
        "UPDATE tasks SET due_date = due_at WHERE due_date IS NULL;",
        "CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);",
        "CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);",
        "ALTER TABLE projects ADD COLUMN description TEXT;",
        "ALTER TABLE projects ADD COLUMN icon TEXT;",
        "ALTER TABLE projects ADD COLUMN user_id TEXT;",
        "CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);",
        "ALTER TABLE journal_entries ADD COLUMN date TEXT;",
        "ALTER TABLE journal_entries ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';",
        "ALTER TABLE journal_entries ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE journal_entries ADD COLUMN attachments_json TEXT NOT NULL DEFAULT '[]';",
        "ALTER TABLE journal_entries ADD COLUMN user_id TEXT;",
        "UPDATE journal_entries SET date = created_at WHERE date IS NULL;",
        "CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);",
        "CREATE INDEX IF NOT EXISTS idx_journal_pinned ON journal_entries(pinned);",
        "ALTER TABLE goals ADD COLUMN description TEXT;",
        "ALTER TABLE goals ADD COLUMN type TEXT NOT NULL DEFAULT 'weekly_tasks';",
        "ALTER TABLE goals ADD COLUMN config_json TEXT NOT NULL DEFAULT '{}';",
        "ALTER TABLE goals ADD COLUMN progress_json TEXT NOT NULL DEFAULT '{}';",
        "ALTER TABLE goals ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';",
        "ALTER TABLE goals ADD COLUMN reminders_json TEXT NOT NULL DEFAULT '[]';",
        "ALTER TABLE goals ADD COLUMN user_id TEXT;",
        "CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);",
        "CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);",
      ]
    ),
    DatabaseMigration(
      identifier: "20260214_004_ai_entities",
      statements: [
        """
        CREATE TABLE IF NOT EXISTS secure_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_insights (
          id TEXT PRIMARY KEY,
          provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'local')),
          type TEXT NOT NULL CHECK (type IN ('productivity', 'behavior', 'recommendation', 'warning')),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          confidence REAL DEFAULT 0.5,
          category TEXT NOT NULL CHECK (category IN ('tasks', 'journal', 'habits', 'goals')),
          actionable INTEGER DEFAULT 0,
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
          dismissed INTEGER DEFAULT 0,
          marked_helpful INTEGER DEFAULT 0,
          user_notes TEXT,
          visualization_data TEXT,
          actionability_suggestions TEXT DEFAULT '[]',
          theme_id TEXT,
          is_recurring INTEGER DEFAULT 0,
          occurrence_number INTEGER DEFAULT 1
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_recaps (
          id TEXT PRIMARY KEY,
          provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'local')),
          type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          highlights TEXT DEFAULT '[]',
          challenges TEXT DEFAULT '[]',
          recommendations TEXT DEFAULT '[]',
          period TEXT NOT NULL,
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          viewed INTEGER DEFAULT 0,
          favorited INTEGER DEFAULT 0,
          exported INTEGER DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_usage (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
          operation TEXT NOT NULL CHECK (operation IN ('analyze', 'recap', 'quickadd', 'summary')),
          prompt_tokens INTEGER DEFAULT 0,
          completion_tokens INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS summaries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary_type TEXT NOT NULL CHECK(summary_type IN ('tasks', 'journal', 'combined')),
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          generated_at TEXT NOT NULL,
          word_count INTEGER,
          metadata TEXT DEFAULT '{}',
          provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'local')),
          prompt_tokens INTEGER DEFAULT 0,
          completion_tokens INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_provider_credentials (
          id TEXT PRIMARY KEY,
          provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
          name TEXT NOT NULL,
          api_key_encrypted TEXT NOT NULL,
          model_preference TEXT,
          enabled INTEGER DEFAULT 1,
          priority INTEGER DEFAULT 0,
          metadata TEXT DEFAULT '{}',
          last_used_at TEXT,
          total_requests INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          success_count INTEGER DEFAULT 0,
          error_count INTEGER DEFAULT 0,
          last_error TEXT,
          last_error_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(provider, name)
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON ai_insights(category);",
        "CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);",
        "CREATE INDEX IF NOT EXISTS idx_ai_insights_theme_id ON ai_insights(theme_id);",
        "CREATE INDEX IF NOT EXISTS idx_ai_recaps_created_at ON ai_recaps(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_ai_recaps_type ON ai_recaps(type);",
        "CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage(timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_summaries_type ON summaries(summary_type);",
        "CREATE INDEX IF NOT EXISTS idx_summaries_date_range ON summaries(start_date, end_date);",
        "CREATE INDEX IF NOT EXISTS idx_summaries_generated ON summaries(generated_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_ai_credentials_provider ON ai_provider_credentials(provider);",
        "CREATE INDEX IF NOT EXISTS idx_ai_credentials_enabled ON ai_provider_credentials(enabled);",
        "CREATE INDEX IF NOT EXISTS idx_ai_credentials_priority ON ai_provider_credentials(priority);",
        "INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('schema_version', '3');",
      ]
    ),
    DatabaseMigration(
      identifier: "20260215_005_security_audit_events",
      statements: [
        """
        CREATE TABLE IF NOT EXISTS security_audit_events (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
          message TEXT NOT NULL,
          metadata_json TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_events(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_events(event_type);",
        "INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('schema_version', '4');",
      ]
    ),
  ]
}
