import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, initializeWithSampleData, useAutoLock, lockApp, selectHasMasterPassword } from '@serenity/core';
import { AuthenticatedApp, ToastProvider, useToast } from '@serenity/ui';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { HomePage } from './pages/HomePage';
import { ActionHubPage } from './pages/ActionHubPage';
import { TodayPage } from './pages/TodayPage';
import { JournalPage } from './pages/JournalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

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
  
  // Set up auto-lock functionality
  useAutoLock();

  useEffect(() => {
    // Initialize with sample data for demonstration
    initializeWithSampleData(dispatch);
  }, [dispatch]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <MenuEventHandler />
        <AuthenticatedApp>
          <Router>
            <div className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/actionhub" element={<ActionHubPage />} />
                  <Route path="/today" element={<TodayPage />} />
                  <Route path="/journal" element={<JournalPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </div>
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