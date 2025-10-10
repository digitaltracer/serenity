/**
 * Selectable Item Component
 * Wrapper that adds bulk selection capability to any item
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsBulkModeActive,
  selectIsTaskSelected,
  selectIsJournalEntrySelected,
  selectIsProjectSelected,
  toggleItemSelection,
  enterBulkMode,
} from '@serenity/core';
import { CheckSquareIcon, SquareIcon } from 'lucide-react';

interface SelectableItemProps {
  id: string;
  type: 'tasks' | 'journalEntries' | 'projects';
  children: React.ReactNode;
  className?: string;
  onLongPress?: () => void;
  disabled?: boolean;
}

const SelectableItemComponent: React.FC<SelectableItemProps> = ({
  id,
  type,
  children,
  className = '',
  onLongPress,
  disabled = false,
}) => {
  const dispatch = useDispatch();
  const isBulkModeActive = useSelector(selectIsBulkModeActive);

  // Memoize selector to prevent recreation on every render
  const isSelectedSelector = useMemo(() => {
    return type === 'tasks' ? selectIsTaskSelected(id) :
           type === 'journalEntries' ? selectIsJournalEntrySelected(id) :
           selectIsProjectSelected(id);
  }, [type, id]);

  const isSelected = useSelector(isSelectedSelector);

  // Long press detection
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Memoize event handlers
  const handleSelectionToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (!isBulkModeActive) {
      dispatch(enterBulkMode());
    }

    dispatch(toggleItemSelection({ type, id }));
  }, [disabled, isBulkModeActive, dispatch, type, id]);

  const handleLongPress = useCallback(() => {
    if (disabled) return;

    if (!isBulkModeActive) {
      dispatch(enterBulkMode());
      dispatch(toggleItemSelection({ type, id }));
    }
    onLongPress?.();
  }, [disabled, isBulkModeActive, dispatch, type, id, onLongPress]);

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    const timer = setTimeout(handleLongPress, 500); // 500ms for long press
    setPressTimer(timer);
  }, [disabled, handleLongPress]);

  const handleMouseUp = useCallback(() => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }, [pressTimer]);

  const handleMouseLeave = useCallback(() => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }, [pressTimer]);

  useEffect(() => {
    return () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
    };
  }, [pressTimer]);

  return (
    <div
      className={`
        relative group transition-all duration-200
        ${isBulkModeActive ? 'cursor-pointer' : ''}
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        ${className}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={isBulkModeActive ? handleSelectionToggle : undefined}
    >
      {/* Selection checkbox */}
      {isBulkModeActive && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={handleSelectionToggle}
            className={`
              flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-200
              ${isSelected 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }
            `}
          >
            {isSelected ? (
              <CheckSquareIcon className="w-4 h-4" />
            ) : (
              <SquareIcon className="w-4 h-4 opacity-0" />
            )}
          </button>
        </div>
      )}

      {/* Subtle selection overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none" />
      )}

      {/* Main content */}
      <div className={isBulkModeActive ? 'pl-10' : ''}>
        {children}
      </div>

      {/* Subtle bulk mode indicator - removed border */}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const SelectableItem = React.memo(SelectableItemComponent);

/**
 * Selectable Task Card
 */
interface SelectableTaskCardProps {
  task: any;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const SelectableTaskCardComponent: React.FC<SelectableTaskCardProps> = ({
  task,
  children,
  className = '',
  disabled = false,
}) => {
  return (
    <SelectableItem
      id={task.id}
      type="tasks"
      className={className}
      disabled={disabled}
    >
      {children}
    </SelectableItem>
  );
};

export const SelectableTaskCard = React.memo(SelectableTaskCardComponent);

/**
 * Selectable Journal Entry Card
 */
interface SelectableJournalEntryProps {
  entry: any;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const SelectableJournalEntryComponent: React.FC<SelectableJournalEntryProps> = ({
  entry,
  children,
  className = '',
  disabled = false,
}) => {
  return (
    <SelectableItem
      id={entry.id}
      type="journalEntries"
      className={className}
      disabled={disabled}
    >
      {children}
    </SelectableItem>
  );
};

export const SelectableJournalEntry = React.memo(SelectableJournalEntryComponent);

/**
 * Selectable Project Card
 */
interface SelectableProjectCardProps {
  project: any;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const SelectableProjectCardComponent: React.FC<SelectableProjectCardProps> = ({
  project,
  children,
  className = '',
  disabled = false,
}) => {
  return (
    <SelectableItem
      id={project.id}
      type="projects"
      className={className}
      disabled={disabled}
    >
      {children}
    </SelectableItem>
  );
};

export const SelectableProjectCard = React.memo(SelectableProjectCardComponent);