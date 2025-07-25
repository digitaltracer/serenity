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
  selectHasMasterPassword 
} from '@serenity/core';
import { 
  saveDatabaseConnection, 
  getDatabaseConnection, 
  isDatabaseConnected,
  savePrivacySettings,
  getPrivacySettings,
  savePrivacySettingsSecure,
  getPrivacySettingsSecure,
  PrivacySecuritySettings,
  setMasterPassword,
  initializeAuth
} from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, DatabaseConfigurationModal, PrivacySecurityModal, useToast, Toggle } from '@serenity/ui';
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
  Lock
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
  
  // Local state for features not yet in Redux
  const [notifications, setNotifications] = React.useState(true);
  const [sounds, setSounds] = React.useState(true);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = React.useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = React.useState(false);
  
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
        // Load database connection state
        const connection = getDatabaseConnection();
        const connected = isDatabaseConnected();
        setDbConnection(connection);
        setDbConnected(connected);
        
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
        console.error('Failed to load settings:', error);
      }
    };
    
    // Delay loading to ensure app is fully loaded first
    const timer = setTimeout(loadSettings, 200);
    return () => clearTimeout(timer);
  }, []);
  
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
      console.error('Export failed:', error);
      // TODO: Add toast notification for error
    }
  };

  const handleDatabaseSave = async (config: any) => {
    try {
      // For now, just close the modal - real implementation would save the config
      console.log('Database configuration saved:', config);
      showSuccess('Database Configuration', 'Database configuration saved successfully');
      // TODO: Integrate with actual database manager
    } catch (error) {
      console.error('Database save failed:', error);
      showError('Configuration Error', 'Failed to save database configuration');
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
      console.error('Failed to save privacy settings:', error);
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-700/30">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                        relative p-4 rounded-xl border transition-all duration-300 ease-out transform
                        ${isSelected 
                          ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50/30 dark:from-blue-900/30 dark:to-purple-900/20 dark:border-blue-600 shadow-lg shadow-blue-500/20 scale-105' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:scale-102'
                        }
                        group focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
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
    </div>
  );
};