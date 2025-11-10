/**
 * Database State Management Slice
 * Manages database connection, configuration, and status
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  DatabaseConfig, 
  DatabaseConnectionStatus, 
  DatabaseStats,
  DatabasePreferences 
} from '../../types/database';
import { databaseManager } from '../../database/DatabaseManager';
import { getDatabaseConnectionSecure, saveDatabaseConnectionSecure } from '../../utils/secureStorage';
import { logger } from '../../utils/logger';

export interface DatabaseState {
  config: DatabaseConfig | null;
  connectionStatus: DatabaseConnectionStatus;
  stats: DatabaseStats | null;
  preferences: DatabasePreferences;
  isConfigModalOpen: boolean;
  isConnecting: boolean;
  lastBackup: Date | null;
  error: string | null;
}

const initialState: DatabaseState = {
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
export const initializeDatabaseConfig = createAsyncThunk(
  'database/initialize',
  async (_, { rejectWithValue }) => {
    try {
      logger.info('🔄 Initializing database configuration...', { component: 'databaseSlice', operation: 'initializingDatabaseConfiguration...' });
      
      // Load saved database connection from secure storage
      const savedConnection = await getDatabaseConnectionSecure();
      
      if (!savedConnection) {
        logger.info('📝 No saved database configuration found', { component: 'databaseSlice', operation: 'savedDatabaseConfiguration' });
        return { config: null, status: { connected: false, type: 'sqlite' as const } };
      }
      
      logger.info('🔍 Found saved database configuration', { component: 'databaseSlice', operation: 'foundSavedDatabase', metadata: { url: savedConnection.url } });
      
      // Parse the connection URL to create DatabaseConfig
      let config: DatabaseConfig;
      
      if (savedConnection.url.startsWith('sqlite:') || savedConnection.url.includes('.db')) {
        // SQLite configuration
        const dbPath = savedConnection.url.replace('sqlite:', '');
        config = {
          type: 'sqlite',
          path: dbPath,
          memory: false,
          readonly: false
        };
      } else if (savedConnection.url.startsWith('postgresql:') || savedConnection.url.startsWith('postgres:')) {
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
      } else {
        logger.warn('⚠️ Unknown database connection format', { component: 'databaseSlice', operation: 'unknownDatabaseConnection', metadata: { url: savedConnection.url } });
        return { config: null, status: { connected: false, type: 'sqlite' as const } };
      }
      
      // Attempt to connect to the saved configuration
      logger.info(`🔌 Attempting to restore connection to ${config.type} database...`, { component: 'databaseSlice', operation: 'attemptingRestoreConnection' });
      const success = await databaseManager.connect(config);
      
      if (success) {
        const status = databaseManager.getConnectionStatus();
        const stats = await databaseManager.getStats();
        logger.info(`✅ Successfully restored ${config.type} database connection`, { component: 'databaseSlice', operation: 'successfullyRestored${config.type}' });
        return { config, status, stats };
      } else {
        logger.warn(`⚠️ Failed to restore ${config.type} database connection`, { component: 'databaseSlice', operation: 'failedRestore${config.type}' });
        return { 
          config, 
          status: { 
            connected: false, 
            type: config.type,
            error: 'Failed to restore connection' 
          } 
        };
      }
    } catch (error) {
      logger.error('❌ Failed to initialize database configuration:', { component: 'databaseSlice', operation: 'failedInitializeDatabase' }, error as Error);
      return rejectWithValue(error instanceof Error ? error.message : 'Initialization failed');
    }
  }
);

export const connectToDatabase = createAsyncThunk(
  'database/connect',
  async (config: DatabaseConfig, { rejectWithValue }) => {
    try {
      const success = await databaseManager.connect(config);
      if (!success) {
        throw new Error('Database connection failed');
      }
      
      const status = databaseManager.getConnectionStatus();
      const stats = await databaseManager.getStats();
      
      // Save the database configuration to secure storage for persistence
      try {
        let connectionUrl: string;
        
        if (config.type === 'sqlite') {
          connectionUrl = config.path ? `sqlite:${config.path}` : 'sqlite::memory:';
        } else if (config.type === 'postgresql') {
          const sslParam = config.ssl ? '?sslmode=require' : '';
          connectionUrl = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`;
        } else {
          throw new Error(`Unsupported database type: ${(config as any).type}`);
        }
        
        await saveDatabaseConnectionSecure(connectionUrl);
        logger.info('💾 Database configuration saved to secure storage', { component: 'databaseSlice', operation: 'databaseConfigurationSaved' });
      } catch (saveError) {
        logger.error('⚠️ Failed to save database configuration:', { component: 'databaseSlice', operation: 'failedSaveDatabase' }, saveError as Error);
        // Don't fail the connection if save fails, just log the warning
      }
      
      return { config, status, stats };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Connection failed');
    }
  }
);

export const disconnectFromDatabase = createAsyncThunk(
  'database/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      await databaseManager.disconnect();
      return databaseManager.getConnectionStatus();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Disconnect failed');
    }
  }
);

export const testDatabaseConnection = createAsyncThunk(
  'database/testConnection',
  async (_, { rejectWithValue }) => {
    try {
      const isConnected = await databaseManager.testConnection();
      const status = databaseManager.getConnectionStatus();
      return { isConnected, status };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Connection test failed');
    }
  }
);

export const refreshDatabaseStats = createAsyncThunk(
  'database/refreshStats',
  async (_, { rejectWithValue }) => {
    try {
      if (!databaseManager.isConnected()) {
        throw new Error('Not connected to database');
      }
      
      const stats = await databaseManager.getStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to refresh stats');
    }
  }
);

export const createDatabaseBackup = createAsyncThunk(
  'database/backup',
  async (path: string, { rejectWithValue }) => {
    try {
      await databaseManager.backup(path);
      return new Date();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Backup failed');
    }
  }
);

export const optimizeDatabase = createAsyncThunk(
  'database/optimize',
  async (_, { rejectWithValue }) => {
    try {
      await databaseManager.vacuum();
      const stats = await databaseManager.getStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Optimization failed');
    }
  }
);

export const switchDatabase = createAsyncThunk(
  'database/switch',
  async (config: DatabaseConfig, { rejectWithValue }) => {
    try {
      const success = await databaseManager.switchDatabase(config);
      if (!success) {
        throw new Error('Database switch failed');
      }
      
      const status = databaseManager.getConnectionStatus();
      const stats = await databaseManager.getStats();
      
      return { config, status, stats };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Database switch failed');
    }
  }
);

const databaseSlice = createSlice({
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
    updateDatabasePreferences: (state, action: PayloadAction<Partial<DatabasePreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    // Error management
    clearDatabaseError: (state) => {
      state.error = null;
    },
    
    // Connection status updates (for real-time updates)
    updateDatabaseConnectionStatus: (state, action: PayloadAction<DatabaseConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    
    // Manual config update (for form changes)
    setTemporaryConfig: (state, action: PayloadAction<DatabaseConfig | null>) => {
      // This is used by the modal for temporary config changes before saving
      // The actual config is only updated on successful connection
    },
  },
  
  extraReducers: (builder) => {
    // Initialize database configuration
    builder
      .addCase(initializeDatabaseConfig.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(initializeDatabaseConfig.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.config = action.payload.config;
        state.connectionStatus = action.payload.status;
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
        state.error = null;
      })
      .addCase(initializeDatabaseConfig.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
        state.connectionStatus.connected = false;
      });
    
    // Connect to database
    builder
      .addCase(connectToDatabase.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectToDatabase.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.config = action.payload.config;
        state.connectionStatus = action.payload.status;
        state.stats = action.payload.stats;
        state.isConfigModalOpen = false;
        state.error = null;
      })
      .addCase(connectToDatabase.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
        state.connectionStatus.connected = false;
      });
    
    // Disconnect from database
    builder
      .addCase(disconnectFromDatabase.fulfilled, (state, action) => {
        state.connectionStatus = action.payload;
        state.config = null;
        state.stats = null;
        state.error = null;
      })
      .addCase(disconnectFromDatabase.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Test connection
    builder
      .addCase(testDatabaseConnection.fulfilled, (state, action) => {
        state.connectionStatus = action.payload.status;
        if (!action.payload.isConnected) {
          state.error = 'Connection test failed';
        } else {
          state.error = null;
        }
      })
      .addCase(testDatabaseConnection.rejected, (state, action) => {
        state.error = action.payload as string;
        state.connectionStatus.connected = false;
      });
    
    // Refresh stats
    builder
      .addCase(refreshDatabaseStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        if (state.stats) {
          state.stats.lastOptimized = new Date();
        }
      })
      .addCase(refreshDatabaseStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Backup
    builder
      .addCase(createDatabaseBackup.fulfilled, (state, action) => {
        state.lastBackup = action.payload;
        state.error = null;
      })
      .addCase(createDatabaseBackup.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Optimize
    builder
      .addCase(optimizeDatabase.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(optimizeDatabase.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Switch database
    builder
      .addCase(switchDatabase.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(switchDatabase.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.config = action.payload.config;
        state.connectionStatus = action.payload.status;
        state.stats = action.payload.stats;
        state.isConfigModalOpen = false;
        state.error = null;
      })
      .addCase(switchDatabase.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  openConfigModal,
  closeConfigModal,
  updateDatabasePreferences,
  clearDatabaseError,
  updateDatabaseConnectionStatus,
  setTemporaryConfig,
} = databaseSlice.actions;

export default databaseSlice.reducer;

// Selectors
export const selectDatabaseConfig = (state: { database: DatabaseState }) => state.database.config;
export const selectConnectionStatus = (state: { database: DatabaseState }) => state.database.connectionStatus;
export const selectDatabaseStats = (state: { database: DatabaseState }) => state.database.stats;
export const selectDatabasePreferences = (state: { database: DatabaseState }) => state.database.preferences;
export const selectIsConfigModalOpen = (state: { database: DatabaseState }) => state.database.isConfigModalOpen;
export const selectIsConnecting = (state: { database: DatabaseState }) => state.database.isConnecting;
export const selectDatabaseError = (state: { database: DatabaseState }) => state.database.error;
export const selectLastBackup = (state: { database: DatabaseState }) => state.database.lastBackup;

// Computed selectors
export const selectIsConnected = (state: { database: DatabaseState }) => 
  state.database.connectionStatus.connected;

export const selectDatabaseType = (state: { database: DatabaseState }) => 
  state.database.connectionStatus.type;

export const selectCanConnect = (state: { database: DatabaseState }) => 
  !state.database.isConnecting && state.database.config !== null;

export const selectNeedsBackup = (state: { database: DatabaseState }) => {
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