import React from 'react';
import { useSelector } from 'react-redux';
import { selectCompactMode } from '@serenity/core';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Premium card design with subtle gradients and elegant shadows
          'rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm',
          'shadow-lg shadow-gray-200/40',
          'dark:border-gray-700/40 dark:from-gray-800/80 dark:to-gray-900/60 dark:shadow-black/25',
          'transition-all duration-300 ease-out',
          'hover:shadow-xl hover:shadow-gray-300/50 hover:border-gray-300/80',
          'dark:hover:shadow-black/40 dark:hover:border-gray-600/60',
          'hover:-translate-y-0.5 hover:scale-[1.01] transform-gpu',
          'ring-1 ring-gray-100/80 dark:ring-gray-800/60',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    const compactMode = useSelector(selectCompactMode);
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-2',
          'border-b border-gray-200 dark:border-gray-700/20',
          // Compact mode responsive padding
          {
            'p-8 pb-6': !compactMode,
            'p-6 pb-4': compactMode,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-xl font-semibold leading-tight tracking-tight text-gray-900',
          'dark:text-white',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-sm text-gray-600 dark:text-gray-400 leading-relaxed',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    const compactMode = useSelector(selectCompactMode);
    
    return (
      <div
        ref={ref}
        className={cn(
          // Compact mode responsive padding
          {
            'p-8 pt-6': !compactMode,
            'p-6 pt-4': compactMode,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };