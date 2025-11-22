'use client'

import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectGoogleCalendarIntegration,
  selectGitHubIntegration,
  selectIsSyncing,
  selectLastSyncError,
  setGoogleCalendarSyncEnabled,
  setGitHubSyncEnabled,
  disconnectGoogleCalendar,
  disconnectGitHub,
  selectHasMasterPassword,
} from '@serenity/core';
import {
  IntegrationCard,
  SyncStatusCard,
  MasterPasswordWarning,
  LoadSavedIntegrationsCard,
  Button,
  Input,
  useToast,
} from '../components';
import { ExternalLink, Calendar, Github } from 'lucide-react';

/**
 * Props for platform-specific integration handlers
 */
export interface IntegrationsPageProps {
  /** Handler for Google Calendar OAuth flow */
  onGoogleConnect?: (clientId: string, clientSecret: string) => Promise<void>;
  /** Handler for GitHub token addition */
  onGitHubConnect?: (token: string, displayName?: string) => Promise<void>;
  /** Handler for sync all integrations */
  onSyncAll?: () => Promise<void>;
  /** Handler for master password setup */
  onSetupMasterPassword?: () => void;
  /** Handler for loading saved integrations */
  onLoadSavedIntegrations?: () => void;
  /** Whether there are encrypted integrations to load */
  hasEncryptedIntegrations?: boolean;
  /** Whether the app is in a locked state */
  isLocked?: boolean;
  /** Platform-specific children (e.g., token management for desktop) */
  children?: React.ReactNode;
}

/**
 * Shared IntegrationsPage component
 * Uses shared UI components with platform-specific handlers passed as props
 */
export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({
  onGoogleConnect,
  onGitHubConnect,
  onSyncAll,
  onSetupMasterPassword,
  onLoadSavedIntegrations,
  hasEncryptedIntegrations = false,
  isLocked = false,
  children,
}) => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();

  // Redux state
  const googleCalendar = useSelector(selectGoogleCalendarIntegration);
  const github = useSelector(selectGitHubIntegration);
  const isSyncing = useSelector(selectIsSyncing);
  const lastSyncError = useSelector(selectLastSyncError);
  const hasMasterPassword = useSelector(selectHasMasterPassword);

  // Local state for credentials
  const [googleClientId, setGoogleClientId] = useState(googleCalendar.clientId || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(googleCalendar.clientSecret || '');
  const [githubToken, setGithubToken] = useState('');
  const [githubTokenName, setGithubTokenName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const hasConnectedIntegrations = googleCalendar.connected || github.connected;

  // Handlers
  const handleGoogleConnect = useCallback(async () => {
    if (!onGoogleConnect) return;
    if (!googleClientId.trim() || !googleClientSecret.trim()) {
      showError('Missing Credentials', 'Please enter both Client ID and Client Secret');
      return;
    }

    setIsConnecting(true);
    try {
      await onGoogleConnect(googleClientId, googleClientSecret);
    } catch (error) {
      showError('Connection Failed', error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  }, [onGoogleConnect, googleClientId, googleClientSecret, showError]);

  const handleGoogleDisconnect = useCallback(() => {
    dispatch(disconnectGoogleCalendar());
    showSuccess('Disconnected', 'Google Calendar has been disconnected');
  }, [dispatch, showSuccess]);

  const handleGoogleSyncToggle = useCallback((enabled: boolean) => {
    dispatch(setGoogleCalendarSyncEnabled(enabled));
    showSuccess('Sync Settings', `Google Calendar sync ${enabled ? 'enabled' : 'disabled'}`);
  }, [dispatch, showSuccess]);

  const handleGitHubConnect = useCallback(async () => {
    if (!onGitHubConnect) return;
    if (!githubToken.trim()) {
      showError('Missing Token', 'Please enter a GitHub Personal Access Token');
      return;
    }

    setIsConnecting(true);
    try {
      await onGitHubConnect(githubToken, githubTokenName);
      setGithubToken('');
      setGithubTokenName('');
      showSuccess('Connected', 'GitHub token added successfully');
    } catch (error) {
      showError('Connection Failed', error instanceof Error ? error.message : 'Failed to add token');
    } finally {
      setIsConnecting(false);
    }
  }, [onGitHubConnect, githubToken, githubTokenName, showSuccess, showError]);

  const handleGitHubDisconnect = useCallback(() => {
    dispatch(disconnectGitHub());
    showSuccess('Disconnected', 'GitHub has been disconnected');
  }, [dispatch, showSuccess]);

  const handleGitHubSyncToggle = useCallback((enabled: boolean) => {
    dispatch(setGitHubSyncEnabled(enabled));
    showSuccess('Sync Settings', `GitHub sync ${enabled ? 'enabled' : 'disabled'}`);
  }, [dispatch, showSuccess]);

  const handleSyncNow = useCallback(async () => {
    if (!onSyncAll) return;
    try {
      await onSyncAll();
      showSuccess('Sync Complete', 'All integrations synced successfully');
    } catch (error) {
      showError('Sync Failed', error instanceof Error ? error.message : 'Failed to sync');
    }
  }, [onSyncAll, showSuccess, showError]);

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-border/50">
                <ExternalLink className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Integrations
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Connect external services to automatically sync tasks and activities
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Master Password Warning */}
            {!hasMasterPassword && onSetupMasterPassword && (
              <MasterPasswordWarning onSetupMasterPassword={onSetupMasterPassword} />
            )}

            {/* Load Saved Integrations */}
            {hasMasterPassword && hasEncryptedIntegrations && !hasConnectedIntegrations && onLoadSavedIntegrations && (
              <LoadSavedIntegrationsCard onLoadIntegrations={onLoadSavedIntegrations} />
            )}

            {/* Sync Status */}
            <SyncStatusCard
              isSyncing={isSyncing}
              lastSyncError={lastSyncError}
              hasConnectedIntegrations={hasConnectedIntegrations}
              onSyncNow={handleSyncNow}
            />

            {/* Google Calendar Integration */}
            <IntegrationCard
              title="Google Calendar"
              description="Automatically sync your calendar events as actionable tasks with smart scheduling"
              icon={<Calendar className="w-6 h-6" />}
              connected={googleCalendar.connected}
              syncEnabled={googleCalendar.syncEnabled}
              lastSync={googleCalendar.lastSync}
              userEmail={googleCalendar.userEmail}
              isConnecting={isConnecting}
              disabled={!hasMasterPassword}
              onDisconnect={handleGoogleDisconnect}
              onSyncToggle={handleGoogleSyncToggle}
              showCredentialsForm={!googleCalendar.connected}
              credentialsFields={[
                {
                  label: 'Google Client ID',
                  placeholder: hasMasterPassword ? 'Enter your Google OAuth Client ID' : 'Set master password first',
                  value: googleClientId,
                  onChange: setGoogleClientId,
                },
                {
                  label: 'Google Client Secret',
                  placeholder: hasMasterPassword ? 'Enter your Google OAuth Client Secret' : 'Set master password first',
                  value: googleClientSecret,
                  onChange: setGoogleClientSecret,
                  type: 'password',
                },
              ]}
              onConnect={handleGoogleConnect}
              connectButtonText="Connect Google Calendar"
              helpText={
                <>
                  <strong>Setup Required:</strong> Get these credentials from the{' '}
                  <a
                    href="https://console.developers.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-200 underline hover:no-underline"
                  >
                    Google Cloud Console
                  </a>
                  .
                </>
              }
            />

            {/* GitHub Integration */}
            <IntegrationCard
              title="GitHub"
              description="Sync pull requests from all accessible repositories as actionable tasks"
              icon={<Github className="w-6 h-6" />}
              connected={github.connected}
              syncEnabled={github.syncEnabled}
              lastSync={github.lastSync}
              userEmail={github.tokens?.length ? `${github.tokens.length} token(s) configured` : undefined}
              isConnecting={isConnecting}
              disabled={!hasMasterPassword}
              onDisconnect={handleGitHubDisconnect}
              onSyncToggle={handleGitHubSyncToggle}
              showCredentialsForm={!github.connected}
              credentialsFields={[
                {
                  label: 'Token Display Name (Optional)',
                  placeholder: 'e.g., Work Account, Personal',
                  value: githubTokenName,
                  onChange: setGithubTokenName,
                },
                {
                  label: 'GitHub Personal Access Token',
                  placeholder: hasMasterPassword ? 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : 'Set master password first',
                  value: githubToken,
                  onChange: setGithubToken,
                  type: 'password',
                },
              ]}
              onConnect={handleGitHubConnect}
              connectButtonText="Add GitHub Token"
              helpText={
                <>
                  <strong>Multi-Token Support:</strong> You can add multiple GitHub tokens.
                  Create tokens at{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-200 underline hover:no-underline"
                  >
                    GitHub Settings
                  </a>
                  .
                </>
              }
            >
              {/* Platform-specific content like token management */}
              {github.connected && children}
            </IntegrationCard>
          </div>
        </div>
      </div>
    </div>
  );
};
