import React from 'react';
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
          // Professional card styling for both light and dark themes
          'rounded-xl border border-gray-200 bg-white backdrop-blur-sm shadow-lg shadow-gray-200/50',
          'dark:border-gray-700/30 dark:bg-gray-900/30 dark:shadow-black/20',
          'transition-all duration-300 hover:shadow-xl hover:shadow-gray-300/50',
          'hover:border-gray-300 dark:hover:border-gray-600/40',
          'dark:hover:shadow-black/30',
          'hover:-translate-y-1 transform-gpu',
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
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-2 p-8 pb-6',
          'border-b border-gray-200 dark:border-gray-700/20',
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
    return (
      <div
        ref={ref}
        className={cn('p-8 pt-6', className)}
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