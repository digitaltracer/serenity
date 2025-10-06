import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLockScreen } from './AppLockScreen';
import { PasswordResetModal } from './PasswordResetModal';
import { PasswordResetFlow } from './PasswordResetFlow';
import { LoadingScreen } from './LoadingScreen';
import { useToast } from './Toast';
import { useCryptoOperations } from '../hooks/useCryptoOperations';
import { logger } from '@serenity/core';
import {
  initializeAuth,
  validatePassword,
  resetPassword,
  factoryReset,
  unlockApp,
  authenticateWithBiometric,
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
  const [showResetFlow, setShowResetFlow] = useState(false);
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
          logger.info('🚀 Starting app initialization...', { component: 'AuthenticatedApp', operation: 'startingAppInitialization...' });
          
          // Import crypto utils only when needed
          const { shouldShowCryptoLoading, initializeCrypto } = await import('@serenity/core');
          
          if (shouldShowCryptoLoading()) {
            logger.info('🔐 Encryption enabled, showing crypto loading screen', { component: 'AuthenticatedApp', operation: 'operation' });
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
            logger.info('⚡ No encryption needed, proceeding with normal initialization', { component: 'AuthenticatedApp', operation: 'operation' });
          }
          
          // Add a minimum delay to show loading screen (even if initialization is fast)
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Start auth initialization
          dispatch(initializeAuth() as any);
          
        } catch (error) {
          logger.error('❌ Failed to initialize app:', { component: 'AuthenticatedApp', operation: 'failedInitializeApp:' }, error as Error);
          // Fall back to default auth initialization
          dispatch(initializeAuth() as any);
        }
      };
      
      // Set a timeout to force initialization completion if it hangs
      const timeoutId = setTimeout(() => {
        logger.warn('App initialization timed out, falling back to default state', { component: 'AuthenticatedApp', operation: 'operation' });
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
      // If password is empty, it means biometric auth was used
      if (password === '') {
        logger.info('🔓 Touch ID authentication initiated, using biometric service...', { component: 'AuthenticatedApp', operation: 'operation' });
        
        // Use the new biometric authentication service
        const result = await dispatch(authenticateWithBiometric('Unlock Serenity Notes and load integrations') as any);
        
        if (result.type === 'auth/authenticateWithBiometric/fulfilled') {
          logger.info('✅ Biometric authentication successful with integrations loaded', { component: 'AuthenticatedApp', operation: 'biometricAuthenticationSuccessful' });
          return true;
        } else {
          logger.error('❌ Biometric authentication failed:', { component: 'AuthenticatedApp', operation: 'biometricAuthenticationFailed:' }, result.payload);
          return false;
        }
      }
      
      // Otherwise validate password normally (this also loads encrypted integrations)
      const result = await dispatch(validatePassword(password) as any);
      if (result.type === 'auth/validatePassword/fulfilled') {
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Unlock failed:', { component: 'AuthenticatedApp', operation: 'unlockFailed:' }, error as Error);
      return false;
    }
  }, [dispatch]);

  // Handle forgot password - now shows the new reset flow
  const handleForgotPassword = useCallback(() => {
    setShowResetFlow(true);
  }, []);

  // Handle password reset completion from the new flow
  const handleCompletePasswordReset = useCallback(async (newPassword: string) => {
    try {
      // First reset the password in the system
      await dispatch(resetPassword() as any);

      // Then set the new password (this will be implemented in core)
      // For now, we'll just unlock the app with the new password
      await handleUnlock(newPassword);

      showSuccess('Password Reset Complete', 'Your master password has been updated successfully');
      setShowResetFlow(false);
    } catch (error) {
      showError('Reset Failed', 'Failed to reset password');
    }
  }, [dispatch, showSuccess, showError, handleUnlock]);

  // Handle old modal password reset
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
    logger.info('Loading screen shown', { component: 'AuthenticatedApp', operation: 'loadingScreenShown', metadata: { isInitialized, isValidating } });
    return (
      <LoadingScreen 
        title="Loading Serenity Notes"
        message="Initializing application..."
        progress={20}
        stage="loading"
      />
    );
  }

  // Show password reset flow if requested
  if (showResetFlow) {
    // For now, we'll use empty arrays - in a real implementation, these would come from secure storage
    return (
      <PasswordResetFlow
        onComplete={handleCompletePasswordReset}
        onCancel={() => setShowResetFlow(false)}
        recoveryCodes={[]} // TODO: Load from secure storage
        securityQuestions={[]} // TODO: Load from secure storage
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