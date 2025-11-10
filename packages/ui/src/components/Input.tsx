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
              // Elegant input styling with focus ring effect
              'flex h-12 w-full rounded-lg border px-4 py-3 text-base',
              'bg-background text-foreground border-border',
              'ring-offset-background',
              'transition-all duration-300 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'placeholder:text-transparent',
              {
                'border-destructive focus-visible:ring-destructive': error,
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
              'text-muted-foreground',
              {
                '-top-2 text-xs text-foreground bg-background px-1': isFocused || hasValue,
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
            // Elegant input styling with focus ring effect
            'flex h-12 w-full rounded-lg border px-4 py-3 text-base',
            'bg-background text-foreground placeholder:text-muted-foreground border-border',
            'ring-offset-background',
            'transition-all duration-300 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              'border-destructive focus-visible:ring-destructive': error,
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
