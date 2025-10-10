/**
 * Virtualized List Component
 * High-performance list rendering using @tanstack/react-virtual
 * Only renders visible items for better performance with large datasets
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 100,
  overscan = 5,
  className = '',
  itemClassName = '',
  getItemKey,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = getItemKey
            ? getItemKey(item, virtualItem.index)
            : virtualItem.index;

          return (
            <div
              key={key}
              className={itemClassName}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Virtualized Task List Component
 * Specialized for rendering task lists efficiently
 */
interface VirtualizedTaskListProps {
  tasks: any[];
  renderTask: (task: any, index: number) => React.ReactNode;
  className?: string;
  estimateSize?: number;
}

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  renderTask,
  className = '',
  estimateSize = 120,
}) => {
  return (
    <VirtualizedList
      items={tasks}
      renderItem={renderTask}
      estimateSize={estimateSize}
      overscan={5}
      className={className}
      getItemKey={(task) => task.id}
    />
  );
};

/**
 * Virtualized Journal List Component
 * Specialized for rendering journal entries efficiently
 */
interface VirtualizedJournalListProps {
  entries: any[];
  renderEntry: (entry: any, index: number) => React.ReactNode;
  className?: string;
  estimateSize?: number;
}

export const VirtualizedJournalList: React.FC<VirtualizedJournalListProps> = ({
  entries,
  renderEntry,
  className = '',
  estimateSize = 150,
}) => {
  return (
    <VirtualizedList
      items={entries}
      renderItem={renderEntry}
      estimateSize={estimateSize}
      overscan={3}
      className={className}
      getItemKey={(entry) => entry.id}
    />
  );
};
