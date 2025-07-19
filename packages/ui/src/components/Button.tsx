import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - professional and subtle
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
          'disabled:pointer-events-none disabled:opacity-50',
          'transform active:scale-98',
          
          // Variants - proper light and dark theme support
          {
            // Primary: Professional styling for both themes
            'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md border border-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:border-gray-600': variant === 'primary',
            
            // Secondary: Clean styling with proper theme variants
            'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 dark:bg-gray-800/40 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700/60 dark:hover:border-gray-600 backdrop-blur-sm': variant === 'secondary',
            
            // Ghost: Minimal with proper contrast for both themes
            'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent dark:text-gray-300 dark:hover:bg-gray-800/40 dark:hover:text-white': variant === 'ghost',
            
            // Destructive: Clean red styling for both themes
            'bg-red-600 text-white hover:bg-red-500 hover:shadow-md border border-red-500/20 dark:bg-red-600 dark:text-white dark:hover:bg-red-500 dark:border-red-500/20 backdrop-blur-sm': variant === 'destructive',
          },
          
          // Sizes - consistent with inputs
          {
            'h-10 px-4 text-sm min-w-[2.5rem]': size === 'sm',
            'h-12 px-6 text-base min-w-[3rem]': size === 'md',
            'h-14 px-8 text-lg min-w-[3.5rem]': size === 'lg',
          },
          
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };