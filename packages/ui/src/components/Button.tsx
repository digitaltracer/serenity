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
          
          // Premium button variants with elegant gradients and shadows
          {
            // Primary: Premium dark button with subtle gradients
            'bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700/60 shadow-md shadow-gray-900/25': variant === 'primary',
            'hover:from-gray-800 hover:to-gray-700 hover:shadow-lg hover:shadow-gray-900/40 hover:-translate-y-0.5': variant === 'primary',
            'dark:from-gray-700 dark:to-gray-800 dark:border-gray-600/60 dark:shadow-black/30': variant === 'primary',
            'dark:hover:from-gray-600 dark:hover:to-gray-700 dark:hover:shadow-black/50': variant === 'primary',
            'ring-1 ring-gray-800/20 dark:ring-gray-600/30': variant === 'primary',
            
            // Secondary: Light elegant button with gradients
            'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 border border-gray-200/80 shadow-sm shadow-gray-200/40': variant === 'secondary',
            'hover:from-gray-100 hover:to-gray-150 hover:shadow-md hover:shadow-gray-300/50 hover:-translate-y-0.5': variant === 'secondary',
            'dark:from-gray-800/80 dark:to-gray-900/60 dark:text-gray-100 dark:border-gray-700/50 dark:shadow-black/20': variant === 'secondary',
            'dark:hover:from-gray-700/90 dark:hover:to-gray-800/80 dark:hover:shadow-black/40': variant === 'secondary',
            'ring-1 ring-gray-100/60 dark:ring-gray-800/40': variant === 'secondary',
            
            // Ghost: Minimal with subtle hover effects
            'text-gray-700 border border-transparent hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50': variant === 'ghost',
            'hover:shadow-sm hover:shadow-gray-200/30 hover:-translate-y-0.5': variant === 'ghost',
            'dark:text-gray-300 dark:hover:from-gray-800/50 dark:hover:to-gray-900/30 dark:hover:shadow-black/20': variant === 'ghost',
            
            // Destructive: Premium red styling
            'bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-500/60 shadow-md shadow-red-600/25': variant === 'destructive',
            'hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/40 hover:-translate-y-0.5': variant === 'destructive',
            'ring-1 ring-red-500/30': variant === 'destructive',
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