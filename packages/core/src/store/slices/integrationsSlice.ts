import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EncryptedIntegrationService } from '../../services/encryptedIntegrationService';

export interface GoogleCalendarIntegration {
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userEmail?: string;
  lastSync?: string;
  syncEnabled: boolean;
  // User-entered credentials (stored securely)
  clientId?: string;
  clientSecret?: string;
}

export interface GitHubIntegration {
  connected: boolean;
  accessToken?: string;
  username?: string;
  lastSync?: string;
  syncEnabled: boolean;
  repositories?: string[]; // Array of repo names to sync
}

export interface IntegrationsState {
  googleCalendar: GoogleCalendarIntegration;
  github: GitHubIntegration;
  syncing: boolean;
  lastSyncError?: string;
}

const initialState: IntegrationsState = {
  googleCalendar: {
    connected: false,
    syncEnabled: false,
  },
  github: {
    connected: false,
    syncEnabled: false,
    repositories: [],
  },
  syncing: false,
};

// Async thunks
export const initializeIntegrations = createAsyncThunk(
  'integrations/initialize',
  async (masterPassword: string | null, { rejectWithValue }) => {
    try {
      console.log('🔄 Initializing integrations...');
      
      // Check if we have encrypted integrations data
      const hasEncrypted = await EncryptedIntegrationService.hasEncryptedIntegrations();
      
      if (!hasEncrypted) {
        console.log('📝 No encrypted integrations found');
        return initialState;
      }
      
      if (!masterPassword) {
        console.log('🔐 Encrypted integrations found, but no master password provided');
        // Return initial state - integrations will be loaded when user authenticates
        return initialState;
      }
      
      console.log('🔓 Loading encrypted integrations with master password...');
      const integrationsState = await EncryptedIntegrationService.loadEncryptedIntegrations(masterPassword);
      
      console.log('✅ Successfully loaded encrypted integrations');
      return integrationsState;
    } catch (error) {
      console.error('❌ Failed to initialize integrations:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load integrations');
    }
  }
);

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    // Google Calendar actions
    connectGoogleCalendar: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      userEmail: string;
      clientId?: string;
      clientSecret?: string;
    }>) => {
      state.googleCalendar = {
        ...state.googleCalendar,
        connected: true,
        ...action.payload,
      };
    },
    disconnectGoogleCalendar: (state) => {
      state.googleCalendar = {
        connected: false,
        syncEnabled: false,
      };
    },
    updateGoogleCalendarTokens: (state, action: PayloadAction<{
      accessToken: string;
      expiresAt: number;
    }>) => {
      if (state.googleCalendar.connected) {
        state.googleCalendar.accessToken = action.payload.accessToken;
        state.googleCalendar.expiresAt = action.payload.expiresAt;
      }
    },
    setGoogleCalendarSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.googleCalendar.syncEnabled = action.payload;
    },
    updateGoogleCalendarLastSync: (state, action: PayloadAction<string>) => {
      state.googleCalendar.lastSync = action.payload;
    },
    saveGoogleCalendarCredentials: (state, action: PayloadAction<{
      clientId: string;
      clientSecret: string;
    }>) => {
      state.googleCalendar.clientId = action.payload.clientId;
      state.googleCalendar.clientSecret = action.payload.clientSecret;
    },

    // GitHub actions
    connectGitHub: (state, action: PayloadAction<{
      accessToken: string;
      username: string;
      repositories?: string[];
    }>) => {
      state.github = {
        ...state.github,
        connected: true,
        ...action.payload,
      };
    },
    disconnectGitHub: (state) => {
      state.github = {
        connected: false,
        syncEnabled: false,
        repositories: [],
      };
    },
    setGitHubSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.github.syncEnabled = action.payload;
    },
    updateGitHubRepositories: (state, action: PayloadAction<string[]>) => {
      state.github.repositories = action.payload;
    },
    updateGitHubLastSync: (state, action: PayloadAction<string>) => {
      state.github.lastSync = action.payload;
    },

    // Sync status actions
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.syncing = action.payload;
      if (action.payload) {
        state.lastSyncError = undefined;
      }
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.syncing = false;
      state.lastSyncError = action.payload;
    },
    clearSyncError: (state) => {
      state.lastSyncError = undefined;
    },

    // Restore entire integrations state from persistence
    restoreState: (state, action: PayloadAction<IntegrationsState>) => {
      return { ...action.payload };
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(initializeIntegrations.pending, (state) => {
        state.syncing = true;
        state.lastSyncError = undefined;
      })
      .addCase(initializeIntegrations.fulfilled, (state, action) => {
        state.syncing = false;
        // Merge the loaded integrations state
        if (action.payload) {
          state.googleCalendar = action.payload.googleCalendar;
          state.github = action.payload.github;
        }
        state.lastSyncError = undefined;
      })
      .addCase(initializeIntegrations.rejected, (state, action) => {
        state.syncing = false;
        state.lastSyncError = action.payload as string;
      });
  },
});

export const {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  updateGoogleCalendarTokens,
  setGoogleCalendarSyncEnabled,
  updateGoogleCalendarLastSync,
  saveGoogleCalendarCredentials,
  connectGitHub,
  disconnectGitHub,
  setGitHubSyncEnabled,
  updateGitHubRepositories,
  updateGitHubLastSync,
  setSyncing,
  setSyncError,
  clearSyncError,
  restoreState,
} = integrationsSlice.actions;

export default integrationsSlice.reducer;

// Selectors
export const selectGoogleCalendarIntegration = (state: { integrations: IntegrationsState }) => 
  state.integrations.googleCalendar;

export const selectGitHubIntegration = (state: { integrations: IntegrationsState }) => 
  state.integrations.github;

export const selectIsSyncing = (state: { integrations: IntegrationsState }) => 
  state.integrations.syncing;

export const selectLastSyncError = (state: { integrations: IntegrationsState }) => 
  state.integrations.lastSyncError;