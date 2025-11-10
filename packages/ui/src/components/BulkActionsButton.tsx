/**
 * Bulk Actions Button
 * Entry point for bulk operations mode
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsBulkModeActive,
  selectSelectedItemsCount,
  enterBulkMode,
  exitBulkMode,
} from '@serenity/core';
import { 
  CheckSquareIcon, 
  XIcon, 
  MoreHorizontalIcon,
  MousePointerClickIcon 
} from 'lucide-react';
import { Button } from './Button';

interface BulkActionsButtonProps {
  className?: string;
  variant?: 'button' | 'icon' | 'menu';
  size?: 'sm' | 'md' | 'lg';
}

export const BulkActionsButton: React.FC<BulkActionsButtonProps> = ({
  className = '',
  variant = 'button',
  size = 'md',
}) => {
  const dispatch = useDispatch();
  const isBulkModeActive = useSelector(selectIsBulkModeActive);
  const selectedCount = useSelector(selectSelectedItemsCount);

  const handleToggleBulkMode = () => {
    if (isBulkModeActive) {
      dispatch(exitBulkMode());
    } else {
      dispatch(enterBulkMode());
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleBulkMode}
        className={`
          inline-flex items-center justify-center w-8 h-8 rounded-lg
          text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors duration-200
          ${isBulkModeActive ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20' : ''}
          ${className}
        `}
        title={isBulkModeActive ? 'Exit bulk selection' : 'Enter bulk selection mode'}
      >
        {isBulkModeActive ? (
          <XIcon className="w-4 h-4" />
        ) : (
          <CheckSquareIcon className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === 'menu') {
    return (
      <div className="relative">
        <button
          onClick={handleToggleBulkMode}
          className={`
            flex items-center space-x-2 px-3 py-2 text-sm rounded-lg
            text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-200
            ${isBulkModeActive ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20' : ''}
            ${className}
          `}
        >
          {isBulkModeActive ? (
            <>
              <XIcon className="w-4 h-4" />
              <span>Exit Selection</span>
              {selectedCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedCount}
                </span>
              )}
            </>
          ) : (
            <>
              <MousePointerClickIcon className="w-4 h-4" />
              <span>Select Items</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <Button
      onClick={handleToggleBulkMode}
      variant={isBulkModeActive ? 'primary' : 'secondary'}
      size={size}
      className={`flex items-center space-x-2 ${className}`}
    >
      {isBulkModeActive ? (
        <>
          <XIcon className="w-4 h-4" />
          <span>Cancel Selection</span>
          {selectedCount > 0 && (
            <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </>
      ) : (
        <>
          <CheckSquareIcon className="w-4 h-4" />
          <span>Select Items</span>
        </>
      )}
    </Button>
  );
};

/**
 * Floating Bulk Actions Button
 * Floating action button for mobile-friendly bulk operations
 */
export const FloatingBulkActionsButton: React.FC = () => {
  const dispatch = useDispatch();
  const isBulkModeActive = useSelector(selectIsBulkModeActive);
  const selectedCount = useSelector(selectSelectedItemsCount);

  const handleToggleBulkMode = () => {
    if (isBulkModeActive) {
      dispatch(exitBulkMode());
    } else {
      dispatch(enterBulkMode());
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <button
        onClick={handleToggleBulkMode}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-lg
          transition-all duration-300 transform hover:scale-105
          ${isBulkModeActive 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
        title={isBulkModeActive ? 'Exit bulk selection' : 'Enter bulk selection mode'}
      >
        {isBulkModeActive ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <CheckSquareIcon className="w-6 h-6" />
        )}
        
        {/* Selected count badge */}
        {isBulkModeActive && selectedCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {selectedCount}
          </div>
        )}
      </button>
    </div>
  );
};

/**
 * Quick Bulk Actions Menu
 * Dropdown menu with common bulk actions
 */
interface QuickBulkActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  selectedCount: number;
}

export const QuickBulkActionsMenu: React.FC<QuickBulkActionsMenuProps> = ({
  isOpen,
  onClose,
  onAction,
  selectedCount,
}) => {
  if (!isOpen) return null;

  const actions = [
    { id: 'complete', label: 'Mark as Complete', icon: CheckSquareIcon },
    { id: 'delete', label: 'Delete Selected', icon: XIcon, destructive: true },
    { id: 'duplicate', label: 'Duplicate', icon: MoreHorizontalIcon },
    { id: 'archive', label: 'Archive', icon: MoreHorizontalIcon },
  ];

  return (
    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
      <div className="p-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-gray-200 dark:border-gray-600">
          {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
        </div>
        
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              onAction(action.id);
              onClose();
            }}
            className={`
              w-full flex items-center space-x-2 px-2 py-2 text-sm rounded
              transition-colors duration-200
              ${action.destructive 
                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <action.icon className="w-4 h-4" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};