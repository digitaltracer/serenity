import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { validateMasterPasswordSecure, saveMasterPasswordHashSecure } from '../../utils/secureStorage';
import { getPrivacySettingsSecure, savePrivacySettingsSecure, getSecureStorage, SECURE_KEYS } from '../../utils/secureStorage';

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
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    console.log('🚀 Auth initialization started');
    const startTime = performance.now();
    
    try {
      // First, do a quick check if we even need expensive crypto operations
      const hasEncryptedData = localStorage.getItem('encrypted_privacy_settings') !== null;
      
      if (!hasEncryptedData) {
        console.log('⚡ No encrypted data found, using fast initialization');
        console.log(`✅ Auth initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
        return {
          hasMasterPassword: false,
          autoLockTimeout: 15,
          isLocked: false,
        };
      }
      
      // Only do expensive crypto operations if we have encrypted data
      console.log('🔐 Encrypted data found, loading securely...');
      const settingsStart = performance.now();
      const privacySettings = await getPrivacySettingsSecure();
      console.log(`✅ Privacy settings loaded in ${(performance.now() - settingsStart).toFixed(2)}ms`);
      
      const hasMasterPassword = privacySettings?.masterPasswordEnabled || false;
      const autoLockTimeout = privacySettings?.autoLockTimeout || 15;
      
      console.log(`🔐 Auth config: masterPassword=${hasMasterPassword}, timeout=${autoLockTimeout}`);
      console.log(`✅ Auth initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
      
      return {
        hasMasterPassword,
        autoLockTimeout,
        isLocked: hasMasterPassword, // Lock if master password is enabled
      };
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      console.log(`⚠️ Falling back to defaults after ${(performance.now() - startTime).toFixed(2)}ms`);
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
  async (password: string, { getState, rejectWithValue }) => {
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

      return { success: true };
    } catch (error) {
      console.error('Password validation failed:', error);
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
      
      return { success: true };
    } catch (error) {
      console.error('Failed to set master password:', error);
      return rejectWithValue('Failed to save master password');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (_, { rejectWithValue }) => {
    try {
      const storage = getSecureStorage();
      
      // Remove master password hash
      await storage.removeItem(SECURE_KEYS.MASTER_PASSWORD_HASH);
      
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
      console.error('Failed to reset password:', error);
      return rejectWithValue('Failed to reset password');
    }
  }
);

export const factoryReset = createAsyncThunk(
  'auth/factoryReset',
  async (_, { rejectWithValue }) => {
    try {
      const storage = getSecureStorage();
      
      // Clear all secure storage
      await storage.clear();
      
      // Clear regular localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to perform factory reset:', error);
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
    },
    unlockApp: (state) => {
      state.isLocked = false;
      state.failedAttempts = 0;
      state.lockoutUntil = null;
      state.error = null;
      state.lastActivity = Date.now();
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

export default authSlice.reducer;