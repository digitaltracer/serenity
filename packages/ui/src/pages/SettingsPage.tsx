import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectTheme,
  selectCompactMode,
  selectAllTasks,
  selectAllEntries,
  selectAllProjects,
  setTheme,
  setCompactMode,
  lockApp,
  selectHasMasterPassword,
  // AI Assistant selectors and actions
  selectAIProviders,
  selectActiveProvider,
  selectAIConfiguration,
  setActiveProvider,
  setAutoAnalyze,
  setAnalysisFrequency,
  setApiKey,
  testApiKey,
  selectAIUsage,
  restoreUsage,
  type AIProvider,
  // Credential management
  selectCredentials,
  selectIsLoadingCredentials,
  fetchCredentials,
  addCredential,
  updateCredential,
  deleteCredential,
  testCredential as testCredentialThunk,
  reorderCredentials,
  type AIProviderCredentialInput,
  // Platform service
  platformService,
  logger,
  // Database and privacy imports
  saveDatabaseConnection,
  getDatabaseConnection,
  isDatabaseConnected,
  savePrivacySettings,
  getPrivacySettings,
  savePrivacySettingsSecure,
  getPrivacySettingsSecure,
  saveDatabaseConnectionSecure,
  getDatabaseConnectionSecure,
  PrivacySecuritySettings,
  setMasterPassword,
  initializeAuth
} from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DatabaseConfigurationModal } from '../components/DatabaseConfigurationModal';
import { PrivacySecurityModal } from '../components/PrivacySecurityModal';
import { TagsManager } from '../components/TagsManager';
import { useToast } from '../components/Toast';
import { Toggle } from '../components/Toggle';
import { AIProviderKeyInput } from '../components/AIProviderKeyInput';
import { AIUsageSummary } from '../components/AIUsageSummary';
import { AIOperationHistory } from '../components/AIOperationHistory';
import { AIUsageTrendChart } from '../components/AIUsageTrendChart';
import { AIProviderCredentialManager } from '../components/AIProviderCredentialManager';
import {
  Settings,
  Palette,
  Bell,
  User,
  Database,
  Shield,
  Globe,
  Sun,
  Moon,
  Monitor,
  Download,
  Lock,
  Tag,
  Sparkles,
  Brain,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';


export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const currentTheme = useSelector(selectTheme);
  const compactMode = useSelector(selectCompactMode);
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);
  const hasMasterPassword = useSelector(selectHasMasterPassword);
  const aiProviders = useSelector(selectAIProviders);
  const activeProvider = useSelector(selectActiveProvider);
  const aiConfiguration = useSelector(selectAIConfiguration);
  const aiUsage = useSelector(selectAIUsage);
  const credentials = useSelector(selectCredentials);
  const isLoadingCredentials = useSelector(selectIsLoadingCredentials);

  // Local state for features not yet in Redux
  const [notifications, setNotifications] = React.useState(true);
  const [sounds, setSounds] = React.useState(true);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = React.useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = React.useState(false);
  const [isTagsManagerOpen, setIsTagsManagerOpen] = React.useState(false);
  const [isAddingCredential, setIsAddingCredential] = React.useState(false);
  const [editingCredentialId, setEditingCredentialId] = React.useState<string | null>(null);
  const [isRefreshingUsage, setIsRefreshingUsage] = React.useState(false);


  // Database connection state - lazy loaded to prevent blocking startup
  const [dbConnection, setDbConnection] = React.useState<any>(null);
  const [dbConnected, setDbConnected] = React.useState(false);
  
  // Privacy settings state - initialize with default values
  const [privacySettings, setPrivacySettings] = React.useState<PrivacySecuritySettings>(() => {
    // Try to get secure settings first, fall back to regular settings
    try {
      return getPrivacySettings(); // This will be updated when component mounts
    } catch (error) {
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
  
  // Load settings on component mount - non-blocking, after app has loaded
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load database connection state from secure storage
        const secureConnection = await getDatabaseConnectionSecure();
        if (secureConnection) {
          setDbConnection(secureConnection);
          setDbConnected(secureConnection.connected);
        } else {
          // Fallback to regular storage for backward compatibility
          const connection = getDatabaseConnection();
          const connected = isDatabaseConnected();
          setDbConnection(connection);
          setDbConnected(connected);
        }
        
        // Load secure privacy settings
        const secureSettings = await getPrivacySettingsSecure();
        if (secureSettings) {
          // Convert enhanced settings back to basic settings
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
    
    // Delay loading to ensure app is fully loaded first
    const timer = setTimeout(loadSettings, 200);
    return () => clearTimeout(timer);
  }, []);

  // Load AI usage data function (reusable)
  const loadUsage = React.useCallback(async () => {
    setIsRefreshingUsage(true);
    try {
      const result = await platformService.aiListUsage();
      if (result.success && Array.isArray(result.usage)) {
        dispatch(restoreUsage(result.usage as any));
        logger.info('✅ Refreshed AI usage data', {
          component: 'SettingsPage',
          operation: 'refreshUsage',
          metadata: { count: result.usage.length }
        });
      }
    } catch (error) {
      logger.error('Failed to load AI usage', { component: 'SettingsPage', operation: 'loadUsage' }, error as Error);
      showError('Refresh Failed', 'Failed to refresh AI usage data');
    } finally {
      setIsRefreshingUsage(false);
    }
  }, [dispatch, showError]);

  // Load AI usage data on mount
  React.useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // Auto-refresh usage data every 30 seconds when on Settings page
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      loadUsage();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [loadUsage]);

  // Load credentials on mount
  React.useEffect(() => {
    (dispatch as any)(fetchCredentials(false));
  }, [dispatch]);

  // AI Provider Handlers
  const handleSaveApiKey = async (providerId: string, apiKey: string) => {
    try {
      await (dispatch as any)(setApiKey({ provider: providerId as 'openai' | 'gemini' | 'anthropic', apiKey })).unwrap();
      showSuccess('API Key Saved', `Successfully saved API key for ${providerId}`);
      return { success: true };
    } catch (error: any) {
      showError('Save Failed', error.message || 'Failed to save API key');
      return { success: false, error: error.message };
    }
  };

  const handleTestApiKey = async (providerId: string) => {
    try {
      await (dispatch as any)(testApiKey(providerId as 'openai' | 'gemini' | 'anthropic')).unwrap();
      showSuccess('Connection Successful', `Successfully connected to ${providerId}`);
      return { success: true };
    } catch (error: any) {
      showError('Connection Failed', error.message || 'Failed to connect to provider');
      return { success: false, error: error.message };
    }
  };

  const handleRemoveApiKey = async (providerId: string) => {
    try {
      const result = await platformService.aiRemoveApiKey(providerId as 'openai' | 'gemini' | 'anthropic');
      if (result.success) {
        showSuccess('API Key Removed', `Successfully removed API key for ${providerId}`);
        // Refresh provider state by testing (which will set hasApiKey to false if removed)
        const providerIdx = aiProviders.findIndex(p => p.id === providerId);
        if (providerIdx >= 0) {
          // Force a refresh of the page or reload providers
          window.location.reload();
        }
        return { success: true };
      } else {
        showError('Remove Failed', result.error || 'Failed to remove API key');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      showError('Remove Failed', error.message || 'Failed to remove API key');
      return { success: false, error: error.message };
    }
  };

  // Credential Management Handlers
  const handleTestCredential = async (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => {
    try {
      const result = await (window as any).api?.['ai-credentials:test-new']?.(provider, apiKey);
      return result || { valid: false, error: 'Test not available' };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  };

  const handleAddCredential = async (credentialData: AIProviderCredentialInput) => {
    try {
      await (dispatch as any)(addCredential(credentialData)).unwrap();
      showSuccess('Credential Added', `Successfully added ${credentialData.provider} credential`);
      setIsAddingCredential(false);
    } catch (error: any) {
      showError('Add Failed', error.message || 'Failed to add credential');
      throw error;
    }
  };

  const handleEditCredential = (credential: any) => {
    setEditingCredentialId(credential.id);
  };

  const handleSaveEditCredential = async (id: string, updates: { name?: string; modelPreference?: string; enabled?: boolean }) => {
    try {
      await (dispatch as any)(updateCredential({ id, updates })).unwrap();
      showSuccess('Credential Updated', 'Successfully updated credential');
      setEditingCredentialId(null);
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to update credential');
      throw error;
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      await (dispatch as any)(deleteCredential(id)).unwrap();
      showSuccess('Credential Deleted', 'Successfully deleted credential');
    } catch (error: any) {
      showError('Delete Failed', error.message || 'Failed to delete credential');
    }
  };

  const handleToggleCredentialEnabled = async (id: string, enabled: boolean) => {
    try {
      await (dispatch as any)(updateCredential({ id, updates: { enabled } })).unwrap();
      showSuccess(
        enabled ? 'Credential Enabled' : 'Credential Disabled',
        enabled ? 'Credential is now active' : 'Credential has been disabled'
      );
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to update credential');
    }
  };

  const handleReorderCredentials = async (reorderedCredentials: any[]) => {
    const priorities = reorderedCredentials.map((cred, idx) => ({
      id: cred.id,
      priority: idx,
    }));

    try {
      await (dispatch as any)(reorderCredentials(priorities)).unwrap();
      showSuccess('Order Updated', 'Credential priority order updated');
    } catch (error: any) {
      showError('Reorder Failed', error.message || 'Failed to update credential order');
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          tasks,
          journalEntries,
          projects,
          settings: {
            theme: currentTheme,
            compactMode,
            notifications,
            sounds
          }
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `serenity-export-${new Date().toISOString().split('T')[0]}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Export failed', { component: 'SettingsPage', operation: 'exportFailed' }, error as Error);
      // TODO: Add toast notification for error
    }
  };

  const handleDatabaseSave = async (config: any) => {
    try {
      logger.info('Database configuration saved: ' + JSON.stringify(config), { component: 'SettingsPage', operation: 'databaseConfigurationSaved' });
      
      // Handle different database types securely
      if (config.type === 'sqlite') {
        // For SQLite, save connection URL
        const sqliteUrl = config.path || 'default';
        await saveDatabaseConnectionSecure(sqliteUrl);
        
        // Update local state
        const updatedConnection = {
          url: sqliteUrl,
          connected: true,
          lastConnected: new Date().toISOString(),
          encryptionEnabled: config.encryption || false
        };
        setDbConnection(updatedConnection);
        setDbConnected(true);
      } else if (config.type === 'postgresql') {
        // For PostgreSQL, use secure storage for credentials
        const { savePostgreSQLConfigSecure } = await import('@serenity/core');
        
        const secureConfig = {
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          ssl: config.ssl || false,
        };
        
        // Save config and password securely
        await savePostgreSQLConfigSecure(secureConfig, config.password || '');
        
        // Update local state (without password)
        const updatedConnection = {
          url: `postgresql://${config.username}@${config.host}:${config.port}/${config.database}`,
          connected: true,
          lastConnected: new Date().toISOString(),
          encryptionEnabled: false
        };
        setDbConnection(updatedConnection);
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
      // If master password is being enabled, we need to handle it through Redux
      if (settings.masterPasswordEnabled && !privacySettings.masterPasswordEnabled) {
        // This case is handled in the modal itself by saving the password hash
        // The modal should have already saved the password hash before calling this
      }
      
      // Convert to enhanced settings format for secure storage
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
      
      // Re-initialize auth to pick up new settings
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

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-border/50">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your Serenity Notes experience
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Theme Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright' },
                  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
                  { value: 'system', label: 'System', icon: Monitor, description: 'Match OS setting' }
                ].map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = currentTheme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => dispatch(setTheme(theme.value as 'light' | 'dark' | 'system'))}
                      className={`
                        relative p-4 rounded-lg border transition-all group focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50 hover:bg-card/50'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                        <div className="text-center">
                          <div className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                            {theme.label}
                          </div>
                          <div className={`text-xs ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {theme.description}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Compact Mode</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reduce spacing for more content
                  </p>
                </div>
              </div>
              <Toggle 
                checked={compactMode} 
                onChange={(checked) => dispatch(setCompactMode(checked))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive task reminders and updates
                  </p>
                </div>
              </div>
              <Toggle 
                checked={notifications} 
                onChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Sound Effects</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Play audio for notifications and actions
                  </p>
                </div>
              </div>
              <Toggle 
                checked={sounds} 
                onChange={setSounds}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Credential Management */}
            <AIProviderCredentialManager
              credentials={credentials}
              isLoading={isLoadingCredentials}
              editingCredentialId={editingCredentialId}
              isAdding={isAddingCredential}
              onStartAdd={() => setIsAddingCredential(true)}
              onEdit={handleEditCredential}
              onDelete={handleDeleteCredential}
              onToggleEnabled={handleToggleCredentialEnabled}
              onReorder={handleReorderCredentials}
              onSaveEdit={handleSaveEditCredential}
              onCancelEdit={() => setEditingCredentialId(null)}
              onSaveAdd={handleAddCredential}
              onCancelAdd={() => setIsAddingCredential(false)}
              onTestApiKey={handleTestCredential}
            />

            {/* Auto-Analyze Setting */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Auto-Analyze</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically analyze new data as it's created
                  </p>
                </div>
              </div>
              <Toggle
                checked={aiConfiguration.autoAnalyze}
                onChange={(checked) => dispatch(setAutoAnalyze(checked))}
              />
            </div>

            {/* Analysis Frequency */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Analysis Frequency</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    How often to generate new insights
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'manual'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => dispatch(setAnalysisFrequency(freq))}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                      ${aiConfiguration.analysisFrequency === freq
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Types to Analyze */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Data Sources</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select what data to include in AI analysis
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Tasks</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {aiConfiguration.dataTypes.includeTasks ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Journal Entries</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {aiConfiguration.dataTypes.includeJournal ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Projects</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {aiConfiguration.dataTypes.includeProjects ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Privacy:</strong> Your data is sent to the selected AI provider for analysis. API keys are stored securely using system encryption.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage & Billing */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  AI Usage & Billing
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Track your AI token usage across providers. Each AI operation consumes tokens based on the amount of data analyzed and generated. Different providers have different pricing models.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsage}
                disabled={isRefreshingUsage}
                className="ml-4 flex items-center gap-2"
                title="Refresh usage data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingUsage ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <AIUsageSummary usage={aiUsage as any} />

            {/* Trend Charts */}
            <AIUsageTrendChart usage={aiUsage as any} />

            {/* Operation History */}
            <AIOperationHistory usage={aiUsage as any} />

            {/* Help Text */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>About Token Usage:</strong> Prompt tokens represent the data sent to the AI (your tasks, journal entries, etc.).
                Completion tokens represent the AI's response (insights, summaries, suggestions). Different models and providers have varying token costs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Profile & Account</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your personal information and preferences
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary"
                className="w-24 rounded-xl"
              >
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Export Data</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download all your tasks and journal entries as JSON
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary"
                onClick={handleExportData}
                className="w-24 rounded-xl"
              >
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
      </div>

      {/* Database Configuration Modal */}
      <DatabaseConfigurationModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onSave={handleDatabaseSave}
        currentConfig={null}
      />

      {/* Privacy & Security Modal */}
      <PrivacySecurityModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onSave={handlePrivacySave}
        initialSettings={privacySettings}
      />

      {/* Tags Manager Modal */}
      <TagsManager
        isOpen={isTagsManagerOpen}
        onClose={() => setIsTagsManagerOpen(false)}
      />
        </div>
      </div>
    </div>
  );
};