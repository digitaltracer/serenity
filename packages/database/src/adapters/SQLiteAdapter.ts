/**
 * SQLite Database Adapter for Serenity Notes
 * Provides file-based persistence using better-sqlite3
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '@serenity/core';

export interface SQLiteConfig {
  dbPath?: string;
  readonly?: boolean;
  memory?: boolean;
  backup?: boolean;
}

export class SQLiteAdapter {
  private db: Database.Database | null = null;
  private dbPath: string;
  private config: SQLiteConfig;

  constructor(config: SQLiteConfig = {}) {
    this.config = config;
    this.dbPath = this.getDbPath();
  }

  /**
   * Get the database path (user documents folder by default)
   */
  private getDbPath(): string {
    if (this.config.memory) {
      return ':memory:';
    }

    if (this.config.dbPath) {
      return this.config.dbPath;
    }

    // Default: store in app's userData directory
    let appDataPath: string;
    try {
      const { app } = require('electron');
      appDataPath = app.getPath('userData'); // Already app-specific
    } catch (error) {
      // Fallback for non-Electron environments
      const os = require('os');
      appDataPath = join(os.homedir(), '.serenity-notes');
    }
    
    // Ensure directory exists
    if (!existsSync(appDataPath)) {
      mkdirSync(appDataPath, { recursive: true });
    }

    return join(appDataPath, 'serenity.db');
  }

  /**
   * Initialize the database connection
   */
  public async initialize(): Promise<void> {
    try {
      this.db = new Database(this.dbPath, {
        readonly: this.config.readonly || false,
        fileMustExist: false,
        timeout: 5000,
        verbose: process.env.NODE_ENV === 'development'
          ? (message?: unknown, ...additionalArgs: unknown[]) => logger.debug(String(message), { component: 'SQLiteAdapter', operation: 'query' })
          : undefined
      });

      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Set synchronous mode for better durability
      this.db.pragma('synchronous = NORMAL');

      logger.info(`📁 SQLite database initialized at: ${this.dbPath}`, { component: 'SQLiteAdapter', operation: 'sqliteDatabaseInitialized' });
    } catch (error) {
      logger.error('Failed to initialize SQLite database:', { component: 'SQLiteAdapter', operation: 'failedInitializeSqlite' }, error as Error);
      throw error;
    }
  }

  /**
   * Create the database schema
   */
  public async createSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        avatar_url TEXT,
        preferences TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        archived BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_at DATETIME,
        priority TEXT DEFAULT 'medium',
        project_id TEXT,
        parent_task_id TEXT,
        \`order\` INTEGER DEFAULT 0,
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
        FOREIGN KEY (parent_task_id) REFERENCES tasks (id) ON DELETE CASCADE
      );

      -- Task tags table (many-to-many)
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id TEXT,
        tag TEXT,
        PRIMARY KEY (task_id, tag),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      );

      -- Journal entries table
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        mood TEXT,
        date DATE NOT NULL,
        pinned BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Journal tags table (many-to-many)
      CREATE TABLE IF NOT EXISTS journal_tags (
        entry_id TEXT,
        tag TEXT,
        PRIMARY KEY (entry_id, tag),
        FOREIGN KEY (entry_id) REFERENCES journal_entries (id) ON DELETE CASCADE
      );

      -- Goals table
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        current_value INTEGER DEFAULT 0,
        unit TEXT,
        target_date DATE,
        status TEXT DEFAULT 'active',
        project_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
      );

      -- Database metadata
      CREATE TABLE IF NOT EXISTS db_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Secure settings table for encrypted data storage
      CREATE TABLE IF NOT EXISTS secure_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Encrypted integrations table for storing integration tokens
      CREATE TABLE IF NOT EXISTS encrypted_integrations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        encrypted_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- AI insights and recaps persistence (SQLite-compatible)
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- User feedback fields
        user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
        dismissed INTEGER DEFAULT 0,
        marked_helpful INTEGER DEFAULT 0,
        user_notes TEXT,
        -- Visualization and actionability fields
        visualization_data TEXT,
        actionability_suggestions TEXT DEFAULT '[]'
      );

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- User interaction fields
        viewed INTEGER DEFAULT 0,
        favorited INTEGER DEFAULT 0,
        exported INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON ai_insights (category);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights (type);
      CREATE INDEX IF NOT EXISTS idx_ai_recaps_created_at ON ai_recaps (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_recaps_type ON ai_recaps (type);

      -- AI token usage persistence (per operation)
      CREATE TABLE IF NOT EXISTS ai_usage (
        id TEXT PRIMARY KEY,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
        operation TEXT NOT NULL CHECK (operation IN ('analyze', 'recap', 'quickadd')),
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage (timestamp);

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks (parent_task_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries (date);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_pinned ON journal_entries (pinned);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (status);
      CREATE INDEX IF NOT EXISTS idx_goals_project_id ON goals (project_id);

      -- Set initial metadata
      INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('version', '1.0.0');
      INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('created_at', datetime('now'));
    `;

    try {
      this.db.exec(schema);
      logger.info('✅ Database schema created successfully', { component: 'SQLiteAdapter', operation: 'databaseSchemaCreated' });

      // Migration: Recreate ai_usage table with correct quickadd operation support
      await this.migrateAIUsageTable();

      // Migration: Add completed_at column to tasks table if it doesn't exist
      await this.migrateTasksCompletedAt();

      // Migration: Add feedback and visualization columns to AI insights and recaps
      await this.migrateAIInsightsEnhancements();
    } catch (error) {
      logger.error('Failed to create database schema:', { component: 'SQLiteAdapter', operation: 'failedCreateDatabase' }, error as Error);
      throw error;
    }
  }

  /**
   * Migrate ai_usage table to support quickadd operation
   */
  private async migrateAIUsageTable(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if ai_usage table has quickadd support by trying an insert
      const testQuickAdd = this.db.prepare(`
        INSERT INTO ai_usage (id, provider, operation, prompt_tokens, completion_tokens, total_tokens)
        VALUES ('test_quickadd', 'openai', 'quickadd', 0, 0, 0)
      `);

      try {
        testQuickAdd.run();
        // If successful, clean up the test record and we're good
        this.db.prepare('DELETE FROM ai_usage WHERE id = ?').run('test_quickadd');
        logger.info('✅ ai_usage table already supports quickadd operation', { component: 'SQLiteAdapter', operation: 'ai_usageTableAlready' });
        return;
      } catch (constraintError: any) {
        if (constraintError.code === 'SQLITE_CONSTRAINT_CHECK') {
          logger.info('🔄 Migrating ai_usage table to support quickadd operation...', { component: 'SQLiteAdapter', operation: 'migratingAi_usageTable' });

          // Backup existing data
          const existingData = this.db.prepare('SELECT * FROM ai_usage').all();

          // Drop and recreate table with correct constraint
          this.db.exec(`
            DROP TABLE IF EXISTS ai_usage;
            CREATE TABLE ai_usage (
              id TEXT PRIMARY KEY,
              timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
              operation TEXT NOT NULL CHECK (operation IN ('analyze', 'recap', 'quickadd')),
              prompt_tokens INTEGER DEFAULT 0,
              completion_tokens INTEGER DEFAULT 0,
              total_tokens INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage (timestamp);
          `);

          // Restore existing data
          if (existingData.length > 0) {
            const insertStmt = this.db.prepare(`
              INSERT INTO ai_usage (id, timestamp, provider, operation, prompt_tokens, completion_tokens, total_tokens)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const transaction = this.db.transaction((rows: any[]) => {
              for (const row of rows) {
                insertStmt.run(row.id, row.timestamp, row.provider, row.operation, row.prompt_tokens, row.completion_tokens, row.total_tokens);
              }
            });

            transaction(existingData);
            logger.info(`✅ Restored ${existingData.length} existing ai_usage records`, { component: 'SQLiteAdapter', operation: 'restored${existingdata.length}Existing' });
          }

          logger.info('✅ ai_usage table migration completed successfully', { component: 'SQLiteAdapter', operation: 'ai_usageTableMigration' });
        } else {
          // Some other error, re-throw
          throw constraintError;
        }
      }
    } catch (error) {
      logger.error('❌ Failed to migrate ai_usage table:', { component: 'SQLiteAdapter', operation: 'failedMigrateAi_usage' }, error as Error);
      throw error;
    }
  }

  /**
   * Migrate tasks table to add completed_at column if it doesn't exist
   */
  private async migrateTasksCompletedAt(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if completed_at column exists by querying PRAGMA table_info
      const tableInfo = this.db.prepare('PRAGMA table_info(tasks)').all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }>;

      const hasCompletedAtColumn = tableInfo.some(column => column.name === 'completed_at');

      if (hasCompletedAtColumn) {
        logger.info('✅ tasks table already has completed_at column', { component: 'SQLiteAdapter', operation: 'tasksTableAlready' });
        return;
      }

      logger.info('🔄 Adding completed_at column to tasks table...', { component: 'SQLiteAdapter', operation: 'addingCompleted_atColumn' });

      // Add the completed_at column
      this.db.exec('ALTER TABLE tasks ADD COLUMN completed_at DATETIME;');

      logger.info('✅ completed_at column added to tasks table successfully', { component: 'SQLiteAdapter', operation: 'completed_atColumnAdded' });
    } catch (error) {
      logger.error('❌ Failed to migrate tasks table for completed_at column:', { component: 'SQLiteAdapter', operation: 'failedMigrateTasks' }, error as Error);
      throw error;
    }
  }

  /**
   * Migrate AI insights and recaps tables to add feedback and visualization columns
   */
  private async migrateAIInsightsEnhancements(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check ai_insights table columns
      const insightsTableInfo = this.db.prepare('PRAGMA table_info(ai_insights)').all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }>;

      const insightsColumns = insightsTableInfo.map(col => col.name);
      const insightsColumnsToAdd = [
        { name: 'updated_at', sql: 'ALTER TABLE ai_insights ADD COLUMN updated_at DATETIME;' },
        { name: 'user_rating', sql: 'ALTER TABLE ai_insights ADD COLUMN user_rating INTEGER;' },
        { name: 'dismissed', sql: 'ALTER TABLE ai_insights ADD COLUMN dismissed INTEGER DEFAULT 0;' },
        { name: 'marked_helpful', sql: 'ALTER TABLE ai_insights ADD COLUMN marked_helpful INTEGER DEFAULT 0;' },
        { name: 'user_notes', sql: 'ALTER TABLE ai_insights ADD COLUMN user_notes TEXT;' },
        { name: 'visualization_data', sql: 'ALTER TABLE ai_insights ADD COLUMN visualization_data TEXT;' },
        { name: 'actionability_suggestions', sql: "ALTER TABLE ai_insights ADD COLUMN actionability_suggestions TEXT DEFAULT '[]';" }
      ];

      let insightsAdded = 0;
      for (const column of insightsColumnsToAdd) {
        if (!insightsColumns.includes(column.name)) {
          logger.info(`🔄 Adding ${column.name} column to ai_insights table...`, { component: 'SQLiteAdapter', operation: `adding${column.name}Column` });
          this.db.exec(column.sql);
          insightsAdded++;
        }
      }

      if (insightsAdded > 0) {
        logger.info(`✅ Added ${insightsAdded} new columns to ai_insights table`, { component: 'SQLiteAdapter', operation: 'addedInsightsColumns' });
      } else {
        logger.info('✅ ai_insights table already has all enhancement columns', { component: 'SQLiteAdapter', operation: 'ai_insightsTableAlready' });
      }

      // Check ai_recaps table columns
      const recapsTableInfo = this.db.prepare('PRAGMA table_info(ai_recaps)').all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }>;

      const recapsColumns = recapsTableInfo.map(col => col.name);
      const recapsColumnsToAdd = [
        { name: 'updated_at', sql: 'ALTER TABLE ai_recaps ADD COLUMN updated_at DATETIME;' },
        { name: 'viewed', sql: 'ALTER TABLE ai_recaps ADD COLUMN viewed INTEGER DEFAULT 0;' },
        { name: 'favorited', sql: 'ALTER TABLE ai_recaps ADD COLUMN favorited INTEGER DEFAULT 0;' },
        { name: 'exported', sql: 'ALTER TABLE ai_recaps ADD COLUMN exported INTEGER DEFAULT 0;' }
      ];

      let recapsAdded = 0;
      for (const column of recapsColumnsToAdd) {
        if (!recapsColumns.includes(column.name)) {
          logger.info(`🔄 Adding ${column.name} column to ai_recaps table...`, { component: 'SQLiteAdapter', operation: `adding${column.name}Column` });
          this.db.exec(column.sql);
          recapsAdded++;
        }
      }

      if (recapsAdded > 0) {
        logger.info(`✅ Added ${recapsAdded} new columns to ai_recaps table`, { component: 'SQLiteAdapter', operation: 'addedRecapsColumns' });
      } else {
        logger.info('✅ ai_recaps table already has all enhancement columns', { component: 'SQLiteAdapter', operation: 'ai_recapsTableAlready' });
      }

      // Create index on dismissed column after adding it
      if (insightsColumns.includes('dismissed') || insightsAdded > 0) {
        try {
          this.db.exec('CREATE INDEX IF NOT EXISTS idx_ai_insights_dismissed ON ai_insights (dismissed);');
          logger.info('✅ Created index on ai_insights.dismissed', { component: 'SQLiteAdapter', operation: 'createdDismissedIndex' });
        } catch (indexError) {
          // Index might already exist, that's ok
          logger.debug('Index on dismissed may already exist', { component: 'SQLiteAdapter', operation: 'dismissedIndexExists' });
        }
      }

    } catch (error) {
      logger.error('❌ Failed to migrate AI insights/recaps tables:', { component: 'SQLiteAdapter', operation: 'failedMigrateAiInsights' }, error as Error);
      throw error;
    }
  }

  /**
   * Get the database instance
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initialize();
      }
      
      const result = this.db!.prepare('SELECT 1 as test').get() as { test: number } | undefined;
      return result ? result.test === 1 : false;
    } catch (error) {
      logger.error('Database connection test failed:', { component: 'SQLiteAdapter', operation: 'databaseConnectionTest' }, error as Error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public getStats(): {
    path: string;
    size: number;
    tables: { name: string; count: number }[];
  } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tables = [
      'users', 'projects', 'tasks', 'task_tags', 
      'journal_entries', 'journal_tags', 'goals'
    ];

    const tableStats = tables.map(table => {
      try {
        const result = this.db!.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        return { name: table, count: result.count };
      } catch (error) {
        return { name: table, count: 0 };
      }
    });

    return {
      path: this.dbPath,
      size: this.config.memory ? 0 : this.getDatabaseSize(),
      tables: tableStats
    };
  }

  /**
   * Get database file size
   */
  private getDatabaseSize(): number {
    try {
      if (this.config.memory || !existsSync(this.dbPath)) {
        return 0;
      }
      const fs = require('fs');
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create a backup of the database
   */
  public async backup(backupPath?: string): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let appDataPath: string;
    try {
      const { app } = require('electron');
      appDataPath = app.getPath('userData');
    } catch (error) {
      const os = require('os');
      appDataPath = join(os.homedir(), '.serenity-notes');
    }
    
    const defaultBackupPath = join(
      appDataPath, 
      'Backups',
      `serenity-backup-${timestamp}.db`
    );

    const targetPath = backupPath || defaultBackupPath;
    
    // Ensure backup directory exists
    const backupDir = require('path').dirname(targetPath);
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    try {
      await this.db.backup(targetPath);
      logger.info(`💾 Database backup created: ${targetPath}`, { component: 'SQLiteAdapter', operation: 'databaseBackupCreated:' });
      return targetPath;
    } catch (error) {
      logger.error('Failed to create database backup:', { component: 'SQLiteAdapter', operation: 'failedCreateDatabase' }, error as Error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        logger.info('🔒 SQLite database connection closed', { component: 'SQLiteAdapter', operation: 'sqliteDatabaseConnection' });
      } catch (error) {
        logger.error('Error closing database:', { component: 'SQLiteAdapter', operation: 'errorClosingDatabase:' }, error as Error);
        throw error;
      }
    }
  }

  /**
   * Execute a transaction
   */
  public transaction<T>(fn: (db: Database.Database) => T): T {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(fn);
    return transaction(this.db);
  }

  /**
   * Vacuum the database to optimize storage
   */
  public vacuum(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.exec('VACUUM');
      logger.info('🧹 Database vacuumed successfully', { component: 'SQLiteAdapter', operation: 'databaseVacuumedSuccessfully' });
    } catch (error) {
      logger.error('Failed to vacuum database:', { component: 'SQLiteAdapter', operation: 'failedVacuumDatabase:' }, error as Error);
      throw error;
    }
  }

  /**
   * Execute a raw SQL query with optional parameters
   */
  public executeRawQuery(query: string, params?: any[]): any {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Determine the type of query
      const queryType = query.trim().toUpperCase();
      
      if (queryType.startsWith('SELECT')) {
        // For SELECT queries, return all results
        const stmt = this.db.prepare(query);
        return params ? stmt.all(...params) : stmt.all();
      } else if (queryType.startsWith('INSERT') || queryType.startsWith('UPDATE') || queryType.startsWith('DELETE')) {
        // For modification queries, return run result
        const stmt = this.db.prepare(query);
        return params ? stmt.run(...params) : stmt.run();
      } else {
        // For DDL and other queries, use exec
        if (params && params.length > 0) {
          const stmt = this.db.prepare(query);
          return params ? stmt.run(...params) : stmt.run();
        } else {
          this.db.exec(query);
          return { changes: 0, lastInsertRowid: 0 };
        }
      }
    } catch (error) {
      logger.error('Raw query execution failed:', { component: 'SQLiteAdapter', operation: 'rawQueryExecution' }, error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const sqliteAdapter = new SQLiteAdapter();
