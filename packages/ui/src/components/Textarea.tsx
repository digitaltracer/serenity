import React from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            // Professional styling for both light and dark themes
            'flex min-h-[120px] w-full rounded-lg border border-gray-300 bg-white backdrop-blur-sm px-4 py-3 text-base',
            'text-gray-900 placeholder:text-gray-500 transition-all duration-150',
            'focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/60',
            'focus:bg-gray-50',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
            'scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-gray-400',
            'dark:border-gray-700/50 dark:bg-gray-900/40 dark:text-gray-100 dark:placeholder:text-gray-500',
            'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60 dark:focus:bg-gray-800/50',
            'dark:scrollbar-track-gray-800 dark:scrollbar-thumb-gray-600',
            {
              'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60': error,
            },
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };