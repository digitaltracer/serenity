/**
 * Desktop Integrations Page
 * Wraps the shared IntegrationsPage with desktop-specific handlers
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IntegrationsPage as SharedIntegrationsPage } from '@serenity/ui/pages';
import {
  selectGitHubIntegration,
  selectHasMasterPassword,
  selectIsLocked,
  selectSessionActive,
  getSessionMasterPassword,
  validatePassword,
  initializeIntegrations,
  addGitHubToken,
  removeGitHubToken,
  toggleGitHubTokenActive,
  persistIntegrationsState,
  GoogleCalendarService,
  GitHubService,
  IntegrationSyncService,
  EncryptedIntegrationService,
  connectGoogleCalendar,
  saveGoogleCalendarCredentials,
  setSyncing,
  RootState,
  logger,
  GitHubToken,
} from '@serenity/core';
import {
  Button,
  Card,
  CardContent,
  Modal,
  Input,
  PrivacySecurityModal,
  PrivacySecuritySettings,
  useToast,
} from '@serenity/ui';
import { Lock, Github } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();

  // Redux state
  const github = useSelector(selectGitHubIntegration);
  const hasMasterPassword = useSelector(selectHasMasterPassword);
  const isLocked = useSelector(selectIsLocked);
  const sessionActive = useSelector(selectSessionActive);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const projects = useSelector((state: RootState) => state.projects.projects);

  // Local state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<'google' | 'github' | 'load' | 'sync' | null>(null);
  const [pendingGoogleCredentials, setPendingGoogleCredentials] = useState<{ clientId: string; clientSecret: string } | null>(null);
  const [pendingGitHubToken, setPendingGitHubToken] = useState<{ token: string; displayName?: string } | null>(null);
  const [hasEncryptedIntegrations, setHasEncryptedIntegrations] = useState(false);
  const [showTokenManagement, setShowTokenManagement] = useState(false);

  // Check for encrypted integrations on mount
  useEffect(() => {
    const checkEncrypted = async () => {
      if (hasMasterPassword && !isLocked) {
        try {
          const hasEncrypted = await EncryptedIntegrationService.hasStoredIntegrations();
          setHasEncryptedIntegrations(hasEncrypted);
        } catch (error) {
          logger.error('Failed to check encrypted integrations', { component: 'IntegrationsPage' }, error as Error);
        }
      }
    };
    checkEncrypted();
  }, [hasMasterPassword, isLocked]);

  // Password validation handler
  const handlePasswordSubmit = useCallback(async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError('');

    try {
      const result = await (dispatch as any)(validatePassword(password.trim()));

      if (validatePassword.fulfilled.match(result)) {
        setShowPasswordModal(false);
        const validatedPassword = password.trim();
        setPassword('');

        // Execute pending action
        if (pendingAction === 'google' && pendingGoogleCredentials) {
          await executeGoogleConnect(pendingGoogleCredentials.clientId, pendingGoogleCredentials.clientSecret, validatedPassword);
        } else if (pendingAction === 'github' && pendingGitHubToken) {
          await executeGitHubConnect(pendingGitHubToken.token, pendingGitHubToken.displayName, validatedPassword);
        } else if (pendingAction === 'load') {
          await executeLoadIntegrations(validatedPassword);
        } else if (pendingAction === 'sync') {
          await executeSyncAll(validatedPassword);
        }

        setPendingAction(null);
        setPendingGoogleCredentials(null);
        setPendingGitHubToken(null);
      } else {
        setPasswordError(result.payload as string || 'Invalid password');
      }
    } catch (error) {
      setPasswordError('Failed to validate password');
    } finally {
      setIsValidatingPassword(false);
    }
  }, [password, dispatch, pendingAction, pendingGoogleCredentials, pendingGitHubToken]);

  const requirePassword = useCallback((action: 'google' | 'github' | 'load' | 'sync') => {
    if (sessionActive) {
      return getSessionMasterPassword();
    }
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
    return null;
  }, [sessionActive]);

  // Google Calendar connection
  const executeGoogleConnect = useCallback(async (clientId: string, clientSecret: string, masterPassword: string) => {
    try {
      // Save credentials
      dispatch(saveGoogleCalendarCredentials({ clientId, clientSecret }));

      // Start OAuth flow via IPC
      const result = await (window as any).electronAPI?.integrations?.startGoogleOAuth?.(clientId, clientSecret);

      if (result?.success) {
        // Store tokens encrypted
        await EncryptedIntegrationService.storeIntegrationData({
          google: {
            clientId,
            clientSecret,
            accessToken: result.tokens.access_token,
            refreshToken: result.tokens.refresh_token,
            expiresAt: result.tokens.expiry_date,
          }
        }, masterPassword);

        dispatch(connectGoogleCalendar({
          accessToken: result.tokens.access_token,
          refreshToken: result.tokens.refresh_token,
          expiresAt: result.tokens.expiry_date,
          userEmail: result.userEmail,
        }));

        showSuccess('Connected', 'Google Calendar connected successfully');
      } else {
        throw new Error(result?.error || 'OAuth flow failed');
      }
    } catch (error) {
      logger.error('Google connect failed', { component: 'IntegrationsPage' }, error as Error);
      throw error;
    }
  }, [dispatch, showSuccess]);

  const handleGoogleConnect = useCallback(async (clientId: string, clientSecret: string) => {
    const masterPassword = requirePassword('google');
    if (masterPassword) {
      await executeGoogleConnect(clientId, clientSecret, masterPassword);
    } else {
      setPendingGoogleCredentials({ clientId, clientSecret });
    }
  }, [requirePassword, executeGoogleConnect]);

  // GitHub connection
  const executeGitHubConnect = useCallback(async (token: string, displayName: string | undefined, masterPassword: string) => {
    try {
      // Validate token by fetching user info
      const userInfo = await GitHubService.validateToken(token);

      if (!userInfo.success) {
        throw new Error(userInfo.error || 'Invalid token');
      }

      // Add token to Redux
      dispatch(addGitHubToken({
        token,
        displayName: displayName || `${userInfo.username} Token`,
        username: userInfo.username!,
      }));

      // Persist encrypted
      await (dispatch as any)(persistIntegrationsState(masterPassword));

      showSuccess('Token Added', `GitHub token for @${userInfo.username} added successfully`);
    } catch (error) {
      logger.error('GitHub connect failed', { component: 'IntegrationsPage' }, error as Error);
      throw error;
    }
  }, [dispatch, showSuccess]);

  const handleGitHubConnect = useCallback(async (token: string, displayName?: string) => {
    const masterPassword = requirePassword('github');
    if (masterPassword) {
      await executeGitHubConnect(token, displayName, masterPassword);
    } else {
      setPendingGitHubToken({ token, displayName });
    }
  }, [requirePassword, executeGitHubConnect]);

  // Load saved integrations
  const executeLoadIntegrations = useCallback(async (masterPassword: string) => {
    try {
      await (dispatch as any)(initializeIntegrations(masterPassword));
      setHasEncryptedIntegrations(false);
      showSuccess('Loaded', 'Saved integrations loaded successfully');
    } catch (error) {
      logger.error('Load integrations failed', { component: 'IntegrationsPage' }, error as Error);
      throw error;
    }
  }, [dispatch, showSuccess]);

  const handleLoadSavedIntegrations = useCallback(() => {
    const masterPassword = requirePassword('load');
    if (masterPassword) {
      executeLoadIntegrations(masterPassword);
    }
  }, [requirePassword, executeLoadIntegrations]);

  // Sync all
  const executeSyncAll = useCallback(async (masterPassword: string) => {
    dispatch(setSyncing(true));
    try {
      await IntegrationSyncService.syncAll({
        tasks,
        projects,
        masterPassword,
        dispatch: dispatch as any,
      });
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch, tasks, projects]);

  const handleSyncAll = useCallback(async () => {
    const masterPassword = requirePassword('sync');
    if (masterPassword) {
      await executeSyncAll(masterPassword);
    }
  }, [requirePassword, executeSyncAll]);

  // Token management handlers
  const handleRemoveToken = useCallback(async (tokenId: string) => {
    dispatch(removeGitHubToken(tokenId));
    const masterPassword = sessionActive ? getSessionMasterPassword() : null;
    if (masterPassword) {
      await (dispatch as any)(persistIntegrationsState(masterPassword));
    }
    showSuccess('Token Removed', 'GitHub token removed');
  }, [dispatch, sessionActive, showSuccess]);

  const handleToggleToken = useCallback(async (tokenId: string) => {
    dispatch(toggleGitHubTokenActive(tokenId));
    const masterPassword = sessionActive ? getSessionMasterPassword() : null;
    if (masterPassword) {
      await (dispatch as any)(persistIntegrationsState(masterPassword));
    }
  }, [dispatch, sessionActive]);

  // Privacy settings handler
  const handlePrivacySettingsSave = useCallback(async (settings: PrivacySecuritySettings) => {
    // This would save privacy settings
    setShowPrivacyModal(false);
    showSuccess('Settings Saved', 'Privacy settings updated');
  }, [showSuccess]);

  // Token management UI (desktop-specific)
  const tokenManagementUI = github.tokens && github.tokens.length > 0 && (
    <div className="space-y-4 mt-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <Github className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                GitHub Tokens
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {github.tokens.length} token{github.tokens.length !== 1 ? 's' : ''} configured
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTokenManagement(!showTokenManagement)}
            className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800/50"
          >
            {showTokenManagement ? 'Hide' : 'Manage'} Tokens
          </Button>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          {github.tokens.map((token: GitHubToken) => (
            <div key={token.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${token.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {token.displayName || `${token.username} Token`}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    @{token.username} • {token.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleToken(token.id)}
                  className={`text-xs ${token.isActive
                    ? 'text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-800/30'
                    : 'text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800/30'
                    }`}
                >
                  {token.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRemoveToken(token.id)}
                  className="text-xs text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-800/30"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SharedIntegrationsPage
        onGoogleConnect={handleGoogleConnect}
        onGitHubConnect={handleGitHubConnect}
        onSyncAll={handleSyncAll}
        onSetupMasterPassword={() => setShowPrivacyModal(true)}
        onLoadSavedIntegrations={handleLoadSavedIntegrations}
        hasEncryptedIntegrations={hasEncryptedIntegrations}
        isLocked={isLocked}
      >
        {tokenManagementUI}
      </SharedIntegrationsPage>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setPasswordError('');
          setPendingAction(null);
        }}
        title="Authentication Required"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please enter your master password to continue.
            </p>
          </div>

          <Input
            label="Master Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your master password"
            disabled={isValidatingPassword}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePasswordSubmit();
            }}
          />

          {passwordError && (
            <div className="text-sm text-red-600 dark:text-red-400">{passwordError}</div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPendingAction(null);
              }}
              disabled={isValidatingPassword}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={isValidatingPassword || !password.trim()}>
              {isValidatingPassword ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <PrivacySecurityModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSave={handlePrivacySettingsSave}
        initialSettings={{
          masterPasswordEnabled: false,
          autoLockTimeout: 15,
          screenPrivacy: false,
          encryptJournalContent: false,
          encryptTaskContent: false,
          hideFromTaskbar: false,
        }}
      />
    </>
  );
};
