import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  floatingLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, floatingLabel = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    // Update hasValue when props.value changes
    useEffect(() => {
      setHasValue(!!props.value);
    }, [props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    if (floatingLabel && label) {
      return (
        <div className="relative">
          <input
            className={cn(
              // Premium input styling with elegant gradients and shadows
              'flex h-12 w-full rounded-lg border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm px-4 py-2.5 text-base',
              'text-gray-900 transition-all duration-200 ease-out',
              'shadow-sm shadow-gray-200/30 ring-1 ring-gray-100/50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60',
              'focus:shadow-md focus:shadow-blue-200/40',
              'dark:border-gray-600/60 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100',
              'dark:shadow-black/20 dark:ring-gray-800/40',
              'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60',
              'dark:focus:shadow-black/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'placeholder:text-transparent',
              {
                'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60': error,
              },
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          
          {/* Floating Label */}
          <label
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              'text-gray-600 dark:text-gray-400',
              {
                'top-0.5 text-xs text-gray-700 dark:text-gray-300': isFocused || hasValue,
                'top-1/2 -translate-y-1/2 text-base': !isFocused && !hasValue,
                'text-red-400': error,
              }
            )}
          >
            {label}
          </label>

          {error && (
            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              {error}
            </p>
          )}
        </div>
      );
    }

    // Standard input without floating label
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          className={cn(
            // Premium input styling with elegant gradients and shadows
            'flex h-12 w-full rounded-lg border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm px-4 py-2.5 text-base',
            'text-gray-900 placeholder:text-gray-500 transition-all duration-200 ease-out',
            'shadow-sm shadow-gray-200/30 ring-1 ring-gray-100/50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60',
            'focus:shadow-md focus:shadow-blue-200/40',
            'dark:border-gray-600/60 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400',
            'dark:shadow-black/20 dark:ring-gray-800/40',
            'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60',
            'dark:focus:shadow-black/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50': error,
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

Input.displayName = 'Input';

export { Input };