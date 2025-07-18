import React from 'react';
import { JournalEntry } from '@serenity/core';
import { cn } from '../utils/cn';
import { Pin, Calendar, Tag } from 'lucide-react';

export interface JournalEntryCardProps {
  entry: JournalEntry;
  onClick?: (entry: JournalEntry) => void;
  onTogglePin?: (entryId: string) => void;
  className?: string;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
  entry,
  onClick,
  onTogglePin,
  className,
}) => {
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

  return (
    <div
      className={cn(
        'group relative border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer',
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        {
          'ring-2 ring-blue-500 border-blue-300': entry.pinned,
        },
        className
      )}
      onClick={() => onClick?.(entry)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          {formatDate(entry.date)}
        </div>

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
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>

      {entry.title && (
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {entry.title}
        </h3>
      )}

      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
        {truncateContent(entry.content)}
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
          {getWordCount(entry.content)} words
        </div>
      </div>
    </div>
  );
};

export { JournalEntryCard };