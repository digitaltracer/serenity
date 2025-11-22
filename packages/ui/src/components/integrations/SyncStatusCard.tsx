'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { RotateCw, AlertTriangle } from 'lucide-react';

export interface SyncStatusCardProps {
  isSyncing: boolean;
  lastSyncError?: string | null;
  hasConnectedIntegrations: boolean;
  onSyncNow: () => void;
}

export const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  isSyncing,
  lastSyncError,
  hasConnectedIntegrations,
  onSyncNow,
}) => {
  return (
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
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

      <CardContent>
        <div className="space-y-4">
          {/* Sync Action */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200/50 dark:border-green-700/30">
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
                onClick={onSyncNow}
                disabled={isSyncing || !hasConnectedIntegrations}
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
  );
};
