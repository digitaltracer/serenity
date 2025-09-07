import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { 
  store, 
  initializeWithSampleData, 
  useAutoLock, 
  lockApp, 
  selectHasMasterPassword, 
  resetShortcuts,
  initializeSQLitePersistence,
  initializeStoreData,
  setTasks,
  setProjects,
  setEntries,
  addUsedTags,
  initializeDatabaseConfig,
  initializeIntegrations,
  restoreInsights,
  restoreRecaps
} from '@serenity/core';
import { AuthenticatedApp, ToastProvider, useToast, LoadingScreen } from '@serenity/ui';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider';
import { HomePage } from './pages/HomePage';
import { ActionHubPage } from './pages/ActionHubPage';
import { TodayPage } from './pages/TodayPage';
import { JournalPage } from './pages/JournalPage';
import { GoalsPage } from './pages/GoalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DatabasePage } from './pages/DatabasePage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

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
  
  // Set up auto-lock functionality
  useAutoLock();

  useEffect(() => {
    async function initializeApp() {
      try {
        setInitializationStatus('Initializing...');
        
        // Clear any localStorage that might be interfering with shortcuts
        console.log('🧹 Clearing localStorage shortcuts data...');
        localStorage.removeItem('shortcuts');
        localStorage.removeItem('serenity_shortcuts');
        
        // Reset shortcuts to ensure we have the latest defaults with global flags
        console.log('🎹 Resetting shortcuts to defaults...');
        dispatch(resetShortcuts());
        
        setInitializationStatus('Initializing SQLite database...');
        
        // Initialize SQLite persistence
        console.log('🗄️ Initializing SQLite persistence...');
        const sqliteInitialized = await initializeSQLitePersistence();
        
        if (sqliteInitialized) {
          console.log('✅ SQLite persistence enabled');
          
          // Add test button to window for debugging
          (window as any).testSQLitePersistence = async () => {
            console.log('🧪 Running SQLite persistence test...');
            try {
              const result = await window.electronAPI.sqlite.testPersistence();
              console.log('🧪 Test result:', result);
              if (result.success) {
                console.log('✅ SQLite persistence test PASSED');
                console.log(`📊 Created task: ${result.createdTask?.title}`);
                console.log(`📊 Total tasks in SQLite: ${result.totalTasks}`);
              } else {
                console.error('❌ SQLite persistence test FAILED:', result.error);
              }
              return result;
            } catch (error) {
              console.error('❌ Test error:', error);
              return { success: false, error: String(error) };
            }
          };
          
          console.log('🧪 SQLite test function available at: window.testSQLitePersistence()');
          
          // Add verification function
          (window as any).verifySQLiteDataLoading = async () => {
            console.log('🔍 Verifying SQLite data loading...');
            try {
              const result = await window.electronAPI.sqlite.verifyDataLoading();
              console.log('🔍 Verification result:', result);
              return result;
            } catch (error) {
              console.error('❌ Verification error:', error);
              return { success: false, error: String(error) };
            }
          };
          
          console.log('🔍 SQLite verification function available at: window.verifySQLiteDataLoading()');
        } else {
          console.log('💾 Using localStorage persistence');
        }
        
        setInitializationStatus('Restoring database configuration...');
        
        // Initialize database configuration from saved settings
        console.log('🗄️ Initializing saved database configuration...');
        try {
          await dispatch(initializeDatabaseConfig());
          console.log('✅ Database configuration initialization completed');
        } catch (error) {
          console.error('❌ Failed to initialize database configuration:', error);
          // Continue with app initialization even if database config fails
        }
        
        // Initialize integrations (will load encrypted data if master password is available)
        console.log('🔗 Initializing integrations...');
        try {
          // Pass null for master password initially - integrations will load when user unlocks
          await dispatch(initializeIntegrations(null));
          console.log('✅ Integrations initialization completed');
          
          // After initialization, check if we need to prompt for master password to load encrypted integrations
          setTimeout(async () => {
            try {
              const hasEncrypted = await window.electronAPI?.integrations?.hasEncrypted?.();
              if (hasEncrypted?.success && (hasEncrypted.data?.hasEncrypted || (hasEncrypted.data?.count ?? 0) > 0)) {
                console.log('🔐 Found encrypted integrations in database, but they require master password to load');
                console.log('ℹ️ Integrations will be loaded when user authenticates in the Integrations page');
              }
            } catch (error) {
              // Ignore errors - this is just informational
            }
          }, 1000);
        } catch (error) {
          console.error('❌ Failed to initialize integrations:', error);
          // Continue with app initialization even if integrations fail
        }
        
        setInitializationStatus('Loading existing data...');
        
        // Use enhanced store initialization which handles both SQLite and localStorage
        console.log('📂 Initializing store data with enhanced migration support...');
        try {
          const initSuccess = await initializeStoreData();
          if (initSuccess) {
            console.log('✅ Store data initialization completed successfully');
          } else {
            console.warn('⚠️ Store data initialization completed with warnings');
          }
        } catch (error) {
          console.error('❌ Store data initialization failed:', error);
          // Continue with app initialization
        }
        
        setInitializationStatus('Loading AI insights...');
        
        // Load AI insights and recaps from database
        console.log('🧠 Loading AI insights and recaps from database...');
        try {
          if (window.electronAPI?.aiAssistant?.getInsights) {
            const insightsResult = await window.electronAPI.aiAssistant.getInsights();
            if (insightsResult.success && Array.isArray(insightsResult.insights)) {
              console.log(`📊 Loaded ${insightsResult.insights.length} AI insights from database`);
              dispatch(restoreInsights(insightsResult.insights));
            }
          }
          
          if (window.electronAPI?.aiAssistant?.getRecaps) {
            const recapsResult = await window.electronAPI.aiAssistant.getRecaps();
            if (recapsResult.success && Array.isArray(recapsResult.recaps)) {
              console.log(`📚 Loaded ${recapsResult.recaps.length} AI recaps from database`);
              dispatch(restoreRecaps(recapsResult.recaps));
            }
          }
        } catch (error) {
          console.error('❌ Failed to load AI insights:', error);
          // Continue with app initialization even if AI insights fail to load
        }
        
        setInitializationStatus('Finalizing...');
        
        // Check if we need sample data
        setTimeout(() => {
          console.log('📊 Checking if sample data is needed...');
          const state = store.getState();
          const hasExistingData = 
            state.tasks?.tasks?.length > 0 || 
            state.projects?.projects?.length > 0 || 
            state.journal?.entries?.length > 0;
          
          if (!hasExistingData) {
            console.log('📊 No existing data found - ready for user to create tasks');
          } else {
            console.log('📊 Existing data found, skipping sample data');
          }
          
          setInitializationStatus('Ready!');
          setTimeout(() => setIsInitializing(false), 500);
        }, 300);
        
        // Force immediate verification of shortcuts
        setTimeout(() => {
          const state = store.getState();
          console.log('🔍 Shortcuts verification:', {
            shortcutsInStore: state.shortcuts?.shortcuts?.length || 0,
            globalInStore: state.shortcuts?.shortcuts?.filter(s => s.isGlobal)?.length || 0
          });
        }, 100);
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitializationStatus('Error occurred, continuing...');
        setTimeout(() => setIsInitializing(false), 1000);
      }
    }
    
    initializeApp();
  }, [dispatch]);

  if (isInitializing) {
    return <LoadingScreen message={initializationStatus} />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <MenuEventHandler />
        <AuthenticatedApp>
          <Router>
            <KeyboardShortcutsProvider>
              <div className="h-screen bg-background text-foreground">
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/actionhub" element={<ActionHubPage />} />
                    <Route path="/today" element={<TodayPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/ai-assistant" element={<AIAssistantPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/database" element={<DatabasePage />} />
                    <Route path="/integrations" element={<IntegrationsPage />} />
                  </Routes>
                </Layout>
              </div>
            </KeyboardShortcutsProvider>
          </Router>
        </AuthenticatedApp>
      </ToastProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
