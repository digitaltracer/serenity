'use client'

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
  // AI Assistant selectors and actions
  selectAIConfiguration,
  setAutoAnalyze,
  setAnalysisFrequency,
  selectAIUsage,
  restoreUsage,
  // Credential management
  selectCredentials,
  selectIsLoadingCredentials,
  updateCredential,
  deleteCredential,
  reorderCredentials,
  type AIProviderCredentialInput,
} from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { Toggle } from '../components/Toggle';
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
  Sun,
  Moon,
  Monitor,
  Download,
  Brain,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';

/**
 * Props for the shared SettingsPage component
 * Platform-specific operations are handled via callbacks
 */
export interface SettingsPageProps {
  /** Load AI usage data from platform-specific storage */
  onLoadUsage?: () => Promise<{ success: boolean; usage?: any[] }>;

  /** Load credentials from platform-specific storage */
  onLoadCredentials?: () => Promise<void>;

  /** Test an API key before saving */
  onTestCredential?: (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => Promise<{ valid: boolean; error?: string }>;

  /** Add/save a new credential */
  onAddCredential?: (credentialData: AIProviderCredentialInput) => Promise<void>;

  /** Platform-specific sections (e.g., Desktop: Database, Privacy, Tags) */
  platformSections?: React.ReactNode;

  /** Platform-specific footer note */
  platformNote?: React.ReactNode;

  /** Privacy notice text (differs between desktop and web) */
  privacyNoticeText?: string;
}

/**
 * Shared SettingsPage component for both desktop and web
 * Uses callback props for platform-specific operations
 */
export const SettingsPage: React.FC<SettingsPageProps> = ({
  onLoadUsage,
  onLoadCredentials,
  onTestCredential,
  onAddCredential,
  platformSections,
  platformNote,
  privacyNoticeText = 'Your data is sent to the selected AI provider for analysis. API keys are stored securely.',
}) => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const currentTheme = useSelector(selectTheme);
  const compactMode = useSelector(selectCompactMode);
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);
  const aiConfiguration = useSelector(selectAIConfiguration);
  const aiUsage = useSelector(selectAIUsage);
  const credentials = useSelector(selectCredentials);
  const isLoadingCredentials = useSelector(selectIsLoadingCredentials);

  // Local state
  const [notifications, setNotifications] = React.useState(true);
  const [sounds, setSounds] = React.useState(true);
  const [isAddingCredential, setIsAddingCredential] = React.useState(false);
  const [editingCredentialId, setEditingCredentialId] = React.useState<string | null>(null);
  const [isRefreshingUsage, setIsRefreshingUsage] = React.useState(false);

  // Load AI usage data function (reusable)
  const loadUsage = React.useCallback(async () => {
    if (!onLoadUsage) return;

    setIsRefreshingUsage(true);
    try {
      const result = await onLoadUsage();
      if (result.success && Array.isArray(result.usage)) {
        dispatch(restoreUsage(result.usage as any));
      }
    } catch (error) {
      console.error('Failed to load AI usage:', error);
      showError('Refresh Failed', 'Failed to refresh AI usage data');
    } finally {
      setIsRefreshingUsage(false);
    }
  }, [dispatch, onLoadUsage, showError]);

  // Load AI usage data on mount
  React.useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // Auto-refresh usage data every 30 seconds
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      loadUsage();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [loadUsage]);

  // Load credentials on mount (platform-specific)
  React.useEffect(() => {
    if (onLoadCredentials) {
      onLoadCredentials();
    }
  }, [onLoadCredentials]);

  // Credential Management Handlers
  const handleTestCredential = async (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => {
    if (!onTestCredential) {
      return { valid: false, error: 'Test not available' };
    }
    return onTestCredential(provider, apiKey);
  };

  const handleAddCredential = async (credentialData: AIProviderCredentialInput) => {
    if (!onAddCredential) {
      showError('Add Failed', 'Credential management not available');
      return;
    }

    try {
      await onAddCredential(credentialData);
      showSuccess('Credential Added', `Successfully added ${credentialData.provider} credential`);
      setIsAddingCredential(false);
      // Refresh credentials (platform-specific)
      if (onLoadCredentials) {
        onLoadCredentials();
      }
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
      showSuccess('Export Complete', 'Your data has been exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Export Failed', 'Failed to export data');
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
                        Automatically analyze new data as it&apos;s created
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
                    <strong>Privacy:</strong> {privacyNoticeText}
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
                      Track your AI token usage across providers.
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
                <AIUsageSummary usage={aiUsage as any} />
                <AIUsageTrendChart usage={aiUsage as any} />
                <AIOperationHistory usage={aiUsage as any} />

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>About Token Usage:</strong> Prompt tokens represent the data sent to the AI. Completion tokens represent the AI&apos;s response.
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

            {/* Platform-specific sections (Desktop: Database, Privacy, Tags) */}
            {platformSections}

            {/* Platform-specific footer note */}
            {platformNote}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
