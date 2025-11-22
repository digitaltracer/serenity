import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  store,
  initializeWithSampleData,
  useAutoLock,
  lockApp,
  selectHasMasterPassword,
  selectAuth,
  setMasterPassword,
  initializeAuth,
  resetShortcuts,
  initializeSQLitePersistence,
  initializeStoreData,
  setTasks,
  setProjects,
  setEntries,
  addUsedTags,
  initializeDatabaseConfig,
  initializeIntegrations,
  initializeAISettings,
  restoreInsights,
  restoreRecaps,
  logger
} from '@serenity/core';
import { AuthenticatedApp, ToastProvider, useToast, LoadingScreen, WelcomeScreen, MasterPasswordSetup, type SecuritySettings } from '@serenity/ui';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider';

// Lazy load all page components from shared @serenity/ui/pages subpath
const HomePage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.HomePage })));
const TodayPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.TodayPage })));
const ActionHubPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.ActionHubPage })));
const JournalPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.JournalPage })));
const GoalsPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.GoalsPage })));
const AnalyticsPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.AnalyticsPage })));
const InsightsPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.InsightsPage })));
const InsightsHubPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.InsightsHubPage })));
const SettingsPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.SettingsPage })));
const SummaryPage = lazy(() => import('@serenity/ui/pages').then(module => ({ default: module.SummaryPage })));

