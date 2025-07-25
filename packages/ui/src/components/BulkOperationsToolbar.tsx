/**
 * Bulk Operations Toolbar
 * Provides bulk actions for selected items
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsBulkModeActive,
  selectSelectedItemsCount,
  selectSelectedTasks,
  selectSelectedJournalEntries,
  selectSelectedProjects,
  exitBulkMode,
  bulkUpdateTasks,
  bulkDeleteTasks,
  addNotification,
} from '@serenity/core';
import {
  XIcon,
  Trash2Icon,
  EditIcon,
  TagIcon,
  FolderIcon,
  CalendarIcon,
  FlagIcon,
  CheckSquareIcon,
  SquareIcon,
  CopyIcon,
  ArchiveIcon,
} from 'lucide-react';
import { Button } from './Button';

interface BulkOperationsToolbarProps {
  className?: string;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  className = '',
}) => {
  const dispatch = useDispatch();
  const isBulkModeActive = useSelector(selectIsBulkModeActive);
  const selectedCount = useSelector(selectSelectedItemsCount);
  const selectedTasks = useSelector(selectSelectedTasks);
  const selectedJournalEntries = useSelector(selectSelectedJournalEntries);
  const selectedProjects = useSelector(selectSelectedProjects);

  // Handle escape key to exit bulk mode
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isBulkModeActive) {
        dispatch(exitBulkMode());
      }
    };

    if (isBulkModeActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isBulkModeActive, dispatch]);

  if (!isBulkModeActive || selectedCount === 0) return null;

  const handleBulkComplete = () => {
    if (selectedTasks.length > 0) {
      dispatch(bulkUpdateTasks({
        taskIds: selectedTasks,
        updates: { completed: true, updatedAt: new Date() },
      }));
      dispatch(addNotification({
        type: 'success',
        title: 'Tasks Completed',
        message: `${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'} marked as complete`,
      }));
    }
  };

  const handleBulkIncomplete = () => {
    if (selectedTasks.length > 0) {
      dispatch(bulkUpdateTasks({
        taskIds: selectedTasks,
        updates: { completed: false, updatedAt: new Date() },
      }));
      dispatch(addNotification({
        type: 'success',
        title: 'Tasks Reopened',
        message: `${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'} marked as incomplete`,
      }));
    }
  };

  const handleBulkDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCount} selected item${selectedCount === 1 ? '' : 's'}? This action cannot be undone.`
    );
    
    if (confirmed) {
      if (selectedTasks.length > 0) {
        dispatch(bulkDeleteTasks(selectedTasks));
      }
      // Add similar actions for journal entries and projects
      
      dispatch(addNotification({
        type: 'success',
        title: 'Items Deleted',
        message: `${selectedCount} item${selectedCount === 1 ? '' : 's'} deleted successfully`,
      }));
      dispatch(exitBulkMode());
    }
  };

  const handleBulkPriority = (priority: 'low' | 'medium' | 'high') => {
    if (selectedTasks.length > 0) {
      dispatch(bulkUpdateTasks({
        taskIds: selectedTasks,
        updates: { priority, updatedAt: new Date() },
      }));
      dispatch(addNotification({
        type: 'success',
        title: 'Priority Updated',
        message: `${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'} set to ${priority} priority`,
      }));
    }
  };

  const handleExitBulkMode = () => {
    dispatch(exitBulkMode());
  };

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600
        shadow-lg transform transition-transform duration-300 ease-in-out
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Selected count */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              {selectedCount} selected
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitBulkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Task-specific actions */}
            {selectedTasks.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkComplete}
                  className="flex items-center space-x-2"
                >
                  <CheckSquareIcon className="w-4 h-4" />
                  <span>Complete</span>
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkIncomplete}
                  className="flex items-center space-x-2"
                >
                  <SquareIcon className="w-4 h-4" />
                  <span>Reopen</span>
                </Button>
                
                {/* Priority dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => handleBulkPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Set Priority</option>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <FlagIcon className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </>
            )}

            {/* Universal actions */}
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <CopyIcon className="w-4 h-4" />
              <span>Duplicate</span>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArchiveIcon className="w-4 h-4" />
              <span>Archive</span>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <TagIcon className="w-4 h-4" />
              <span>Add Tags</span>
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="flex items-center space-x-2"
            >
              <Trash2Icon className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Bulk Selection Header
 * Shows bulk selection controls in list headers
 */
interface BulkSelectionHeaderProps {
  type: 'tasks' | 'journalEntries' | 'projects';
  items: any[];
  selectedItems: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export const BulkSelectionHeader: React.FC<BulkSelectionHeaderProps> = ({
  type,
  items,
  selectedItems,
  onSelectAll,
  onDeselectAll,
  className = '',
}) => {
  const isBulkModeActive = useSelector(selectIsBulkModeActive);
  
  if (!isBulkModeActive) return null;

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  return (
    <div className={`flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 ${className}`}>
      <input
        type="checkbox"
        checked={allSelected}
        ref={(input) => {
          if (input) input.indeterminate = someSelected;
        }}
        onChange={allSelected ? onDeselectAll : onSelectAll}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      
      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
        {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
      </span>
      
      {selectedItems.length > 0 && (
        <span className="text-sm text-blue-700 dark:text-blue-300">
          ({selectedItems.length} of {items.length} selected)
        </span>
      )}
    </div>
  );
};