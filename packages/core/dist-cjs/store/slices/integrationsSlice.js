"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectLastSyncError = exports.selectIsSyncing = exports.selectGitHubIntegration = exports.selectGoogleCalendarIntegration = exports.restoreState = exports.clearSyncError = exports.setSyncError = exports.setSyncing = exports.updateGitHubLastSync = exports.updateGitHubTotalRepositories = exports.setGitHubSyncEnabled = exports.disconnectGitHub = exports.toggleGitHubTokenActive = exports.updateGitHubToken = exports.removeGitHubToken = exports.addGitHubToken = exports.connectGitHub = exports.saveGoogleCalendarCredentials = exports.updateGoogleCalendarLastSync = exports.setGoogleCalendarSyncEnabled = exports.updateGoogleCalendarTokens = exports.disconnectGoogleCalendar = exports.connectGoogleCalendar = exports.persistIntegrationsState = exports.updateGitHubSyncEnabled = exports.updateGoogleCalendarSyncEnabled = exports.initializeIntegrations = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const encryptedIntegrationService_1 = require("../../services/encryptedIntegrationService");
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
exports.initializeIntegrations = (0, toolkit_1.createAsyncThunk)('integrations/initialize', async (masterPassword, { rejectWithValue }) => {
    try {
        console.log('🔄 Initializing integrations...');
        // Check if we have encrypted integrations data
        const hasEncrypted = await encryptedIntegrationService_1.EncryptedIntegrationService.hasEncryptedIntegrations();
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
        let integrationsState = await encryptedIntegrationService_1.EncryptedIntegrationService.loadEncryptedIntegrations(masterPassword);
        // Check if loading was successful
        if (!integrationsState) {
            console.log('❌ Failed to load encrypted integrations');
            return initialState;
        }
        // Migration: Convert legacy single-token GitHub integration to multi-token format
        if (integrationsState.github && 'accessToken' in integrationsState.github) {
            console.log('🔄 Migrating legacy single-token GitHub integration to multi-token format...');
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
                console.log('✅ Successfully migrated legacy GitHub integration');
                // Save the migrated state back to storage
                try {
                    await encryptedIntegrationService_1.EncryptedIntegrationService.saveEncryptedIntegrations(integrationsState, masterPassword);
                    console.log('💾 Migrated integration state saved to storage');
                }
                catch (error) {
                    console.error('⚠️ Failed to save migrated integration state:', error);
                }
            }
        }
        console.log('✅ Successfully loaded encrypted integrations');
        return integrationsState;
    }
    catch (error) {
        console.error('❌ Failed to initialize integrations:', error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to load integrations');
    }
});
// Async thunk to update and persist Google Calendar sync enabled state
exports.updateGoogleCalendarSyncEnabled = (0, toolkit_1.createAsyncThunk)('integrations/updateGoogleCalendarSyncEnabled', async (enabled, { getState, rejectWithValue }) => {
    try {
        console.log('🔄 Updating Google Calendar sync enabled state:', enabled);
        // Get current state to check if we have encrypted integrations
        const state = getState();
        const integrations = state.integrations;
        // If not connected, just update state without persistence
        if (!integrations.googleCalendar.connected) {
            return { enabled, persisted: false };
        }
        // Try to get the master password from authentication state or prompt user
        // For now, we'll return success and let the user know they need to re-connect to persist
        console.log('⚠️ Cannot persist sync state change without master password. State updated locally only.');
        return { enabled, persisted: false };
    }
    catch (error) {
        console.error('❌ Failed to update Google Calendar sync enabled state:', error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to update sync state');
    }
});
// Async thunk to update and persist GitHub sync enabled state  
exports.updateGitHubSyncEnabled = (0, toolkit_1.createAsyncThunk)('integrations/updateGitHubSyncEnabled', async (enabled, { getState, rejectWithValue }) => {
    try {
        console.log('🔄 Updating GitHub sync enabled state:', enabled);
        // Get current state to check if we have encrypted integrations
        const state = getState();
        const integrations = state.integrations;
        // If not connected, just update state without persistence
        if (!integrations.github.connected) {
            return { enabled, persisted: false };
        }
        // Try to get the master password from authentication state or prompt user
        // For now, we'll return success and let the user know they need to re-connect to persist
        console.log('⚠️ Cannot persist sync state change without master password. State updated locally only.');
        return { enabled, persisted: false };
    }
    catch (error) {
        console.error('❌ Failed to update GitHub sync enabled state:', error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to update sync state');
    }
});
// Async thunk to persist current integrations state with master password
exports.persistIntegrationsState = (0, toolkit_1.createAsyncThunk)('integrations/persistState', async (masterPassword, { getState, rejectWithValue }) => {
    try {
        console.log('💾 Persisting integrations state to database...');
        const state = getState();
        const integrationsState = state.integrations;
        await encryptedIntegrationService_1.EncryptedIntegrationService.saveEncryptedIntegrations(integrationsState, masterPassword);
        console.log('✅ Integrations state persisted successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Failed to persist integrations state:', error);
        return rejectWithValue(error instanceof Error ? error.message : 'Failed to persist integrations');
    }
});
const integrationsSlice = (0, toolkit_1.createSlice)({
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
            .addCase(exports.initializeIntegrations.pending, (state) => {
            state.syncing = true;
            state.lastSyncError = undefined;
        })
            .addCase(exports.initializeIntegrations.fulfilled, (state, action) => {
            state.syncing = false;
            // Merge the loaded integrations state
            if (action.payload) {
                state.googleCalendar = action.payload.googleCalendar;
                state.github = action.payload.github;
            }
            state.lastSyncError = undefined;
        })
            .addCase(exports.initializeIntegrations.rejected, (state, action) => {
            state.syncing = false;
            state.lastSyncError = action.payload;
        })
            .addCase(exports.updateGoogleCalendarSyncEnabled.fulfilled, (state, action) => {
            state.googleCalendar.syncEnabled = action.payload.enabled;
        })
            .addCase(exports.updateGitHubSyncEnabled.fulfilled, (state, action) => {
            state.github.syncEnabled = action.payload.enabled;
        })
            .addCase(exports.persistIntegrationsState.pending, (state) => {
            // Optionally show a saving indicator
        })
            .addCase(exports.persistIntegrationsState.fulfilled, (state) => {
            // Successfully persisted
        })
            .addCase(exports.persistIntegrationsState.rejected, (state, action) => {
            state.lastSyncError = action.payload;
        });
    },
});
_a = integrationsSlice.actions, exports.connectGoogleCalendar = _a.connectGoogleCalendar, exports.disconnectGoogleCalendar = _a.disconnectGoogleCalendar, exports.updateGoogleCalendarTokens = _a.updateGoogleCalendarTokens, exports.setGoogleCalendarSyncEnabled = _a.setGoogleCalendarSyncEnabled, exports.updateGoogleCalendarLastSync = _a.updateGoogleCalendarLastSync, exports.saveGoogleCalendarCredentials = _a.saveGoogleCalendarCredentials, exports.connectGitHub = _a.connectGitHub, exports.addGitHubToken = _a.addGitHubToken, exports.removeGitHubToken = _a.removeGitHubToken, exports.updateGitHubToken = _a.updateGitHubToken, exports.toggleGitHubTokenActive = _a.toggleGitHubTokenActive, exports.disconnectGitHub = _a.disconnectGitHub, exports.setGitHubSyncEnabled = _a.setGitHubSyncEnabled, exports.updateGitHubTotalRepositories = _a.updateGitHubTotalRepositories, exports.updateGitHubLastSync = _a.updateGitHubLastSync, exports.setSyncing = _a.setSyncing, exports.setSyncError = _a.setSyncError, exports.clearSyncError = _a.clearSyncError, exports.restoreState = _a.restoreState;
// Async thunks are already exported above with their declarations
exports.default = integrationsSlice.reducer;
// Selectors
const selectGoogleCalendarIntegration = (state) => state.integrations.googleCalendar;
exports.selectGoogleCalendarIntegration = selectGoogleCalendarIntegration;
const selectGitHubIntegration = (state) => state.integrations.github;
exports.selectGitHubIntegration = selectGitHubIntegration;
const selectIsSyncing = (state) => state.integrations.syncing;
exports.selectIsSyncing = selectIsSyncing;
const selectLastSyncError = (state) => state.integrations.lastSyncError;
exports.selectLastSyncError = selectLastSyncError;
