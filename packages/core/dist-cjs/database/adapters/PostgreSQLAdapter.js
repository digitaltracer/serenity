"use strict";
/**
 * PostgreSQL Database Adapter for Serenity Notes
 * Provides PostgreSQL-specific implementation of DatabaseOperations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgreSQLAdapter = void 0;
const pg_1 = require("pg");
const logger_1 = require("../../utils/logger");
class PostgreSQLAdapter {
    constructor() {
        this.connected = false;
        this.config = null;
        this.pool = null;
    }
    /**
     * Connect to PostgreSQL database
     */
    async connect(config) {
        if (config.type !== 'postgresql') {
            throw new Error('Invalid config type for PostgreSQLAdapter');
        }
        const pgConfig = config;
        this.config = pgConfig;
        try {
            logger_1.logger.info(`🐘 Connecting to PostgreSQL: ${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`, { component: 'PostgreSQLAdapter', operation: 'connectingPostgresql:${pgconfig.host}:${pgconfig.port}/${pgconfig.database}' });
            // Create connection pool with proper configuration
            const poolConfig = {
                user: pgConfig.username,
                password: pgConfig.password,
                host: pgConfig.host,
                port: pgConfig.port,
                database: pgConfig.database,
                ssl: pgConfig.ssl ? { rejectUnauthorized: false } : false,
                max: 10, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
            };
            this.pool = new pg_1.Pool(poolConfig);
            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.connected = true;
            logger_1.logger.info('✅ PostgreSQL connection pool established', { component: 'PostgreSQLAdapter', operation: 'postgresqlConnectionPool' });
            return true;
        }
        catch (error) {
            logger_1.logger.error('PostgreSQL connection failed:', { component: 'PostgreSQLAdapter', operation: 'postgresqlConnectionFailed:' }, error);
            this.connected = false;
            if (this.pool) {
                await this.pool.end();
                this.pool = null;
            }
            return false;
        }
    }
    /**
     * Disconnect from PostgreSQL database
     */
    async disconnect() {
        if (this.connected && this.pool) {
            try {
                await this.pool.end();
                this.pool = null;
                this.connected = false;
                this.config = null;
                logger_1.logger.info('🔌 PostgreSQL connection pool closed', { component: 'PostgreSQLAdapter', operation: 'postgresqlConnectionPool' });
            }
            catch (error) {
                logger_1.logger.error('Error closing PostgreSQL connection pool:', { component: 'PostgreSQLAdapter', operation: 'errorClosingPostgresql' }, error);
                throw error;
            }
        }
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Test database connection
     */
    async testConnection() {
        if (!this.connected || !this.pool) {
            return false;
        }
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT 1 as test');
            client.release();
            return result.rows[0]?.test === 1;
        }
        catch (error) {
            logger_1.logger.error('PostgreSQL connection test failed:', { component: 'PostgreSQLAdapter', operation: 'postgresqlConnectionTest' }, error);
            return false;
        }
    }
    /**
     * Run database migrations
     */
    async migrate() {
        if (!this.connected || !this.pool) {
            throw new Error('Not connected to database');
        }
        logger_1.logger.info('📋 Running PostgreSQL migrations...', { component: 'PostgreSQLAdapter', operation: 'runningPostgresqlMigrations...' });
        const client = await this.pool.connect();
        try {
            // Begin transaction
            await client.query('BEGIN');
            // Create migrations table if it doesn't exist
            await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
            // Create main application schema
            await this.createApplicationSchema(client);
            // Record migration
            await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', ['1.0.0']);
            // Commit transaction
            await client.query('COMMIT');
            logger_1.logger.info('✅ PostgreSQL migrations completed', { component: 'PostgreSQLAdapter', operation: 'postgresqlMigrationsCompleted' });
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Migration failed:', { component: 'PostgreSQLAdapter', operation: 'migrationFailed:' }, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get database version
     */
    async getVersion() {
        if (!this.connected || !this.pool) {
            return null;
        }
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1');
            client.release();
            return result.rows[0]?.version || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get PostgreSQL schema version:', { component: 'PostgreSQLAdapter', operation: 'failedGetPostgresql' }, error);
            return null;
        }
    }
    /**
     * Backup database
     */
    async backup(path) {
        if (!this.connected || !this.config) {
            throw new Error('Not connected to database');
        }
        logger_1.logger.info(`💾 Creating PostgreSQL backup: ${path}`, { component: 'PostgreSQLAdapter', operation: 'creatingPostgresqlBackup:' });
        try {
            const { spawn } = require('child_process');
            const { host, port, database, username, password } = this.config;
            return new Promise((resolve, reject) => {
                const env = { ...process.env, PGPASSWORD: password };
                const pgDump = spawn('pg_dump', [
                    '-h', host,
                    '-p', port.toString(),
                    '-U', username,
                    '-d', database,
                    '-f', path,
                    '--verbose'
                ], { env });
                pgDump.stdout.on('data', (data) => {
                    logger_1.logger.info(`pg_dump: ${data.toString()}`, { component: 'PostgreSQLAdapter', operation: 'pg_dump:${data.tostring()}' });
                });
                pgDump.stderr.on('data', (data) => {
                    logger_1.logger.info(`pg_dump: ${data.toString()}`, { component: 'PostgreSQLAdapter', operation: 'pg_dump:${data.tostring()}' });
                });
                pgDump.on('close', (code) => {
                    if (code === 0) {
                        logger_1.logger.info('✅ PostgreSQL backup completed', { component: 'PostgreSQLAdapter', operation: 'postgresqlBackupCompleted' });
                        resolve();
                    }
                    else {
                        reject(new Error(`pg_dump failed with exit code ${code}`));
                    }
                });
                pgDump.on('error', (error) => {
                    reject(new Error(`Failed to start pg_dump: ${error.message}`));
                });
            });
        }
        catch (error) {
            logger_1.logger.error('Backup failed:', { component: 'PostgreSQLAdapter', operation: 'backupFailed:' }, error);
            throw error;
        }
    }
    /**
     * Restore database from backup
     */
    async restore(path) {
        if (!this.connected || !this.config) {
            throw new Error('Not connected to database');
        }
        logger_1.logger.info(`📂 Restoring PostgreSQL database from: ${path}`, { component: 'PostgreSQLAdapter', operation: 'restoringPostgresqlDatabase' });
        try {
            const { spawn } = require('child_process');
            const { host, port, database, username, password } = this.config;
            return new Promise((resolve, reject) => {
                const env = { ...process.env, PGPASSWORD: password };
                const psql = spawn('psql', [
                    '-h', host,
                    '-p', port.toString(),
                    '-U', username,
                    '-d', database,
                    '-f', path,
                    '--verbose'
                ], { env });
                psql.stdout.on('data', (data) => {
                    logger_1.logger.info(`psql: ${data.toString()}`, { component: 'PostgreSQLAdapter', operation: 'psql:${data.tostring()}' });
                });
                psql.stderr.on('data', (data) => {
                    logger_1.logger.info(`psql: ${data.toString()}`, { component: 'PostgreSQLAdapter', operation: 'psql:${data.tostring()}' });
                });
                psql.on('close', (code) => {
                    if (code === 0) {
                        logger_1.logger.info('✅ PostgreSQL restore completed', { component: 'PostgreSQLAdapter', operation: 'postgresqlRestoreCompleted' });
                        resolve();
                    }
                    else {
                        reject(new Error(`psql failed with exit code ${code}`));
                    }
                });
                psql.on('error', (error) => {
                    reject(new Error(`Failed to start psql: ${error.message}`));
                });
            });
        }
        catch (error) {
            logger_1.logger.error('Restore failed:', { component: 'PostgreSQLAdapter', operation: 'restoreFailed:' }, error);
            throw error;
        }
    }
    /**
     * Vacuum/optimize database
     */
    async vacuum() {
        if (!this.connected || !this.pool) {
            throw new Error('Not connected to database');
        }
        logger_1.logger.info('🧹 Running PostgreSQL VACUUM ANALYZE...', { component: 'PostgreSQLAdapter', operation: 'runningPostgresqlVacuum' });
        const client = await this.pool.connect();
        try {
            // Get all user tables
            const result = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);
            // Run VACUUM ANALYZE on each table
            for (const row of result.rows) {
                logger_1.logger.info(`Vacuuming table: ${row.tablename}`, { component: 'PostgreSQLAdapter', operation: 'vacuumingTable:${row.tablename}' });
                await client.query(`VACUUM ANALYZE ${row.tablename}`);
            }
            logger_1.logger.info('✅ PostgreSQL VACUUM completed', { component: 'PostgreSQLAdapter', operation: 'postgresqlVacuumCompleted' });
        }
        catch (error) {
            logger_1.logger.error('VACUUM failed:', { component: 'PostgreSQLAdapter', operation: 'vacuumFailed:' }, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get database statistics
     */
    async getStats() {
        if (!this.connected || !this.pool) {
            throw new Error('Not connected to database');
        }
        const client = await this.pool.connect();
        try {
            // Get database size
            const sizeResult = await client.query(`
        SELECT pg_database_size(current_database()) as size
      `);
            const size = parseInt(sizeResult.rows[0]?.size || '0');
            // Get table count
            const tableCountResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
            const tables = parseInt(tableCountResult.rows[0]?.count || '0');
            // Get record counts for main tables
            const records = {
                tasks: 0,
                projects: 0,
                journalEntries: 0,
                users: 0,
            };
            const tableMapping = {
                'tasks': 'tasks',
                'projects': 'projects',
                'journal_entries': 'journalEntries',
                'users': 'users',
            };
            for (const [table, key] of Object.entries(tableMapping)) {
                try {
                    const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                    records[key] = parseInt(result.rows[0]?.count || '0');
                }
                catch (error) {
                    // Table might not exist yet
                    records[key] = 0;
                }
            }
            // Get basic performance stats from pg_stat_database
            const perfResult = await client.query(`
        SELECT 
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);
            const perfRow = perfResult.rows[0] || {};
            const totalQueries = parseInt(perfRow.xact_commit || '0') + parseInt(perfRow.xact_rollback || '0');
            const errorRate = totalQueries > 0 ? parseInt(perfRow.xact_rollback || '0') / totalQueries : 0;
            return {
                type: 'postgresql',
                size,
                tables,
                records,
                performance: {
                    avgQueryTime: 0, // Would need more complex calculation
                    totalQueries,
                    errorRate,
                },
                health: 'healthy',
                lastOptimized: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get PostgreSQL stats:', { component: 'PostgreSQLAdapter', operation: 'failedGetPostgresql' }, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get PostgreSQL server version
     */
    async getServerVersion() {
        if (!this.connected || !this.pool) {
            throw new Error('Not connected to database');
        }
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT version()');
            return result.rows[0]?.version || 'Unknown';
        }
        catch (error) {
            logger_1.logger.error('Failed to get server version:', { component: 'PostgreSQLAdapter', operation: 'failedGetServer' }, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get active connections count
     */
    async getActiveConnections() {
        if (!this.connected || !this.pool) {
            throw new Error('Not connected to database');
        }
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
            return parseInt(result.rows[0]?.count || '0');
        }
        catch (error) {
            logger_1.logger.error('Failed to get active connections:', { component: 'PostgreSQLAdapter', operation: 'failedGetActive' }, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get PostgreSQL-specific configuration
     */
    getPostgreSQLConfig() {
        return this.config;
    }
    /**
     * Create the application schema with all required tables
     */
    async createApplicationSchema(client) {
        logger_1.logger.info('🏗️ Creating application schema...', { component: 'PostgreSQLAdapter', operation: '🏗️CreatingApplication' });
        // Create main tables
        const schemaSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        avatar_url TEXT,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
        "order" INTEGER DEFAULT 0,
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Task tags table (many-to-many)
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
        tag TEXT,
        PRIMARY KEY (task_id, tag)
      );

      -- Journal entries table
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        mood TEXT,
        date DATE NOT NULL,
        pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Journal tags table (many-to-many)
      CREATE TABLE IF NOT EXISTS journal_tags (
        entry_id TEXT REFERENCES journal_entries(id) ON DELETE CASCADE,
        tag TEXT,
        PRIMARY KEY (entry_id, tag)
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
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Database metadata
      CREATE TABLE IF NOT EXISTS db_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Secure settings table for encrypted data storage
      CREATE TABLE IF NOT EXISTS secure_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Encrypted integrations table for storing integration tokens
      CREATE TABLE IF NOT EXISTS encrypted_integrations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('google_calendar', 'github')),
        encrypted_data TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks (parent_task_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries (date);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_pinned ON journal_entries (pinned);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (status);
      CREATE INDEX IF NOT EXISTS idx_goals_project_id ON goals (project_id);

      -- Insert initial metadata
      INSERT INTO db_metadata (key, value) VALUES ('version', '1.0.0') ON CONFLICT (key) DO NOTHING;
      INSERT INTO db_metadata (key, value) VALUES ('created_at', NOW()::TEXT) ON CONFLICT (key) DO NOTHING;
    `;
        await client.query(schemaSQL);
        logger_1.logger.info('✅ Application schema created successfully', { component: 'PostgreSQLAdapter', operation: 'applicationSchemaCreated' });
    }
}
exports.PostgreSQLAdapter = PostgreSQLAdapter;
