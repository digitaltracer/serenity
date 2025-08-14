"use strict";
/**
 * Universal Database Manager for Serenity Notes
 * Abstracts SQLite and PostgreSQL operations behind a common interface
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseManager = exports.DatabaseManager = void 0;
class DatabaseManager {
    constructor() {
        this.currentAdapter = null;
        this.config = null;
        this.connectionStatus = {
            connected: false,
            type: 'sqlite',
        };
    }
    /**
     * Connect to database using the specified configuration
     */
    async connect(config) {
        try {
            console.log(`🔌 Connecting to ${config.type} database...`);
            // Disconnect from current database if connected
            if (this.currentAdapter) {
                await this.disconnect();
            }
            // Create appropriate adapter
            this.currentAdapter = await this.createAdapter(config);
            // Test the connection
            const connected = await this.currentAdapter.connect(config);
            if (connected) {
                this.config = config;
                this.connectionStatus = {
                    connected: true,
                    type: config.type,
                    lastConnected: new Date(),
                };
                console.log(`✅ Connected to ${config.type} database successfully`);
                // Run migrations if needed
                await this.migrate();
                return true;
            }
            else {
                throw new Error('Connection test failed');
            }
        }
        catch (error) {
            console.error(`❌ Failed to connect to ${config.type} database:`, error);
            this.connectionStatus = {
                connected: false,
                type: config.type,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            this.currentAdapter = null;
            this.config = null;
            return false;
        }
    }
    /**
     * Disconnect from current database
     */
    async disconnect() {
        if (this.currentAdapter) {
            try {
                await this.currentAdapter.disconnect();
                console.log('🔌 Database disconnected');
            }
            catch (error) {
                console.error('Error during disconnect:', error);
            }
            this.currentAdapter = null;
            this.config = null;
            this.connectionStatus.connected = false;
        }
    }
    /**
     * Check if currently connected to a database
     */
    isConnected() {
        return this.connectionStatus.connected && this.currentAdapter !== null;
    }
    /**
     * Test current database connection
     */
    async testConnection() {
        if (!this.currentAdapter) {
            return false;
        }
        try {
            const result = await this.currentAdapter.testConnection();
            // Update performance metrics
            const startTime = performance.now();
            await this.currentAdapter.testConnection();
            const latency = performance.now() - startTime;
            if (result) {
                this.connectionStatus.performance = {
                    latency,
                    throughput: 1000 / latency, // rough estimate
                };
            }
            return result;
        }
        catch (error) {
            this.connectionStatus.error = error instanceof Error ? error.message : 'Connection test failed';
            return false;
        }
    }
    /**
     * Run database migrations
     */
    async migrate() {
        if (!this.currentAdapter) {
            throw new Error('No database connection available');
        }
        console.log('📋 Running database migrations...');
        await this.currentAdapter.migrate();
        console.log('✅ Migrations completed successfully');
    }
    /**
     * Get current database schema version
     */
    async getVersion() {
        if (!this.currentAdapter) {
            return null;
        }
        return this.currentAdapter.getVersion();
    }
    /**
     * Backup database to specified path
     */
    async backup(path) {
        if (!this.currentAdapter) {
            throw new Error('No database connection available');
        }
        console.log(`💾 Creating database backup at: ${path}`);
        await this.currentAdapter.backup(path);
        console.log('✅ Backup completed successfully');
    }
    /**
     * Restore database from backup
     */
    async restore(path) {
        if (!this.currentAdapter) {
            throw new Error('No database connection available');
        }
        console.log(`📂 Restoring database from: ${path}`);
        await this.currentAdapter.restore(path);
        console.log('✅ Restore completed successfully');
    }
    /**
     * Optimize database (vacuum, analyze, etc.)
     */
    async vacuum() {
        if (!this.currentAdapter) {
            throw new Error('No database connection available');
        }
        console.log('🧹 Optimizing database...');
        await this.currentAdapter.vacuum();
        console.log('✅ Database optimization completed');
    }
    /**
     * Get database statistics and health information
     */
    async getStats() {
        if (!this.currentAdapter) {
            throw new Error('No database connection available');
        }
        return this.currentAdapter.getStats();
    }
    /**
     * Get current connection status
     */
    getConnectionStatus() {
        return { ...this.connectionStatus };
    }
    /**
     * Get current database configuration
     */
    getCurrentConfig() {
        return this.config ? { ...this.config } : null;
    }
    /**
     * Switch to a different database configuration
     */
    async switchDatabase(config) {
        console.log(`🔄 Switching from ${this.config?.type || 'none'} to ${config.type}`);
        // Backup current data if switching between different types
        if (this.config && this.config.type !== config.type && this.isConnected()) {
            const backupPath = `serenity-backup-${Date.now()}.sql`;
            try {
                await this.backup(backupPath);
                console.log(`📄 Created backup before switching: ${backupPath}`);
            }
            catch (error) {
                console.warn('Failed to create backup before switching:', error);
            }
        }
        return this.connect(config);
    }
    /**
     * Create appropriate database adapter based on configuration
     */
    async createAdapter(config) {
        switch (config.type) {
            case 'sqlite':
                const { SQLiteAdapter } = await Promise.resolve().then(() => __importStar(require('./adapters/SQLiteAdapter')));
                return new SQLiteAdapter();
            case 'postgresql':
                const { PostgreSQLAdapter } = await Promise.resolve().then(() => __importStar(require('./adapters/PostgreSQLAdapter')));
                return new PostgreSQLAdapter();
            default:
                throw new Error(`Unsupported database type: ${config.type}`);
        }
    }
    /**
     * Get recommended database configurations for different use cases
     */
    static getRecommendedConfigs() {
        return {
            personal: {
                id: 'personal-sqlite',
                name: 'Personal (SQLite)',
                description: 'Fast local database, perfect for personal use',
                config: {
                    type: 'sqlite',
                    encryption: true,
                },
                recommended: true,
                tags: ['local', 'fast', 'encrypted'],
            },
            selfHosted: {
                id: 'self-hosted-postgres',
                name: 'Self-Hosted (PostgreSQL)',
                description: 'Full-featured database for power users and teams',
                config: {
                    type: 'postgresql',
                    host: 'localhost',
                    port: 5432,
                    database: 'serenity_notes',
                    username: 'serenity',
                    password: '',
                    ssl: false,
                },
                recommended: false,
                tags: ['self-hosted', 'postgresql', 'scalable'],
            },
            cloud: {
                id: 'cloud-postgres',
                name: 'Cloud PostgreSQL',
                description: 'Managed PostgreSQL for teams and businesses',
                config: {
                    type: 'postgresql',
                    host: '',
                    port: 5432,
                    database: 'serenity_notes',
                    username: '',
                    password: '',
                    ssl: true,
                },
                recommended: false,
                tags: ['cloud', 'managed', 'secure'],
            },
        };
    }
}
exports.DatabaseManager = DatabaseManager;
// Export singleton instance
exports.databaseManager = new DatabaseManager();
