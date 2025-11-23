import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectHasMasterPassword,
  lockApp,
  addCredential,
  type AIProviderCredentialInput,
  // Database and privacy imports
  getDatabaseConnection,
  isDatabaseConnected,
  getPrivacySettings,
  savePrivacySettingsSecure,
  getPrivacySettingsSecure,
  saveDatabaseConnectionSecure,
  getDatabaseConnectionSecure,
  PrivacySecuritySettings,
  initializeAuth,
  logger,
} from '@serenity/core';
import { SettingsPage as SharedSettingsPage, Card, CardHeader, CardTitle, CardContent, Button, DatabaseConfigurationModal, PrivacySecurityModal, TagsManager, useToast } from '@serenity/ui';
import {
  Settings,
  Database,
  Lock,
  Tag,
} from 'lucide-react';

/**
 * Desktop-specific SettingsPage wrapper
 * Provides Electron IPC callbacks and desktop-only sections (Database, Privacy, Tags)
 */
export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const hasMasterPassword = useSelector(selectHasMasterPassword);

  // Modal states
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = React.useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = React.useState(false);
  const [isTagsManagerOpen, setIsTagsManagerOpen] = React.useState(false);

  // Database connection state
  const [dbConnection, setDbConnection] = React.useState<any>(null);
  const [dbConnected, setDbConnected] = React.useState(false);

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = React.useState<PrivacySecuritySettings>(() => {
    try {
      return getPrivacySettings();
    } catch {
      return {
        masterPasswordEnabled: false,
        autoLockTimeout: 15,
        screenPrivacy: false,
        encryptJournalContent: false,
        encryptTaskContent: false,
        hideFromTaskbar: false,
      };
    }
  });

  // Load settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load database connection
        const secureConnection = await getDatabaseConnectionSecure();
        if (secureConnection) {
          setDbConnection(secureConnection);
          setDbConnected(secureConnection.connected);
        } else {
          const connection = getDatabaseConnection();
          const connected = isDatabaseConnected();
          setDbConnection(connection);
          setDbConnected(connected);
        }

        // Load privacy settings
        const secureSettings = await getPrivacySettingsSecure();
        if (secureSettings) {
          const basicSettings: PrivacySecuritySettings = {
            masterPasswordEnabled: secureSettings.masterPasswordEnabled,
            autoLockTimeout: secureSettings.autoLockTimeout,
            screenPrivacy: secureSettings.screenPrivacy,
            encryptJournalContent: secureSettings.encryptJournalContent,
            encryptTaskContent: secureSettings.encryptTaskContent,
            hideFromTaskbar: secureSettings.hideFromTaskbar,
          };
          setPrivacySettings(basicSettings);
        }
      } catch (error) {
        logger.error('Failed to load settings', { component: 'SettingsPage', operation: 'failedLoadSettings' }, error as Error);
      }
    };

    const timer = setTimeout(loadSettings, 200);
    return () => clearTimeout(timer);
  }, []);

  // Desktop-specific handlers
  const handleLoadUsage = async () => {
    if (window.electronAPI?.aiAssistant?.listUsage) {
      const result = await window.electronAPI.aiAssistant.listUsage();
      return { success: result.success, usage: result.usage };
    }
    return { success: false };
  };

  const handleTestCredential = async (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => {
    try {
      const result = await (window as any).api?.['ai-credentials:test-new']?.(provider, apiKey);
      return result || { valid: false, error: 'Test not available' };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  };

  const handleAddCredential = async (credentialData: AIProviderCredentialInput) => {
    await (dispatch as any)(addCredential(credentialData)).unwrap();
  };

  const handleDatabaseSave = async (config: any) => {
    try {
      if (config.type === 'sqlite') {
        const sqliteUrl = config.path || 'default';
        await saveDatabaseConnectionSecure(sqliteUrl);
        setDbConnection({
          url: sqliteUrl,
          connected: true,
          lastConnected: new Date().toISOString(),
          encryptionEnabled: config.encryption || false
        });
        setDbConnected(true);
      } else if (config.type === 'postgresql') {
        const { savePostgreSQLConfigSecure } = await import('@serenity/core');
        await savePostgreSQLConfigSecure({
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          ssl: config.ssl || false,
        }, config.password || '');
        setDbConnection({
          url: `postgresql://${config.username}@${config.host}:${config.port}/${config.database}`,
          connected: true,
          lastConnected: new Date().toISOString(),
          encryptionEnabled: false
        });
        setDbConnected(true);
      }
      showSuccess('Database Configuration', 'Database configuration saved securely');
    } catch (error) {
      logger.error('Database save failed', { component: 'SettingsPage', operation: 'databaseSaveFailed' }, error as Error);
      showError('Configuration Error', 'Failed to save database configuration securely');
    }
  };

  const handlePrivacySave = async (settings: PrivacySecuritySettings) => {
    try {
      const enhancedSettings = {
        ...settings,
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

      await savePrivacySettingsSecure(enhancedSettings);
      setPrivacySettings(settings);
      await dispatch(initializeAuth() as any);

      if (settings.masterPasswordEnabled && !privacySettings.masterPasswordEnabled) {
        showSuccess('Master Password Enabled', 'Your app is now protected with a master password');
      } else if (!settings.masterPasswordEnabled && privacySettings.masterPasswordEnabled) {
        showSuccess('Master Password Disabled', 'Master password protection has been disabled');
      } else {
        showSuccess('Settings Saved', 'Privacy and security settings updated successfully');
      }
    } catch (error) {
      logger.error('Failed to save privacy settings', { component: 'SettingsPage', operation: 'failedSavePrivacy' }, error as Error);
      showError('Save Failed', 'Failed to save privacy settings');
    }
  };

  const handleLockApp = () => {
    if (hasMasterPassword) {
      dispatch(lockApp());
      showSuccess('App Locked', 'The application has been locked');
    } else {
      showError('No Master Password', 'Please set up a master password first to enable app locking');
    }
  };

  // Desktop-only Advanced section
  const platformSections = (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Storage */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Data Storage
                  {dbConnected && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dbConnected
                    ? `Connected • Last: ${dbConnection?.lastConnected ? new Date(dbConnection.lastConnected).toLocaleDateString() : 'Unknown'}`
                    : 'Configure PostgreSQL database connection'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsDatabaseModalOpen(true)}
              className="w-24 rounded-xl"
            >
              {dbConnected ? 'Manage' : 'Configure'}
            </Button>
          </div>

          {/* Privacy & Security */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Privacy & Security
                  {privacySettings.masterPasswordEnabled && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {privacySettings.masterPasswordEnabled
                    ? `Protected • Auto-lock: ${privacySettings.autoLockTimeout > 0 ? `${privacySettings.autoLockTimeout}min` : 'Never'}`
                    : 'Configure security and privacy settings'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasMasterPassword && (
                <Button
                  variant="outline"
                  onClick={handleLockApp}
                  className="w-16 rounded-xl"
                  title="Lock the application now"
                >
                  Lock
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-24 rounded-xl"
              >
                Manage
              </Button>
            </div>
          </div>

          {/* Tags Management */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Tags Management
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organize, rename, merge, and delete tags system-wide
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsTagsManagerOpen(true)}
              className="w-24 rounded-xl"
            >
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <DatabaseConfigurationModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onSave={handleDatabaseSave}
        currentConfig={null}
      />

      <PrivacySecurityModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onSave={handlePrivacySave}
        initialSettings={privacySettings}
      />

      <TagsManager
        isOpen={isTagsManagerOpen}
        onClose={() => setIsTagsManagerOpen(false)}
      />
    </>
  );

  return (
    <SharedSettingsPage
      onLoadUsage={handleLoadUsage}
      onTestCredential={handleTestCredential}
      onAddCredential={handleAddCredential}
      platformSections={platformSections}
      privacyNoticeText="Your data is sent to the selected AI provider for analysis. API keys are stored securely using system encryption."
    />
  );
};
