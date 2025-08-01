import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardContent,
  Button, 
  Input, 
  Toggle,
  Badge,
  Modal,
  PrivacySecurityModal,
  PrivacySecuritySettings,
  useToast 
} from '@serenity/ui';
import {
  selectGoogleCalendarIntegration,
  selectGitHubIntegration,
  selectIsSyncing,
  selectLastSyncError,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  connectGitHub,
  addGitHubToken,
  removeGitHubToken,
  updateGitHubToken,
  toggleGitHubTokenActive,
  disconnectGitHub,
  setGoogleCalendarSyncEnabled,
  setGitHubSyncEnabled,
  updateGoogleCalendarSyncEnabled,
  updateGitHubSyncEnabled,
  updateGoogleCalendarLastSync,
  updateGitHubLastSync,
  persistIntegrationsState,
  setSyncing,
  setSyncError,
  clearSyncError,
  saveGoogleCalendarCredentials,
  GoogleCalendarService,
  GitHubService,
  IntegrationSyncService,
  EncryptedIntegrationService,
  addTask,
  RootState,
  selectHasMasterPassword,
  selectIsLocked,
  selectSessionMasterPassword,
  validatePassword,
  store,
  savePrivacySettingsSecure,
  setMasterPassword,
  initializeAuth,
  GitHubToken
} from '@serenity/core';
import { Calendar, Github, RotateCw, AlertTriangle, CheckCircle, ExternalLink, Lock, Shield } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const googleCalendar = useSelector(selectGoogleCalendarIntegration);
  const github = useSelector(selectGitHubIntegration);
  const isSyncing = useSelector(selectIsSyncing);
  const lastSyncError = useSelector(selectLastSyncError);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const hasMasterPassword = useSelector(selectHasMasterPassword);
  const isLocked = useSelector(selectIsLocked);
  const sessionMasterPassword = useSelector(selectSessionMasterPassword);
  
  // Check if we need to load encrypted integrations on mount
  useEffect(() => {
    const checkAndLoadEncryptedIntegrations = async () => {
      // Only check if user has master password and isn't locked
      if (!hasMasterPassword || isLocked) {
        return;
      }
      
      // Check if integrations are already loaded
      if (googleCalendar.connected || github.connected) {
        console.log('ℹ️ Integrations already loaded');
        return;
      }
      
      try {
        // Check if there are encrypted integrations in the database
        if (window.electronAPI?.sqlite) {
          const result = await window.electronAPI.sqlite.query(
            'SELECT COUNT(*) as count FROM encrypted_integrations'
          );
          
          if (result.success && result.data?.[0]?.count > 0) {
            console.log('🔐 Found encrypted integrations, but need master password to load them');
            setHasEncryptedIntegrations(true);
          }
        }
      } catch (error) {
        console.log('ℹ️ Could not check for encrypted integrations:', error);
      }
    };
    
    // Run check after component mounts
    setTimeout(checkAndLoadEncryptedIntegrations, 500);
  }, [hasMasterPassword, isLocked, googleCalendar.connected, github.connected, showError]);
  
  // GitHub token management states
  const [githubTokens, setGithubTokens] = useState<GitHubToken[]>(github.tokens || []);
  const [newGithubToken, setNewGithubToken] = useState('');
  const [newTokenDisplayName, setNewTokenDisplayName] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [availableRepos, setAvailableRepos] = useState<Array<{name: string, full_name: string}>>([]);
  const [showTokenManagement, setShowTokenManagement] = useState(false);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(googleCalendar.clientId || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(googleCalendar.clientSecret || '');
  
  // Master password authentication states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'google' | 'github' | null>(null);
  const [validatedMasterPassword, setValidatedMasterPassword] = useState<string>('');
  const [currentMasterPassword, setCurrentMasterPassword] = useState<string>(''); // For OAuth flows
  const masterPasswordRef = useRef<string>(''); // Persistent ref for OAuth flows that survives re-renders
  
  // Privacy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // State for encrypted integrations check
  const [hasEncryptedIntegrations, setHasEncryptedIntegrations] = useState(false);
  
  // State for pending sync toggle changes
  const [pendingSyncToggle, setPendingSyncToggle] = useState<{ integration: 'google' | 'github', enabled: boolean } | null>(null);
  
  // Keep local GitHub tokens in sync with Redux state
  useEffect(() => {
    setGithubTokens(github.tokens || []);
  }, [github.tokens]);

  // Handle privacy settings save
  const handlePrivacySettingsSave = async (settings: PrivacySecuritySettings) => {
    try {
      console.log('Saving privacy settings:', settings);
      
      // Convert basic settings to enhanced settings format
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
      
      // Save the privacy settings
      await savePrivacySettingsSecure(enhancedSettings);
      
      // If master password was enabled and a password was set, initialize auth
      if (settings.masterPasswordEnabled) {
        // The PrivacySecurityModal handles master password setting internally
        // We just need to reinitialize auth to pick up the new settings
        await dispatch(initializeAuth());
        
        showSuccess('Master Password Set', 'Master password has been configured successfully. You can now connect integrations.');
      } else {
        showSuccess('Settings Saved', 'Privacy settings have been saved successfully.');
      }
      
      setShowPrivacyModal(false);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      showError('Settings Error', 'Failed to save privacy settings. Please try again.');
    }
  };

  // Set up OAuth event listeners
  useEffect(() => {
    if (!window.electronAPI?.oauth) return;

    const handleOAuthSuccess = async (authData: any) => {
      console.log('📅 OAuth success received:', authData);
      // Get password from sessionStorage if available
      const tempKeyFromStorage = sessionStorage.getItem('serenity_oauth_temp_key');
      const sessionStoragePassword = tempKeyFromStorage ? sessionStorage.getItem(tempKeyFromStorage) : null;
      
      console.log('🔍 Checking master password availability in OAuth callback:', {
        hasCurrentMasterPassword: !!currentMasterPassword,
        currentMasterPasswordLength: currentMasterPassword?.length || 0,
        hasValidatedMasterPassword: !!validatedMasterPassword,
        validatedMasterPasswordLength: validatedMasterPassword?.length || 0,
        hasMasterPasswordRef: !!masterPasswordRef.current,
        masterPasswordRefLength: masterPasswordRef.current?.length || 0,
        hasSessionStoragePassword: !!sessionStoragePassword,
        sessionStoragePasswordLength: sessionStoragePassword?.length || 0
      });
      
      // Connect to Google Calendar in Redux
      dispatch(connectGoogleCalendar({
        ...authData,
        clientId: googleClientId.trim(),
        clientSecret: googleClientSecret.trim()
      }));
      
      // Get the current session master password from Redux
      const currentState = store.getState() as any;
      const sessionPassword = currentState.auth.sessionMasterPassword;
      console.log('🔑 Session master password available:', !!sessionPassword);
      
      // Encrypt and store the integration data
      if (sessionPassword) {
        try {
          console.log('🔐 Using session master password for Google Calendar encryption (length:', sessionPassword.length, ')');
          await EncryptedIntegrationService.saveEncryptedIntegrations(
            currentState.integrations,
            sessionPassword
          );
          console.log('✅ Google Calendar tokens encrypted and stored successfully');
        } catch (error) {
          console.error('❌ Failed to encrypt Google Calendar tokens:', error);
          alert('Warning: Failed to encrypt integration tokens. Please try reconnecting.');
        }
      } else {
        console.warn('⚠️ No session master password available for Google Calendar encryption');
        alert('Warning: Session master password not available. Integration tokens were not encrypted. Please unlock the app first.');
      }
      
      setIsConnecting(false);
    };

    const handleOAuthError = (error: string) => {
      console.error('OAuth error:', error);
      alert(`Google Calendar connection failed: ${error}`);
      setIsConnecting(false);
    };

    const handleOAuthCancelled = () => {
      console.log('OAuth cancelled by user');
      setIsConnecting(false);
    };

    window.electronAPI.oauth.onGoogleSuccess(handleOAuthSuccess);
    window.electronAPI.oauth.onGoogleError(handleOAuthError);
    window.electronAPI.oauth.onGoogleCancelled(handleOAuthCancelled);

    return () => {
      window.electronAPI?.oauth.removeOAuthListeners();
    };
  }, [dispatch, currentMasterPassword, validatedMasterPassword, googleClientId, googleClientSecret]);

  // Save Google Calendar credentials when they change
  useEffect(() => {
    if (googleClientId.trim() && googleClientSecret.trim()) {
      dispatch(saveGoogleCalendarCredentials({
        clientId: googleClientId.trim(),
        clientSecret: googleClientSecret.trim()
      }));
    }
  }, [googleClientId, googleClientSecret, dispatch]);

  // Password validation handler
  const handlePasswordSubmit = async () => {
    console.log('🔐 handlePasswordSubmit called with password length:', password.trim().length);
    
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError('');

    try {
      console.log('🔄 Dispatching validatePassword...');
      const result = await dispatch(validatePassword(password.trim()));
      console.log('📝 validatePassword result:', result);
      
      if (validatePassword.fulfilled.match(result)) {
        // Password is valid, store it and proceed with pending action
        console.log('✅ Password validation successful, setting validated master password');
        console.log('🔑 Setting validatedMasterPassword (length:', password.trim().length, ')');
        setValidatedMasterPassword(password.trim());
        
        // Verify the state was set
        console.log('✓ After setting - validatedMasterPassword length should be:', password.trim().length);
        
        setShowPasswordModal(false);
        setPassword('');
        
        if (pendingAction === 'google') {
          console.log('🔑 Proceeding with Google Calendar connection with validated password');
          // Use the password directly since state might not have updated yet
          await performGoogleCalendarConnectWithPassword(password.trim());
        } else if (pendingAction === 'github') {
          console.log('🔑 Proceeding with GitHub connection with validated password');
          // Use the password directly since state might not have updated yet
          await performGitHubConnectWithPassword(password.trim());
        } else if (pendingAction === 'load') {
          console.log('🔑 Proceeding to load saved integrations with validated password');
          await performLoadSavedIntegrations(password.trim());
        } else if (pendingAction === 'persist_sync' && pendingSyncToggle) {
          console.log('🔑 Proceeding to persist sync toggle change with validated password');
          await performSyncTogglePersistence(password.trim(), pendingSyncToggle);
        }
        
        setPendingAction(null);
        setPendingSyncToggle(null);
      } else {
        console.error('❌ Password validation failed:', result.payload);
        console.error('❌ Full result object:', result);
        setPasswordError(result.payload as string || 'Invalid password');
      }
    } catch (error) {
      console.error('❌ Exception during password validation:', error);
      setPasswordError('Failed to validate password');
    } finally {
      setIsValidatingPassword(false);
    }
  };

  // Check master password before allowing integration connections
  const requireMasterPassword = (action: 'google' | 'github' | 'load', callback?: () => Promise<void>) => {
    if (!hasMasterPassword) {
      alert('Master password required. Please set up a master password in Settings before connecting integrations.');
      return;
    }

    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };

  // Load encrypted integrations from database
  const handleLoadSavedIntegrations = async () => {
    requireMasterPassword('load');
  };

  const performLoadSavedIntegrations = async (masterPassword: string) => {
    try {
      console.log('🔓 Loading saved integrations with master password...');
      await dispatch(initializeIntegrations(masterPassword));
      
      showSuccess('Integrations Loaded', 'Your saved integrations have been loaded successfully.');
      setHasEncryptedIntegrations(false); // Hide the load button
    } catch (error) {
      console.error('❌ Failed to load saved integrations:', error);
      showError('Load Failed', `Failed to load integrations: ${error}`);
    }
  };

  const performSyncTogglePersistence = async (masterPassword: string, toggleData: { integration: 'google' | 'github', enabled: boolean }) => {
    try {
      console.log(`💾 Persisting ${toggleData.integration} sync toggle (${toggleData.enabled}) with master password...`);
      await dispatch(persistIntegrationsState(masterPassword));
      
      console.log(`✅ ${toggleData.integration} sync state persisted successfully`);
      showSuccess('Sync Settings', `${toggleData.integration === 'google' ? 'Google Calendar' : 'GitHub'} sync ${toggleData.enabled ? 'enabled' : 'disabled'} and saved permanently.`);
    } catch (error) {
      console.error(`❌ Failed to persist ${toggleData.integration} sync state:`, error);
      showError('Sync Settings', 'Sync preference could not be saved permanently. Changes may be lost on restart.');
    }
  };

  const handleGoogleCalendarConnect = async () => {
    requireMasterPassword('google');
  };

  const performGoogleCalendarConnect = async () => {
    await performGoogleCalendarConnectWithPassword(validatedMasterPassword!);
  };

  const performGoogleCalendarConnectWithPassword = async (masterPassword: string) => {
    console.log('📅 performGoogleCalendarConnectWithPassword called with password length:', masterPassword?.length || 0);
    if (!window.electronAPI?.oauth) {
      alert('OAuth not available in this environment');
      return;
    }

    if (!googleClientId.trim() || !googleClientSecret.trim()) {
      alert('Please enter both Google Client ID and Client Secret');
      return;
    }

    try {
      setIsConnecting(true);
      
      console.log('📅 Starting Google Calendar OAuth flow (session master password available:', !!sessionMasterPassword, ')');
      
      const result = await window.electronAPI.oauth.googleStart(googleClientId.trim(), googleClientSecret.trim());
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start OAuth flow');
      }
      
      console.log('📅 OAuth flow started successfully');
      // The OAuth flow will continue in the event listeners
    } catch (error) {
      console.error('Google Calendar connection failed:', error);
      alert(`Failed to start Google Calendar connection: ${error}`);
      setIsConnecting(false);
    }
  };

  const handleGoogleCalendarDisconnect = async () => {
    dispatch(disconnectGoogleCalendar());
    
    // Clear encrypted storage
    try {
      await EncryptedIntegrationService.clearStoredIntegrations();
      console.log('✅ Cleared encrypted Google Calendar data');
    } catch (error) {
      console.error('❌ Failed to clear encrypted data:', error);
    }
  };

  const handleGitHubConnect = async () => {
    requireMasterPassword('github');
  };

  const performGitHubConnect = async () => {
    console.log('⚠️ performGitHubConnect called without password parameter');
    await performGitHubConnectWithPassword(validatedMasterPassword);
  };

  const performGitHubConnectWithPassword = async (masterPassword: string) => {
    console.log('🐙 performGitHubConnectWithPassword called with password length:', masterPassword?.length || 0);
    
    if (!newGithubToken.trim()) {
      alert('Please enter a GitHub personal access token');
      return;
    }

    try {
      // Validate token and get user info
      const userInfo = await GitHubService.validateToken(newGithubToken);
      
      // Create new token object
      const newToken: GitHubToken = {
        id: `github_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        token: newGithubToken,
        username: userInfo.login,
        displayName: newTokenDisplayName.trim() || `${userInfo.login} Token`,
        organizations: [],
        repositories: [],
        lastSync: undefined,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      console.log('🔍 Adding new GitHub token:', {
        id: newToken.id,
        username: newToken.username,
        displayName: newToken.displayName
      });
      
      // Add token to Redux state
      dispatch(addGitHubToken(newToken));
      
      // Encrypt and store the integration data using session master password
      if (sessionMasterPassword) {
        try {
          console.log('🔐 Starting GitHub tokens encryption process with session master password (length:', sessionMasterPassword.length, ')');
          
          // Get updated state after dispatch (synchronous action updates state immediately)
          const currentState = store.getState() as any;
          
          console.log('📊 Current integration state:', {
            githubConnected: currentState.integrations?.github?.connected,
            tokenCount: currentState.integrations?.github?.tokens?.length
          });
          
          await EncryptedIntegrationService.saveEncryptedIntegrations(
            currentState.integrations,
            sessionMasterPassword
          );
          console.log('✅ GitHub tokens encrypted and stored successfully');
          showSuccess('GitHub Token Added', `GitHub token for ${userInfo.login} has been added and encrypted successfully.`);
        } catch (error) {
          console.error('❌ Failed to encrypt GitHub tokens:', error);
          showError('Encryption Failed', `Failed to encrypt integration tokens: ${error}. Please try reconnecting.`);
        }
      } else {
        console.warn('⚠️ No session master password available for GitHub encryption');
        showError('Authentication Error', 'Session master password not available. Please unlock the app first.');
      }
      
      // Clear form
      setNewGithubToken('');
      setNewTokenDisplayName('');
      
    } catch (error) {
      alert(`GitHub token validation failed: ${error}`);
    }
  };
  
  // Handle removing a GitHub token
  const handleRemoveGitHubToken = async (tokenId: string) => {
    const token = githubTokens.find(t => t.id === tokenId);
    if (!token) return;
    
    const confirmed = confirm(`Are you sure you want to remove the GitHub token for ${token.username}?`);
    if (!confirmed) return;
    
    dispatch(removeGitHubToken(tokenId));
    
    // Persist changes if session master password is available
    if (sessionMasterPassword) {
      try {
        await dispatch(persistIntegrationsState(sessionMasterPassword));
        showSuccess('Token Removed', `GitHub token for ${token.username} has been removed successfully.`);
      } catch (error) {
        console.error('❌ Failed to persist token removal:', error);
        showError('Persistence Failed', 'Token removed locally but could not be saved permanently.');
      }
    } else {
      showError('Save Required', 'Token removed locally. Please unlock the app to save changes permanently.');
    }
  };
  
  // Handle toggling token active status
  const handleToggleTokenActive = async (tokenId: string) => {
    dispatch(toggleGitHubTokenActive(tokenId));
    
    // Persist changes if session master password is available
    if (sessionMasterPassword) {
      try {
        await dispatch(persistIntegrationsState(sessionMasterPassword));
        const token = githubTokens.find(t => t.id === tokenId);
        if (token) {
          showSuccess('Token Updated', `GitHub token for ${token.username} ${token.isActive ? 'disabled' : 'enabled'} successfully.`);
        }
      } catch (error) {
        console.error('❌ Failed to persist token status change:', error);
        showError('Persistence Failed', 'Token status changed locally but could not be saved permanently.');
      }
    } else {
      showError('Save Required', 'Token status changed locally. Please unlock the app to save changes permanently.');
    }
  };

  const handleGitHubDisconnect = async () => {
    dispatch(disconnectGitHub());
    setAvailableRepos([]);
    setSelectedRepos([]);
    
    // Clear encrypted storage
    try {
      await EncryptedIntegrationService.clearStoredIntegrations();
      console.log('✅ Cleared encrypted GitHub data');
    } catch (error) {
      console.error('❌ Failed to clear encrypted data:', error);
    }
  };

  const handleSyncNow = async () => {
    dispatch(setSyncing(true));
    dispatch(clearSyncError());

    try {
      let totalTasksCreated = 0;

      // Sync Google Calendar if connected and enabled
      if (googleCalendar.connected && googleCalendar.syncEnabled && googleCalendar.accessToken) {
        try {
          const dateRange = IntegrationSyncService.getDefaultSyncDateRange(7); // Last 7 days
          const { tasks: calendarTasks } = await IntegrationSyncService.syncGoogleCalendarEvents(
            googleCalendar.accessToken,
            tasks,
            dateRange,
            googleCalendar.connectionDate // Pass connection date to filter historic events
          );
          
          // Add calendar tasks to store
          calendarTasks.forEach(task => {
            dispatch(addTask(task));
            totalTasksCreated++;
          });
          
          // Update last sync timestamp
          dispatch(updateGoogleCalendarLastSync(new Date().toISOString()));
          console.log('✅ Google Calendar sync completed successfully');
        } catch (error) {
          console.error('Google Calendar sync failed:', error);
        }
      }

      // Sync GitHub if connected and enabled with active tokens
      if (github.connected && github.syncEnabled && github.tokens.length > 0) {
        try {
          const activeTokens = github.tokens.filter(token => token.isActive);
          
          if (activeTokens.length > 0) {
            console.log(`🔄 Syncing GitHub with ${activeTokens.length} active tokens...`);
            
            const since = new Date();
            since.setDate(since.getDate() - 7); // Last 7 days
            
            // Use multi-token approach for comprehensive PR fetching
            const startOfDay = new Date(since);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            
            const pullRequests = await GitHubService.getTodaysPullRequestsMultiToken(
              activeTokens.map(token => ({
                id: token.id,
                token: token.token,
                username: token.username,
                isActive: token.isActive
              })),
              startOfDay,
              endOfDay
            );
            
            console.log(`📊 Found ${pullRequests.length} PRs from multi-token sync`);
            
            // Convert PRs to tasks (simplified conversion for now)
            pullRequests.forEach(pr => {
              const task = {
                id: `github_pr_${pr.id}`,
                title: `PR #${pr.number}: ${pr.title}`,
                description: `GitHub PR in ${pr.repository.full_name}\n\n${pr.body || 'No description'}`,
                completed: pr.state === 'closed' || pr.state === 'merged',
                priority: 'medium' as const,
                tags: ['github', 'pull-request', pr.repository.name],
                projectId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dueDate: null,
                subtasks: []
              };
              
              dispatch(addTask(task));
              totalTasksCreated++;
            });
            
            // Update last sync timestamp
            dispatch(updateGitHubLastSync(new Date().toISOString()));
            console.log('✅ GitHub multi-token sync completed successfully');
          } else {
            console.log('⚠️ No active GitHub tokens found for sync');
          }
        } catch (error) {
          console.error('GitHub multi-token sync failed:', error);
        }
      }

      console.log(`Sync completed: ${totalTasksCreated} tasks created`);
      
      // Persist the updated lastSync timestamps to encrypted storage
      if (sessionMasterPassword && (
        (googleCalendar.connected && googleCalendar.syncEnabled) || 
        (github.connected && github.syncEnabled)
      )) {
        try {
          await dispatch(persistIntegrationsState(sessionMasterPassword));
          console.log('✅ Integration timestamps persisted to encrypted storage');
        } catch (error) {
          console.warn('⚠️ Failed to persist integration timestamps:', error);
        }
      }
      
    } catch (error) {
      dispatch(setSyncError(String(error)));
    } finally {
      dispatch(setSyncing(false));
    }
  };

  // Handle Google Calendar sync toggle with persistence
  const handleGoogleCalendarSyncToggle = async (enabled: boolean) => {
    console.log('🔄 Google Calendar sync toggled to:', enabled);
    
    // Update Redux state immediately for responsive UI
    dispatch(setGoogleCalendarSyncEnabled(enabled));
    
    // Persist the change using session master password
    if (sessionMasterPassword) {
      try {
        console.log('💾 Persisting Google Calendar sync state change...');
        await dispatch(persistIntegrationsState(sessionMasterPassword));
        console.log('✅ Google Calendar sync state persisted successfully');
        showSuccess('Sync Settings', `Google Calendar sync ${enabled ? 'enabled' : 'disabled'} and saved permanently.`);
      } catch (error) {
        console.error('❌ Failed to persist Google Calendar sync state:', error);
        showError('Sync Settings', 'Sync preference updated locally but could not be saved permanently. Changes may be lost on restart.');
      }
    } else {
      console.log('ℹ️ No session master password available - sync state updated locally only');
      showError('Sync Settings', 'Sync preference updated locally but could not be saved permanently. Please unlock the app to save changes.');
    }
  };

  // Handle GitHub sync toggle with persistence
  const handleGitHubSyncToggle = async (enabled: boolean) => {
    console.log('🔄 GitHub sync toggled to:', enabled);
    
    // Update Redux state immediately for responsive UI
    dispatch(setGitHubSyncEnabled(enabled));
    
    // Persist the change using session master password
    if (sessionMasterPassword) {
      try {
        console.log('💾 Persisting GitHub sync state change...');
        await dispatch(persistIntegrationsState(sessionMasterPassword));
        console.log('✅ GitHub sync state persisted successfully');
        showSuccess('Sync Settings', `GitHub sync ${enabled ? 'enabled' : 'disabled'} and saved permanently.`);
      } catch (error) {
        console.error('❌ Failed to persist GitHub sync state:', error);
        showError('Sync Settings', 'Sync preference updated locally but could not be saved permanently. Changes may be lost on restart.');
      }
    } else {
      console.log('ℹ️ No session master password available - sync state updated locally only');
      showError('Sync Settings', 'Sync preference updated locally but could not be saved permanently. Please unlock the app to save changes.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-700/30">
            <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
      {!hasMasterPassword && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">Master Password Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  A master password is required to connect integrations for security reasons. 
                  Integration tokens will be encrypted and stored securely.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-600 dark:hover:bg-amber-800/30"
                  onClick={() => setShowPrivacyModal(true)}
                >
                  Set Up Master Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load Saved Integrations */}
      {hasMasterPassword && hasEncryptedIntegrations && !googleCalendar.connected && !github.connected && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Saved Integrations Found</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You have encrypted integrations saved in the database. 
                  Enter your master password to load them.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-800/30"
                  onClick={handleLoadSavedIntegrations}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Load Saved Integrations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isSyncing 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-800'}`}>
                <RotateCw className={`w-6 h-6 ${isSyncing 
                  ? 'animate-spin text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Sync Status
                  </CardTitle>
                  {isSyncing ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-700/50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Syncing</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-medium">Ready</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isSyncing ? 'Synchronizing data from connected integrations...' : 'All integrations ready for synchronization'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Sync Action */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    {isSyncing ? 'Synchronization in Progress' : 'Manual Sync Available'}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {isSyncing 
                      ? 'Please wait while we sync your data...' 
                      : 'Sync all connected integrations to get the latest updates'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleSyncNow} 
                  disabled={isSyncing || (!googleCalendar.connected && !github.connected)}
                  className="ml-6 min-w-[120px] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </div>
            
            {/* Sync Error */}
            {lastSyncError && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200/50 dark:border-red-700/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                      Sync Error
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {lastSyncError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${googleCalendar.connected 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Calendar className={`w-6 h-6 ${googleCalendar.connected 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Google Calendar
                  </CardTitle>
                  {googleCalendar.connected ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700/50">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-medium">Not Connected</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Automatically sync your calendar events as actionable tasks with smart scheduling
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">

        {googleCalendar.connected ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Connected as: {googleCalendar.userEmail}
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 pl-4">
                    Last sync: {googleCalendar.lastSync ? new Date(googleCalendar.lastSync).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 ml-6">
                  <div className="flex flex-col items-center gap-2">
                    <Toggle
                      checked={googleCalendar.syncEnabled}
                      onChange={handleGoogleCalendarSyncToggle}
                    />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {googleCalendar.syncEnabled ? 'Sync Enabled' : 'Sync Disabled'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGoogleCalendarDisconnect}
                    className="min-w-[100px] text-blue-700 border-blue-300 hover:bg-blue-200 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800/50 font-medium"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Connect Your Calendar
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Automatically create tasks from your calendar events with smart scheduling and deadlines.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4">
                <Input
                  label="Google Client ID"
                  placeholder={hasMasterPassword ? "Enter your Google OAuth Client ID" : "Set master password first to enter credentials"}
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  disabled={isConnecting || !hasMasterPassword}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                <Input
                  label="Google Client Secret"
                  placeholder={hasMasterPassword ? "Enter your Google OAuth Client Secret" : "Set master password first to enter credentials"}
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  type="password"
                  disabled={isConnecting || !hasMasterPassword}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-700/30">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Setup Required:</strong> Get these credentials from the{' '}
                  <a 
                    href="https://console.developers.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-200 underline hover:no-underline"
                  >
                    Google Cloud Console
                  </a>
                  . See{' '}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Refer to GOOGLE_OAUTH_SETUP.md in the project root for detailed setup instructions.');
                    }}
                    className="text-amber-700 dark:text-amber-200 underline hover:no-underline"
                  >
                    setup guide
                  </a>{' '}
                  for detailed instructions.
                </p>
              </div>
              
              <Button 
                onClick={handleGoogleCalendarConnect} 
                disabled={isConnecting || !googleClientId.trim() || !googleClientSecret.trim() || !hasMasterPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* GitHub Integration */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">  
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${github.connected 
                ? 'bg-gray-100 dark:bg-gray-700' 
                : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Github className={`w-6 h-6 ${github.connected 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    GitHub
                  </CardTitle>
                  {github.connected ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700/50">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-medium">Not Connected</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Sync pull requests from all accessible repositories as actionable tasks
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">

        {github.connected ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Connected as: @{github.username}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 pl-4">
                    Last sync: {github.lastSync ? new Date(github.lastSync).toLocaleString() : 'Never'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                    {github.tokens.length} token{github.tokens.length !== 1 ? 's' : ''} configured, {github.tokens.filter(t => t.isActive).length} active
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 ml-6">
                  <div className="flex flex-col items-center gap-2">
                    <Toggle
                      checked={github.syncEnabled}
                      onChange={handleGitHubSyncToggle}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {github.syncEnabled ? 'Sync Enabled' : 'Sync Disabled'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGitHubDisconnect}
                    className="min-w-[100px] text-gray-700 border-gray-300 hover:bg-gray-200 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700/50 font-medium"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Token Management */}
            {github.tokens && github.tokens.length > 0 && (
              <div className="space-y-4">
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
                          Managing {github.tokens.length} token{github.tokens.length !== 1 ? 's' : ''} for comprehensive repository access
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTokenManagement(!showTokenManagement)}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800/50"
                    >
                      {showTokenManagement ? 'Hide' : 'Manage'} Tokens
                    </Button>
                  </div>
                  
                  {/* Token List */}
                  <div className="space-y-3">
                    {github.tokens.map(token => (
                      <div key={token.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${token.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleTokenActive(token.id)}
                            className={`text-xs ${token.isActive 
                              ? 'text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-800/30'
                              : 'text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800/30'
                            }`}
                          >
                            {token.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveGitHubToken(token.id)}
                            className="text-xs text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-800/30"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Add Token Form */}
                {showTokenManagement && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <Github className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Add New GitHub Token
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Add additional tokens to access more repositories and organizations
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        label="Token Display Name (Optional)"
                        placeholder="e.g., Work Account, Personal, Organization"
                        value={newTokenDisplayName}
                        onChange={(e) => setNewTokenDisplayName(e.target.value)}
                        disabled={!hasMasterPassword}
                        className="transition-all duration-200 focus:ring-2 focus:ring-gray-500"
                      />
                      <Input
                        label="GitHub Personal Access Token"
                        placeholder={hasMasterPassword ? "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" : "Set master password first to enter token"}
                        value={newGithubToken}
                        onChange={(e) => setNewGithubToken(e.target.value)}
                        type="password"
                        disabled={!hasMasterPassword}
                        className="transition-all duration-200 focus:ring-2 focus:ring-gray-500"
                      />
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleGitHubConnect} 
                          disabled={!hasMasterPassword || !newGithubToken.trim()}
                          className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-2 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Github className="w-4 h-4" />
                          Add Token
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setShowTokenManagement(false);
                            setNewGithubToken('');
                            setNewTokenDisplayName('');
                          }}
                          className="text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700/50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  <Github className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Connect Your GitHub
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Add multiple GitHub tokens to sync pull requests from all accessible repositories (owned, collaborator, and organization repos) as actionable tasks.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Token Display Name (Optional)"
                placeholder="e.g., Work Account, Personal, Organization"
                value={newTokenDisplayName}
                onChange={(e) => setNewTokenDisplayName(e.target.value)}
                disabled={!hasMasterPassword}
                className="transition-all duration-200 focus:ring-2 focus:ring-gray-500"
              />
              <Input
                label="GitHub Personal Access Token"
                placeholder={hasMasterPassword ? "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" : "Set master password first to enter token"}
                value={newGithubToken}
                onChange={(e) => setNewGithubToken(e.target.value)}
                type="password"
                disabled={!hasMasterPassword}
                className="transition-all duration-200 focus:ring-2 focus:ring-gray-500"
              />
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-700/30">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Multi-Token Support:</strong> You can add multiple GitHub tokens to access repositories from different accounts or organizations. Create tokens at{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-200 underline hover:no-underline"
                  >
                    GitHub Settings → Developer settings → Personal access tokens
                  </a>
                  . Make sure to grant appropriate repository access permissions.
                </p>
              </div>
              
              <Button 
                onClick={handleGitHubConnect} 
                disabled={!hasMasterPassword || !newGithubToken.trim()}
                className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-2.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                Add GitHub Token
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
      </div>

      {/* Master Password Authentication Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword('');
          setPasswordError('');
          setPendingAction(null);
          setPendingSyncToggle(null);
        }}
        title="Authentication Required"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please enter your master password to connect integrations. 
                Integration tokens will be encrypted and stored securely in the database.
              </p>
            </div>
          </div>
          
          <Input
            label="Master Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your master password"
            disabled={isValidatingPassword}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
          />
          
          {passwordError && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {passwordError}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setPasswordError('');
                setPendingAction(null);
                setPendingSyncToggle(null);
              }}
              disabled={isValidatingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={isValidatingPassword || !password.trim()}
            >
              {isValidatingPassword ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Privacy and Security Modal */}
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
    </div>
  );
};