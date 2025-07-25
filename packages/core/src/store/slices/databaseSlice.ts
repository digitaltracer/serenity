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