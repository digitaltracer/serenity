import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store, initializeWithSampleData } from '@serenity/core';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { HomePage } from './pages/HomePage';
import { ActionHubPage } from './pages/ActionHubPage';
import { TodayPage } from './pages/TodayPage';
import { JournalPage } from './pages/JournalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize with sample data for demonstration
    initializeWithSampleData(dispatch);
  }, [dispatch]);

  return (
    <ThemeProvider>
      <Router>
        <div className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
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