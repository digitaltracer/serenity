import React from 'react';
import { cn } from '../utils/cn';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  animated = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3',
  };

  const variantClasses = {
    default: { bg: 'bg-primary' },
    success: { bg: 'bg-green-500' },
    warning: { bg: 'bg-yellow-500' },
    danger: { bg: 'bg-destructive' },
  } as const;

  const currentVariant = variantClasses[variant];

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Track */}
      <div
        className={cn(
          'w-full rounded-full bg-muted border border-border overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Progress Fill */}
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            currentVariant.bg,
            { 'animate-pulse': animated && percentage > 0 }
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Value Display */}
      {showValue && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/80">
            {Math.round(percentage)}%
          </span>
          <span className="text-xs text-muted-foreground">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
};

export { ProgressBar };
