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
  animated = true,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const variantClasses = {
    default: {
      bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
      shadow: 'shadow-lg shadow-gray-500/50',
      glow: 'shadow-gray-500/30',
    },
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      shadow: 'shadow-lg shadow-green-500/50',
      glow: 'shadow-green-500/30',
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      shadow: 'shadow-lg shadow-yellow-500/50',
      glow: 'shadow-yellow-500/30',
    },
    danger: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      shadow: 'shadow-lg shadow-red-500/50',
      glow: 'shadow-red-500/30',
    },
  };

  const currentVariant = variantClasses[variant];

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Track */}
      <div
        className={cn(
          'w-full rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 overflow-hidden relative',
          sizeClasses[size]
        )}
      >
        {/* Progress Fill */}
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full relative overflow-hidden',
            currentVariant.bg,
            currentVariant.shadow,
            {
              'animate-pulse': animated && percentage > 0,
            }
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated Shine Effect */}
          {animated && percentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine_2s_ease-in-out_infinite] transform translate-x-[-100%]" />
          )}
          
          {/* Glow Effect */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full blur-sm',
              currentVariant.bg,
              'opacity-60'
            )}
            style={{ 
              boxShadow: `0 0 20px var(--glow-color)`,
              '--glow-color': variant === 'default' ? '#6b7280' : 
                             variant === 'success' ? '#10b981' :
                             variant === 'warning' ? '#f59e0b' : '#ef4444'
            } as React.CSSProperties}
          />
        </div>
      </div>
      
      {/* Value Display */}
      {showValue && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            {Math.round(percentage)}%
          </span>
          <span className="text-xs text-gray-500">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
};

export { ProgressBar };