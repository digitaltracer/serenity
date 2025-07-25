/**
 * Database Status Indicator Component
 * Shows current database connection status and type
 */

import React from 'react';
import { 
  DatabaseIcon, 
  HardDriveIcon, 
  ServerIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  WifiOffIcon 
} from 'lucide-react';
import { DatabaseConnectionStatus, DatabaseType } from '@serenity/core';

interface DatabaseStatusIndicatorProps {
  status: DatabaseConnectionStatus;
  className?: string;
  showDetails?: boolean;
  onClick?: () => void;
}

const getDatabaseIcon = (type: DatabaseType) => {
  switch (type) {
    case 'sqlite':
      return <HardDriveIcon className="w-4 h-4" />;
    case 'postgresql':
      return <ServerIcon className="w-4 h-4" />;
    default:
      return <DatabaseIcon className="w-4 h-4" />;
  }
};

const getStatusIcon = (connected: boolean) => {
  if (connected) {
    return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
  } else {
    return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
  }
};

const getStatusColor = (connected: boolean, hasError: boolean) => {
  if (connected) {
    return 'text-green-700 dark:text-green-300';
  } else if (hasError) {
    return 'text-red-700 dark:text-red-300';
  } else {
    return 'text-gray-700 dark:text-gray-300';
  }
};

const getBackgroundColor = (connected: boolean, hasError: boolean) => {
  if (connected) {
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  } else if (hasError) {
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  } else {
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
  }
};

export const DatabaseStatusIndicator: React.FC<DatabaseStatusIndicatorProps> = ({
  status,
  className = '',
  showDetails = true,
  onClick,
}) => {
  const { connected, type, error, performance, lastConnected } = status;
  const hasError = Boolean(error);
  
  const statusText = connected 
    ? `Connected to ${type.toUpperCase()}`
    : hasError 
      ? 'Connection Error'
      : 'Not Connected';

  const baseClasses = `
    flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
    ${getBackgroundColor(connected, hasError)}
    ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {/* Status and DB Type Icons */}
      <div className="flex items-center space-x-1">
        {getDatabaseIcon(type)}
        {getStatusIcon(connected)}
      </div>
      
      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${getStatusColor(connected, hasError)}`}>
            {statusText}
          </div>
          
          {/* Additional details */}
          {connected && performance && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {performance.latency.toFixed(1)}ms latency
            </div>
          )}
          
          {hasError && (
            <div className="text-xs text-red-600 dark:text-red-400 truncate">
              {error}
            </div>
          )}
          
          {!connected && !hasError && lastConnected && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last connected: {new Date(lastConnected).toLocaleString()}
            </div>
          )}
        </div>
      )}
      
      {/* Click indicator */}
      {onClick && (
        <div className="text-gray-400 dark:text-gray-500">
          <DatabaseIcon className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

// Compact version for toolbar/header
export const CompactDatabaseStatus: React.FC<{
  status: DatabaseConnectionStatus;
  onClick?: () => void;
}> = ({ status, onClick }) => {
  const { connected, type } = status;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors
        ${connected 
          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
        }
      `}
      title={`${connected ? 'Connected to' : 'Not connected to'} ${type.toUpperCase()} database`}
    >
      {getDatabaseIcon(type)}
      <span>{type.toUpperCase()}</span>
      {getStatusIcon(connected)}
    </button>
  );
};