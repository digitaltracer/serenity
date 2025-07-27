import React, { useMemo } from 'react';
import { JournalEntry, selectCompactMode } from '@serenity/core';
import { useSelector } from 'react-redux';
import { cn } from '../utils/cn';
import { Pin, Calendar, Tag, Trash2 } from 'lucide-react';

export interface JournalEntryCardProps {
  entry: JournalEntry;
  onClick?: (entry: JournalEntry) => void;
  onTogglePin?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
  className?: string;
}

const JournalEntryCard = React.memo<JournalEntryCardProps>(({
  entry,
  onClick,
  onTogglePin,
  onDelete,
  className,
}) => {
  const compactMode = useSelector(selectCompactMode);
  
  // Memoize expensive calculations to prevent re-computation on every render
  const entryData = useMemo(() => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const getWordCount = (content: string) => {
      return content.trim().split(/\s+/).length;
    };

    const truncateContent = (content: string, maxLength = 150) => {
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength) + '...';
    };

    return {
      formattedDate: formatDate(entry.date),
      wordCount: getWordCount(entry.content),
      truncatedContent: truncateContent(entry.content),
    };
  }, [entry.date, entry.content]);

  return (
    <div
      className={cn(
        // Premium card design with elegant gradients and shadows
        'group relative rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm',
        'shadow-lg shadow-gray-200/40 ring-1 ring-gray-100/80',
        'dark:border-gray-700/40 dark:from-gray-800/80 dark:to-gray-900/60 dark:shadow-black/25 dark:ring-gray-800/60',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:shadow-xl hover:shadow-gray-300/50 hover:border-gray-300/80',
        'dark:hover:shadow-black/40 dark:hover:border-gray-600/60',
        'hover:-translate-y-0.5 hover:scale-[1.005] transform-gpu',
        // Compact mode responsive padding
        {
          'p-6': !compactMode,
          'p-4': compactMode,
          'ring-2 ring-blue-500/50 border-blue-300/80 dark:ring-blue-400/50 dark:border-blue-600/60': entry.pinned,
        },
        className
      )}
      onClick={() => onClick?.(entry)}
    >
      <div className={cn(
        'flex items-start justify-between',
        {
          'mb-3': !compactMode,
          'mb-2': compactMode,
        }
      )}>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          {entryData.formattedDate}
        </div>

        <div className="flex items-center gap-1">
          <button
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
              {
                'opacity-100 text-blue-500': entry.pinned,
              }
            )}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.(entry.id);
            }}
            title="Pin entry"
          >
            <Pin className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              title="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {entry.title && (
        <h3 className={cn(
          'font-semibold text-gray-900 dark:text-gray-100',
          {
            'mb-2': !compactMode,
            'mb-1.5': compactMode,
          }
        )}>
          {entry.title}
        </h3>
      )}

      <div className={cn(
        'text-gray-700 dark:text-gray-300 text-sm leading-relaxed',
        {
          'mb-3': !compactMode,
          'mb-2': compactMode,
        }
      )}>
        {entryData.truncatedContent}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {entry.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex gap-1">
                {entry.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 2 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    +{entry.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}

          {entry.mood && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Mood: {entry.mood}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {entryData.wordCount} words
        </div>
      </div>
    </div>
  );
});

export { JournalEntryCard };