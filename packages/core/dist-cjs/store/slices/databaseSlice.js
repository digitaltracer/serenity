"use strict";
/**
 * Database State Management Slice
 * Manages database connection, configuration, and status
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectNeedsBackup = exports.selectCanConnect = exports.selectDatabaseType = exports.selectIsConnected = exports.selectLastBackup = exports.selectDatabaseError = exports.selectIsConnecting = exports.selectIsConfigModalOpen = exports.selectDatabasePreferences = exports.selectDatabaseStats = exports.selectConnectionStatus = exports.selectDatabaseConfig = exports.setTemporaryConfig = exports.updateDatabaseConnectionStatus = exports.clearDatabaseError = exports.updateDatabasePreferences = exports.closeConfigModal = exports.openConfigModal = exports.switchDatabase = exports.optimizeDatabase = exports.createDatabaseBackup = exports.refreshDatabaseStats = exports.testDatabaseConnection = exports.disconnectFromDatabase = exports.connectToDatabase = exports.initializeDatabaseConfig = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const DatabaseManager_1 = require("../../database/DatabaseManager");
const secureStorage_1 = require("../../utils/secureStorage");
const logger_1 = require("../../utils/logger");
const initialState = {
    config: null,
    connectionStatus: {
        connected: false,
        type: 'sqlite',
    },
    stats: null,
    preferences: {
        autoBackup: true,
        backupInterval: 'daily',
        backupRetention: 7,
        optimizeSchedule: 'weekly',
        connectionRetries: 3,
        queryTimeout: 30000,
        showPerformanceMetrics: true,
    },
    isConfigModalOpen: false,
    isConnecting: false,
    lastBackup: null,
    error: null,
};
// Async thunks for database operations
// Initialize database configuration from saved settings
exports.initializeDatabaseConfig = (0, toolkit_1.createAsyncThunk)('database/initialize', async (_, { rejectWithValue }) => {
    try {
        logger_1.logger.info('🔄 Initializing database configuration...', { component: 'databaseSlice', operation: 'initializingDatabaseConfiguration...' });
        // Load saved database connection from secure storage
        const savedConnection = await (0, secureStorage_1.getDatabaseConnectionSecure)();
        if (!savedConnection) {
            logger_1.logger.info('📝 No saved database configuration found', { component: 'databaseSlice', operation: 'savedDatabaseConfiguration' });
            return { config: null, status: { connected: false, type: 'sqlite' } };
        }
        logger_1.logger.info('🔍 Found saved database configuration', { component: 'databaseSlice', operation: 'foundSavedDatabase', metadata: { url: savedConnection.url } });
        // Parse the connection URL to create DatabaseConfig
        let config;
        if (savedConnection.url.startsWith('sqlite:') || savedConnection.url.includes('.db')) {
            // SQLite configuration
            const dbPath = savedConnection.url.replace('sqlite:', '');
            config = {
                type: 'sqlite',
                path: dbPath,
                memory: false,
                readonly: false
            };
        }
        else if (savedConnection.url.startsWith('postgresql:') || savedConnection.url.startsWith('postgres:')) {
            // PostgreSQL configuration - parse connection URL
            const url = new URL(savedConnection.url);
            config = {
                type: 'postgresql',
                host: url.hostname,
                port: parseInt(url.port) || 5432,
                database: url.pathname.slice(1), // Remove leading slash
                username: url.username,
                password: url.password,
                ssl: url.searchParams.get('sslmode') === 'require'
            };
        }
        else {
            logger_1.logger.warn('⚠️ Unknown database connection format', { component: 'databaseSlice', operation: 'unknownDatabaseConnection', metadata: { url: savedConnection.url } });
            return { config: null, status: { connected: false, type: 'sqlite' } };
        }
        // Attempt to connect to the saved configuration
        logger_1.logger.info(`🔌 Attempting to restore connection to ${config.type} database...`, { component: 'databaseSlice', operation: 'attemptingRestoreConnection' });
        const success = await DatabaseManager_1.databaseManager.connect(config);
        if (success) {
            const status = DatabaseManager_1.databaseManager.getConnectionStatus();
            const stats = await DatabaseManager_1.databaseManager.getStats();
            logger_1.logger.info(`✅ Successfully restored ${config.type} database connection`, { component: 'databaseSlice', operation: 'successfullyRestored${config.type}' });
            return { config, status, stats };
        }
        else {
            logger_1.logger.warn(`⚠️ Failed to restore ${config.type} database connection`, { component: 'databaseSlice', operation: 'failedRestore${config.type}' });
            return {
                config,
                status: {
                    connected: false,
                    type: config.type,
                    error: 'Failed to restore connection'
                }
            };
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to initialize database configuration:', { component: 'databaseSlice', operation: 'failedInitializeDatabase' }, error);
        return rejectWithValue(error instanceof Error ? error.message : 'Initialization failed');
    }
});
exports.connectToDatabase = (0, toolkit_1.createAsyncThunk)('database/connect', async (config, { rejectWithValue }) => {
    try {
        const success = await DatabaseManager_1.databaseManager.connect(config);
        if (!success) {
            throw new Error('Database connection failed');
        }
        const status = DatabaseManager_1.databaseManager.getConnectionStatus();
        const stats = await DatabaseManager_1.databaseManager.getStats();
        // Save the database configuration to secure storage for persistence
        try {
            let connectionUrl;
            if (config.type === 'sqlite') {
                connectionUrl = config.path ? `sqlite:${config.path}` : 'sqlite::memory:';
            }
            else if (config.type === 'postgresql') {
                const sslParam = config.ssl ? '?sslmode=require' : '';
                connectionUrl = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`;
            }
            else {
                throw new Error(`Unsupported database type: ${config.type}`);
            }
            await (0, secureStorage_1.saveDatabaseConnectionSecure)(connectionUrl);
            logger_1.logger.info('💾 Database configuration saved to secure storage', { component: 'databaseSlice', operation: 'databaseConfigurationSaved' });
        }
        catch (saveError) {
            logger_1.logger.error('⚠️ Failed to save database configuration:', { component: 'databaseSlice', operation: 'failedSaveDatabase' }, saveError);
            // Don't fail the connection if save fails, just log the warning
        }
        return { config, status, stats };
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Connection failed');
    }
});
exports.disconnectFromDatabase = (0, toolkit_1.createAsyncThunk)('database/disconnect', async (_, { rejectWithValue }) => {
    try {
        await DatabaseManager_1.databaseManager.disconnect();
        return DatabaseManager_1.databaseManager.getConnectionStatus();
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Disconnect failed');
    }
});
exports.testDatabaseConnection = (0, toolkit_1.createAsyncThunk)('database/testConnection', async (_, { rejectWithValue }) => {
    try {
        const isConnected = await DatabaseManager_1.databaseManager.testConnection();
        const status = DatabaseManager_1.databaseManager.getConnectionStatus();
        return { isConnected, status };
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Connection test failed');
    }
});
exports.refreshDatabaseStats = (0, toolkit_1.createAsyncThunk)('database/refreshStats', async (_, { rejectWithValue }) => {
    try {
        if (!DatabaseManager_1.databaseManager.isConnected()) {
            throw new Error('Not connected to database');
        }
        const stats = await DatabaseManager_1.databaseManager.getStats();
        return stats;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to refresh stats');
    }
});
exports.createDatabaseBackup = (0, toolkit_1.createAsyncThunk)('database/backup', async (path, { rejectWithValue }) => {
    try {
        await DatabaseManager_1.databaseManager.backup(path);
        return new Date();
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Backup failed');
    }
});
exports.optimizeDatabase = (0, toolkit_1.createAsyncThunk)('database/optimize', async (_, { rejectWithValue }) => {
    try {
        await DatabaseManager_1.databaseManager.vacuum();
        const stats = await DatabaseManager_1.databaseManager.getStats();
        return stats;
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Optimization failed');
    }
});
exports.switchDatabase = (0, toolkit_1.createAsyncThunk)('database/switch', async (config, { rejectWithValue }) => {
    try {
        const success = await DatabaseManager_1.databaseManager.switchDatabase(config);
        if (!success) {
            throw new Error('Database switch failed');
        }
        const status = DatabaseManager_1.databaseManager.getConnectionStatus();
        const stats = await DatabaseManager_1.databaseManager.getStats();
        return { config, status, stats };
    }
    catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Database switch failed');
    }
});
const databaseSlice = (0, toolkit_1.createSlice)({
    name: 'database',
    initialState,
    reducers: {
        // UI state management
        openConfigModal: (state) => {
            state.isConfigModalOpen = true;
        },
        closeConfigModal: (state) => {
            state.isConfigModalOpen = false;
            state.error = null;
        },
        // Preferences management
        updateDatabasePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },
        // Error management
        clearDatabaseError: (state) => {
            state.error = null;
        },
        // Connection status updates (for real-time updates)
        updateDatabaseConnectionStatus: (state, action) => {
            state.connectionStatus = action.payload;
        },
        // Manual config update (for form changes)
        setTemporaryConfig: (state, action) => {
            // This is used by the modal for temporary config changes before saving
            // The actual config is only updated on successful connection
        },
    },
    extraReducers: (builder) => {
        // Initialize database configuration
        builder
            .addCase(exports.initializeDatabaseConfig.pending, (state) => {
            state.isConnecting = true;
            state.error = null;
        })
            .addCase(exports.initializeDatabaseConfig.fulfilled, (state, action) => {
            state.isConnecting = false;
            state.config = action.payload.config;
            state.connectionStatus = action.payload.status;
            if (action.payload.stats) {
                state.stats = action.payload.stats;
            }
            state.error = null;
        })
            .addCase(exports.initializeDatabaseConfig.rejected, (state, action) => {
            state.isConnecting = false;
            state.error = action.payload;
            state.connectionStatus.connected = false;
        });
        // Connect to database
        builder
            .addCase(exports.connectToDatabase.pending, (state) => {
            state.isConnecting = true;
            state.error = null;
        })
            .addCase(exports.connectToDatabase.fulfilled, (state, action) => {
            state.isConnecting = false;
            state.config = action.payload.config;
            state.connectionStatus = action.payload.status;
            state.stats = action.payload.stats;
            state.isConfigModalOpen = false;
            state.error = null;
        })
            .addCase(exports.connectToDatabase.rejected, (state, action) => {
            state.isConnecting = false;
            state.error = action.payload;
            state.connectionStatus.connected = false;
        });
        // Disconnect from database
        builder
            .addCase(exports.disconnectFromDatabase.fulfilled, (state, action) => {
            state.connectionStatus = action.payload;
            state.config = null;
            state.stats = null;
            state.error = null;
        })
            .addCase(exports.disconnectFromDatabase.rejected, (state, action) => {
            state.error = action.payload;
        });
        // Test connection
        builder
            .addCase(exports.testDatabaseConnection.fulfilled, (state, action) => {
            state.connectionStatus = action.payload.status;
            if (!action.payload.isConnected) {
                state.error = 'Connection test failed';
            }
            else {
                state.error = null;
            }
        })
            .addCase(exports.testDatabaseConnection.rejected, (state, action) => {
            state.error = action.payload;
            state.connectionStatus.connected = false;
        });
        // Refresh stats
        builder
            .addCase(exports.refreshDatabaseStats.fulfilled, (state, action) => {
            state.stats = action.payload;
            if (state.stats) {
                state.stats.lastOptimized = new Date();
            }
        })
            .addCase(exports.refreshDatabaseStats.rejected, (state, action) => {
            state.error = action.payload;
        });
        // Backup
        builder
            .addCase(exports.createDatabaseBackup.fulfilled, (state, action) => {
            state.lastBackup = action.payload;
            state.error = null;
        })
            .addCase(exports.createDatabaseBackup.rejected, (state, action) => {
            state.error = action.payload;
        });
        // Optimize
        builder
            .addCase(exports.optimizeDatabase.fulfilled, (state, action) => {
            state.stats = action.payload;
            state.error = null;
        })
            .addCase(exports.optimizeDatabase.rejected, (state, action) => {
            state.error = action.payload;
        });
        // Switch database
        builder
            .addCase(exports.switchDatabase.pending, (state) => {
            state.isConnecting = true;
            state.error = null;
        })
            .addCase(exports.switchDatabase.fulfilled, (state, action) => {
            state.isConnecting = false;
            state.config = action.payload.config;
            state.connectionStatus = action.payload.status;
            state.stats = action.payload.stats;
            state.isConfigModalOpen = false;
            state.error = null;
        })
            .addCase(exports.switchDatabase.rejected, (state, action) => {
            state.isConnecting = false;
            state.error = action.payload;
        });
    },
});
_a = databaseSlice.actions, exports.openConfigModal = _a.openConfigModal, exports.closeConfigModal = _a.closeConfigModal, exports.updateDatabasePreferences = _a.updateDatabasePreferences, exports.clearDatabaseError = _a.clearDatabaseError, exports.updateDatabaseConnectionStatus = _a.updateDatabaseConnectionStatus, exports.setTemporaryConfig = _a.setTemporaryConfig;
exports.default = databaseSlice.reducer;
// Selectors
const selectDatabaseConfig = (state) => state.database.config;
exports.selectDatabaseConfig = selectDatabaseConfig;
const selectConnectionStatus = (state) => state.database.connectionStatus;
exports.selectConnectionStatus = selectConnectionStatus;
const selectDatabaseStats = (state) => state.database.stats;
exports.selectDatabaseStats = selectDatabaseStats;
const selectDatabasePreferences = (state) => state.database.preferences;
exports.selectDatabasePreferences = selectDatabasePreferences;
const selectIsConfigModalOpen = (state) => state.database.isConfigModalOpen;
exports.selectIsConfigModalOpen = selectIsConfigModalOpen;
const selectIsConnecting = (state) => state.database.isConnecting;
exports.selectIsConnecting = selectIsConnecting;
const selectDatabaseError = (state) => state.database.error;
exports.selectDatabaseError = selectDatabaseError;
const selectLastBackup = (state) => state.database.lastBackup;
exports.selectLastBackup = selectLastBackup;
// Computed selectors
const selectIsConnected = (state) => state.database.connectionStatus.connected;
exports.selectIsConnected = selectIsConnected;
const selectDatabaseType = (state) => state.database.connectionStatus.type;
exports.selectDatabaseType = selectDatabaseType;
const selectCanConnect = (state) => !state.database.isConnecting && state.database.config !== null;
exports.selectCanConnect = selectCanConnect;
const selectNeedsBackup = (state) => {
    if (!state.database.preferences.autoBackup || !state.database.lastBackup) {
        return false;
    }
    const now = new Date();
    const lastBackup = new Date(state.database.lastBackup);
    const interval = state.database.preferences.backupInterval;
    switch (interval) {
        case 'daily':
            return now.getTime() - lastBackup.getTime() > 24 * 60 * 60 * 1000;
        case 'weekly':
            return now.getTime() - lastBackup.getTime() > 7 * 24 * 60 * 60 * 1000;
        case 'monthly':
            return now.getTime() - lastBackup.getTime() > 30 * 24 * 60 * 60 * 1000;
        default:
            return false;
    }
};
exports.selectNeedsBackup = selectNeedsBackup;
