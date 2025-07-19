import React from 'react';
import { cn } from '../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              // Professional styling for both light and dark themes
              'flex h-12 w-full rounded-lg border border-gray-300 bg-white backdrop-blur-sm px-4 py-2.5 text-base',
              'text-gray-900 transition-all duration-150',
              'focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/60',
              'focus:bg-gray-50',
              'dark:border-gray-700/50 dark:bg-gray-900/40 dark:text-gray-100',
              'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60 dark:focus:bg-gray-800/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'appearance-none cursor-pointer',
              // Custom option styling
              '[&>option]:bg-white [&>option]:text-gray-900 [&>option]:py-2',
              'dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100',
              {
                'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60': error,
              },
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Enhanced dropdown icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform duration-200" />
          </div>
        </div>
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

Select.displayName = 'Select';

export { Select };