import React from 'react';
import { useSelector } from 'react-redux';
import { selectCompactMode } from '@serenity/core';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable = false, ...props }, ref) => {
    if (hoverable) {
      return (
        <div
          ref={ref}
          className={cn(
            'group relative rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300',
            'border-border/50 hover:border-primary/30',
            'hover:shadow-[0_0_40px_hsl(var(--primary)/0.15)]',
            className
          )}
          {...props}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

          <div className="relative">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Tokenized card styles
          'rounded-xl border bg-card text-card-foreground border-border shadow-sm transition-colors duration-200',
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
          'border-b border-border',
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
          'text-xl font-semibold leading-tight tracking-tight truncate',
          className
        )}
        title={typeof children === 'string' ? children : undefined}
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
          'text-sm text-muted-foreground leading-relaxed line-clamp-3',
          className
        )}
        title={typeof children === 'string' ? children : undefined}
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
