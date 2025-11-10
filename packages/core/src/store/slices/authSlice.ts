import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { validateMasterPasswordSecure, saveMasterPasswordHashSecure } from '../../utils/secureStorage';
import { getPrivacySettingsSecure, savePrivacySettingsSecure, getSecureStorage, SECURE_KEYS } from '../../utils/secureStorage';
import { secureSessionManager } from '../../utils/secureSessionManager';
import { initializeIntegrations } from './integrationsSlice';
import { logger } from '../../utils/logger';

export interface AuthState {
  isLocked: boolean;
  isInitialized: boolean;
  hasMasterPassword: boolean;
  isValidating: boolean;
  failedAttempts: number;
  maxAttempts: number;
  lockoutUntil: number | null; // timestamp
  autoLockTimeout: number; // minutes
  lastActivity: number; // timestamp
  error: string | null;
  // SECURITY FIX: Remove master password from Redux state
  // Master password should be handled in memory only and cleared immediately after use
  sessionActive: boolean; // Just track if session is active
}

const initialState: AuthState = {
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
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    logger.info('🚀 Auth initialization started', { component: 'authSlice', operation: 'authInitializationStarted' });
    const startTime = performance.now();
    
    try {
      // Check if database API is available
      if (!window.electronAPI?.auth) {
        logger.info('⚡ Auth API not available, using default settings', { component: 'authSlice', operation: 'operation' });
        return {
          hasMasterPassword: false,
          autoLockTimeout: 15,
          isLocked: false,
        };
      }
      
      // Load privacy settings from database
      logger.info('🔐 Loading settings from database...', { component: 'authSlice', operation: 'loadingSettingsFrom' });
      const settingsStart = performance.now();
      const privacySettings = await getPrivacySettingsSecure();
      logger.info(`✅ Privacy settings loaded in ${(performance.now() - settingsStart).toFixed(2)}ms`, { component: 'authSlice', operation: 'privacySettingsLoaded' });
      
      const hasMasterPassword = privacySettings?.masterPasswordEnabled || false;
      const autoLockTimeout = privacySettings?.autoLockTimeout || 15;
      
      logger.info(`🔐 Auth config: masterPassword=${hasMasterPassword}, timeout=${autoLockTimeout}`, { component: 'authSlice', operation: 'operation' });
      logger.info(`✅ Auth initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`, { component: 'authSlice', operation: 'authInitializationCompleted' });
      
      return {
        hasMasterPassword,
        autoLockTimeout,
        isLocked: hasMasterPassword, // Lock if master password is enabled
      };
    } catch (error) {
      logger.error('❌ Failed to initialize auth:', { component: 'authSlice', operation: 'failedInitializeAuth:' }, error as Error);
      logger.info(`⚠️ Falling back to defaults after ${(performance.now() - startTime).toFixed(2)}ms`, { component: 'authSlice', operation: 'fallingBackDefaults' });
      return {
        hasMasterPassword: false,
        autoLockTimeout: 15,
        isLocked: false,
      };
    }
  }
);

export const validatePassword = createAsyncThunk(
  'auth/validatePassword',
  async (password: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { auth: AuthState };
      
      // Check if currently in lockout
      if (state.auth.lockoutUntil && Date.now() < state.auth.lockoutUntil) {
        return rejectWithValue('Account is temporarily locked. Please try again later.');
      }

      const isValid = await validateMasterPasswordSecure(password);
      
      if (!isValid) {
        return rejectWithValue('Invalid password');
      }

      // Password is valid - load encrypted integrations
      try {
        logger.info('🔓 Master password validated, loading encrypted integrations...', { component: 'authSlice', operation: 'operation' });
        await dispatch(initializeIntegrations(password));
        logger.info('✅ Encrypted integrations loaded successfully', { component: 'authSlice', operation: 'encryptedIntegrationsLoaded' });
      } catch (error) {
        logger.error('⚠️ Failed to load encrypted integrations after authentication:', { component: 'authSlice', operation: 'failedLoadEncrypted' }, error as Error);
        // Don't fail the password validation if integrations fail to load
      }

      // Store password for biometric authentication if available and not already stored
      try {
        const { BiometricAuthService } = await import('../../services/biometricAuthService');
        const biometricAvailable = await BiometricAuthService.isAvailable();
        const hasStoredPassword = await BiometricAuthService.hasStoredMasterPassword();
        
        if (biometricAvailable.available && !hasStoredPassword) {
          logger.info('🔒 Storing master password for future biometric authentication...', { component: 'authSlice', operation: 'storingMasterPassword' });
          const stored = await BiometricAuthService.storeMasterPasswordForBiometric(password);
          if (stored) {
            logger.info('✅ Master password stored for biometric authentication', { component: 'authSlice', operation: 'masterPasswordStored' });
          } else {
            logger.warn('⚠️ Failed to store master password for biometric authentication', { component: 'authSlice', operation: 'failedStoreMaster' });
          }
        }
      } catch (error) {
        logger.warn('⚠️ Could not store master password for biometric auth:', { component: 'authSlice', operation: 'couldNotStore' });
        // Don't fail the password validation if biometric storage fails
      }

      // SECURITY FIX: Store password in secure session manager instead of Redux
      secureSessionManager.setMasterPassword(password);


      return { success: true };
    } catch (error) {
      logger.error('Password validation failed:', { component: 'authSlice', operation: 'passwordValidationFailed:' }, error as Error);
      return rejectWithValue('Failed to validate password');
    }
  }
);

