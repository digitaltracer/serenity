"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionMasterPassword = exports.selectSessionActive = exports.selectLockoutTime = exports.selectFailedAttempts = exports.selectAuthError = exports.selectIsValidating = exports.selectHasMasterPassword = exports.selectIsInitialized = exports.selectIsLocked = exports.selectAuth = exports.checkAutoLock = exports.setAutoLockTimeout = exports.clearError = exports.updateLastActivity = exports.unlockApp = exports.lockApp = exports.factoryReset = exports.resetPassword = exports.authenticateWithBiometric = exports.setMasterPassword = exports.validatePassword = exports.initializeAuth = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const secureStorage_1 = require("../../utils/secureStorage");
const secureStorage_2 = require("../../utils/secureStorage");
const secureSessionManager_1 = require("../../utils/secureSessionManager");
const integrationsSlice_1 = require("./integrationsSlice");
const logger_1 = require("../../utils/logger");
const initialState = {
    isLocked: true, // Start locked by default
    isInitialized: false,
    hasMasterPassword: false,
    isValidating: false,
    failedAttempts: 0,
    maxAttempts: 5,
    lockoutUntil: null,
    autoLockTimeout: 15,
    lastActivity: Date.now(),
    error: null,
    sessionActive: false,
};
// Async thunks
exports.initializeAuth = (0, toolkit_1.createAsyncThunk)('auth/initialize', async () => {
    logger_1.logger.info('🚀 Auth initialization started', { component: 'authSlice', operation: 'authInitializationStarted' });
    const startTime = performance.now();
    try {
        // Check if database API is available
        if (!window.electronAPI?.auth) {
            logger_1.logger.info('⚡ Auth API not available, using default settings', { component: 'authSlice', operation: 'operation' });
            return {
                hasMasterPassword: false,
                autoLockTimeout: 15,
                isLocked: false,
            };
        }
        // Load privacy settings from database
        logger_1.logger.info('🔐 Loading settings from database...', { component: 'authSlice', operation: 'loadingSettingsFrom' });
        const settingsStart = performance.now();
        const privacySettings = await (0, secureStorage_2.getPrivacySettingsSecure)();
        logger_1.logger.info(`✅ Privacy settings loaded in ${(performance.now() - settingsStart).toFixed(2)}ms`, { component: 'authSlice', operation: 'privacySettingsLoaded' });
        const hasMasterPassword = privacySettings?.masterPasswordEnabled || false;
        const autoLockTimeout = privacySettings?.autoLockTimeout || 15;
        logger_1.logger.info(`🔐 Auth config: masterPassword=${hasMasterPassword}, timeout=${autoLockTimeout}`, { component: 'authSlice', operation: 'operation' });
        logger_1.logger.info(`✅ Auth initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`, { component: 'authSlice', operation: 'authInitializationCompleted' });
        return {
            hasMasterPassword,
            autoLockTimeout,
            isLocked: hasMasterPassword, // Lock if master password is enabled
        };
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to initialize auth:', { component: 'authSlice', operation: 'failedInitializeAuth:' }, error);
        logger_1.logger.info(`⚠️ Falling back to defaults after ${(performance.now() - startTime).toFixed(2)}ms`, { component: 'authSlice', operation: 'fallingBackDefaults' });
        return {
            hasMasterPassword: false,
            autoLockTimeout: 15,
            isLocked: false,
        };
    }
});
exports.validatePassword = (0, toolkit_1.createAsyncThunk)('auth/validatePassword', async (password, { getState, rejectWithValue, dispatch }) => {
    try {
        const state = getState();
        // Check if currently in lockout
        if (state.auth.lockoutUntil && Date.now() < state.auth.lockoutUntil) {
            return rejectWithValue('Account is temporarily locked. Please try again later.');
        }
        const isValid = await (0, secureStorage_1.validateMasterPasswordSecure)(password);
        if (!isValid) {
            return rejectWithValue('Invalid password');
        }
        // Password is valid - load encrypted integrations
        try {
            logger_1.logger.info('🔓 Master password validated, loading encrypted integrations...', { component: 'authSlice', operation: 'operation' });
            await dispatch((0, integrationsSlice_1.initializeIntegrations)(password));
            logger_1.logger.info('✅ Encrypted integrations loaded successfully', { component: 'authSlice', operation: 'encryptedIntegrationsLoaded' });
        }
        catch (error) {
            logger_1.logger.error('⚠️ Failed to load encrypted integrations after authentication:', { component: 'authSlice', operation: 'failedLoadEncrypted' }, error);
            // Don't fail the password validation if integrations fail to load
        }
        // Store password for biometric authentication if available and not already stored
        try {
            const { BiometricAuthService } = await Promise.resolve().then(() => __importStar(require('../../services/biometricAuthService')));
            const biometricAvailable = await BiometricAuthService.isAvailable();
            const hasStoredPassword = await BiometricAuthService.hasStoredMasterPassword();
            if (biometricAvailable.available && !hasStoredPassword) {
                logger_1.logger.info('🔒 Storing master password for future biometric authentication...', { component: 'authSlice', operation: 'storingMasterPassword' });
                const stored = await BiometricAuthService.storeMasterPasswordForBiometric(password);
                if (stored) {
                    logger_1.logger.info('✅ Master password stored for biometric authentication', { component: 'authSlice', operation: 'masterPasswordStored' });
                }
                else {
                    logger_1.logger.warn('⚠️ Failed to store master password for biometric authentication', { component: 'authSlice', operation: 'failedStoreMaster' });
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('⚠️ Could not store master password for biometric auth:', { component: 'authSlice', operation: 'couldNotStore' });
            // Don't fail the password validation if biometric storage fails
        }
        // SECURITY FIX: Store password in secure session manager instead of Redux
        secureSessionManager_1.secureSessionManager.setMasterPassword(password);
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error('Password validation failed:', { component: 'authSlice', operation: 'passwordValidationFailed:' }, error);
        return rejectWithValue('Failed to validate password');
    }
});
exports.setMasterPassword = (0, toolkit_1.createAsyncThunk)('auth/setMasterPassword', async ({ password, settings }, { rejectWithValue }) => {
    try {
        // Save the password hash
        await (0, secureStorage_1.saveMasterPasswordHashSecure)(password);
        // Update privacy settings to enable master password
        const updatedSettings = {
            ...settings,
            masterPasswordEnabled: true,
        };
        await (0, secureStorage_2.savePrivacySettingsSecure)(updatedSettings);
        // Store master password for biometric authentication if available
        try {
            const { BiometricAuthService } = await Promise.resolve().then(() => __importStar(require('../../services/biometricAuthService')));
            const biometricAvailable = await BiometricAuthService.isAvailable();
            if (biometricAvailable.available) {
                logger_1.logger.info('🔒 Storing master password for biometric authentication...', { component: 'authSlice', operation: 'storingMasterPassword' });
                const stored = await BiometricAuthService.storeMasterPasswordForBiometric(password);
                if (stored) {
                    logger_1.logger.info('✅ Master password stored for biometric authentication', { component: 'authSlice', operation: 'masterPasswordStored' });
                }
                else {
                    logger_1.logger.warn('⚠️ Failed to store master password for biometric authentication', { component: 'authSlice', operation: 'failedStoreMaster' });
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('⚠️ Could not store master password for biometric auth:', { component: 'authSlice', operation: 'couldNotStore' });
            // Don't fail the entire operation if biometric storage fails
        }
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error('Failed to set master password:', { component: 'authSlice', operation: 'failedSetMaster' }, error);
        return rejectWithValue('Failed to save master password');
    }
});
exports.authenticateWithBiometric = (0, toolkit_1.createAsyncThunk)('auth/authenticateWithBiometric', async (reason, { dispatch, rejectWithValue }) => {
    try {
        logger_1.logger.info('🔒 Starting biometric authentication...', { component: 'authSlice', operation: 'startingBiometricAuthentication...' });
        const { BiometricAuthService } = await Promise.resolve().then(() => __importStar(require('../../services/biometricAuthService')));
        const result = await BiometricAuthService.authenticateAndRetrieveMasterPassword(reason);
        if (!result.success) {
            if (result.cancelled) {
                return rejectWithValue('Authentication cancelled by user');
            }
            return rejectWithValue(result.error || 'Biometric authentication failed');
        }
        if (!result.masterPassword) {
            return rejectWithValue('Failed to retrieve master password');
        }
        logger_1.logger.info('✅ Biometric authentication successful, loading encrypted integrations...', { component: 'authSlice', operation: 'operation' });
        // Load encrypted integrations with the retrieved master password (best-effort)
        try {
            // Dispatch returns an action; ignore its type to avoid TS mismatch in callers
            await dispatch((0, integrationsSlice_1.initializeIntegrations)(result.masterPassword));
            logger_1.logger.info('✅ Encrypted integrations loaded successfully after biometric auth', { component: 'authSlice', operation: 'encryptedIntegrationsLoaded' });
        }
        catch (error) {
            logger_1.logger.error('⚠️ Failed to load encrypted integrations after biometric auth:', { component: 'authSlice', operation: 'failedLoadEncrypted' }, error);
        }
        // SECURITY FIX: Store password in secure session manager instead of Redux
        secureSessionManager_1.secureSessionManager.setMasterPassword(result.masterPassword);
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error('Biometric authentication failed:', { component: 'authSlice', operation: 'biometricAuthenticationFailed:' }, error);
        return rejectWithValue(`Biometric authentication failed: ${error}`);
    }
});
exports.resetPassword = (0, toolkit_1.createAsyncThunk)('auth/resetPassword', async (_, { rejectWithValue }) => {
    try {
        // Remove master password hash from database
        if (window.electronAPI?.auth?.deleteSecureSetting) {
            await window.electronAPI.auth.deleteSecureSetting('master_password_hash');
            logger_1.logger.info('✅ Removed master password hash from database', { component: 'authSlice', operation: 'removedMasterPassword' });
        }
        // Update privacy settings to disable master password
        const currentSettings = await (0, secureStorage_2.getPrivacySettingsSecure)();
        if (currentSettings) {
            const updatedSettings = {
                ...currentSettings,
                masterPasswordEnabled: false,
            };
            await (0, secureStorage_2.savePrivacySettingsSecure)(updatedSettings);
        }
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error('Failed to reset password:', { component: 'authSlice', operation: 'failedResetPassword:' }, error);
        return rejectWithValue('Failed to reset password');
    }
});
exports.factoryReset = (0, toolkit_1.createAsyncThunk)('auth/factoryReset', async (_, { rejectWithValue }) => {
    try {
        // Clear database secure settings (iterate known keys or use helper if available)
        if (window.electronAPI?.auth?.clearAllSecureSettings) {
            await window.electronAPI.auth.clearAllSecureSettings();
            logger_1.logger.info('✅ Cleared all secure settings from database', { component: 'authSlice', operation: 'clearedAllSecure' });
        }
        // Clear regular localStorage
        localStorage.clear();
        // Clear sessionStorage
        sessionStorage.clear();
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error('Failed to perform factory reset:', { component: 'authSlice', operation: 'failedPerformFactory' }, error);
        return rejectWithValue('Failed to perform factory reset');
    }
});
const authSlice = (0, toolkit_1.createSlice)({
    name: 'auth',
    initialState,
    reducers: {
        lockApp: (state) => {
            state.isLocked = true;
            state.error = null;
            state.sessionActive = false;
            // SECURITY FIX: Clear password from secure session manager
            secureSessionManager_1.secureSessionManager.clearMasterPassword();
        },
        unlockApp: (state) => {
            state.isLocked = false;
            state.failedAttempts = 0;
            state.lockoutUntil = null;
            state.error = null;
            state.lastActivity = Date.now();
            state.sessionActive = secureSessionManager_1.secureSessionManager.isSessionActive();
        },
        updateLastActivity: (state) => {
            state.lastActivity = Date.now();
        },
        clearError: (state) => {
            state.error = null;
        },
        setAutoLockTimeout: (state, action) => {
            state.autoLockTimeout = action.payload;
        },
        checkAutoLock: (state) => {
            // Only check auto-lock if master password is enabled and we're not already locked
            if (state.hasMasterPassword && !state.isLocked && state.autoLockTimeout > 0) {
                const timeSinceLastActivity = Date.now() - state.lastActivity;
                const timeoutMs = state.autoLockTimeout * 60 * 1000;
                if (timeSinceLastActivity >= timeoutMs) {
                    state.isLocked = true;
                    state.error = null;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Initialize auth
            .addCase(exports.initializeAuth.pending, (state) => {
            state.isValidating = true;
        })
            .addCase(exports.initializeAuth.fulfilled, (state, action) => {
            state.isValidating = false;
            state.isInitialized = true;
            state.hasMasterPassword = action.payload.hasMasterPassword;
            state.autoLockTimeout = action.payload.autoLockTimeout;
            state.isLocked = action.payload.isLocked;
        })
            .addCase(exports.initializeAuth.rejected, (state) => {
            state.isValidating = false;
            state.isInitialized = true;
            state.error = 'Failed to initialize authentication';
        })
            // Validate password
            .addCase(exports.validatePassword.pending, (state) => {
            state.isValidating = true;
            state.error = null;
        })
            .addCase(exports.validatePassword.fulfilled, (state) => {
            state.isValidating = false;
            state.isLocked = false;
            state.failedAttempts = 0;
            state.lockoutUntil = null;
            state.error = null;
            state.lastActivity = Date.now();
            state.sessionActive = true; // SECURITY FIX: Just track session state, not password
        })
            .addCase(exports.validatePassword.rejected, (state, action) => {
            state.isValidating = false;
            state.failedAttempts += 1;
            state.error = action.payload;
            // Check if max attempts reached
            if (state.failedAttempts >= state.maxAttempts) {
                // Calculate lockout time (exponential backoff)
                const lockoutMinutes = Math.min(30, Math.pow(2, state.failedAttempts - state.maxAttempts));
                state.lockoutUntil = Date.now() + (lockoutMinutes * 60 * 1000);
                state.error = `Too many failed attempts. Locked for ${lockoutMinutes} minutes.`;
            }
        })
            // Set master password
            .addCase(exports.setMasterPassword.pending, (state) => {
            state.isValidating = true;
            state.error = null;
        })
            .addCase(exports.setMasterPassword.fulfilled, (state) => {
            state.isValidating = false;
            state.hasMasterPassword = true;
            state.isLocked = false; // Unlock immediately after setting password
            state.error = null;
        })
            .addCase(exports.setMasterPassword.rejected, (state, action) => {
            state.isValidating = false;
            state.error = action.payload;
        })
            // Reset password
            .addCase(exports.resetPassword.pending, (state) => {
            state.isValidating = true;
            state.error = null;
        })
            .addCase(exports.resetPassword.fulfilled, (state) => {
            state.isValidating = false;
            state.hasMasterPassword = false;
            state.isLocked = false;
            state.failedAttempts = 0;
            state.lockoutUntil = null;
            state.error = null;
            state.sessionActive = false;
            // SECURITY FIX: Clear password from secure session manager
            secureSessionManager_1.secureSessionManager.clearMasterPassword();
        })
            .addCase(exports.resetPassword.rejected, (state, action) => {
            state.isValidating = false;
            state.error = action.payload;
        })
            // Factory reset
            .addCase(exports.factoryReset.pending, (state) => {
            state.isValidating = true;
            state.error = null;
        })
            .addCase(exports.factoryReset.fulfilled, (state) => {
            // Reset to initial state
            Object.assign(state, initialState);
            state.isInitialized = true;
            state.isValidating = false;
        })
            .addCase(exports.factoryReset.rejected, (state, action) => {
            state.isValidating = false;
            state.error = action.payload;
        })
            // Biometric authentication
            .addCase(exports.authenticateWithBiometric.pending, (state) => {
            state.isValidating = true;
            state.error = null;
        })
            .addCase(exports.authenticateWithBiometric.fulfilled, (state) => {
            state.isValidating = false;
            state.isLocked = false;
            state.failedAttempts = 0;
            state.lockoutUntil = null;
            state.error = null;
            state.lastActivity = Date.now();
            state.sessionActive = true; // SECURITY FIX: Just track session state, not password
        })
            .addCase(exports.authenticateWithBiometric.rejected, (state, action) => {
            state.isValidating = false;
            // Don't increment failed attempts for biometric auth failures
            state.error = action.payload;
        });
    },
});
_a = authSlice.actions, exports.lockApp = _a.lockApp, exports.unlockApp = _a.unlockApp, exports.updateLastActivity = _a.updateLastActivity, exports.clearError = _a.clearError, exports.setAutoLockTimeout = _a.setAutoLockTimeout, exports.checkAutoLock = _a.checkAutoLock;
// Selectors
const selectAuth = (state) => state.auth;
exports.selectAuth = selectAuth;
const selectIsLocked = (state) => state.auth.isLocked;
exports.selectIsLocked = selectIsLocked;
const selectIsInitialized = (state) => state.auth.isInitialized;
exports.selectIsInitialized = selectIsInitialized;
const selectHasMasterPassword = (state) => state.auth.hasMasterPassword;
exports.selectHasMasterPassword = selectHasMasterPassword;
const selectIsValidating = (state) => state.auth.isValidating;
exports.selectIsValidating = selectIsValidating;
const selectAuthError = (state) => state.auth.error;
exports.selectAuthError = selectAuthError;
const selectFailedAttempts = (state) => state.auth.failedAttempts;
exports.selectFailedAttempts = selectFailedAttempts;
const selectLockoutTime = (state) => {
    const { lockoutUntil } = state.auth;
    if (!lockoutUntil || Date.now() >= lockoutUntil)
        return 0;
    return Math.ceil((lockoutUntil - Date.now()) / 1000);
};
exports.selectLockoutTime = selectLockoutTime;
// SECURITY FIX: Selector for session active state (replaces password selector)
const selectSessionActive = (state) => state.auth.sessionActive;
exports.selectSessionActive = selectSessionActive;
// SECURITY FIX: Safe function to get master password from secure session manager
const getSessionMasterPassword = () => {
    return secureSessionManager_1.secureSessionManager.getMasterPassword();
};
exports.getSessionMasterPassword = getSessionMasterPassword;
exports.default = authSlice.reducer;
