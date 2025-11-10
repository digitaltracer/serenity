import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { EncryptedIntegrationService } from '../../services/encryptedIntegrationService';
import { logger } from '../../utils/logger';
const initialState = {
    googleCalendar: {
        connected: false,
        syncEnabled: false,
    },
    github: {
        connected: false,
        syncEnabled: false,
        tokens: [],
    },
    syncing: false,
};
// Async thunks
export const initializeIntegrations = createAsyncThunk('integrations/initialize', async (masterPassword, { rejectWithValue }) => {
    try {
        logger.info('🔄 Initializing integrations...', { component: 'integrationsSlice', operation: 'initializingIntegrations...' });
        // Check if we have encrypted integrations data
        const hasEncrypted = await EncryptedIntegrationService.hasEncryptedIntegrations();
        if (!hasEncrypted) {
            logger.info('📝 No encrypted integrations found', { component: 'integrationsSlice', operation: 'encryptedIntegrationsFound' });
            return initialState;
        }
        if (!masterPassword) {
            logger.info('🔐 Encrypted integrations found, but no master password provided', { component: 'integrationsSlice', operation: 'operation' });
            // Return initial state - integrations will be loaded when user authenticates
            return initialState;
        }
        logger.info('🔓 Loading encrypted integrations with master password...', { component: 'integrationsSlice', operation: 'loadingEncryptedIntegrations' });
        let integrationsState = await EncryptedIntegrationService.loadEncryptedIntegrations(masterPassword);
        // Check if loading was successful
        if (!integrationsState) {
            logger.info('❌ Failed to load encrypted integrations', { component: 'integrationsSlice', operation: 'failedLoadEncrypted' });
            return initialState;
        }
        // Migration: Convert legacy single-token GitHub integration to multi-token format
        if (integrationsState.github && 'accessToken' in integrationsState.github) {
            logger.info('🔄 Migrating legacy single-token GitHub integration to multi-token format...', { component: 'integrationsSlice', operation: 'migratingLegacySingle-token' });
            const legacyIntegration = integrationsState.github;
            // Create a token from the legacy accessToken
            if (legacyIntegration.accessToken && legacyIntegration.username) {
                const migratedToken = {
                    id: `migrated_${Date.now()}`,
                    token: legacyIntegration.accessToken,
                    username: legacyIntegration.username,
                    displayName: `${legacyIntegration.username} (Migrated)`,
                    organizations: [],
                    repositories: legacyIntegration.repositories || [],
                    lastSync: legacyIntegration.lastSync,
                    isActive: true,
                    createdAt: new Date().toISOString()
                };
                // Convert to new format
                integrationsState.github = {
                    connected: legacyIntegration.connected,
                    tokens: [migratedToken],
                    syncEnabled: legacyIntegration.syncEnabled,
                    lastSync: legacyIntegration.lastSync,
                    totalRepositories: legacyIntegration.repositories?.length || 0
                };
                logger.info('✅ Successfully migrated legacy GitHub integration', { component: 'integrationsSlice', operation: 'successfullyMigratedLegacy' });
                // Save the migrated state back to storage
                try {
                    await EncryptedIntegrationService.saveEncryptedIntegrations(integrationsState, masterPassword);
                    logger.info('💾 Migrated integration state saved to storage', { component: 'integrationsSlice', operation: 'migratedIntegrationState' });
                }
                catch (error) {
                    logger.error('⚠️ Failed to save migrated integration state:', { component: 'integrationsSlice', operation: 'failedSaveMigrated' }, error);
                }
            }
        }
        logger.info('✅ Successfully loaded encrypted integrations', { component: 'integrationsSlice', operation: 'successfullyLoadedEncrypted' });
        return integrationsState;
    }
    catch (error) {
        logger.error('❌ Failed to initialize integrations:', { component: 'integrationsSlice', operation: 'failedInitializeIntegrations:' }, error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to load integrations');
    }
});
// Async thunk to update and persist Google Calendar sync enabled state
export const updateGoogleCalendarSyncEnabled = createAsyncThunk('integrations/updateGoogleCalendarSyncEnabled', async (enabled, { getState, rejectWithValue }) => {
    try {
        logger.info('🔄 Updating Google Calendar sync enabled state', { component: 'integrationsSlice', operation: 'updatingGoogleCalendar', metadata: { enabled } });
        // Get current state to check if we have encrypted integrations
        const state = getState();
        const integrations = state.integrations;
        // If not connected, just update state without persistence
        if (!integrations.googleCalendar.connected) {
            return { enabled, persisted: false };
        }
        // Try to get the master password from authentication state or prompt user
        // For now, we'll return success and let the user know they need to re-connect to persist
        logger.info('⚠️ Cannot persist sync state change without master password. State updated locally only.', { component: 'integrationsSlice', operation: 'cannotPersistSync' });
        return { enabled, persisted: false };
    }
    catch (error) {
        logger.error('❌ Failed to update Google Calendar sync enabled state:', { component: 'integrationsSlice', operation: 'failedUpdateGoogle' }, error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to update sync state');
    }
});
// Async thunk to update and persist GitHub sync enabled state  
export const updateGitHubSyncEnabled = createAsyncThunk('integrations/updateGitHubSyncEnabled', async (enabled, { getState, rejectWithValue }) => {
    try {
        logger.info('🔄 Updating GitHub sync enabled state', { component: 'integrationsSlice', operation: 'updatingGithubSync', metadata: { enabled } });
        // Get current state to check if we have encrypted integrations
        const state = getState();
        const integrations = state.integrations;
        // If not connected, just update state without persistence
        if (!integrations.github.connected) {
            return { enabled, persisted: false };
        }
        // Try to get the master password from authentication state or prompt user
        // For now, we'll return success and let the user know they need to re-connect to persist
        logger.info('⚠️ Cannot persist sync state change without master password. State updated locally only.', { component: 'integrationsSlice', operation: 'cannotPersistSync' });
        return { enabled, persisted: false };
    }
    catch (error) {
        logger.error('❌ Failed to update GitHub sync enabled state:', { component: 'integrationsSlice', operation: 'failedUpdateGithub' }, error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to update sync state');
    }
});
// Async thunk to persist current integrations state with master password
export const persistIntegrationsState = createAsyncThunk('integrations/persistState', async (masterPassword, { getState, rejectWithValue }) => {
    try {
        logger.info('💾 Persisting integrations state to database...', { component: 'integrationsSlice', operation: 'persistingIntegrationsState' });
        const state = getState();
        const integrationsState = state.integrations;
        await EncryptedIntegrationService.saveEncryptedIntegrations(integrationsState, masterPassword);
        logger.info('✅ Integrations state persisted successfully', { component: 'integrationsSlice', operation: 'integrationsStatePersisted' });
        return true;
    }
    catch (error) {
        logger.error('❌ Failed to persist integrations state:', { component: 'integrationsSlice', operation: 'failedPersistIntegrations' }, error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to persist integrations');
    }
});
const integrationsSlice = createSlice({
    name: 'integrations',
    initialState,
    reducers: {
        // Google Calendar actions
        connectGoogleCalendar: (state, action) => {
            state.googleCalendar = {
                ...state.googleCalendar,
                connected: true,
                connectionDate: state.googleCalendar.connectionDate || new Date().toISOString(), // Set connection date only on first connection
                ...action.payload,
            };
        },
        disconnectGoogleCalendar: (state) => {
            state.googleCalendar = {
                connected: false,
                syncEnabled: false,
            };
        },
        updateGoogleCalendarTokens: (state, action) => {
            if (state.googleCalendar.connected) {
                state.googleCalendar.accessToken = action.payload.accessToken;
                state.googleCalendar.expiresAt = action.payload.expiresAt;
            }
        },
        setGoogleCalendarSyncEnabled: (state, action) => {
            state.googleCalendar.syncEnabled = action.payload;
        },
        updateGoogleCalendarLastSync: (state, action) => {
            state.googleCalendar.lastSync = action.payload;
        },
        saveGoogleCalendarCredentials: (state, action) => {
            state.googleCalendar.clientId = action.payload.clientId;
            state.googleCalendar.clientSecret = action.payload.clientSecret;
        },
        // GitHub actions
        connectGitHub: (state, action) => {
            // Add the new token to the tokens array
            const existingTokenIndex = state.github.tokens.findIndex(t => t.id === action.payload.token.id);
            if (existingTokenIndex >= 0) {
                // Update existing token
                state.github.tokens[existingTokenIndex] = action.payload.token;
            }
            else {
                // Add new token
                state.github.tokens.push(action.payload.token);
            }
            state.github.connected = state.github.tokens.length > 0;
        },
        addGitHubToken: (state, action) => {
            const existingTokenIndex = state.github.tokens.findIndex(t => t.id === action.payload.id);
            if (existingTokenIndex >= 0) {
                // Update existing token
                state.github.tokens[existingTokenIndex] = action.payload;
            }
            else {
                // Add new token
                state.github.tokens.push(action.payload);
            }
            state.github.connected = state.github.tokens.length > 0;
        },
        removeGitHubToken: (state, action) => {
            state.github.tokens = state.github.tokens.filter(token => token.id !== action.payload);
            state.github.connected = state.github.tokens.length > 0;
            // If no tokens left, disable sync
            if (state.github.tokens.length === 0) {
                state.github.syncEnabled = false;
            }
        },
        updateGitHubToken: (state, action) => {
            const tokenIndex = state.github.tokens.findIndex(t => t.id === action.payload.id);
            if (tokenIndex >= 0) {
                state.github.tokens[tokenIndex] = action.payload;
            }
        },
        toggleGitHubTokenActive: (state, action) => {
            const token = state.github.tokens.find(t => t.id === action.payload);
            if (token) {
                token.isActive = !token.isActive;
            }
        },
        disconnectGitHub: (state) => {
            state.github = {
                connected: false,
                syncEnabled: false,
                tokens: [],
            };
        },
        setGitHubSyncEnabled: (state, action) => {
            state.github.syncEnabled = action.payload;
        },
        updateGitHubTotalRepositories: (state, action) => {
            state.github.totalRepositories = action.payload;
        },
        updateGitHubLastSync: (state, action) => {
            state.github.lastSync = action.payload;
        },
        // Sync status actions
        setSyncing: (state, action) => {
            state.syncing = action.payload;
            if (action.payload) {
                state.lastSyncError = undefined;
            }
        },
        setSyncError: (state, action) => {
            state.syncing = false;
            state.lastSyncError = action.payload;
        },
        clearSyncError: (state) => {
            state.lastSyncError = undefined;
        },
        // Restore entire integrations state from persistence
        restoreState: (state, action) => {
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
            state.lastSyncError = action.payload;
        })
            .addCase(updateGoogleCalendarSyncEnabled.fulfilled, (state, action) => {
            state.googleCalendar.syncEnabled = action.payload.enabled;
        })
            .addCase(updateGitHubSyncEnabled.fulfilled, (state, action) => {
            state.github.syncEnabled = action.payload.enabled;
        })
            .addCase(persistIntegrationsState.pending, (state) => {
            // Optionally show a saving indicator
        })
            .addCase(persistIntegrationsState.fulfilled, (state) => {
            // Successfully persisted
        })
            .addCase(persistIntegrationsState.rejected, (state, action) => {
            state.lastSyncError = action.payload;
        });
    },
});
export const { connectGoogleCalendar, disconnectGoogleCalendar, updateGoogleCalendarTokens, setGoogleCalendarSyncEnabled, updateGoogleCalendarLastSync, saveGoogleCalendarCredentials, connectGitHub, addGitHubToken, removeGitHubToken, updateGitHubToken, toggleGitHubTokenActive, disconnectGitHub, setGitHubSyncEnabled, updateGitHubTotalRepositories, updateGitHubLastSync, setSyncing, setSyncError, clearSyncError, restoreState, } = integrationsSlice.actions;
// Async thunks are already exported above with their declarations
export default integrationsSlice.reducer;
// Selectors
export const selectGoogleCalendarIntegration = (state) => state.integrations.googleCalendar;
export const selectGitHubIntegration = (state) => state.integrations.github;
export const selectIsSyncing = (state) => state.integrations.syncing;
export const selectLastSyncError = (state) => state.integrations.lastSyncError;
