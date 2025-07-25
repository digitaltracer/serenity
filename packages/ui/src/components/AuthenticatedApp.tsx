import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLockScreen } from './AppLockScreen';
import { PasswordResetModal } from './PasswordResetModal';
import { LoadingScreen } from './LoadingScreen';
import { useToast } from './Toast';
import { useCryptoOperations } from '../hooks/useCryptoOperations';
import { 
  initializeAuth, 
  validatePassword,
  resetPassword,
  factoryReset,
  unlockApp,
  selectIsLocked, 
  selectIsInitialized,
  selectHasMasterPassword,
  selectIsValidating,
  selectAuthError,
  selectFailedAttempts,
  selectLockoutTime,
  clearError,
  selectAllTasks,
  selectAllEntries,
  selectAllProjects,
  exportDataSecurely,
  getPrivacySettings
} from '@serenity/core';

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ 
  children
}) => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const { cryptoProgress, startCryptoOperation, updateProgress, completeCryptoOperation, failCryptoOperation } = useCryptoOperations();
  
  const isLocked = useSelector(selectIsLocked);
  const isInitialized = useSelector(selectIsInitialized);
  const hasMasterPassword = useSelector(selectHasMasterPassword);
  const isValidating = useSelector(selectIsValidating);
  const error = useSelector(selectAuthError);
  const failedAttempts = useSelector(selectFailedAttempts);
  const lockoutTime = useSelector(selectLockoutTime);
  
  // Data for export
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);

  // Initialize authentication on app startup
  useEffect(() => {
    if (!isInitialized) {
      const initializeApp = async () => {
        try {
          console.log('🚀 Starting app initialization...');
          
          // Import crypto utils only when needed
          const { shouldShowCryptoLoading, initializeCrypto } = await import('@serenity/core');
          
          if (shouldShowCryptoLoading()) {
            console.log('🔐 Encryption enabled, showing crypto loading screen');
            startCryptoOperation();
            
            // Initialize crypto with progress updates
            const success = await initializeCrypto((progress, stage, message) => {
              updateProgress({ 
                progress, 
                stage: stage as any, 
                message 
              });
            });
            
            if (success) {
              completeCryptoOperation();
            } else {
              failCryptoOperation('Failed to initialize encryption');
            }
          } else {
            console.log('⚡ No encryption needed, proceeding with normal initialization');
          }
          
          // Add a minimum delay to show loading screen (even if initialization is fast)
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Start auth initialization
          dispatch(initializeAuth() as any);
          
        } catch (error) {
          console.error('❌ Failed to initialize app:', error);
          // Fall back to default auth initialization
          dispatch(initializeAuth() as any);
        }
      };
      
      // Set a timeout to force initialization completion if it hangs
      const timeoutId = setTimeout(() => {
        console.warn('App initialization timed out, falling back to default state');
        // Force initialization to complete
        dispatch({
          type: 'auth/initialize/fulfilled',
          payload: {
            hasMasterPassword: false,
            autoLockTimeout: 15,
            isLocked: false,
          }
        });
      }, 2000); // 2 second timeout to allow loading screen to be visible

      initializeApp().finally(() => {
        clearTimeout(timeoutId);
      });

      return () => clearTimeout(timeoutId);
    }
  }, [dispatch, isInitialized, startCryptoOperation, updateProgress, completeCryptoOperation, failCryptoOperation]);

  // Handle password validation
  const handleUnlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      // If password is empty, it means biometric auth was used - directly unlock
      if (password === '') {
        dispatch(unlockApp());
        return true;
      }
      
      // Otherwise validate password normally
      const result = await dispatch(validatePassword(password) as any);
      if (result.type === 'auth/validatePassword/fulfilled') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unlock failed:', error);
      return false;
    }
  }, [dispatch]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    setIsResetModalOpen(true);
  }, []);

  // Handle password reset
  const handleResetPassword = useCallback(async () => {
    try {
      const result = await dispatch(resetPassword() as any);
      if (result.type === 'auth/resetPassword/fulfilled') {
        showSuccess('Password Reset', 'Master password has been removed successfully');
        setIsResetModalOpen(false);
        // Re-initialize to update the UI
        dispatch(initializeAuth() as any);
      }
    } catch (error) {
      showError('Reset Failed', 'Failed to reset password');
    }
  }, [dispatch, showSuccess, showError]);

  // Handle factory reset
  const handleFactoryReset = useCallback(async () => {
    try {
      const result = await dispatch(factoryReset() as any);
      if (result.type === 'auth/factoryReset/fulfilled') {
        showSuccess('Factory Reset Complete', 'All data has been cleared');
        setIsResetModalOpen(false);
        // Force page reload to ensure clean state
        window.location.reload();
      }
    } catch (error) {
      showError('Reset Failed', 'Failed to perform factory reset');
    }
  }, [dispatch, showSuccess, showError]);

  // Handle data export
  const handleExportData = useCallback(async () => {
    try {
      const settings = getPrivacySettings();
      
      // Convert PrivacySecuritySettings to EnhancedPrivacySecuritySettings
      const enhancedSettings = {
        // Copy existing properties from PrivacySecuritySettings
        masterPasswordEnabled: settings.masterPasswordEnabled,
        autoLockTimeout: settings.autoLockTimeout,
        screenPrivacy: settings.screenPrivacy,
        encryptJournalContent: settings.encryptJournalContent,
        encryptTaskContent: settings.encryptTaskContent,
        hideFromTaskbar: settings.hideFromTaskbar,
        
        // Add missing properties with defaults for EnhancedPrivacySecuritySettings
        dataRetentionDays: 365,
        localOnlyMode: true,
        encryptionLevel: 'basic' as const,
        secureDelete: false,
        biometricAuth: false,
        dataClassification: {
          journalEntries: 'confidential' as const,
          taskDescriptions: 'internal' as const,
          taskTitles: 'public' as const,
          projectNames: 'internal' as const,
          tags: 'public' as const,
          userNotes: 'confidential' as const,
        }
      };
      
      const data = {
        tasks,
        journalEntries,
        projects,
        appSettings: { theme: 'light', compactMode: false }
      };
      
      // Use a simple password for emergency export
      const exportPassword = 'emergency-export-' + Date.now();
      await exportDataSecurely(data, exportPassword, enhancedSettings, 'emergency-backup-before-reset.json');
      
      showSuccess('Data Exported', `Backup saved with password: ${exportPassword}`);
    } catch (error) {
      showError('Export Failed', 'Failed to export data');
    }
  }, [tasks, journalEntries, projects, showSuccess, showError]);

  // Clear error when component unmounts or when specifically requested
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show loading state while initializing
  if (!isInitialized) {
    console.log('🔄 Loading screen shown - isInitialized:', isInitialized, 'isValidating:', isValidating);
    return (
      <LoadingScreen 
        title="Loading Serenity Notes"
        message="Initializing application..."
        progress={20}
        stage="loading"
      />
    );
  }

  // Show lock screen if app is locked and has master password
  if (isLocked && hasMasterPassword) {
    return (
      <>
        <AppLockScreen
          onUnlock={handleUnlock}
          onForgotPassword={handleForgotPassword}
          isValidating={isValidating}
          error={error || undefined}
          attempts={failedAttempts}
          maxAttempts={5}
          lockoutTime={lockoutTime}
        />
        
        <PasswordResetModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onResetPassword={handleResetPassword}
          onFactoryReset={handleFactoryReset}
          onExportData={handleExportData}
        />
      </>
    );
  }

  // Show crypto loading screen if needed
  if (cryptoProgress.isLoading) {
    return (
      <LoadingScreen 
        title="Loading Serenity Notes"
        message={cryptoProgress.message}
        progress={cryptoProgress.progress}
        stage={cryptoProgress.stage}
      />
    );
  }

  // Show main app
  return <>{children}</>;
};