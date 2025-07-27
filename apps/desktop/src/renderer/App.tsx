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
  setTasks,
  setProjects,
  setEntries,
  addUsedTags
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
        
        setInitializationStatus('Loading existing data...');
        
        if (sqliteInitialized) {
          // Load data from SQLite
          console.log('📂 Starting to load data from SQLite...');
          try {
            console.log('🔄 Calling SQLite getTasks, getProjects, getJournalEntries...');
            
            const [tasksResult, projectsResult, journalResult] = await Promise.all([
              window.electronAPI.sqlite.getTasks(),
              window.electronAPI.sqlite.getProjects(), 
              window.electronAPI.sqlite.getJournalEntries()
            ]);
            
            console.log('🔍 SQLite Results:');
            console.log('  - Tasks result:', tasksResult);
            console.log('  - Projects result:', projectsResult);
            console.log('  - Journal result:', journalResult);
            
            // Dispatch data to Redux store if loaded successfully
            if (tasksResult.success) {
              if (tasksResult.data?.length > 0) {
                console.log(`✅ LOADING ${tasksResult.data.length} TASKS FROM SQLITE INTO REDUX:`);
                tasksResult.data.forEach((task: any, i: number) => {
                  console.log(`  ${i+1}. ${task.title} (${task.id}) - Tags: ${task.tags?.join(', ') || 'none'}`);
                });
                dispatch(setTasks(tasksResult.data));
                console.log('✅ Tasks dispatched to Redux store');
                
                // Extract all tags from loaded tasks and populate usedTags collection
                const allTags: string[] = [];
                tasksResult.data.forEach((task: any) => {
                  if (task.tags && Array.isArray(task.tags)) {
                    allTags.push(...task.tags);
                  }
                });
                
                if (allTags.length > 0) {
                  const uniqueTags = [...new Set(allTags)];
                  console.log(`🏷️ EXTRACTED ${uniqueTags.length} UNIQUE TAGS FROM LOADED TASKS:`, uniqueTags);
                  dispatch(addUsedTags(uniqueTags));
                  console.log('✅ Tags added to usedTags collection for autocomplete');
                } else {
                  console.log('⚠️ No tags found in loaded tasks');
                }
              } else {
                console.log('⚠️ No tasks found in SQLite database');
              }
            } else {
              console.error('❌ Failed to get tasks from SQLite:', tasksResult.error);
            }
            
            if (projectsResult.success) {
              if (projectsResult.data?.length > 0) {
                console.log(`✅ LOADING ${projectsResult.data.length} PROJECTS FROM SQLITE`);
                dispatch(setProjects(projectsResult.data));
              } else {
                console.log('⚠️ No projects found in SQLite database');
              }
            } else {
              console.error('❌ Failed to get projects from SQLite:', projectsResult.error);
            }
            
            if (journalResult.success) {
              if (journalResult.data?.length > 0) {
                console.log(`✅ LOADING ${journalResult.data.length} JOURNAL ENTRIES FROM SQLITE`);
                dispatch(setEntries(journalResult.data));
                
                // Extract tags from journal entries as well
                const journalTags: string[] = [];
                journalResult.data.forEach((entry: any) => {
                  if (entry.tags && Array.isArray(entry.tags)) {
                    journalTags.push(...entry.tags);
                  }
                });
                
                if (journalTags.length > 0) {
                  const uniqueJournalTags = [...new Set(journalTags)];
                  console.log(`🏷️ EXTRACTED ${uniqueJournalTags.length} UNIQUE TAGS FROM JOURNAL ENTRIES:`, uniqueJournalTags);
                  dispatch(addUsedTags(uniqueJournalTags));
                  console.log('✅ Journal tags added to usedTags collection');
                }
              } else {
                console.log('⚠️ No journal entries found in SQLite database');
              }
            } else {
              console.error('❌ Failed to get journal entries from SQLite:', journalResult.error);
            }
            
          } catch (error) {
            console.error('❌ Failed to load data from SQLite:', error);
          }
        } else {
          // Fallback to localStorage check
          console.log('🗃️ SQLite not available, checking localStorage data...');
          const hasData = localStorage.getItem('serenity_tasks') || 
                          localStorage.getItem('serenity_projects') || 
                          localStorage.getItem('serenity_journal_entries');
          
          console.log('📊 localStorage check result:', {
            tasks: !!localStorage.getItem('serenity_tasks'),
            projects: !!localStorage.getItem('serenity_projects'),
            journal: !!localStorage.getItem('serenity_journal_entries')
          });
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
              <div className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/actionhub" element={<ActionHubPage />} />
                    <Route path="/today" element={<TodayPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/database" element={<DatabasePage />} />
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