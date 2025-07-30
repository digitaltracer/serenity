/**
 * SQLite Database Adapter for Serenity Notes
 * Provides file-based persistence using better-sqlite3
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

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
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
      });

      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Set synchronous mode for better durability
      this.db.pragma('synchronous = NORMAL');

      console.log(`📁 SQLite database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
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
      console.log('✅ Database schema created successfully');
    } catch (error) {
      console.error('Failed to create database schema:', error);
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
      console.error('Database connection test failed:', error);
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
      console.log(`💾 Database backup created: ${targetPath}`);
      return targetPath;
    } catch (error) {
      console.error('Failed to create database backup:', error);
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
        console.log('🔒 SQLite database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
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
      console.log('🧹 Database vacuumed successfully');
    } catch (error) {
      console.error('Failed to vacuum database:', error);
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
      console.error('Raw query execution failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sqliteAdapter = new SQLiteAdapter();