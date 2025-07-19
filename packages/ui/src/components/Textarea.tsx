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
            // Premium textarea styling with elegant gradients and shadows
            'flex min-h-[120px] w-full rounded-lg border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm px-4 py-3 text-base',
            'text-gray-900 placeholder:text-gray-500 transition-all duration-200 ease-out',
            'shadow-sm shadow-gray-200/30 ring-1 ring-gray-100/50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60',
            'focus:shadow-md focus:shadow-blue-200/40',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
            'scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-gray-400',
            'dark:border-gray-600/60 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400',
            'dark:shadow-black/20 dark:ring-gray-800/40',
            'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60',
            'dark:focus:shadow-black/40',
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