export const setMasterPassword = createAsyncThunk(
  'auth/setMasterPassword',
  async ({ password, settings }: { password: string; settings: any }, { rejectWithValue }) => {
    try {
      // Save the password hash
      await saveMasterPasswordHashSecure(password);
      
      // Update privacy settings to enable master password
      const updatedSettings = {
        ...settings,
        masterPasswordEnabled: true,
      };
      await savePrivacySettingsSecure(updatedSettings);
      
      // Store master password for biometric authentication if available
      try {
        const { BiometricAuthService } = await import('../../services/biometricAuthService');
        const biometricAvailable = await BiometricAuthService.isAvailable();
        
        if (biometricAvailable.available) {
          logger.info('🔒 Storing master password for biometric authentication...', { component: 'authSlice', operation: 'storingMasterPassword' });
          const stored = await BiometricAuthService.storeMasterPasswordForBiometric(password);
          if (stored) {
            logger.info('✅ Master password stored for biometric authentication', { component: 'authSlice', operation: 'masterPasswordStored' });
          } else {
            logger.warn('⚠️ Failed to store master password for biometric authentication', { component: 'authSlice', operation: 'failedStoreMaster' });
          }
        }
      } catch (error) {
        logger.warn('⚠️ Could not store master password for biometric auth:', { component: 'authSlice', operation: 'couldNotStore' });
        // Don't fail the entire operation if biometric storage fails
      }


      return { success: true };
    } catch (error) {
      logger.error('Failed to set master password:', { component: 'authSlice', operation: 'failedSetMaster' }, error as Error);
      return rejectWithValue('Failed to save master password');
    }
  }
);

export const authenticateWithBiometric = createAsyncThunk(
  'auth/authenticateWithBiometric',
  async (reason: string | undefined, { dispatch, rejectWithValue }) => {
    try {
      logger.info('🔒 Starting biometric authentication...', { component: 'authSlice', operation: 'startingBiometricAuthentication...' });
      
      const { BiometricAuthService } = await import('../../services/biometricAuthService');
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
      
      logger.info('✅ Biometric authentication successful, loading encrypted integrations...', { component: 'authSlice', operation: 'operation' });
      
      // Load encrypted integrations with the retrieved master password (best-effort)
      try {
        // Dispatch returns an action; ignore its type to avoid TS mismatch in callers
        await (dispatch as any)(initializeIntegrations(result.masterPassword));
        logger.info('✅ Encrypted integrations loaded successfully after biometric auth', { component: 'authSlice', operation: 'encryptedIntegrationsLoaded' });
      } catch (error) {
        logger.error('⚠️ Failed to load encrypted integrations after biometric auth:', { component: 'authSlice', operation: 'failedLoadEncrypted' }, error as Error);
      }
      
      // SECURITY FIX: Store password in secure session manager instead of Redux
      secureSessionManager.setMasterPassword(result.masterPassword);


      return { success: true };
    } catch (error) {
      logger.error('Biometric authentication failed:', { component: 'authSlice', operation: 'biometricAuthenticationFailed:' }, error as Error);
      return rejectWithValue(`Biometric authentication failed: ${error}`);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (_, { rejectWithValue }) => {
    try {
      // Remove master password hash from database
      if (window.electronAPI?.auth?.deleteSecureSetting) {
        await window.electronAPI.auth.deleteSecureSetting('master_password_hash');
        logger.info('✅ Removed master password hash from database', { component: 'authSlice', operation: 'removedMasterPassword' });
      }
      
      // Update privacy settings to disable master password
      const currentSettings = await getPrivacySettingsSecure();
      if (currentSettings) {
        const updatedSettings = {
          ...currentSettings,
          masterPasswordEnabled: false,
        };
        await savePrivacySettingsSecure(updatedSettings);
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset password:', { component: 'authSlice', operation: 'failedResetPassword:' }, error as Error);
      return rejectWithValue('Failed to reset password');
    }
  }
);

export const factoryReset = createAsyncThunk(
  'auth/factoryReset',
  async (_, { rejectWithValue }) => {
    try {
      // Clear database secure settings (iterate known keys or use helper if available)
      if (window.electronAPI?.auth?.clearAllSecureSettings) {
        await window.electronAPI.auth.clearAllSecureSettings();
        logger.info('✅ Cleared all secure settings from database', { component: 'authSlice', operation: 'clearedAllSecure' });
      }
      
      // Clear regular localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to perform factory reset:', { component: 'authSlice', operation: 'failedPerformFactory' }, error as Error);
      return rejectWithValue('Failed to perform factory reset');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    lockApp: (state) => {
      state.isLocked = true;
      state.error = null;
      state.sessionActive = false;
      // SECURITY FIX: Clear password from secure session manager
      secureSessionManager.clearMasterPassword();
    },
    unlockApp: (state) => {
      state.isLocked = false;
      state.failedAttempts = 0;
      state.lockoutUntil = null;
      state.error = null;
      state.lastActivity = Date.now();
      state.sessionActive = secureSessionManager.isSessionActive();
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    clearError: (state) => {
      state.error = null;
    },
    setAutoLockTimeout: (state, action: PayloadAction<number>) => {
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
      .addCase(initializeAuth.pending, (state) => {
        state.isValidating = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isValidating = false;
        state.isInitialized = true;
        state.hasMasterPassword = (action.payload as any).hasMasterPassword;
        state.autoLockTimeout = (action.payload as any).autoLockTimeout;
        state.isLocked = (action.payload as any).isLocked;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isValidating = false;
        state.isInitialized = true;
        state.error = 'Failed to initialize authentication';
      })
      
      // Validate password
      .addCase(validatePassword.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validatePassword.fulfilled, (state) => {
        state.isValidating = false;
        state.isLocked = false;
        state.failedAttempts = 0;
        state.lockoutUntil = null;
        state.error = null;
        state.lastActivity = Date.now();
        state.sessionActive = true; // SECURITY FIX: Just track session state, not password
      })
      .addCase(validatePassword.rejected, (state, action) => {
        state.isValidating = false;
        state.failedAttempts += 1;
        state.error = action.payload as string;
        
        // Check if max attempts reached
        if (state.failedAttempts >= state.maxAttempts) {
          // Calculate lockout time (exponential backoff)
          const lockoutMinutes = Math.min(30, Math.pow(2, state.failedAttempts - state.maxAttempts));
          state.lockoutUntil = Date.now() + (lockoutMinutes * 60 * 1000);
          state.error = `Too many failed attempts. Locked for ${lockoutMinutes} minutes.`;
        }
      })
      
      // Set master password
      .addCase(setMasterPassword.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(setMasterPassword.fulfilled, (state) => {
        state.isValidating = false;
        state.hasMasterPassword = true;
        state.isLocked = false; // Unlock immediately after setting password
        state.error = null;
      })
      .addCase(setMasterPassword.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload as string;
      })
      
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isValidating = false;
        state.hasMasterPassword = false;
        state.isLocked = false;
        state.failedAttempts = 0;
        state.lockoutUntil = null;
        state.error = null;
        state.sessionActive = false;
        // SECURITY FIX: Clear password from secure session manager
        secureSessionManager.clearMasterPassword();
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload as string;
      })
      
      // Factory reset
      .addCase(factoryReset.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(factoryReset.fulfilled, (state) => {
        // Reset to initial state
        Object.assign(state, initialState);
        state.isInitialized = true;
        state.isValidating = false;
      })
      .addCase(factoryReset.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload as string;
      })
      
      // Biometric authentication
      .addCase(authenticateWithBiometric.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(authenticateWithBiometric.fulfilled, (state) => {
        state.isValidating = false;
        state.isLocked = false;
        state.failedAttempts = 0;
        state.lockoutUntil = null;
        state.error = null;
        state.lastActivity = Date.now();
        state.sessionActive = true; // SECURITY FIX: Just track session state, not password
      })
      .addCase(authenticateWithBiometric.rejected, (state, action) => {
        state.isValidating = false;
        // Don't increment failed attempts for biometric auth failures
        state.error = action.payload as string;
      });
  },
});

export const {
  lockApp,
  unlockApp,
  updateLastActivity,
  clearError,
  setAutoLockTimeout,
  checkAutoLock,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsLocked = (state: { auth: AuthState }) => state.auth.isLocked;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectHasMasterPassword = (state: { auth: AuthState }) => state.auth.hasMasterPassword;
export const selectIsValidating = (state: { auth: AuthState }) => state.auth.isValidating;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectFailedAttempts = (state: { auth: AuthState }) => state.auth.failedAttempts;
export const selectLockoutTime = (state: { auth: AuthState }) => {
  const { lockoutUntil } = state.auth;
  if (!lockoutUntil || Date.now() >= lockoutUntil) return 0;
  return Math.ceil((lockoutUntil - Date.now()) / 1000);
};

// SECURITY FIX: Selector for session active state (replaces password selector)
export const selectSessionActive = (state: { auth: AuthState }) => state.auth.sessionActive;

// SECURITY FIX: Safe function to get master password from secure session manager
export const getSessionMasterPassword = (): string | null => {
  return secureSessionManager.getMasterPassword();
};

export default authSlice.reducer;
