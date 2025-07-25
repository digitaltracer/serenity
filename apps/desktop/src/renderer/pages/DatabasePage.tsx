/**
 * Database Management Page
 * Provides database configuration, statistics, and management tools
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  DatabaseIcon, 
  SettingsIcon, 
  RefreshCwIcon,
  DownloadIcon,
  TrendingUpIcon
} from 'lucide-react';
import {
  RootState,
  AppDispatch,
  selectDatabaseConfig,
  selectConnectionStatus,
  selectDatabaseStats,
  selectIsConfigModalOpen,
  selectIsConnecting,
  selectDatabaseError,
  openConfigModal,
  connectToDatabase,
  refreshDatabaseStats,
  createDatabaseBackup,
  optimizeDatabase,
  DatabaseConfig
} from '@serenity/core';
import {
  DatabaseConfigurationModal,
  DatabaseStatusIndicator,
  DatabaseStatsCard,
  Button,
  Card
} from '@serenity/ui';

export const DatabasePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const config = useSelector((state: RootState) => selectDatabaseConfig(state));
  const connectionStatus = useSelector((state: RootState) => selectConnectionStatus(state));
  const stats = useSelector((state: RootState) => selectDatabaseStats(state));
  const isConfigModalOpen = useSelector((state: RootState) => selectIsConfigModalOpen(state));
  const isConnecting = useSelector((state: RootState) => selectIsConnecting(state));
  const error = useSelector((state: RootState) => selectDatabaseError(state));
  
  // Load initial data
  useEffect(() => {
    if (connectionStatus.connected) {
      dispatch(refreshDatabaseStats());
    }
  }, [dispatch, connectionStatus.connected]);

  // Auto-refresh stats every 30 seconds if connected
  useEffect(() => {
    if (!connectionStatus.connected) return;
    
    const interval = setInterval(() => {
      dispatch(refreshDatabaseStats());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch, connectionStatus.connected]);

  const handleConfigSave = async (newConfig: DatabaseConfig) => {
    try {
      await dispatch(connectToDatabase(newConfig)).unwrap();
    } catch (error) {
      console.error('Failed to save database configuration:', error);
    }
  };

  const handleRefreshStats = () => {
    dispatch(refreshDatabaseStats());
  };

  const handleBackup = async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `serenity-backup-${timestamp}.sql`;
      await dispatch(createDatabaseBackup(backupPath)).unwrap();
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleOptimize = async () => {
    try {
      await dispatch(optimizeDatabase()).unwrap();
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DatabaseIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Database Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure and monitor your database connection
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {connectionStatus.connected && (
                <Button
                  onClick={handleRefreshStats}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCwIcon className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              )}
              
              <Button
                onClick={() => dispatch(openConfigModal())}
                className="flex items-center space-x-2"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Configure Database</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-8">
          <DatabaseStatusIndicator
            status={connectionStatus}
            showDetails={true}
            onClick={() => dispatch(openConfigModal())}
            className="w-full"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2">
                <div className="text-red-600 dark:text-red-400">
                  <DatabaseIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Database Error
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {connectionStatus.connected && stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Database Statistics */}
            <div className="lg:col-span-2">
              <DatabaseStatsCard
                stats={stats}
                onOptimize={handleOptimize}
                onBackup={handleBackup}
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleBackup}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Create Backup</span>
                  </Button>
                  
                  <Button
                    onClick={handleOptimize}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <TrendingUpIcon className="w-4 h-4" />
                    <span>Optimize Database</span>
                  </Button>
                  
                  <Button
                    onClick={() => dispatch(openConfigModal())}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Change Configuration</span>
                  </Button>
                </div>
              </Card>

              {/* Configuration Summary */}
              {config && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Current Configuration
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Database Type
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 uppercase">
                        {config.type}
                      </p>
                    </div>
                    
                    {config.type === 'postgresql' && (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Host
                          </span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {(config as any).host}:{(config as any).port}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Database
                          </span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {(config as any).database}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {config.type === 'sqlite' && (config as any).encryption && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Encryption
                        </span>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Enabled
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Not Connected View */
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <DatabaseIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">
                No Database Connection
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configure your database connection to start managing your data.
              </p>
              <Button
                onClick={() => dispatch(openConfigModal())}
                className="flex items-center space-x-2 mx-auto"
                disabled={isConnecting}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Configure Database'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        <DatabaseConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => dispatch({ type: 'database/closeConfigModal' })}
          onSave={handleConfigSave}
          currentConfig={config}
          connectionStatus={connectionStatus}
        />
      </div>
    </div>
  );
};