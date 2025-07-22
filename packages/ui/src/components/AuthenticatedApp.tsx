import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLockScreen } from './AppLockScreen';
import { PasswordResetModal } from './PasswordResetModal';
import { useToast } from './Toast';
import { 
  initializeAuth, 
  validatePassword,
  resetPassword,
  factoryReset,
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
      dispatch(initializeAuth() as any);
    }
  }, [dispatch, isInitialized]);

  // Handle password validation
  const handleUnlock = useCallback(async (password: string): Promise<boolean> => {
    try {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Initializing Serenity Notes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Setting up your secure workspace...
          </p>
        </div>
      </div>
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

  // Show main app
  return <>{children}</>;
};