// Desktop-specific pages with full implementations (not shared stubs)
const DatabasePage = lazy(() => import('./pages/DatabasePage').then(module => ({ default: module.DatabasePage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage').then(module => ({ default: module.IntegrationsPage })));

// Loading fallback component for route transitions
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Preload critical routes for better perceived performance
function preloadCriticalRoutes() {
  // Preload ActionHub and Today pages as they're most frequently accessed
  setTimeout(() => {
    import('./pages/ActionHubPage');
    import('./pages/TodayPage');
  }, 1000);
}

// Component for handling menu events - must be inside ToastProvider
function MenuEventHandler() {
  const dispatch = useDispatch();
  const hasMasterPassword = useSelector(selectHasMasterPassword);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      const handleMenuAction = (event: string, data?: any) => {
        switch (event) {
          case 'lock-app':
            if (hasMasterPassword) {
              dispatch(lockApp());
              showSuccess('App Locked', 'The application has been locked');
            } else {
              showError('No Master Password', 'Please set up a master password in Settings to enable app locking');
            }
            break;
          // Handle other menu events as needed
          case 'navigate':
            // Navigation is handled by the router
            window.location.hash = `#/${data}`;
            break;
        }
      };

      window.electronAPI.onMenuAction(handleMenuAction);

      // Cleanup
      return () => {
        window.electronAPI?.removeMenuListeners();
      };
    }
  }, [dispatch, hasMasterPassword, showSuccess, showError]);

  return null; // This component doesn't render anything
}

function AppContent() {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationStatus, setInitializationStatus] = useState('Starting app...');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMasterPasswordSetup, setShowMasterPasswordSetup] = useState(false);

  // Get auth state
  const auth = useSelector(selectAuth);
  const { showError, showSuccess } = useToast();

  // Set up auto-lock functionality
  useAutoLock();

  useEffect(() => {
    async function initializeApp() {
      try {
        setInitializationStatus('Initializing...');

        // Preload critical routes in the background
        preloadCriticalRoutes();

        // Clear any localStorage that might be interfering with shortcuts
        logger.debug('Clearing localStorage shortcuts data', { component: 'App', operation: 'initializeApp' });
        localStorage.removeItem('shortcuts');
        localStorage.removeItem('serenity_shortcuts');

        // Reset shortcuts to ensure we have the latest defaults with global flags
        logger.debug('Resetting shortcuts to defaults', { component: 'App', operation: 'initializeApp' });
        dispatch(resetShortcuts());
        
        setInitializationStatus('Initializing SQLite database...');

        // Initialize SQLite persistence
        logger.info('Initializing SQLite persistence', { component: 'App', operation: 'initializeApp' });
        const sqliteInitialized = await initializeSQLitePersistence();

        if (sqliteInitialized) {
          logger.info('SQLite persistence enabled', { component: 'App', operation: 'initializeApp' });
          
          // Add test button to window for debugging
          (window as any).testSQLitePersistence = async () => {
            logger.debug('Running SQLite persistence test', { component: 'App', operation: 'testSQLitePersistence' });
            try {
              const result = await window.electronAPI.sqlite.testPersistence();
              logger.debug('Test result received', { component: 'App', operation: 'testSQLitePersistence', metadata: { result } });
              if (result.success) {
                logger.info('SQLite persistence test PASSED', { component: 'App', operation: 'testSQLitePersistence', metadata: { createdTask: result.createdTask?.title, totalTasks: result.totalTasks } });
              } else {
                logger.error('SQLite persistence test FAILED', { component: 'App', operation: 'testSQLitePersistence', metadata: { error: result.error } });
              }
              return result;
            } catch (error) {
              logger.error('Test error', { component: 'App', operation: 'testSQLitePersistence' }, error as Error);
              return { success: false, error: String(error) };
            }
          };

          logger.debug('SQLite test function available at: window.testSQLitePersistence()', { component: 'App', operation: 'initializeApp' });

          // Add verification function
          (window as any).verifySQLiteDataLoading = async () => {
            logger.debug('Verifying SQLite data loading', { component: 'App', operation: 'verifySQLiteDataLoading' });
            try {
              const result = await window.electronAPI.sqlite.verifyDataLoading();
              logger.debug('Verification result', { component: 'App', operation: 'verifySQLiteDataLoading', metadata: { result } });
              return result;
            } catch (error) {
              logger.error('Verification error', { component: 'App', operation: 'verifySQLiteDataLoading' }, error as Error);
              return { success: false, error: String(error) };
            }
          };

          logger.debug('SQLite verification function available at: window.verifySQLiteDataLoading()', { component: 'App', operation: 'initializeApp' });
        } else {
          logger.info('Using localStorage persistence', { component: 'App', operation: 'initializeApp' });
        }
        
        setInitializationStatus('Initializing authentication...');

        // Initialize authentication
        logger.info('Initializing authentication', { component: 'App', operation: 'initializeApp' });
        try {
          await dispatch(initializeAuth());
          logger.info('Authentication initialization completed', { component: 'App', operation: 'initializeApp' });
        } catch (error) {
          logger.error('Failed to initialize authentication', { component: 'App', operation: 'initializeApp' }, error as Error);
        }

        setInitializationStatus('Restoring database configuration...');

        // Initialize database configuration from saved settings
        logger.info('Initializing saved database configuration', { component: 'App', operation: 'initializeApp' });
        try {
          await dispatch(initializeDatabaseConfig());
          logger.info('Database configuration initialization completed', { component: 'App', operation: 'initializeApp' });
        } catch (error) {
          logger.error('Failed to initialize database configuration', { component: 'App', operation: 'initializeApp' }, error as Error);
          // Continue with app initialization even if database config fails
        }
        
        // Initialize integrations (will load encrypted data if master password is available)
        logger.info('Initializing integrations', { component: 'App', operation: 'initializeApp' });
        try {
          // Pass null for master password initially - integrations will load when user unlocks
          await dispatch(initializeIntegrations(null));
          logger.info('Integrations initialization completed', { component: 'App', operation: 'initializeApp' });

          // After initialization, check if we need to prompt for master password to load encrypted integrations
          setTimeout(async () => {
            try {
              const hasEncrypted = await window.electronAPI?.integrations?.hasEncrypted?.();
              if (hasEncrypted?.success && (hasEncrypted.data?.hasEncrypted || (hasEncrypted.data?.count ?? 0) > 0)) {
                logger.info('Found encrypted integrations in database, they require master password to load', { component: 'App', operation: 'initializeApp' });
                logger.info('Integrations will be loaded when user authenticates in the Integrations page', { component: 'App', operation: 'initializeApp' });
              }
            } catch (error) {
              // Ignore errors - this is just informational
            }
          }, 1000);
        } catch (error) {
          logger.error('Failed to initialize integrations', { component: 'App', operation: 'initializeApp' }, error as Error);
          // Continue with app initialization even if integrations fail
        }
        
        setInitializationStatus('Loading existing data...');

        // Use enhanced store initialization which handles both SQLite and localStorage
        logger.info('Initializing store data with enhanced migration support', { component: 'App', operation: 'initializeApp' });
        try {
          const initSuccess = await initializeStoreData();
          if (initSuccess) {
            logger.info('Store data initialization completed successfully', { component: 'App', operation: 'initializeApp' });
          } else {
            logger.warn('Store data initialization completed with warnings', { component: 'App', operation: 'initializeApp' });
          }
        } catch (error) {
          logger.error('Store data initialization failed', { component: 'App', operation: 'initializeApp' }, error as Error);
          // Continue with app initialization
        }
        
        setInitializationStatus('Loading AI settings...');

        // Initialize AI settings and provider state
        logger.info('Initializing AI settings and provider state', { component: 'App', operation: 'initializeApp' });
        try {
          await dispatch(initializeAISettings());
          logger.info('AI settings initialized successfully', { component: 'App', operation: 'initializeApp' });
        } catch (error) {
          logger.error('Failed to initialize AI settings', { component: 'App', operation: 'initializeApp' }, error as Error);
          // Continue with app initialization even if AI settings fail to load
        }

        setInitializationStatus('Loading AI insights...');

        // Load AI insights and recaps from database
        logger.info('Loading AI insights and recaps from database', { component: 'App', operation: 'initializeApp' });
        try {
          if (window.electronAPI?.aiAssistant?.getInsights) {
            const insightsResult = await window.electronAPI.aiAssistant.getInsights();
            if (insightsResult.success && Array.isArray(insightsResult.insights)) {
              logger.info('Loaded AI insights from database', { component: 'App', operation: 'initializeApp', metadata: { count: insightsResult.insights.length } });
              dispatch(restoreInsights(insightsResult.insights));
            }
          }

          if (window.electronAPI?.aiAssistant?.getRecaps) {
            const recapsResult = await window.electronAPI.aiAssistant.getRecaps();
            if (recapsResult.success && Array.isArray(recapsResult.recaps)) {
              logger.info('Loaded AI recaps from database', { component: 'App', operation: 'initializeApp', metadata: { count: recapsResult.recaps.length } });
              dispatch(restoreRecaps(recapsResult.recaps));
            }
          }
        } catch (error) {
          logger.error('Failed to load AI insights', { component: 'App', operation: 'initializeApp' }, error as Error);
          // Continue with app initialization even if AI insights fail to load
        }
        
        setInitializationStatus('Finalizing...');

        // Check if we need sample data
        setTimeout(() => {
          logger.debug('Checking if sample data is needed', { component: 'App', operation: 'initializeApp' });
          const state = store.getState();
          const hasExistingData =
            state.tasks?.tasks?.length > 0 ||
            state.projects?.projects?.length > 0 ||
            state.journal?.entries?.length > 0;

          if (!hasExistingData) {
            logger.info('No existing data found - ready for user to create tasks', { component: 'App', operation: 'initializeApp' });
          } else {
            logger.info('Existing data found, skipping sample data', { component: 'App', operation: 'initializeApp' });
          }

          setInitializationStatus('Ready!');
          setTimeout(() => setIsInitializing(false), 500);
        }, 300);

        // Force immediate verification of shortcuts
        setTimeout(() => {
          const state = store.getState();
          logger.debug('Shortcuts verification', { component: 'App', operation: 'initializeApp', metadata: {
            shortcutsInStore: state.shortcuts?.shortcuts?.length || 0,
            globalInStore: state.shortcuts?.shortcuts?.filter(s => s.isGlobal)?.length || 0
          } });
        }, 100);

      } catch (error) {
        logger.error('Failed to initialize app', { component: 'App', operation: 'initializeApp' }, error as Error);
        setInitializationStatus('Error occurred, continuing...');
        setTimeout(() => setIsInitializing(false), 1000);
      }
    }

    initializeApp();
  }, [dispatch]);

  // Check if we should show welcome screen (after initialization)
  useEffect(() => {
    if (!isInitializing && auth.isInitialized) {
      // Check if this is first launch (no master password)
      if (!auth.hasMasterPassword) {
        logger.info('First launch detected - showing welcome screen', { component: 'App', operation: 'checkWelcomeScreen' });
        setShowWelcome(true);
      }
    }
  }, [isInitializing, auth.isInitialized, auth.hasMasterPassword]);

  // Handle "Get Started" click from welcome screen
  const handleGetStarted = () => {
    logger.info('User clicked Get Started', { component: 'App', operation: 'handleGetStarted' });
    setShowWelcome(false);
    setShowMasterPasswordSetup(true);
  };

  // Handle master password setup completion
  const handleMasterPasswordComplete = async (password: string, settings: SecuritySettings) => {
    try {
      logger.info('Master password setup completed', { component: 'App', operation: 'handleMasterPasswordComplete' });

      // Save master password and settings
      await dispatch(setMasterPassword({ password, settings }));

      // Show success message
      showSuccess('Welcome to Serenity!', 'Your master password has been set successfully');

      // Close setup
      setShowMasterPasswordSetup(false);
    } catch (error) {
      logger.error('Failed to complete master password setup', { component: 'App', operation: 'handleMasterPasswordComplete' }, error as Error);
      showError('Setup Failed', 'Failed to save your master password. Please try again.');
    }
  };

  if (isInitializing) {
    return <LoadingScreen message={initializationStatus} />;
  }

  // Show welcome screen if first launch
  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // Show master password setup if requested
  if (showMasterPasswordSetup) {
    return (
      <MasterPasswordSetup
        onComplete={handleMasterPasswordComplete}
        onBack={() => {
          setShowMasterPasswordSetup(false);
          setShowWelcome(true);
        }}
      />
    );
  }

  return (
    <>
      <MenuEventHandler />
      <AuthenticatedApp>
        <Router>
          <KeyboardShortcutsProvider>
            <div className="h-screen bg-background text-foreground">
              <Layout>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/actionhub" element={<ActionHubPage />} />
                    <Route path="/today" element={<TodayPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/insights" element={<InsightsHubPage />} />
                    {/* Backward compatibility redirect */}
                    <Route path="/analytics" element={<InsightsHubPage />} />
                    <Route path="/summary" element={<SummaryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/database" element={<DatabasePage />} />
                    <Route path="/integrations" element={<IntegrationsPage />} />
                  </Routes>
                </Suspense>
              </Layout>
            </div>
          </KeyboardShortcutsProvider>
        </Router>
      </AuthenticatedApp>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
