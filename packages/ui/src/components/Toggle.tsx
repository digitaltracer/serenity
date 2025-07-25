import React from 'react';
import { cn } from '../utils/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  color?: 'blue' | 'green' | 'purple';
  className?: string;
  'aria-label'?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'md',
  color = 'blue',
  className,
  'aria-label': ariaLabel,
}) => {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  const thumbTranslateClasses = {
    sm: checked ? 'translate-x-5' : 'translate-x-1',
    md: checked ? 'translate-x-6' : 'translate-x-1',
  };

  const colorClasses = {
    blue: checked 
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
      : 'bg-gray-200 dark:bg-gray-700 shadow-inner',
    green: checked 
      ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30' 
      : 'bg-gray-200 dark:bg-gray-700 shadow-inner',
    purple: checked 
      ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30' 
      : 'bg-gray-200 dark:bg-gray-700 shadow-inner',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
        sizeClasses[size],
        colorClasses[color],
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 transform-gpu',
        color === 'blue' && 'focus:ring-blue-500/60',
        color === 'green' && 'focus:ring-green-500/60',
        color === 'purple' && 'focus:ring-purple-500/60',
        className
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow-md transition-all duration-300 ease-out',
          thumbSizeClasses[size],
          thumbTranslateClasses[size],
          checked ? 'shadow-lg' : 'shadow-sm'
        )}
      />
    </button>
  );
};