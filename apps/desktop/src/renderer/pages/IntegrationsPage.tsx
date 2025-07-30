import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
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
  disconnectGitHub,
  setGoogleCalendarSyncEnabled,
  setGitHubSyncEnabled,
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
  validatePassword,
  store,
  savePrivacySettingsSecure,
  setMasterPassword,
  initializeAuth
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
  
  const [githubToken, setGithubToken] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [availableRepos, setAvailableRepos] = useState<Array<{name: string, full_name: string}>>([]);
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
      
      // Use whichever master password is available (prioritize sessionStorage as it's most persistent)
      const passwordToUse = sessionStoragePassword || masterPasswordRef.current || currentMasterPassword || validatedMasterPassword;
      console.log('🔑 Password to use for encryption (length:', passwordToUse?.length || 0, ')');
      console.log('🔍 Password source:', sessionStoragePassword ? 'sessionStorage' : masterPasswordRef.current ? 'ref' : currentMasterPassword ? 'currentState' : validatedMasterPassword ? 'validatedState' : 'none');
      
      // Encrypt and store the integration data
      if (passwordToUse) {
        try {
          console.log('🔐 Using master password for Google Calendar encryption (length:', passwordToUse.length, ')');
          const currentState = store.getState() as any;
          await EncryptedIntegrationService.saveEncryptedIntegrations(
            currentState.integrations,
            passwordToUse
          );
          console.log('✅ Google Calendar tokens encrypted and stored successfully');
          
          // Clear the stored password for security from all sources
          setCurrentMasterPassword('');
          masterPasswordRef.current = '';
          if (tempKeyFromStorage) {
            sessionStorage.removeItem(tempKeyFromStorage);
            sessionStorage.removeItem('serenity_oauth_temp_key');
          }
        } catch (error) {
          console.error('❌ Failed to encrypt Google Calendar tokens:', error);
          alert('Warning: Failed to encrypt integration tokens. Please try reconnecting.');
        }
      } else {
        console.warn('⚠️ No master password available for Google Calendar encryption (none of the four sources)');
        console.warn('🔍 State check:', {
          currentMasterPassword: currentMasterPassword ? `[${currentMasterPassword.length} chars]` : 'null',
          validatedMasterPassword: validatedMasterPassword ? `[${validatedMasterPassword.length} chars]` : 'null',
          masterPasswordRef: masterPasswordRef.current ? `[${masterPasswordRef.current.length} chars]` : 'null',
          sessionStoragePassword: sessionStoragePassword ? `[${sessionStoragePassword.length} chars]` : 'null'
        });
        alert('Warning: Master password not available. Integration tokens were not encrypted.');
      }
      
      setIsConnecting(false);
    };

    const handleOAuthError = (error: string) => {
      console.error('OAuth error:', error);
      alert(`Google Calendar connection failed: ${error}`);
      setIsConnecting(false);
      
      // Clear stored password for security from all sources
      setCurrentMasterPassword('');
      masterPasswordRef.current = '';
      const tempKey = sessionStorage.getItem('serenity_oauth_temp_key');
      if (tempKey) {
        sessionStorage.removeItem(tempKey);
        sessionStorage.removeItem('serenity_oauth_temp_key');
      }
    };

    const handleOAuthCancelled = () => {
      console.log('OAuth cancelled by user');
      setIsConnecting(false);
      
      // Clear stored password for security from all sources
      setCurrentMasterPassword('');
      masterPasswordRef.current = '';
      const tempKey = sessionStorage.getItem('serenity_oauth_temp_key');
      if (tempKey) {
        sessionStorage.removeItem(tempKey);
        sessionStorage.removeItem('serenity_oauth_temp_key');
      }
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
        }
        
        setPendingAction(null);
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
      
      // Store the master password for the OAuth callback to use
      console.log('🔑 About to store master password for OAuth callback (length:', masterPassword.length, ')');
      setCurrentMasterPassword(masterPassword);
      masterPasswordRef.current = masterPassword; // Store in ref for persistence across re-renders
      
      // Also store in sessionStorage as a final fallback (this survives component unmount/remount)
      const tempKey = `serenity_oauth_temp_password_${Date.now()}`;
      sessionStorage.setItem(tempKey, masterPassword);
      sessionStorage.setItem('serenity_oauth_temp_key', tempKey); // Store the key to retrieve it later
      
      console.log('🔑 Master password stored in state, ref, and sessionStorage');
      
      // Verify all storage methods
      setTimeout(() => {
        console.log('🔍 Storage verification after password set:', {
          currentMasterPasswordStateLength: currentMasterPassword?.length || 0,
          masterPasswordRefLength: masterPasswordRef.current?.length || 0,
          sessionStorageLength: sessionStorage.getItem(tempKey)?.length || 0,
          passedPasswordLength: masterPassword.length
        });
      }, 100);
      
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
      
      // Clear stored password for security from all sources
      setCurrentMasterPassword('');
      masterPasswordRef.current = '';
      const tempKey = sessionStorage.getItem('serenity_oauth_temp_key');
      if (tempKey) {
        sessionStorage.removeItem(tempKey);
        sessionStorage.removeItem('serenity_oauth_temp_key');
      }
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
    requireMasterPassword('github', performGitHubConnect);
  };

  const performGitHubConnect = async () => {
    console.log('⚠️ performGitHubConnect called without password parameter');
    await performGitHubConnectWithPassword(validatedMasterPassword);
  };

  const performGitHubConnectWithPassword = async (masterPassword: string) => {
    console.log('🐙 performGitHubConnectWithPassword called with password length:', masterPassword?.length || 0);
    
    if (!githubToken.trim()) {
      alert('Please enter a GitHub personal access token');
      return;
    }

    try {
      // Validate token and get user info
      const userInfo = await GitHubService.validateToken(githubToken);
      
      // Get user repositories
      const repos = await GitHubService.getUserRepositories(githubToken);
      setAvailableRepos(repos);
      
      dispatch(connectGitHub({
        accessToken: githubToken,
        username: userInfo.login,
        repositories: repos.slice(0, 5).map(repo => repo.full_name), // Default to first 5 repos
      }));
      
      // Encrypt and store the integration data
      console.log('🔍 Checking master password availability:', {
        hasDirectPassword: !!masterPassword,
        directPasswordLength: masterPassword?.length || 0,
        hasValidatedPassword: !!validatedMasterPassword,
        validatedPasswordLength: validatedMasterPassword?.length || 0
      });
      
      const passwordToUse = masterPassword || validatedMasterPassword;
      
      if (passwordToUse) {
        try {
          console.log('🔐 Starting GitHub token encryption process with password length:', passwordToUse.length);
          
          // Get updated state after dispatch (synchronous action updates state immediately)
          const currentState = store.getState() as any;
          
          console.log('📊 Current integration state:', {
            githubConnected: currentState.integrations?.github?.connected,
            hasGithubToken: !!currentState.integrations?.github?.accessToken,
            githubUsername: currentState.integrations?.github?.username
          });
          
          await EncryptedIntegrationService.saveEncryptedIntegrations(
            currentState.integrations,
            passwordToUse
          );
          console.log('✅ GitHub tokens encrypted and stored successfully');
          showSuccess('GitHub Connected', 'Your GitHub integration has been connected and encrypted successfully.');
        } catch (error) {
          console.error('❌ Failed to encrypt GitHub tokens:', error);
          showError('Encryption Failed', `Failed to encrypt integration tokens: ${error}. Please try reconnecting.`);
        }
      } else {
        console.warn('⚠️ No master password available for GitHub encryption');
        console.warn('🔍 Debug info:', {
          masterPassword,
          validatedMasterPassword,
          pendingAction,
          hasMasterPassword
        });
        showError('Authentication Error', 'Master password validation failed. Please try again.');
      }
      
      setSelectedRepos(repos.slice(0, 5).map(repo => repo.full_name));
      setGithubToken('');
    } catch (error) {
      alert(`GitHub connection failed: ${error}`);
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
            dateRange
          );
          
          // Add calendar tasks to store
          calendarTasks.forEach(task => {
            dispatch(addTask(task));
            totalTasksCreated++;
          });
        } catch (error) {
          console.error('Google Calendar sync failed:', error);
        }
      }

      // Sync GitHub if connected and enabled
      if (github.connected && github.syncEnabled && github.accessToken && github.repositories) {
        try {
          const since = new Date();
          since.setDate(since.getDate() - 7); // Last 7 days
          
          const { tasks: githubTasks } = await IntegrationSyncService.syncGitHubActivity(
            github.accessToken,
            github.repositories,
            tasks,
            since
          );
          
          // Add GitHub tasks to store
          githubTasks.forEach(task => {
            dispatch(addTask(task));
            totalTasksCreated++;
          });
        } catch (error) {
          console.error('GitHub sync failed:', error);
        }
      }

      console.log(`Sync completed: ${totalTasksCreated} tasks created`);
    } catch (error) {
      dispatch(setSyncError(String(error)));
    } finally {
      dispatch(setSyncing(false));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect external services to automatically sync tasks and activities
        </p>
      </div>

      {/* Master Password Warning */}
      {!hasMasterPassword && (
        <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
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
        </Card>
      )}

      {/* Load Saved Integrations */}
      {hasMasterPassword && hasEncryptedIntegrations && !googleCalendar.connected && !github.connected && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
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
        </Card>
      )}

      {/* Sync Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <div>
              <h3 className="font-medium">Sync Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isSyncing ? 'Syncing...' : 'Ready to sync'}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSyncNow} 
            disabled={isSyncing || (!googleCalendar.connected && !github.connected)}
            className="flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Sync Now
          </Button>
        </div>
        
        {lastSyncError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-400">Sync Error</p>
              <p className="text-xs text-red-600 dark:text-red-500">{lastSyncError}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Google Calendar Integration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Google Calendar</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync calendar events as tasks
            </p>
          </div>
          <div className="ml-auto">
            {googleCalendar.connected ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
        </div>

        {googleCalendar.connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected as: {googleCalendar.userEmail}</p>
                <p className="text-xs text-gray-500">
                  Last sync: {googleCalendar.lastSync ? new Date(googleCalendar.lastSync).toLocaleString() : 'Never'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={googleCalendar.syncEnabled}
                  onChange={(enabled) => dispatch(setGoogleCalendarSyncEnabled(enabled))}
                />
                <Button variant="secondary" onClick={handleGoogleCalendarDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your Google Calendar to automatically create tasks from your calendar events.
            </p>
            <div className="space-y-3">
              <Input
                label="Google Client ID"
                placeholder={hasMasterPassword ? "Enter your Google OAuth Client ID" : "Set master password first to enter credentials"}
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                disabled={isConnecting || !hasMasterPassword}
              />
              <Input
                label="Google Client Secret"
                placeholder={hasMasterPassword ? "Enter your Google OAuth Client Secret" : "Set master password first to enter credentials"}
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                type="password"
                disabled={isConnecting || !hasMasterPassword}
              />
              <p className="text-xs text-gray-500">
                Get these credentials from the{' '}
                <a 
                  href="https://console.developers.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
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
                  className="text-blue-600 hover:underline"
                >
                  setup guide
                </a>{' '}
                for detailed instructions.
              </p>
              <Button 
                onClick={handleGoogleCalendarConnect} 
                disabled={isConnecting || !googleClientId.trim() || !googleClientSecret.trim() || !hasMasterPassword}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* GitHub Integration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Github className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-semibold">GitHub</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync commits and pull requests as completed tasks
            </p>
          </div>
          <div className="ml-auto">
            {github.connected ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
        </div>

        {github.connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected as: @{github.username}</p>
                <p className="text-xs text-gray-500">
                  Syncing {github.repositories?.length || 0} repositories
                </p>
                <p className="text-xs text-gray-500">
                  Last sync: {github.lastSync ? new Date(github.lastSync).toLocaleString() : 'Never'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={github.syncEnabled}
                  onChange={(enabled) => dispatch(setGitHubSyncEnabled(enabled))}
                />
                <Button variant="secondary" onClick={handleGitHubDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
            
            {github.repositories && github.repositories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Synced Repositories:</p>
                <div className="flex flex-wrap gap-2">
                  {github.repositories.map(repo => (
                    <Badge key={repo} variant="outline" className="text-xs">
                      {repo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your GitHub account to automatically create completed tasks from your commits and merged pull requests.
            </p>
            <div className="space-y-3">
              <Input
                label="GitHub Personal Access Token"
                placeholder={hasMasterPassword ? "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" : "Set master password first to enter token"}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                type="password"
                disabled={!hasMasterPassword}
              />
              <p className="text-xs text-gray-500">
                Create a personal access token at{' '}
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub Settings → Developer settings → Personal access tokens
                </a>
              </p>
              <Button 
                onClick={handleGitHubConnect} 
                disabled={!hasMasterPassword}
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                Connect GitHub
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Master Password Authentication Modal */}
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