/**
 * Database Statistics Card Component
 * Displays database health, performance metrics, and statistics
 */

import React from 'react';
import { 
  DatabaseIcon, 
  BarChart3Icon, 
  ClockIcon, 
  HardDriveIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ActivityIcon
} from 'lucide-react';
import { DatabaseStats } from '@serenity/core';
import { Card } from './Card';
import { Button } from './Button';

interface DatabaseStatsCardProps {
  stats: DatabaseStats;
  onOptimize?: () => void;
  onBackup?: () => void;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getHealthColor = (health: DatabaseStats['health']) => {
  switch (health) {
    case 'healthy':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const getHealthIcon = (health: DatabaseStats['health']) => {
  switch (health) {
    case 'healthy':
      return <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'warning':
      return <AlertTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'critical':
      return <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
    default:
      return <DatabaseIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  }
};

export const DatabaseStatsCard: React.FC<DatabaseStatsCardProps> = ({
  stats,
  onOptimize,
  onBackup,
  className = '',
}) => {
  const totalRecords = Object.values(stats.records).reduce((sum: number, count: number) => sum + count, 0);
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Database Statistics
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.type.toUpperCase()} Database
              </p>
            </div>
          </div>
          
          {/* Health Status */}
          <div className="flex items-center space-x-2">
            {getHealthIcon(stats.health)}
            <span className={`text-sm font-medium ${getHealthColor(stats.health)}`}>
              {stats.health.charAt(0).toUpperCase() + stats.health.slice(1)}
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Database Size */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <HardDriveIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Size
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatBytes(stats.size)}
              </div>
            </div>
          </div>

          {/* Total Records */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <BarChart3Icon className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Records
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(totalRecords as number).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Average Query Time */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Avg Query
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.performance.avgQueryTime.toFixed(1)}ms
              </div>
            </div>
          </div>

          {/* Error Rate */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <ActivityIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Error Rate
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(stats.performance.errorRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Record Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Record Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.records).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {(count as number).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Performance Metrics
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Queries
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.performance.totalQueries.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tables
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.tables}
              </span>
            </div>
            {stats.lastOptimized && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last Optimized
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(stats.lastOptimized).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onOptimize && (
            <Button
              onClick={onOptimize}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <TrendingUpIcon className="w-4 h-4" />
              <span>Optimize</span>
            </Button>
          )}
          
          {onBackup && (
            <Button
              onClick={onBackup}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <HardDriveIcon className="w-4 h-4" />
              <span>Backup</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};